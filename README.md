# CryptoSharia Admin

Sistem administrasi pusat untuk mengelola platform CryptoSharia - analisis syariah cryptocurrency terpercaya.

![CryptoSharia Banner](static/logo.png)

## Fitur Utama

- **Dashboard Analitik**: Pantau metrik sistem secara real-time.
- **Manajemen Token**: CRUD data token crypto, status kepatuhan syariah, dan tagging.
- **Manajemen Konten (CMS)**: Buat dan kelola artikel, berita, dan events.
- **Manajemen Pengguna**: Kelola akun pengguna, staff, dan role-based access control (RBAC).
- **Audit Log**: Pencatatan aktivitas sistem untuk keamanan dan transparansi.
- **Pesan Masuk**: Kelola pesan dan pertanyaan dari pengguna publik.

## Teknologi

Dibangun dengan stack modern untuk performa dan keamanan maksimal:

- **Framework**: [SvelteKit](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) Runes
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [Shadcn-Svelte](https://next.shadcn-svelte.com/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: Custom Session & Role-Based Auth
- **Icons**: Lucide Svelte

## Instalasi & Menjalankan

### Persyaratan

- Node.js versi 20+
- PostgreSQL database

### Langkah-langkah

1.  **Clone repository ini**:
    ```bash
    git clone https://github.com/cryptosharia/cryptosharia-admin.git
    cd cryptosharia-admin
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Buat file `.env` berdasarkan contoh dan isi kredensial database Anda:
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/cryptosharia_db
    ```

4.  **Setup Database**:
    Jalankan migrasi atau push schema ke database lokal:
    ```bash
    npx drizzle-kit push
    ```

5.  **Jalankan Development Server**:
    ```bash
    npm run dev
    ```
    Akses dashboard di `http://localhost:5173`.

## Struktur Direktori

- `src/routes`: Halaman dan API endpoints (File-based routing).
    - `(app)`: Halaman yang membutuhkan login (Dashboard, Users, Tokens, etc).
    - `(auth)`: Halaman autentikasi (Login, Register).
- `src/lib/server/db`: Konfigurasi Database dan Schema Drizzle.
- `src/lib/components`: Komponen UI reusable (Button, Input, Sidebar, etc).

## Kontribusi

Silakan buat *Pull Request* untuk fitur baru atau perbaikan bug. Pastikan kode Anda mengikuti standar coding convention yang telah ditetapkan.

## Lisensi

Private Proprietary - CryptoSharia Team.
