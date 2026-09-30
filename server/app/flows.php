<?php
// Definisi percakapan. Dipakai server (validasi, email, admin) dan dikirim ke browser (tampilan chat).
// type: text | email | tel | date | longtext
// Semua pertanyaan opsional, sama seperti form sebelumnya.

return [
    'wbs' => [
        'prefix' => 'WBS',
        'title'  => 'Whistleblowing System (WBS)',
        'button' => 'Whistleblowing System (WBS)',
        'blurb'  => 'Laporkan dugaan penipuan, korupsi, pelanggaran aturan, atau penyalahgunaan wewenang.',
        'intro'  => [
            'Whistleblowing System (Sistem Pelaporan Pelanggaran) adalah sistem yang memungkinkan individu, biasanya karyawan atau orang dalam sebuah organisasi, untuk melaporkan tindakan atau perilaku yang melanggar hukum, etika, atau kebijakan perusahaan.',
            'Laporan bisa mencakup penipuan, korupsi, pelanggaran peraturan, atau penyalahgunaan wewenang. Identitas pelapor dirahasiakan. Anda tidak wajib menyebutkan nama, dan semua pertanyaan boleh dilewati.',
        ],
        'steps' => [
            ['key' => 'nama_pelapor',       'type' => 'text',     'label' => "Nama Pelapor", 'q' => "Boleh tahu nama Anda? Boleh diisi inisial atau dikosongkan."],
            ['key' => 'email',              'type' => 'email',    'label' => 'Email', 'q' => 'Apakah ada alamat email yang bisa kami hubungi?'],
            ['key' => 'no_telp',            'type' => 'tel',      'label' => 'No. Telp Pelapor', 'q' => 'Nomor telepon yang bisa dihubungi?'],
            ['key' => 'alamat_pelapor',     'type' => 'text',     'label' => 'Alamat/Tempat Tugas Pelapor', 'q' => 'Alamat atau tempat tugas Anda?'],
            ['key' => 'nama_terlapor',      'type' => 'text',     'label' => 'Nama Lengkap Terlapor', 'q' => 'Siapa nama lengkap pihak yang dilaporkan?'],
            ['key' => 'jabatan_terlapor',   'type' => 'text',     'label' => 'Jabatan/Unit Kerja Terlapor', 'q' => 'Apa jabatan atau unit kerja pihak yang dilaporkan?'],
            ['key' => 'tanggal_kejadian',   'type' => 'date',     'label' => 'Tanggal Kejadian', 'q' => 'Kapan kejadiannya?'],
            ['key' => 'tempat_pelanggaran', 'type' => 'text',     'label' => 'Tempat/Lokasi Pelanggaran', 'q' => 'Di mana lokasi kejadian?'],
            ['key' => 'jenis_pelanggaran',  'type' => 'text',     'label' => 'Jenis Pelanggaran', 'q' => 'Jenis pelanggaran apa yang terjadi?'],
            ['key' => 'detail_kejadian',    'type' => 'longtext', 'label' => 'Detail Kejadian', 'q' => 'Ceritakan detail kejadiannya sejelas mungkin.'],
        ],
        'files_prompt' => 'Jika ada dokumen atau bukti pendukung (foto, PDF, dan lain-lain), silakan unggah di sini. Bagian ini tidak wajib.',
        'outro' => 'Terima kasih sudah melapor. Tim kami akan melakukan peninjauan atas laporan Anda.',
    ],

    'gratifikasi' => [
        'prefix' => 'GRT',
        'title'  => 'Pelaporan Penerimaan Gratifikasi',
        'button' => 'Pelaporan Gratifikasi',
        'blurb'  => 'Laporkan penerimaan pemberian (uang, barang, fasilitas) yang berkaitan dengan jabatan.',
        'intro'  => [
            'Gratifikasi adalah setiap pemberian dan/atau penerimaan dalam arti luas, yakni meliputi pemberian uang, barang, rabat (discount), komisi, pinjaman tanpa bunga, tiket perjalanan, fasilitas penginapan, perjalanan wisata, pengobatan cuma-cuma, dan fasilitas lainnya baik yang diterima di dalam negeri maupun di luar negeri, dengan sarana elektronik atau tanpa sarana elektronik.',
            'PT Waskita Karya Infrastruktur (WKI) berkomitmen mencegah segala gratifikasi di lingkungan perusahaan, dari top management hingga level pegawai. Komitmen ini dibuktikan dengan Sertifikasi Sistem Manajemen Anti Penyuapan (ISO 37001:2016) dan SK No 10.2/SK/WKI/2025 tentang Prosedur Pengendalian Gratifikasi.',
            'Semua pertanyaan boleh dilewati.',
        ],
        'steps' => [
            ['section' => 'A. Identitas Pelapor', 'key' => 'nama_lengkap',  'type' => 'text',  'label' => 'Nama Lengkap', 'q' => 'Siapa nama lengkap Anda?'],
            ['key' => 'nip',                'type' => 'text',  'label' => 'NIP', 'q' => 'NIP Anda?'],
            ['key' => 'ttl',                'type' => 'text',  'label' => 'Tempat & Tgl Lahir', 'q' => 'Tempat dan tanggal lahir Anda?'],
            ['key' => 'jabatan',            'type' => 'text',  'label' => 'Jabatan', 'q' => 'Apa jabatan Anda?'],
            ['key' => 'email',              'type' => 'email', 'label' => 'Alamat Email', 'q' => 'Alamat email Anda?'],
            ['key' => 'telepon',            'type' => 'tel',   'label' => 'Nomor Telepon', 'q' => 'Nomor telepon Anda?'],
            ['key' => 'alamat_rumah',       'type' => 'text',  'label' => 'Alamat Rumah', 'q' => 'Alamat rumah Anda?'],

            ['section' => 'B. Data Penerimaan Gratifikasi', 'key' => 'jenis_penerimaan', 'type' => 'text', 'label' => 'Jenis Penerimaan dan Uraian', 'q' => 'Apa jenis penerimaan gratifikasinya? Mohon diuraikan.'],
            ['key' => 'nilai',              'type' => 'text',  'label' => 'Nilai/Nominal/Taksiran', 'q' => 'Berapa nilai, nominal, atau taksirannya?'],
            ['key' => 'peristiwa',          'type' => 'text',  'label' => 'Peristiwa', 'q' => 'Dalam peristiwa apa gratifikasi ini diterima?'],
            ['key' => 'tempat_tanggal',     'type' => 'text',  'label' => 'Tempat & Tanggal', 'q' => 'Di mana dan kapan gratifikasi ini diterima?'],

            ['section' => 'C. Data Pemberian Gratifikasi', 'key' => 'pemberi_nama', 'type' => 'text', 'label' => 'Nama Pemberi', 'q' => 'Siapa nama pemberi gratifikasi?'],
            ['key' => 'pemberi_pekerjaan',  'type' => 'text',  'label' => 'Pekerjaan dan Jabatan Pemberi', 'q' => 'Apa pekerjaan dan jabatan pemberi?'],
            ['key' => 'pemberi_kontak',     'type' => 'text',  'label' => 'Alamat/Telepon/Fax/Email Pemberi', 'q' => 'Alamat, telepon, fax, atau email pemberi?'],
            ['key' => 'hubungan',           'type' => 'text',  'label' => 'Hubungan dengan Pemberi', 'q' => 'Apa hubungan Anda dengan pemberi?'],

            ['section' => 'D. Alamat dan Kronologi', 'key' => 'alasan', 'type' => 'text', 'label' => 'Alasan Pemberian', 'q' => 'Apa alasan pemberian tersebut?'],
            ['key' => 'kronologi',          'type' => 'longtext', 'label' => 'Kronologi Penerimaan', 'q' => 'Ceritakan kronologi penerimaannya.'],
            ['key' => 'dokumen',            'type' => 'text',  'label' => 'Dokumen yang Dilampirkan', 'q' => 'Dokumen apa saja yang Anda lampirkan? Tuliskan daftarnya.'],
        ],
        'files_prompt' => 'Silakan unggah dokumen atau bukti pendukung di sini jika ada. Bagian ini tidak wajib.',
        'outro' => 'Terima kasih. Laporan gratifikasi Anda sudah kami terima.',
    ],
];
