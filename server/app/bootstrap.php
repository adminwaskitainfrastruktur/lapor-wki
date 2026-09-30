<?php
declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Konfigurasi belum dibuat. Salin app/config.sample.php menjadi app/config.php lalu isi.');
}
$CONFIG = require $configFile;
date_default_timezone_set($CONFIG['timezone'] ?? 'Asia/Jakarta');
// Lokasi lampiran. Sebaiknya di luar folder web (lihat 'storage_dir' di config.sample.php).
define('STORAGE_DIR', rtrim((string)($CONFIG['storage_dir'] ?? '') ?: APP_ROOT . '/storage', "/\\"));

function cfg(string $key, $default = null)
{
    global $CONFIG;
    return $CONFIG[$key] ?? $default;
}

function h(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('X-Frame-Options: SAMEORIGIN');
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $c = cfg('db');
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], (int)($c['port'] ?? 3306), $c['name']);
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    migrate($pdo);
    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS reports (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ref VARCHAR(24) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL,
        answers LONGTEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'baru',
        admin_note TEXT NULL,
        email_status VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        INDEX idx_type (type),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS attachments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        report_id INT UNSIGNED NOT NULL,
        orig_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(120) NOT NULL,
        mime VARCHAR(120) NOT NULL,
        size INT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX idx_report (report_id),
        CONSTRAINT fk_att_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limit (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        k CHAR(64) NOT NULL,
        ts INT UNSIGNED NOT NULL,
        INDEX idx_k (k),
        INDEX idx_ts (ts)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

// Pembatas umum berbasis hash (IP tidak disimpan, hanya hash harian yang tidak bisa dibalik).
// Mengembalikan true bila batas sudah terlampaui. $count=false hanya memeriksa tanpa mencatat.
function throttle(string $bucket, int $max, int $windowSeconds, bool $count = true): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $key = hash('sha256', $bucket . '|' . $ip . '|' . date('Y-m-d') . '|' . cfg('app_secret', ''));
    $pdo = db();
    $now = time();
    $pdo->prepare('DELETE FROM rate_limit WHERE ts < ?')->execute([$now - 86400]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM rate_limit WHERE k = ? AND ts > ?');
    $st->execute([$key, $now - $windowSeconds]);
    if ((int)$st->fetchColumn() >= $max) {
        return true;
    }
    if ($count) {
        $pdo->prepare('INSERT INTO rate_limit (k, ts) VALUES (?, ?)')->execute([$key, $now]);
    }
    return false;
}

function rate_limit_hit(): bool
{
    $rl = cfg('rate_limit', ['max' => 5, 'window_minutes' => 60]);
    return throttle('submit', (int)$rl['max'], (int)$rl['window_minutes'] * 60);
}

function random_ref(string $prefix): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $s = '';
    for ($i = 0; $i < 8; $i++) {
        $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $prefix . '-' . $s;
}
