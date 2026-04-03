# Drawing Filing & Approval System

Sistem pengelolaan drawing berbasis web untuk alur submit, check, approval bertingkat, distribusi dokumen final, dan kontrol revisi dalam satu aplikasi terpusat.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-005c84?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-SQL-90e36a)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-4f46e5)](https://www.better-auth.com/)

Project ini dibangun dengan **Next.js 15**, **Tailwind CSS**, **Drizzle ORM**, **Better Auth**, dan **MySQL 8**.

## Highlights

- Alur drawing end-to-end: draft, check, approval level 1, approval level 2, completed, obsolete
- Role-based access untuk `Admin`, `Drafter`, `Draft Leader`, `Approver L1`, `Head`, dan `Consumer`
- PDF viewer internal dengan mode full view, zoom, dan print untuk drawing final
- Upload file PDF ke storage lokal aplikasi
- E-sign / approval stamp pada dokumen final
- Autentikasi dengan Better Auth
- Reset password dan remember me
- Dashboard, daftar drawing, approval queue, dan manajemen user

## Tech Stack

- **Frontend**: Next.js App Router, React 19, Tailwind CSS
- **Backend**: Next.js Route Handlers
- **Database**: MySQL 8 + Drizzle ORM
- **Authentication**: Better Auth
- **PDF**: PDF.js viewer internal + `pdf-lib` untuk stamping approval
- **Validation**: Zod

## Fitur Utama

### Workflow Drawing

- Drafter membuat drawing baru dan upload file PDF
- Draft Leader melakukan proses check
- Approver L1 melakukan approval tahap pertama
- Head melakukan approval tahap akhir
- Drawing `COMPLETED` menjadi read-only dan siap didistribusikan

### PDF Handling

- File PDF disimpan di folder lokal `public/uploads/drawings/...`
- Preview dokumen ditampilkan lewat viewer internal
- Mode `Full View` tersedia untuk area baca yang lebih luas
- Drawing final dapat dicetak dari PDF completed asli
- Approval dapat menambahkan stamp/e-sign ke file PDF hasil proses

### Security & Access

- Login dengan email atau username
- Opsi `Remember me`
- Lupa password / reset password
- User dapat mengganti password sendiri
- Admin dapat mengelola user dan mereset password user lain

## Role Overview

- **Admin**: akses penuh ke user management, monitoring drawing, dan reset password user
- **Drafter**: membuat, edit, submit ulang drawing
- **Draft Leader**: check dan reject/approve tahap check
- **Approver L1**: approval level 1
- **Head**: approval level 2 / final approval
- **Consumer**: akses baca untuk drawing yang sudah final

Dokumentasi detail per role tersedia di [docs/roles/README.md](./docs/roles/README.md).

## Quick Start

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan environment

Copy `.env.example` menjadi `.env`, lalu sesuaikan nilainya.

Contoh minimum:

```env
DATABASE_URL=mysql://root:password@127.0.0.1:3306/drawing_management
BETTER_AUTH_SECRET=replace-this-with-a-64-char-random-secret-before-production
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

Opsional untuk reset password via email:

```env
PASSWORD_RESET_FROM_EMAIL=
PASSWORD_RESET_SMTP_HOST=
PASSWORD_RESET_SMTP_PORT=
PASSWORD_RESET_SMTP_USER=
PASSWORD_RESET_SMTP_PASS=
```

### 3. Siapkan database

```bash
npm run db:push
npm run db:seed
```

### 4. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Seed Accounts

Setelah menjalankan `npm run db:seed`, akun berikut tersedia:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@drawing.local` | `Admin123!` |
| Drafter | `drafter@drawing.local` | `Drafter123!` |
| Draft Leader | `lead@drawing.local` | `Lead12345!` |
| Approver L1 | `approver@drawing.local` | `Approve123!` |
| Head | `head@drawing.local` | `Head12345!` |
| Consumer | `consumer@drawing.local` | `Viewer123!` |

## NPM Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:seed
```

## Project Structure

```text
src/
  app/                    Next.js app routes and API handlers
  components/             Reusable UI and app components
  lib/                    Shared config, types, auth, db, utils
  server/                 Services and server-side storage helpers
docs/
  roles/                  End-user documentation per role
drizzle/                  Drizzle migration artifacts
public/
  uploads/                Uploaded drawing files
  pdfjs/                  Hosted PDF.js runtime assets
```

## Important Notes

- Project ini menggunakan **local file storage** untuk upload PDF.
- Drawing preview, print, dan approval stamp bergantung pada file PDF yang tersimpan di server aplikasi.
- Untuk production, sangat disarankan:
  - memakai user database khusus aplikasi, bukan `root`
  - mengganti `BETTER_AUTH_SECRET`
  - mengaktifkan SMTP untuk reset password
  - memindahkan file storage ke lokasi yang lebih terkontrol atau object storage

## Verification

Perintah berikut umum dipakai untuk verifikasi lokal:

```bash
npm run lint
npm run build
```

## License

Project ini dilisensikan sesuai file [LICENSE](./LICENSE).
