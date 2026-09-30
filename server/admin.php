<?php
declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';
security_headers();
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

$flows = require __DIR__ . '/app/flows.php';
$users = cfg('admin_users', []);

session_name('lapor_admin');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();

// ---------- Mode setup: membuat hash password (hanya jika belum ada admin) ----------
if (isset($_GET['setup'])) {
    if ($users) {
        http_response_code(403);
        exit('Setup dinonaktifkan karena akun admin sudah ada di config.');
    }
    $hash = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && strlen((string)($_POST['pw'] ?? '')) >= 10) {
        $hash = password_hash((string)$_POST['pw'], PASSWORD_DEFAULT);
    }
    page_start('Setup admin');
    echo '<h1>Setup admin</h1><p>Buat password (minimal 10 karakter). Hash akan muncul di bawah untuk ditempel ke <code>app/config.php</code> pada bagian <code>admin_users</code>. Password tidak disimpan.</p>';
    echo '<form method="post"><label>Password<input type="password" name="pw" minlength="10" required autocomplete="new-password"></label><button>Buat hash</button></form>';
    if ($hash) {
        echo '<p>Tempel di config:</p><pre>\'admin\' =&gt; \'' . h($hash) . '\',</pre>';
    }
    page_end();
    exit;
}

function page_start(string $title): void
{
    echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . h($title) . '</title><style>
    :root{--p:#1e40af;--bg:#eff6ff;--card:#fff;--b:#bfdbfe;--mut:#475569;--fg:#1e3a8a;--red:#b91c1c;--ok:#15803d}
    *{box-sizing:border-box}body{margin:0;font:16px/1.6 "Source Sans 3",system-ui,sans-serif;background:var(--bg);color:#0f1d47}
    main{max-width:1080px;margin:0 auto;padding:24px 16px}h1{font-size:24px;color:var(--fg);margin:0 0 12px}
    a{color:var(--p)}table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--b);border-radius:12px;overflow:hidden}
    th,td{padding:10px 12px;border-bottom:1px solid var(--b);text-align:left;vertical-align:top}th{background:#dbeafe;font-weight:600}
    input,select,textarea,button{font:inherit;padding:10px 12px;border-radius:10px;border:1px solid var(--b);min-height:44px}
    button{background:var(--p);color:#fff;border:0;cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #93b4ff;outline-offset:2px}
    label{display:block;margin:8px 0}label input,label textarea{display:block;width:100%;max-width:420px}
    .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 16px}.card{background:var(--card);border:1px solid var(--b);border-radius:16px;padding:16px;margin:0 0 16px}
    .tag{display:inline-block;padding:2px 10px;border-radius:999px;background:#dbeafe;font-size:14px}.err{color:var(--red)}pre{background:#0f172a;color:#e6ecff;padding:12px;border-radius:10px;overflow:auto}
    dt{font-weight:600;margin-top:10px}dd{margin:0}
    </style></head><body><main>';
}
function page_end(): void
{
    echo '</main></body></html>';
}
function csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}
function csrf_ok(): bool
{
    return hash_equals($_SESSION['csrf'] ?? '', (string)($_POST['csrf'] ?? ''));
}

// ---------- Login ----------
if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: admin.php');
    exit;
}
$error = '';
if (empty($_SESSION['user'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
        $u = (string)($_POST['user'] ?? '');
        $p = (string)($_POST['pass'] ?? '');
        // maksimal 10 percobaan gagal per 15 menit per pengirim
        if (throttle('login', 10, 900, false)) {
            http_response_code(429);
            page_start('Terlalu banyak percobaan');
            echo '<h1>Terlalu banyak percobaan</h1><p class="err" role="alert">Coba lagi dalam 15 menit.</p>';
            page_end();
            exit;
        }
        $ok = isset($users[$u]) && password_verify($p, $users[$u]);
        if (!$ok) {
            throttle('login', 10, 900);
            // jeda kecil untuk memperlambat tebakan
            usleep(600000);
            $error = 'Nama pengguna atau password salah.';
        } else {
            session_regenerate_id(true);
            $_SESSION['user'] = $u;
            header('Location: admin.php');
            exit;
        }
    }
    page_start('Masuk admin');
    echo '<h1>Masuk admin</h1>';
    if (!$users) {
        echo '<p class="err">Belum ada akun admin. Buka <a href="admin.php?setup">admin.php?setup</a> untuk membuat hash password.</p>';
    }
    if ($error) {
        echo '<p class="err" role="alert">' . h($error) . '</p>';
    }
    echo '<form method="post" class="card"><input type="hidden" name="login" value="1"><label>Nama pengguna<input name="user" autocomplete="username" required></label><label>Password<input type="password" name="pass" autocomplete="current-password" required></label><button>Masuk</button></form>';
    page_end();
    exit;
}

$pdo = db();
$statuses = ['baru' => 'Baru', 'ditinjau' => 'Sedang ditinjau', 'selesai' => 'Selesai'];

// ---------- Unduh lampiran ----------
if (isset($_GET['dl'])) {
    $st = $pdo->prepare('SELECT * FROM attachments WHERE id = ?');
    $st->execute([(int)$_GET['dl']]);
    $a = $st->fetch();
    $path = $a ? realpath(STORAGE_DIR . '/uploads/' . $a['stored_name']) : false;
    $base = realpath(STORAGE_DIR . '/uploads');
    if (!$a || !$path || !$base || strpos($path, $base) !== 0) {
        http_response_code(404);
        exit('File tidak ditemukan');
    }
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . filesize($path));
    header('Content-Disposition: attachment; filename="' . rawurlencode($a['orig_name']) . '"; filename*=UTF-8\'\'' . rawurlencode($a['orig_name']));
    readfile($path);
    exit;
}

// ---------- Ekspor CSV ----------
if (isset($_GET['csv'])) {
    $rows = $pdo->query('SELECT * FROM reports ORDER BY id DESC')->fetchAll();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="laporan-' . date('Ymd-His') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Kode', 'Jenis', 'Waktu', 'Status', 'Catatan admin', 'Jawaban']);
    foreach ($rows as $r) {
        $ans = json_decode($r['answers'], true) ?: [];
        $flow = $flows[$r['type']] ?? null;
        $parts = [];
        foreach ($ans as $k => $v) {
            $label = $k;
            if ($flow) {
                foreach ($flow['steps'] as $s) {
                    if ($s['key'] === $k) {
                        $label = $s['label'];
                    }
                }
            }
            $parts[] = $label . ': ' . $v;
        }
        // cegah injeksi rumus spreadsheet
        $cell = implode("\n", $parts);
        if ($cell !== '' && strpbrk($cell[0], '=+-@') !== false) {
            $cell = "'" . $cell;
        }
        fputcsv($out, [$r['ref'], $r['type'], $r['created_at'], $r['status'], $r['admin_note'], $cell]);
    }
    exit;
}

// ---------- Ubah status/catatan ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update'])) {
    if (!csrf_ok()) {
        http_response_code(400);
        exit('Token tidak valid');
    }
    $st = isset($statuses[$_POST['status'] ?? '']) ? $_POST['status'] : 'baru';
    $pdo->prepare('UPDATE reports SET status = ?, admin_note = ? WHERE id = ?')
        ->execute([$st, mb_substr((string)($_POST['note'] ?? ''), 0, 2000), (int)$_POST['id']]);
    header('Location: admin.php?id=' . (int)$_POST['id'] . '&saved=1');
    exit;
}

// ---------- Detail ----------
if (isset($_GET['id'])) {
    $st = $pdo->prepare('SELECT * FROM reports WHERE id = ?');
    $st->execute([(int)$_GET['id']]);
    $r = $st->fetch();
    if (!$r) {
        http_response_code(404);
        exit('Laporan tidak ditemukan');
    }
    $flow = $flows[$r['type']] ?? ['title' => $r['type'], 'steps' => []];
    $ans = json_decode($r['answers'], true) ?: [];
    $att = $pdo->prepare('SELECT * FROM attachments WHERE report_id = ?');
    $att->execute([$r['id']]);
    page_start($r['ref']);
    echo '<div class="bar"><a href="admin.php">&larr; Semua laporan</a></div>';
    echo '<h1>' . h($r['ref']) . ' <span class="tag">' . h($flow['title']) . '</span></h1>';
    echo '<p>Masuk: ' . h($r['created_at']) . ' &middot; Email: ' . h((string)$r['email_status']) . '</p>';
    if (isset($_GET['saved'])) {
        echo '<p role="status" style="color:var(--ok)">Tersimpan.</p>';
    }
    echo '<div class="card"><dl>';
    foreach ($flow['steps'] as $s) {
        $v = $ans[$s['key']] ?? '';
        echo '<dt>' . h($s['label']) . '</dt><dd>' . ($v === '' ? '<i>(tidak diisi)</i>' : nl2br(h($v))) . '</dd>';
    }
    echo '</dl></div>';
    echo '<div class="card"><b>Lampiran</b><ul>';
    $n = 0;
    foreach ($att->fetchAll() as $a) {
        $n++;
        echo '<li><a href="admin.php?dl=' . (int)$a['id'] . '">' . h($a['orig_name']) . '</a> (' . round($a['size'] / 1024) . ' KB)</li>';
    }
    if (!$n) {
        echo '<li><i>Tidak ada</i></li>';
    }
    echo '</ul></div>';
    echo '<form method="post" class="card"><input type="hidden" name="csrf" value="' . h(csrf()) . '"><input type="hidden" name="update" value="1"><input type="hidden" name="id" value="' . (int)$r['id'] . '">';
    echo '<label>Status<select name="status">';
    foreach ($statuses as $k => $v) {
        echo '<option value="' . h($k) . '"' . ($r['status'] === $k ? ' selected' : '') . '>' . h($v) . '</option>';
    }
    echo '</select></label><label>Catatan admin<textarea name="note" rows="4">' . h((string)$r['admin_note']) . '</textarea></label><button>Simpan</button></form>';
    page_end();
    exit;
}

// ---------- Daftar ----------
$type = $_GET['type'] ?? '';
$where = isset($flows[$type]) ? 'WHERE type = ' . $pdo->quote($type) : '';
$rows = $pdo->query("SELECT id, ref, type, status, created_at, email_status, (SELECT COUNT(*) FROM attachments a WHERE a.report_id = reports.id) AS files FROM reports $where ORDER BY id DESC LIMIT 500")->fetchAll();
page_start('Laporan masuk');
echo '<div class="bar"><h1 style="margin:0;flex:1">Laporan masuk</h1><span>Masuk sebagai ' . h($_SESSION['user']) . '</span><a href="admin.php?logout=1">Keluar</a></div>';
echo '<div class="bar"><a href="admin.php">Semua</a>';
foreach ($flows as $k => $f) {
    echo '<a href="admin.php?type=' . h($k) . '">' . h($f['title']) . '</a>';
}
echo '<a href="admin.php?csv=1">Ekspor CSV</a></div>';
echo '<table><thead><tr><th>Kode</th><th>Jenis</th><th>Waktu</th><th>Status</th><th>File</th><th>Email</th></tr></thead><tbody>';
foreach ($rows as $r) {
    echo '<tr><td><a href="admin.php?id=' . (int)$r['id'] . '">' . h($r['ref']) . '</a></td><td>' . h($flows[$r['type']]['title'] ?? $r['type']) . '</td><td>' . h($r['created_at']) . '</td><td><span class="tag">' . h($statuses[$r['status']] ?? $r['status']) . '</span></td><td>' . (int)$r['files'] . '</td><td>' . h((string)$r['email_status']) . '</td></tr>';
}
if (!$rows) {
    echo '<tr><td colspan="6"><i>Belum ada laporan.</i></td></tr>';
}
echo '</tbody></table>';
page_end();
