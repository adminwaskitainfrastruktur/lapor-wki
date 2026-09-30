<?php
declare(strict_types=1);

// Pengirim email sederhana: driver 'mail' (bawaan hosting) atau 'smtp'. Mendukung lampiran.
final class Mailer
{
    /** @param string[] $to  @param array<int,array{name:string,path:string,mime:string}> $attachments  @return array{0:bool,1:string} */
    public static function send(array $to, string $subject, string $html, array $attachments = []): array
    {
        $m = cfg('mail', []);
        $from = $m['from'] ?? '';
        $fromName = $m['from_name'] ?? '';
        if (!$to || !$from) {
            return [false, 'Penerima atau pengirim belum diatur'];
        }
        $boundary = 'b_' . bin2hex(random_bytes(12));
        $headers = [
            'From: ' . self::mimeName($fromName) . ' <' . $from . '>',
            'MIME-Version: 1.0',
            'Date: ' . date('r'),
            'Message-ID: <' . bin2hex(random_bytes(10)) . '@' . (substr(strrchr($from, '@'), 1) ?: 'localhost') . '>',
        ];
        $body = self::buildBody($html, $attachments, $boundary, $headers);
        $encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

        try {
            if (($m['driver'] ?? 'mail') === 'smtp') {
                $headers[] = 'To: ' . implode(', ', $to);
                $headers[] = 'Subject: ' . $encSubject;
                self::smtp($m, $from, $to, implode("\r\n", $headers) . "\r\n\r\n" . $body);
                return [true, 'smtp ok'];
            }
            $ok = @mail(implode(', ', $to), $encSubject, $body, implode("\r\n", $headers), '-f' . $from);
            return [$ok, $ok ? 'mail() ok' : 'mail() gagal'];
        } catch (Throwable $e) {
            return [false, $e->getMessage()];
        }
    }

    private static function mimeName(string $n): string
    {
        return $n === '' ? '' : '=?UTF-8?B?' . base64_encode($n) . '?=';
    }

    private static function buildBody(string $html, array $attachments, string $boundary, array &$headers): string
    {
        $htmlPart = chunk_split(base64_encode($html), 76, "\r\n");
        if (!$attachments) {
            $headers[] = 'Content-Type: text/html; charset=UTF-8';
            $headers[] = 'Content-Transfer-Encoding: base64';
            return $htmlPart;
        }
        $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
        $out = "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . $htmlPart;
        foreach ($attachments as $a) {
            $name = '=?UTF-8?B?' . base64_encode($a['name']) . '?=';
            $out .= "--$boundary\r\nContent-Type: {$a['mime']}; name=\"$name\"\r\n"
                . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$name\"\r\n\r\n"
                . chunk_split(base64_encode((string)file_get_contents($a['path'])), 76, "\r\n");
        }
        return $out . "--$boundary--\r\n";
    }

    private static function smtp(array $m, string $from, array $to, string $data): void
    {
        $secure = $m['secure'] ?? 'tls';
        $host = $m['host'];
        $port = (int)$m['port'];
        $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $fp = @stream_socket_client($remote, $errno, $errstr, 20);
        if (!$fp) {
            throw new RuntimeException("SMTP tidak bisa terhubung: $errstr ($errno)");
        }
        stream_set_timeout($fp, 30);
        $expect = function (array $codes) use ($fp): string {
            $resp = '';
            while (($line = fgets($fp, 1024)) !== false) {
                $resp .= $line;
                if (strlen($line) < 4 || $line[3] === ' ') {
                    break;
                }
            }
            if (!in_array((int)substr($resp, 0, 3), $codes, true)) {
                throw new RuntimeException('SMTP: ' . trim($resp));
            }
            return $resp;
        };
        $cmd = function (string $c, array $codes) use ($fp, $expect): string {
            fwrite($fp, $c . "\r\n");
            return $expect($codes);
        };
        $expect([220]);
        $ehloHost = $_SERVER['SERVER_NAME'] ?? 'localhost';
        $cmd('EHLO ' . $ehloHost, [250]);
        if ($secure === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP: gagal memulai TLS');
            }
            $cmd('EHLO ' . $ehloHost, [250]);
        }
        if (($m['user'] ?? '') !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode($m['user']), [334]);
            $cmd(base64_encode($m['pass']), [235]);
        }
        $cmd('MAIL FROM:<' . $from . '>', [250]);
        foreach ($to as $r) {
            $cmd('RCPT TO:<' . $r . '>', [250, 251]);
        }
        $cmd('DATA', [354]);
        $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $data));
        $data = str_replace("\n", "\r\n", $data);
        fwrite($fp, $data . "\r\n.\r\n");
        $expect([250]);
        @fwrite($fp, "QUIT\r\n");
        fclose($fp);
    }
}
