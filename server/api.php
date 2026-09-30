<?php
declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';
require __DIR__ . '/app/mailer.php';

security_headers();
$flows = require __DIR__ . '/app/flows.php';
$action = $_GET['action'] ?? '';

if ($action === 'flows' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $upload = cfg('upload');
    json_out([
        'flows' => $flows,
        'upload' => [
            'maxFiles' => (int)$upload['max_files'],
            'maxSizeMb' => (int)$upload['max_size_mb'],
            'extensions' => $upload['extensions'],
        ],
    ]);
}

if ($action !== 'submit' || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'Permintaan tidak dikenal'], 404);
}

// --- Pemeriksaan asal permintaan (jika browser mengirim Origin) ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$hostOnly = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '' && strcasecmp((string)parse_url($origin, PHP_URL_HOST), $hostOnly) !== 0) {
    json_out(['ok' => false, 'error' => 'Asal permintaan tidak diizinkan'], 403);
}

// --- Honeypot: bot mengisi kolom tersembunyi, kita pura-pura sukses ---
if (trim((string)($_POST['website'] ?? '')) !== '') {
    json_out(['ok' => true, 'ref' => 'OK-00000000']);
}

$type = (string)($_POST['type'] ?? '');
if (!isset($flows[$type])) {
    json_out(['ok' => false, 'error' => 'Jenis laporan tidak valid'], 422);
}
$flow = $flows[$type];

try {
    if (rate_limit_hit()) {
        json_out(['ok' => false, 'error' => 'Terlalu banyak kiriman dari perangkat ini. Coba lagi beberapa saat lagi.'], 429);
    }
} catch (Throwable $e) {
    error_log('rate_limit: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Layanan sedang bermasalah. Coba lagi nanti.'], 500);
}

// --- Validasi jawaban ---
$rawAnswers = json_decode((string)($_POST['answers'] ?? '{}'), true);
if (!is_array($rawAnswers)) {
    json_out(['ok' => false, 'error' => 'Format jawaban tidak valid'], 422);
}
$answers = [];
foreach ($flow['steps'] as $step) {
    $key = $step['key'];
    $val = isset($rawAnswers[$key]) && is_string($rawAnswers[$key]) ? trim($rawAnswers[$key]) : '';
    if ($val === '') {
        continue;
    }
    $max = $step['type'] === 'longtext' ? 5000 : 500;
    if (mb_strlen($val) > $max) {
        json_out(['ok' => false, 'error' => 'Jawaban "' . $step['label'] . '" terlalu panjang (maks ' . $max . ' karakter)'], 422);
    }
    if ($step['type'] === 'email' && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
        json_out(['ok' => false, 'error' => 'Format email pada "' . $step['label'] . '" tidak valid'], 422);
    }
    if ($step['type'] === 'date' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
        json_out(['ok' => false, 'error' => 'Format tanggal pada "' . $step['label'] . '" tidak valid'], 422);
    }
    $answers[$key] = $val;
}

// --- Validasi lampiran ---
$up = cfg('upload');
$maxBytes = (int)$up['max_size_mb'] * 1024 * 1024;
$files = [];
if (!empty($_FILES['files']) && is_array($_FILES['files']['name'])) {
    $count = count($_FILES['files']['name']);
    if ($count > (int)$up['max_files']) {
        json_out(['ok' => false, 'error' => 'Maksimal ' . $up['max_files'] . ' file'], 422);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    for ($i = 0; $i < $count; $i++) {
        $err = $_FILES['files']['error'][$i];
        if ($err === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $name = (string)$_FILES['files']['name'][$i];
        if ($err !== UPLOAD_ERR_OK) {
            json_out(['ok' => false, 'error' => 'File "' . $name . '" gagal diunggah'], 422);
        }
        $tmp = $_FILES['files']['tmp_name'][$i];
        $size = (int)$_FILES['files']['size'][$i];
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if ($size > $maxBytes) {
            json_out(['ok' => false, 'error' => 'File "' . $name . '" melebihi ' . $up['max_size_mb'] . ' MB'], 422);
        }
        if (!in_array($ext, $up['extensions'], true)) {
            json_out(['ok' => false, 'error' => 'Jenis file "' . $name . '" tidak diizinkan'], 422);
        }
        $mime = (string)$finfo->file($tmp);
        if (preg_match('#^(text/(html|x-php)|application/(x-httpd-php|x-php|javascript|x-msdownload|x-sh))#', $mime)) {
            json_out(['ok' => false, 'error' => 'File "' . $name . '" ditolak'], 422);
        }
        $files[] = ['tmp' => $tmp, 'name' => mb_substr(basename($name), 0, 200), 'ext' => $ext, 'size' => $size, 'mime' => $mime ?: 'application/octet-stream'];
    }
}

if (!$answers && !$files) {
    json_out(['ok' => false, 'error' => 'Laporan kosong. Isi minimal satu jawaban atau unggah satu file.'], 422);
}

// --- Simpan ---
$pdo = db();
$now = date('Y-m-d H:i:s');
$ref = '';
$saved = [];
try {
    $pdo->beginTransaction();
    for ($try = 0; $try < 5; $try++) {
        $ref = random_ref($flow['prefix']);
        $exists = $pdo->prepare('SELECT 1 FROM reports WHERE ref = ?');
        $exists->execute([$ref]);
        if (!$exists->fetchColumn()) {
            break;
        }
    }
    $pdo->prepare('INSERT INTO reports (ref, type, answers, created_at) VALUES (?, ?, ?, ?)')
        ->execute([$ref, $type, json_encode($answers, JSON_UNESCAPED_UNICODE), $now]);
    $reportId = (int)$pdo->lastInsertId();

    $dir = STORAGE_DIR . '/uploads/' . date('Y') . '/' . date('m');
    if ($files && !is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new RuntimeException('Folder unggahan tidak bisa dibuat');
    }
    foreach ($files as $f) {
        $stored = bin2hex(random_bytes(16)) . '.' . $f['ext'];
        $path = $dir . '/' . $stored;
        if (!move_uploaded_file($f['tmp'], $path)) {
            throw new RuntimeException('Gagal menyimpan file');
        }
        $rel = date('Y') . '/' . date('m') . '/' . $stored;
        $pdo->prepare('INSERT INTO attachments (report_id, orig_name, stored_name, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$reportId, $f['name'], $rel, $f['mime'], $f['size'], $now]);
        $saved[] = ['name' => $f['name'], 'path' => $path, 'mime' => $f['mime'], 'size' => $f['size']];
    }
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    foreach ($saved as $s) {
        @unlink($s['path']);
    }
    error_log('submit: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Laporan belum tersimpan. Silakan coba lagi.'], 500);
}

// --- Email notifikasi (kegagalan email tidak membatalkan laporan) ---
$emailStatus = 'tidak dikirim';
try {
    $recipients = cfg('recipients')[$type] ?? [];
    $rows = '';
    foreach ($flow['steps'] as $step) {
        $v = $answers[$step['key']] ?? '';
        $rows .= '<tr><td style="padding:6px 12px;border:1px solid #d5deef;background:#f3f7ff;vertical-align:top;width:34%"><b>' . h($step['label']) . '</b></td>'
            . '<td style="padding:6px 12px;border:1px solid #d5deef;vertical-align:top">' . ($v === '' ? '<i style="color:#8a94a8">(tidak diisi)</i>' : nl2br(h($v))) . '</td></tr>';
    }
    $total = array_sum(array_column($saved, 'size'));
    $attachMax = (int)(cfg('mail')['attach_max_total_mb'] ?? 15) * 1024 * 1024;
    $attach = [];
    $fileNote = 'Tidak ada lampiran.';
    if ($saved) {
        $names = implode(', ', array_map(fn($s) => h($s['name']), $saved));
        if ($total <= $attachMax) {
            $attach = array_map(fn($s) => ['name' => $s['name'], 'path' => $s['path'], 'mime' => $s['mime']], $saved);
            $fileNote = 'Lampiran (' . count($saved) . '): ' . $names;
        } else {
            $fileNote = 'Lampiran terlalu besar untuk email. File ada di dashboard admin: ' . $names;
        }
    }
    $html = '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1b2540">'
        . '<h2 style="margin:0 0 4px">' . h($flow['title']) . '</h2>'
        . '<p style="margin:0 0 12px;color:#55607a">Laporan baru masuk. Kode referensi: <b>' . h($ref) . '</b> &middot; ' . h(date('d M Y H:i', strtotime($now))) . ' WIB</p>'
        . '<table style="border-collapse:collapse;width:100%;max-width:720px">' . $rows . '</table>'
        . '<p style="margin:12px 0 0">' . $fileNote . '</p>'
        . '<p style="margin:16px 0 0;color:#8a94a8;font-size:12px">Email otomatis dari Layanan Pelaporan WKI. Jangan diteruskan ke pihak yang tidak berwenang.</p></div>';
    [$ok, $msg] = Mailer::send($recipients, '[' . $flow['prefix'] . '] Ada laporan baru - ' . $ref, $html, $attach);
    $emailStatus = ($ok ? 'terkirim' : 'gagal') . ': ' . mb_substr($msg, 0, 200);
} catch (Throwable $e) {
    $emailStatus = 'gagal: ' . mb_substr($e->getMessage(), 0, 200);
    error_log('email: ' . $e->getMessage());
}
$pdo->prepare('UPDATE reports SET email_status = ? WHERE id = ?')->execute([$emailStatus, $reportId]);

json_out(['ok' => true, 'ref' => $ref]);
