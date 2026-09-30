<?php
// Salin file ini menjadi app/config.php lalu isi nilainya. Jangan bagikan config.php.
return [
    'timezone'   => 'Asia/Jakarta',
    'app_name'   => 'Layanan Pelaporan PT Waskita Karya Infrastruktur',
    'app_secret' => 'GANTI-DENGAN-TEKS-ACAK-PANJANG',   // dipakai untuk hash pembatas kiriman

    // Folder lampiran. DISARANKAN di luar folder web, mis. '/home/u123456789/lapor-storage'
    // (buat folder itu di File Manager, sejajar dengan folder 'domains'). Kosongkan untuk memakai ./storage.
    'storage_dir' => '',

    // Database MySQL dari Hostinger (hPanel > Databases > MySQL Databases)
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'u123456789_lapor',
        'user' => 'u123456789_lapor',
        'pass' => 'PASSWORD_DATABASE',
    ],

    // Email notifikasi
    // driver 'mail'  = email bawaan hosting (tanpa setting, risiko masuk spam lebih tinggi)
    // driver 'smtp'  = SMTP (mis. mailbox Hostinger, SendLayer, Brevo, dll.)
    'mail' => [
        'driver'    => 'mail',
        'from'      => 'noreply@contoh-domain.co.id',
        'from_name' => 'Layanan Pelaporan WKI',
        'host'      => 'smtp.hostinger.com',
        'port'      => 465,
        'secure'    => 'ssl',          // 'ssl' (465) atau 'tls' (587)
        'user'      => '',
        'pass'      => '',
        'attach_max_total_mb' => 15,   // lampiran ditempel di email selama total di bawah ini
    ],

    // Penerima email per jenis laporan
    'recipients' => [
        'wbs' => [
            'penerima-wbs-1@contoh-domain.co.id',
            'penerima-wbs-2@contoh-domain.co.id',
        ],
        'gratifikasi' => [
            'penerima-gratifikasi-1@contoh-domain.co.id',
            'penerima-gratifikasi-2@contoh-domain.co.id',
        ],
    ],

    // Lampiran
    'upload' => [
        'max_files'   => 5,
        'max_size_mb' => 10,
        'extensions'  => ['jpg','jpeg','png','pdf','doc','docx','xls','xlsx','ppt','pptx','mp4','zip'],
    ],

    // Batas kiriman per pengirim (dihitung dari hash, IP tidak disimpan)
    'rate_limit' => ['max' => 5, 'window_minutes' => 60],

    // Akun admin untuk melihat laporan di /admin.php
    // Kosongkan dulu, buka /admin.php?setup untuk membuat hash password, lalu tempel di sini.
    'admin_users' => [
        // 'admin' => '$2y$10$....hash....',
    ],
];
