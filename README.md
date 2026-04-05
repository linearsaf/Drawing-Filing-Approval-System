# Drawing Filing & Approval System

Sistem pengelolaan drawing berbasis web untuk filing, submit, check, approval bertingkat, distribusi Final Drawing, dan kontrol revisi dalam satu aplikasi terpusat.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-005c84?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-SQL-90e36a)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-4f46e5)](https://www.better-auth.com/)

Project ini dibangun dengan **Next.js 15**, **React 19**, **Tailwind CSS**, **Drizzle ORM**, **Better Auth**, dan **MySQL 8** untuk mendukung filing drawing, workflow approval, distribusi Final Drawing, dan traceability operasional dalam satu workspace internal.

## Quick Navigation

- [Executive Summary](#executive-summary)
- [Workflow Snapshot](#workflow-snapshot)
- [Product Snapshot](#product-snapshot)
- [Fitur Utama](#fitur-utama)
- [Quick Start](#quick-start)
- [API Snapshot](#api-snapshot)
- [Important Notes](#important-notes)

## Highlights

- Workflow end-to-end: `Draft -> Waiting Check -> Waiting Approval L1 -> Waiting Final Approval -> Completed -> Obsolete`
- Role-based access untuk `Admin`, `Drafter`, `Draft Leader`, `Approver L1`, `Head`, dan `Consumer`
- `Drawing List` dengan search, filter, card view, dan compact list
- `Drawing Detail` dengan revision history, approval history, dan audit timeline
- `Upload Old Drawing` untuk legacy import dengan badge `Legacy Ready`
- Final PDF preview, print, dan download dengan akses terkontrol
- Public `Request Access`, reset password, `Remember me`, dan `User Management`
- Dashboard per role dan queue approval yang sesuai assignment

## Executive Summary

Drawing Management App dirancang sebagai workspace digital internal untuk mengatasi masalah drawing yang tersebar, status revisi yang sulit dipastikan, dan approval yang tidak mudah ditelusuri. Fokus utamanya bukan hanya digitalisasi file, tetapi memastikan bahwa proses `Create Drawing`, `Check`, `Approval`, `Final Approval`, dan distribusi `Final Drawing` berjalan lebih tertib, terkontrol, dan siap diaudit.

Dalam implementasi saat ini, aplikasi sudah mencakup autentikasi, role-based access, dashboard per role, `Drawing List`, `Drawing Detail`, approval berjenjang, legacy import melalui `Upload Old Drawing`, final PDF access, audit trail, dan `User Management`. Dengan pendekatan ini, tim maintenance dan tim internal lain memiliki satu sumber acuan yang lebih konsisten untuk dokumen final yang valid.

## Workflow Snapshot

### Alur utama

- `Create Drawing -> Submit to Check -> Approval -> Final Drawing -> Distribution`
- `Upload Old Drawing -> Completed -> Distribution`

### Diagram workflow

```mermaid
flowchart LR
    A[Create Drawing] --> B[Draft]
    B --> C[Submit to Check]
    C --> D[Waiting Check]
    D --> E[Check by Draft Leader]
    E --> F[Waiting Approval L1]
    F --> G[Approval L1]
    G --> H{Level 2 diperlukan?}
    H -- Tidak --> I[Completed]
    H -- Ya --> J[Waiting Final Approval]
    J --> K[Final Approval by Head]
    K --> I[Completed]
    I --> L[Final Drawing Distribution]
    M[Upload Old Drawing] --> N[Legacy Ready / Completed]
    N --> L
```

### Nilai utama

- Mengurangi risiko penggunaan drawing yang belum final atau sudah obsolete
- Mempercepat pencarian drawing dan histori revisi
- Menjaga jejak keputusan approval tetap terlacak
- Memisahkan akses final document sesuai role dan status

## Product Snapshot

| Login | Dashboard |
| --- | --- |
| ![Login](docs/Images/01-login-page.png) | ![Drafter Dashboard](docs/Images/02.Drafter-dashboard-page.png) |

| Drawing List | Check / Approval |
| --- | --- |
| ![Drawing List](docs/Images/03.drafter-drawing-list-page.png) | ![Check Drawing](docs/Images/06.%20Draf-lleader-Approval-page.png) |

Screenshot tambahan tersedia di folder [docs/Images](./docs/Images).

### Visual coverage

- `Sign In` dan entry point auth
- dashboard per role untuk workload dan queue visibility
- `Drawing List` untuk search, filter, dan action navigation
- halaman `Check` / `Approval` untuk review PDF dan keputusan workflow

## Tech Stack

- **Frontend**: Next.js App Router, React 19, Tailwind CSS
- **Backend**: Next.js Route Handlers
- **Database**: MySQL 8 + Drizzle ORM
- **Authentication**: Better Auth
- **PDF**: PDF.js viewer internal + `pdf-lib` untuk stamping approval
- **Validation**: Zod
- **Email**: Nodemailer

## Fitur Utama

### Workflow Drawing

- Drafter membuat drawing baru dan upload file PDF
- Draft Leader melakukan `Check` dan menentukan approver per revision
- Approver L1 melakukan approval tahap pertama
- Head melakukan `Final Approval` saat level 2 dipakai
- Revision `Completed` menjadi read-only dan siap didistribusikan
- Drafter atau Admin dapat membuat revision baru dari drawing `Completed`
- Draft Leader dan Admin dapat memakai `Upload Old Drawing` untuk legacy import

### PDF Handling

- File PDF disimpan di folder lokal `public/uploads/drawings/...`
- Preview dokumen ditampilkan lewat viewer internal
- Drawing final dapat dicetak dari PDF completed asli
- Approval dapat menambahkan stamp/e-sign ke file PDF hasil proses
- Akses preview, print, dan download final drawing melalui backend route

### Security & Access

- Login dengan email atau username
- Opsi `Remember me`
- Public `Request Access`
- Lupa password / reset password
- User dapat mengganti password sendiri
- Admin dapat mengelola user dan mereset password user lain
- Consumer hanya dapat melihat drawing `Completed`

### Legacy Drawing Support

- `Upload Old Drawing` dipakai untuk dokumen lama yang approval historisnya sudah selesai di luar sistem
- Drawing legacy ditandai dengan badge `Legacy Ready`
- `createdBy` tetap menyimpan uploader, sedangkan `drawnByUserId` mewakili pemilik drawing secara bisnis
- Revisi berikutnya dari drawing legacy tetap kembali ke workflow normal

## Role Overview

- **Admin**: akses lintas role, `User Management`, request access review, reset password user, dan delete drawing
- **Drafter**: create drawing, edit rejected revision, submit ke `Check`, dan create revision baru
- **Draft Leader**: `Check`, assignment approver, dan `Upload Old Drawing`
- **Approver L1**: approval level 1 untuk revision yang ditugaskan
- **Head**: `Final Approval` untuk revision level 2 yang ditugaskan
- **Consumer**: akses baca untuk drawing `Completed`

Dokumentasi detail per role tersedia di [docs/roles/README.md](./docs/roles/README.md).

## Business Rules Snapshot

- `drawingNumber` harus unik secara global.
- Kombinasi `drawingId + revisionNo` harus unik.
- Approval plan disusun per revision dengan level 1 wajib dan level 2 opsional.
- Semua reject wajib menyertakan note dan workflow kembali ke Drafter.
- Consumer hanya dapat melihat drawing berstatus `Completed`.
- Revision `Completed` tidak diedit langsung; perubahan dilakukan dengan membuat revision baru.
- `Upload Old Drawing` langsung masuk ke jalur `Legacy Ready` / `Completed` tanpa approval digital historis.

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

Opsional untuk email sistem:

```env
SMTP_FROM_EMAIL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

Catatan:

- konfigurasi SMTP ini dipakai bersama untuk email `Reset Password` dan `Request Access Approved`
- kode masih mendukung env lama `PASSWORD_RESET_*` sebagai fallback kompatibilitas

### 3. Siapkan database

```bash
npm run db:push
npm run db:seed
```

Catatan:

- `npm run db:seed` menyiapkan akun awal dan sample business data untuk pengujian lokal.
- Jalankan seed hanya pada environment yang memang aman untuk data development.

### 4. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000`.

### 5. Generate dokumen internal opsional

```bash
npm run docs:generate
npm run slides:generate
```

Output akan dibuat di folder `docs/`.

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
npm run docs:generate
npm run slides:generate
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
  Images/                 Screenshot referensi aplikasi
scripts/                  Seed script and internal document generators
drizzle/                  Drizzle migration artifacts
public/
  uploads/                Uploaded drawing files (runtime-generated)
  pdfjs/                  Hosted PDF.js runtime assets
  pdfjs-viewer.html       Hosted PDF.js viewer shell
```

## API Snapshot

API internal saat ini dikelompokkan per domain fungsional:

- **Auth**: `POST /api/auth/[...all]`
- **Access Request**: create request, admin review, approve, reject
- **Users**: user management, reset password, drafter lookup, approver lookup, legacy drawn-by lookup
- **Drawings**: list, create, update, delete, legacy import, create revision baru
- **Revisions**: submit, check, approval-plan, approve level 1, approve level 2, preview, print, download
- **Dashboard**: summary per role
- **Password**: request reset dan reset submit

## Why This Repo Exists

README ini diposisikan sebagai ringkasan implementasi aktual untuk membantu tiga kebutuhan sekaligus:

- orientasi cepat bagi developer atau reviewer baru
- gambaran bisnis singkat bagi stakeholder internal
- pintu masuk ke dokumentasi yang lebih lengkap di folder `docs/`

## Usage Notice

- Repository ini bersifat **proprietary** dan ditujukan untuk penggunaan internal.
- Hak cipta dan hak intelektual atas source code, dokumentasi, aset, dan materi terkait berada pada **LinearSAF**.
- Penggunaan, penyalinan, modifikasi, distribusi, atau pengungkapan ke pihak lain hanya boleh dilakukan dengan izin tertulis yang sesuai.

## Important Notes

- Project ini menggunakan **local file storage** untuk upload PDF.
- Drawing preview, print, download, dan approval stamp bergantung pada file PDF yang tersimpan di server aplikasi.
- `public/uploads/` di-ignore dari Git karena merupakan output runtime.
- Untuk production, sangat disarankan:
  - memakai user database khusus aplikasi, bukan `root`
  - mengganti `BETTER_AUTH_SECRET`
  - mengaktifkan SMTP untuk reset password dan approval email yang relevan
  - memindahkan file storage ke lokasi yang lebih terkontrol atau object storage

## Internal Document Tooling

- Repository ini menyertakan generator dokumen internal di folder `scripts/` untuk output `.docx` dan `.pptx`.
- Library `docx` dan `pptxgenjs` disimpan sebagai **devDependencies**, bukan runtime dependencies aplikasi.
- Tooling ini aman untuk dipertahankan selama hanya dipakai dari script internal dan tidak di-import ke kode aplikasi di `src/`.
- Folder `.agents/` di-ignore karena bersifat agent-local tooling dan tidak dibutuhkan untuk build atau deploy aplikasi.

Output yang saat ini sudah tersedia di folder `docs/`:

- `Drawing-Management-App-Documentation.docx`
- `Drawing-Management-App-Proposal.pptx`

## Verification

Perintah berikut umum dipakai untuk verifikasi lokal:

```bash
npm run lint
npm run build
npm run docs:generate
npm run slides:generate
```

## License

Repository ini tidak didistribusikan sebagai open source. Ketentuan penggunaan mengikuti notice proprietary pada file [LICENSE](./LICENSE).
