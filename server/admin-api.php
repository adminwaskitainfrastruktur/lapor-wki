<?php
declare(strict_types=1);

/**
 * API dashboard admin (dipakai halaman React #/admin).
 * Masuk: browser login Microsoft (MSAL) lalu mengirim access token Microsoft Graph sekali ke action=login.
 * Server memanggil Graph /me dengan token itu; hanya akun di tenant kantor yang userPrincipalName-nya
 * tercantum di auth.admins yang mendapat sesi. Akun @waskitainfrastruktur.co.id lain tetap ditolak.
 */

require __DIR__ . '/app/bootstrap.php';

security_headers();
header('X-Robots-Tag: noindex, nofollow');

$flows = require __DIR__ . '/app/flows.php';
$STATUSES = ['baru' => 'Baru', 'ditinjau' => 'Sedang ditinjau', 'selesai' => 'Selesai'];
$action = (string)($_GET['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'];

session_name('lapor_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

// Sesi berakhir setelah 8 jam tanpa aktivitas
if (!empty($_SESSION['user']) && time() - (int)($_SESSION['seen'] ?? 0) > 8 * 3600) {
    $_SESSION = [];
}
if (!empty($_SESSION['user'])) {
    $_SESSION['seen'] = time();
}

function admin_list(): array
{
    $a = cfg('auth', []);
    return array_values(array_filter(array_map(fn ($e) => strtolower(trim((string)$e)), (array)($a['admins'] ?? []))));
}

function same_origin(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
    return $origin === '' || strcasecmp((string)parse_url($origin, PHP_URL_HOST), $host) === 0;
}

function require_admin(bool $write = false): array
{
    if (empty($_SESSION['user'])) {
        json_out(['ok' => false, 'error' => 'Silakan masuk terlebih dahulu.'], 401);
    }
    // Daftar admin dibaca ulang tiap permintaan: menghapus email dari config langsung mencabut akses.
    if (!in_array($_SESSION['user']['email'], admin_list(), true)) {
        $_SESSION = [];
        json_out(['ok' => false, 'error' => 'Akun Anda tidak lagi memiliki akses admin.'], 403);
    }
    if ($write && (!same_origin() || !hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')))) {
        json_out(['ok' => false, 'error' => 'Token keamanan tidak valid. Muat ulang halaman.'], 400);
    }
    return $_SESSION['user'];
}

function body_json(): array
{
    $d = json_decode((string)file_get_contents('php://input'), true);
    return is_array($d) ? $d : [];
}

function jwt_claims(string $jwt): array
{
    $p = explode('.', $jwt);
    if (count($p) !== 3) {
        return [];
    }
    $c = json_decode((string)base64_decode(strtr($p[1], '-_', '+/')), true);
    return is_array($c) ? $c : [];
}

function answer_rows(array $flow, array $ans): array
{
    $rows = [];
    foreach ($flow['steps'] as $s) {
        $rows[] = ['key' => $s['key'], 'label' => $s['label'], 'section' => $s['section'] ?? null, 'type' => $s['type'], 'value' => (string)($ans[$s['key']] ?? '')];
    }
    return $rows;
}

// ---------- Sesi ----------
if ($action === 'me' && $method === 'GET') {
    if (empty($_SESSION['user']) || !in_array($_SESSION['user']['email'], admin_list(), true)) {
        json_out(['ok' => false], 401);
    }
    json_out(['ok' => true, 'user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']]);
}

if ($action === 'login' && $method === 'POST') {
    if (!same_origin()) {
        json_out(['ok' => false, 'error' => 'Asal permintaan tidak diizinkan.'], 403);
    }
    if (throttle('admin_login', 10, 900, false)) {
        json_out(['ok' => false, 'error' => 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'], 429);
    }
    $auth = cfg('auth', []);
    $token = (string)(body_json()['token'] ?? '');
    if (empty($auth['tenant_id'])) {
        json_out(['ok' => false, 'error' => 'Login Microsoft belum dikonfigurasi.'], 400);
    }
    if ($token === '') {
        json_out(['ok' => false, 'error' => 'Token Microsoft tidak ditemukan.'], 400);
    }
    $ch = curl_init('https://graph.microsoft.com/v1.0/me?$select=displayName,userPrincipalName,mail');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token, 'Accept: application/json'],
    ]);
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $me = is_string($raw) ? json_decode($raw, true) : null;
    // Graph menerima token = token asli, sehingga klaim tid di dalamnya bisa dipercaya.
    $tid = strtolower((string)(jwt_claims($token)['tid'] ?? ''));
    if ($code !== 200 || !is_array($me) || $tid !== strtolower((string)$auth['tenant_id'])) {
        throttle('admin_login', 10, 900);
        json_out(['ok' => false, 'error' => 'Login Microsoft tidak dapat diverifikasi.'], 401);
    }
    // userPrincipalName, bukan mail: UPN hanya bisa memakai domain yang terverifikasi milik tenant.
    $email = strtolower(trim((string)($me['userPrincipalName'] ?? '')));
    if (!in_array($email, admin_list(), true)) {
        throttle('admin_login', 10, 900);
        json_out(['ok' => false, 'error' => 'Akun ' . $email . ' tidak memiliki akses admin.', 'email' => $email], 403);
    }
    session_regenerate_id(true);
    $_SESSION['user'] = ['email' => $email, 'name' => (string)($me['displayName'] ?? $email)];
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    $_SESSION['seen'] = time();
    json_out(['ok' => true, 'user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']]);
}

if ($action === 'logout' && $method === 'POST') {
    $_SESSION = [];
    session_destroy();
    json_out(['ok' => true]);
}

// ---------- Mulai dari sini wajib admin ----------
$pdo = db();

if ($action === 'stats' && $method === 'GET') {
    require_admin();
    $byStatus = array_fill_keys(array_keys($STATUSES), 0);
    foreach ($pdo->query('SELECT status, COUNT(*) n FROM reports GROUP BY status') as $r) {
        $byStatus[$r['status']] = (int)$r['n'];
    }
    $byType = array_fill_keys(array_keys($flows), 0);
    foreach ($pdo->query('SELECT type, COUNT(*) n FROM reports GROUP BY type') as $r) {
        $byType[$r['type']] = (int)$r['n'];
    }
    $days = [];
    for ($i = 13; $i >= 0; $i--) {
        $days[date('Y-m-d', strtotime("-$i day"))] = 0;
    }
    $st = $pdo->prepare('SELECT DATE(created_at) d, COUNT(*) n FROM reports WHERE created_at >= ? GROUP BY DATE(created_at)');
    $st->execute([array_key_first($days) . ' 00:00:00']);
    foreach ($st as $r) {
        if (isset($days[$r['d']])) {
            $days[$r['d']] = (int)$r['n'];
        }
    }
    $mailFail = (int)$pdo->query("SELECT COUNT(*) FROM reports WHERE email_status IS NOT NULL AND email_status LIKE 'gagal%'")->fetchColumn();
    json_out([
        'ok'       => true,
        'total'    => array_sum($byStatus),
        'byStatus' => $byStatus,
        'byType'   => $byType,
        'daily'    => array_map(fn ($d, $n) => ['date' => $d, 'count' => $n], array_keys($days), $days),
        'mailFail' => $mailFail,
        'statuses' => $STATUSES,
        'types'    => array_map(fn ($f) => $f['title'], $flows),
    ]);
}

if ($action === 'list' && $method === 'GET') {
    require_admin();
    $where = [];
    $args = [];
    if (isset($flows[$_GET['type'] ?? ''])) {
        $where[] = 'type = ?';
        $args[] = $_GET['type'];
    }
    if (isset($STATUSES[$_GET['status'] ?? ''])) {
        $where[] = 'status = ?';
        $args[] = $_GET['status'];
    }
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(ref LIKE ? OR answers LIKE ?)';
        $like = '%' . addcslashes($q, '%_\\') . '%';
        $args[] = $like;
        $args[] = $like;
    }
    $sql = 'SELECT id, ref, type, status, created_at, updated_at, email_status, answers,
            (SELECT COUNT(*) FROM attachments a WHERE a.report_id = reports.id) AS files
            FROM reports' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 500';
    $st = $pdo->prepare($sql);
    $st->execute($args);
    $rows = [];
    foreach ($st as $r) {
        $ans = json_decode($r['answers'], true) ?: [];
        // cuplikan: jawaban panjang pertama (kronologi/uraian) untuk kolom ringkas
        $snippet = '';
        foreach ($flows[$r['type']]['steps'] ?? [] as $s) {
            if ($s['type'] === 'longtext' && !empty($ans[$s['key']])) {
                $snippet = mb_substr((string)$ans[$s['key']], 0, 140);
                break;
            }
        }
        $rows[] = [
            'id' => (int)$r['id'], 'ref' => $r['ref'], 'type' => $r['type'], 'status' => $r['status'],
            'createdAt' => $r['created_at'], 'updatedAt' => $r['updated_at'], 'emailStatus' => $r['email_status'],
            'files' => (int)$r['files'], 'snippet' => $snippet,
        ];
    }
    json_out(['ok' => true, 'rows' => $rows]);
}

if ($action === 'detail' && $method === 'GET') {
    require_admin();
    $st = $pdo->prepare('SELECT * FROM reports WHERE id = ?');
    $st->execute([(int)($_GET['id'] ?? 0)]);
    $r = $st->fetch();
    if (!$r) {
        json_out(['ok' => false, 'error' => 'Laporan tidak ditemukan.'], 404);
    }
    $flow = $flows[$r['type']] ?? ['title' => $r['type'], 'steps' => []];
    $att = $pdo->prepare('SELECT id, orig_name, mime, size FROM attachments WHERE report_id = ? ORDER BY id');
    $att->execute([$r['id']]);
    json_out(['ok' => true, 'report' => [
        'id' => (int)$r['id'], 'ref' => $r['ref'], 'type' => $r['type'], 'typeTitle' => $flow['title'],
        'status' => $r['status'], 'createdAt' => $r['created_at'], 'updatedAt' => $r['updated_at'],
        'emailStatus' => $r['email_status'], 'adminNote' => (string)$r['admin_note'], 'publicNote' => (string)$r['public_note'],
        'answers' => answer_rows($flow, json_decode($r['answers'], true) ?: []),
        'attachments' => array_map(fn ($a) => ['id' => (int)$a['id'], 'name' => $a['orig_name'], 'mime' => $a['mime'], 'size' => (int)$a['size']], $att->fetchAll()),
    ]]);
}

if ($action === 'update' && $method === 'POST') {
    require_admin(true);
    $d = body_json();
    $status = isset($STATUSES[$d['status'] ?? '']) ? $d['status'] : null;
    if (!$status) {
        json_out(['ok' => false, 'error' => 'Status tidak dikenal.'], 400);
    }
    $st = $pdo->prepare('UPDATE reports SET status = ?, admin_note = ?, public_note = ?, updated_at = ? WHERE id = ?');
    $st->execute([
        $status,
        mb_substr((string)($d['adminNote'] ?? ''), 0, 4000),
        mb_substr((string)($d['publicNote'] ?? ''), 0, 2000),
        date('Y-m-d H:i:s'),
        (int)($d['id'] ?? 0),
    ]);
    json_out(['ok' => true, 'updatedAt' => date('Y-m-d H:i:s')]);
}

if ($action === 'download' && $method === 'GET') {
    require_admin();
    $st = $pdo->prepare('SELECT * FROM attachments WHERE id = ?');
    $st->execute([(int)($_GET['id'] ?? 0)]);
    $a = $st->fetch();
    $path = $a ? realpath(STORAGE_DIR . '/uploads/' . $a['stored_name']) : false;
    $base = realpath(STORAGE_DIR . '/uploads');
    if (!$a || !$path || !$base || strpos($path, $base) !== 0) {
        http_response_code(404);
        exit('File tidak ditemukan');
    }
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . filesize($path));
    header('Cache-Control: no-store');
    header('Content-Disposition: attachment; filename="' . rawurlencode($a['orig_name']) . '"; filename*=UTF-8\'\'' . rawurlencode($a['orig_name']));
    readfile($path);
    exit;
}

if ($action === 'csv' && $method === 'GET') {
    require_admin();
    $rows = $pdo->query('SELECT * FROM reports ORDER BY id DESC')->fetchAll();
    header('Content-Type: text/csv; charset=utf-8');
    header('Cache-Control: no-store');
    header('Content-Disposition: attachment; filename="laporan-' . date('Ymd-His') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Kode', 'Jenis', 'Waktu', 'Status', 'Diperbarui', 'Catatan internal', 'Tanggapan ke pelapor', 'Jawaban']);
    // cegah injeksi rumus spreadsheet
    $safe = fn (?string $v) => ($v !== null && $v !== '' && strpbrk($v[0], '=+-@') !== false) ? "'" . $v : (string)$v;
    foreach ($rows as $r) {
        $flow = $flows[$r['type']] ?? ['title' => $r['type'], 'steps' => []];
        $parts = [];
        foreach (answer_rows($flow, json_decode($r['answers'], true) ?: []) as $a) {
            if ($a['value'] !== '') {
                $parts[] = $a['label'] . ': ' . $a['value'];
            }
        }
        fputcsv($out, [$r['ref'], $flow['title'], $r['created_at'], $STATUSES[$r['status']] ?? $r['status'], $r['updated_at'],
            $safe($r['admin_note']), $safe($r['public_note']), $safe(implode("\n", $parts))]);
    }
    exit;
}

json_out(['ok' => false, 'error' => 'Permintaan tidak dikenal.'], 404);
