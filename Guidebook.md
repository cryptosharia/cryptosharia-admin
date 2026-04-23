# 📖 Buku Panduan & Manual Operasional CryptoSharia Admin

> Panduan komprehensif untuk tim internal dalam mengoperasikan sistem administrasi CryptoSharia secara aman dan efektif.

---

> [!IMPORTANT]
> **DISCLAIMER:** Dokumen ini difokuskan pada penjelasan fungsi internal dan operasional. Tim konten/admin **tidak perlu** melakukan instalasi teknis atau konfigurasi server. Akses sistem dilakukan sepenuhnya melalui peramban (browser) di alamat resmi: **[admin.cryptosharia.id](https://admin.cryptosharia.id)**.

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Akses Sistem & Keamanan](#2-akses-sistem--keamanan)
3. [Dashboard Analitik](#3-dashboard-analitik)
4. [Manajemen Token Crypto (Analisis Syariah)](#4-manajemen-token-crypto-analisis-syariah)
5. [Manajemen Konten (CMS)](#5-manajemen-konten-cms)
6. [Manajemen Tags](#6-manajemen-tags)
7. [Manajemen Pengguna & Peran (RBAC)](#7-manajemen-pengguna--peran-rbac)
8. [Manajemen Pesan Masuk (Messages)](#8-manajemen-pesan-masuk-messages)
9. [Pengaturan Profil & Audit Log](#9-pengaturan-profil--audit-log)
10. [Panduan Editor Markdown](#10-panduan-editor-markdown)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)

---

## 1. Pendahuluan

**CryptoSharia Admin** adalah panel pusat kendali (back-office) untuk platform CryptoSharia — sebuah layanan analisis kepatuhan syariah terhadap aset cryptocurrency. Sebagai pengelola, Anda bertanggung jawab memastikan data kepatuhan syariah tetap akurat dan konten edukasi yang disajikan bermanfaat bagi pengguna publik.

Tugas utama yang dilakukan di sini:
- **Analisis Syariah:** Menentukan status Halal/Haram/Syubhat suatu token.
- **Edukasi:** Menulis artikel, riset, dan berita terbaru.
- **Interaksi:** Merespon pesan atau pertanyaan dari pengguna.
- **Pengawasan:** Memantau statistik pertumbuhan data dan log aktivitas.

---

## 2. Akses Sistem & Keamanan

Untuk mengakses dashboard, Anda memerlukan akun staff yang telah didaftarkan oleh Superadmin.

1.  Buka browser (Google Chrome atau Mozilla Firefox sangat direkomendasikan).
2.  Ketik alamat: **[admin.cryptosharia.id](https://admin.cryptosharia.id)**.
3.  Masukkan **Email** dan **Password** Anda pada halaman login.
4.  Klik tombol **Login**.

> [!TIP]
> **Keamanan Akun:**
> - Pastikan tidak ada spasi di awal atau akhir email saat mengetik.
> - Selalu lakukan **Logout** (tombol di bagian bawah sidebar) saat selesai bekerja untuk menjaga keamanan data.
> - Jika muncul pesan "Invalid Credentials", segera hubungi tim IT atau Superadmin untuk verifikasi status akun Anda.

---

## 3. Dashboard Analitik

Halaman Dashboard memberikan ringkasan kondisi sistem secara real-time:
- **Total Token:** Jumlah seluruh aset crypto yang terdaftar di sistem.
- **Post Terbit:** Jumlah artikel, berita, atau riset yang sudah dipublikasikan.
- **Total Users:** Jumlah staff/admin yang terdaftar.
- **Pesan Baru:** Notifikasi jumlah pesan dari pengguna yang belum dibaca.
- **Aktivitas Terakhir:** Menunjukkan ringkasan perubahan terbaru yang dilakukan oleh tim admin.

---

## 4. Manajemen Token Crypto (Analisis Syariah)

Ini adalah fitur inti untuk mengelola status kepatuhan syariah suatu aset crypto.

### A. Menambah Token Baru
1.  Klik menu **Tokens** > Klik tombol **New Token**.
2.  **Informasi Dasar**: Isi Nama Token (misal: Bitcoin) dan Ticker (misal: BTC). Sistem akan otomatis membuat *URL Slug*.
3.  **Analisis Syariah**:
    - **Sharia Status**: Pilih salah satu dari **Halal**, **Haram**, atau **Syubhat**.
    - **Excerpt**: Ringkasan singkat alasan status tersebut (1-2 kalimat).
    - **Body Content**: Penjelasan mendalam mengenai fundamental proyek dan tinjauan teknis syariahnya menggunakan editor Markdown.
4.  **Metadata**: Tambahkan *Tags* (seperti: layer-1, defi, stablecoin) dan *TradingView Symbol* (misal: `BINANCE:BTCUSDT`) untuk menampilkan grafik harga.
5.  **Media**: Unggah logo token dengan format PNG atau JPG (disarankan latar belakang transparan).
6.  **Publishing**: Set status ke **Published** agar muncul di aplikasi publik, atau **Draft** jika masih dalam proses peninjauan.

### B. Memperbarui Status
Jika ada perubahan fundamental pada suatu proyek (contoh: transisi dari staking ke fitur lain), Anda dapat mengedit koin tersebut dan memperbarui status syariah beserta alasannya. Seluruh perubahan ini akan tercatat dalam **Audit Log**.

---

## 5. Manajemen Konten (CMS)

Gunakan menu ini untuk mengelola semua tulisan di platform (Berita, Edukasi, Riset, dan Event).

### A. Membuat Post Baru
1.  Klik menu **Posts** > Klik tombol **New Post**.
2.  **Judul & Konten**: Masukkan judul artikel dan isi tulisan menggunakan editor Markdown.
3.  **Kategori (Section)**:
    - `News` — Berita harian pasar crypto.
    - `Education` — Artikel panduan belajar untuk pemula.
    - `Research` — Laporan analisis proyek mendalam.
    - `Activity` — Kegiatan komunitas atau pengumuman event.
4.  **Tipe Konten**: Tentukan apakah formatnya berupa Article, Webinar, Video, atau Headline.
5.  **Media**: Unggah *Cover Image* (rasio 16:9 disarankan). Centang **Feature this post** jika ingin artikel ini muncul di banner utama (headline).
6.  **Event (Opsional)**: Jika tipe post adalah Webinar atau Event, isi kolom **Event Date** sesuai jadwal pelaksanaan.

---

## 6. Manajemen Tags

Tag digunakan untuk mengelompokkan data agar mudah ditemukan oleh pengguna.
- **Konsistensi**: Gunakan tag yang sudah ada jika relevan (misal: gunakan `layer-1` daripada membuat tag baru `L1`).
- **Efisiensi**: Satu tag dapat ditempelkan pada banyak token maupun artikel sekaligus.

---

## 7. Manajemen Pengguna & Peran (RBAC)

Hanya akun dengan role **Superadmin** yang dapat mengakses menu ini penuh.

### Tingkatan Hak Akses:
1.  **Super Admin**: Akses penuh ke seluruh fitur dan pengaturan pengguna.
2.  **Admin**: Mengelola data Token dan Posts secara bebas.
3.  **Posts Manager**: Dibatasi hanya untuk mengelola artikel, berita, dan tag terkait konten.
4.  **Tokens Manager**: Fokus pada analisis syariah dan pembaruan data koin crypto.

**Manajemen Status:** Superadmin dapat mengubah status staff menjadi `Inactive` (Suspend) untuk mencabut akses sementara tanpa menghapus data akun.

---

## 8. Manajemen Pesan Masuk (Messages)

Semua input dari formulir "Hubungi Kami" di website publik akan mendarat di sini.
- **Inbox**: Pantau pesan dengan status "Unread".
- **Detail**: Klik pesan untuk melihat nama pengirim, email, dan isi pertanyaan mereka.
- **Tindak Lanjut**: Gunakan informasi kontak untuk membalas pertanyaan pengguna melalui kanal resmi email CryptoSharia. Tandai sebagai "Read" jika sudah diproses.

---

## 9. Pengaturan Profil & Audit Log

### Profil Pribadi
Akses pengaturan melalui nama Anda di pojok kiri bawah:
- Ubah **Nama Tampilan** dan unggah **Avatar**.
- **Ganti Password**: Sangat disarankan untuk mengubah kata sandi secara berkala.

### Audit Log
Sistem secara otomatis mencatat setiap tindakan krusial (seperti saat admin menghapus token atau mengubah kategori artikel). Hal ini memastikan akuntabilitas tim dalam mengelola data sensitif.

---

## 10. Panduan Editor Markdown

Sistem menggunakan format Markdown demi kecepatan dan konsistensi tampilan.

| Hasil | Kode Markdown |
|---|---|
| **Teks Tebal** | `**Teks Tebal**` |
| *Teks Miring* | `*Teks Miring*` |
| Judul (Sub-bab) | `## Judul` |
| Judul Kecil | `### Judul` |
| Daftar Poin | `- Item Satu` |
| Daftar Nomor | `1. Item Satu` |
| Tautan (Link) | `[Nama Link](https://url.com)` |
| Gambar | `![Deskripsi](https://url-gambar.com)` |

---

## 11. Troubleshooting & FAQ

**Q: Saya tidak bisa mengunggah logo koin?**
A: Pastikan file berformat .png atau .jpg dan ukurannya tidak melebihi 2MB. Cek juga koneksi internet Anda.

**Q: Token sudah saya simpan tapi tidak muncul di web publik?**
A: Pastikan status token sudah diatur ke `Published`. Jika masih `Draft`, koin hanya akan terlihat oleh tim admin.

**Q: Bagaimana cara reset password jika lupa?**
A: Anda tidak dapat mereset sendiri. Hubungi **Superadmin** untuk memberikan password sementara atau mengirimkan link pembaruan.

---
*Dokumen ini adalah gabungan resmi dari Manual Operasional & Guide Book CryptoSharia Admin.*
*Terakhir diperbarui: April 2026*
