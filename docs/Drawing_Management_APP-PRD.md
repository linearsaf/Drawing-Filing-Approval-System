# Drawing Management App PRD

## 1. Informasi Dokumen

- Nama Dokumen: Product Requirements Document
- Nama Produk: Drawing Filing & Approval System
- Status Dokumen: Updated to current implementation
- Format: Web Application Full Stack
- Target Stack: Next.js App Router, MySQL, Drizzle ORM, Better Auth
- Dokumen File: `docs/Drawing_Management_APP-PRD.md`

---

## 2. Ringkasan Produk

Drawing Filing & Approval System adalah workspace internal untuk mengelola siklus hidup drawing dari pembuatan draft, proses check, approval bertingkat, distribusi final drawing, sampai audit trail aktivitas.

Versi aplikasi yang berjalan saat ini sudah mencakup:

- authentication berbasis Better Auth
- role-based access control
- dashboard per role
- create, edit, submit, check, approval, dan revision flow
- upload old drawing sebagai legacy ready import
- drawing list dengan search dan filter
- drawing detail dengan preview, approval history, revision history, dan audit timeline
- final drawing preview, print, dan download
- admin user management
- public request access flow yang direview admin
- reset password flow

---

## 3. Latar Belakang

Masalah operasional yang ingin diselesaikan:

- drawing tersebar dan sulit ditelusuri
- proses check dan approval tidak terdokumentasi rapi
- histori revisi sulit dibaca
- user berisiko memakai drawing yang belum final
- distribusi dokumen final belum terkendali
- audit perubahan dan pengunduhan belum mudah ditelusuri

---

## 4. Objective

Sistem ini dibangun untuk:

1. menjadi workspace utama filing drawing
2. mengelola workflow check dan approval secara berjenjang
3. menjaga histori revisi tetap rapi dan terlacak
4. memastikan consumer hanya melihat final drawing yang valid
5. menyediakan audit trail untuk aktivitas penting
6. memberi admin kontrol atas user, role, dan request access baru

---

## 5. Business Process

### Alur utama

`Create Drawing -> Submit to Check -> Approval -> Final Drawing -> Distribution`

`Upload Old Drawing -> Completed -> Distribution`

### Alur operasional

1. Drafter membuat drawing baru dan upload PDF.
2. Drawing disimpan sebagai `DRAFT` atau langsung dikirim ke `WAITING_CHECK`.
3. Draft Leader melakukan `Check` sekaligus menentukan approver per revision.
4. Jika lolos, drawing masuk ke `WAITING_APPROVAL_1` dengan approver level 1 yang ditugaskan.
5. Approver Level 1 yang ditugaskan memproses approval level pertama.
6. Jika level 2 disiapkan, drawing masuk ke `WAITING_APPROVAL_2`.
7. Head yang ditugaskan memproses final approval bila level 2 memang dipakai.
8. Jika level 2 tidak dipakai, approval level 1 langsung mengubah revision menjadi `COMPLETED`.
9. Jika level 2 dipakai dan lolos, revision menjadi `COMPLETED`.
10. Consumer dan role internal yang berhak dapat membuka, print, dan download final drawing.
11. Jika ada perubahan lanjutan, Drafter/Admin membuat revision baru dari drawing yang sudah completed.

### Alur legacy import

1. Draft Leader atau Admin membuka `Upload Old Drawing`.
2. User mengisi metadata utama: `Drawing Number`, `Drawing Name`, `SAC / SBI Asset Code`, `Area`, `Discipline`, `Revision Number`, `Drawn by`, `Legacy Ready Note`, dan upload PDF.
3. Sistem menyimpan `createdBy` sebagai uploader dan `drawnByUserId` sebagai pemilik drawing secara bisnis.
4. Drawing langsung dibuat sebagai `COMPLETED` dengan `workflowSource = LEGACY_READY`.
5. Consumer langsung dapat preview, print, dan download.
6. Jika nanti perlu perubahan, revisi berikutnya kembali masuk workflow normal: draft -> check -> approval.

### Aturan implementasi saat ini

- approval plan disusun per revision saat check
- approval level 1 wajib
- approval level 2 opsional
- legacy import tidak membuat `approval_actions` dan tidak membuat `revision_approval_steps`
- drawing legacy ditandai via `workflowSource = LEGACY_READY`, bukan status baru
- semua reject mengembalikan proses ke Drafter
- reject wajib menyertakan note
- completed revision bersifat read-only
- consumer hanya melihat drawing dengan status `COMPLETED`

---

## 6. User Roles dan Fungsi

### 6.1 Drafter

Hak akses:

- create drawing
- edit drawing pada status draft atau rejected
- upload PDF revision
- submit revision ke proses check
- melihat status, revision history, approval history, dan audit timeline
- membuat revision baru dari drawing completed

### 6.2 Draft Leader

Hak akses:

- melihat drawing dengan status `WAITING_CHECK`
- membuka halaman `Check Drawing`
- approve atau reject pada approval level `0`
- menentukan approver level 1 dan optional approver level 2 untuk revision yang lolos check
- membuka halaman `Upload Old Drawing`
- upload old drawing sebagai `COMPLETED` tanpa workflow approval digital
- menuliskan decision note

### 6.3 Approver Level 1

Hak akses:

- melihat drawing dengan status `WAITING_APPROVAL_1` yang ditugaskan kepadanya
- membuka halaman approval
- approve atau reject pada approval level `1`
- menuliskan decision note

### 6.4 Head

Hak akses:

- melihat drawing dengan status `WAITING_APPROVAL_2` yang ditugaskan kepadanya
- membuka halaman final approval
- approve atau reject pada approval level `2`
- menghasilkan final drawing saat approve

### 6.5 User / Consumer

Hak akses:

- browse final drawing
- membuka detail drawing yang completed
- preview, print, dan download final drawing
- read-only access

### 6.6 Admin

Hak akses:

- seluruh kemampuan Drafter, Draft Leader, Approver L1, dan Head sesuai kebutuhan operasional
- membuka `Upload Old Drawing`
- upload old drawing sebagai `COMPLETED` tanpa workflow approval digital
- mengelola `Drawn by` dan `Uploaded by` context pada drawing legacy
- mengelola user, request access, dan reset password

Hak akses:

- seluruh akses operasional lintas role
- create user, edit user, activate/deactivate user
- reset password user
- delete drawing
- review dan memproses request access
- melihat seluruh drawing dan audit trail

---

## 7. Request Access Flow

Flow ini sudah aktif di aplikasi saat ini.

### Jalur public

- calon user membuka halaman `Request Access` dari login page
- calon user mengisi `name`, `email`, `username`, dan `requestedRole`
- sistem menyimpan request ke tabel `user_access_requests` dengan status `PENDING`

### Jalur admin

- admin melihat daftar pending request di `User Management`
- admin dapat mengubah data request sebelum keputusan final
- admin dapat `Approve` atau `Reject`

### Saat approve

- sistem membuat row user baru pada tabel `user`
- role final mengikuti hasil review admin
- user dibuat aktif
- default password dibuat dari nama final tanpa spasi + `123!`
- email notifikasi approval diproses
- request berubah menjadi `APPROVED`

### Saat reject

- request berubah menjadi `REJECTED`
- tidak ada akun user yang dibuat

---

## 8. Ruang Lingkup Implementasi Saat Ini

### In Scope yang sudah tersedia

- sign in
- reset password request dan reset password submit
- public request access
- admin approval request access
- role guard pada page dan API
- dashboard per role
- drawing list dengan search, filter, card view, dan compact list
- drawing detail
- create drawing
- upload old drawing
- edit drawing
- submit revision
- check drawing
- approval level 1
- final approval
- preview PDF
- print PDF
- download final drawing
- revision history
- approval history
- audit timeline
- admin user management
- drafter lookup API
- legacy drawn-by lookup API

### Out of Scope saat ini

- approval workflow multi-level bebas di luar skema L1 wajib + L2 opsional
- multi-role per user
- annotation langsung di PDF
- compare visual antar revision
- notification center in-app
- mobile app native
- external DMS / ERP integration
- legal digital signature

---

## 9. Requirement Fungsional Aktual

### 9.1 Authentication & Authorization

Sistem menyediakan:

- sign in berbasis Better Auth
- session management
- role-based access control di page dan route
- user active/inactive control
- reset password flow

### 9.2 Dashboard

Dashboard menampilkan:

- total visible drawing
- waiting check
- waiting approval L1
- waiting final approval
- rejected
- completed
- draft
- role queue
- activity feed

### 9.3 Drawing Form

Field utama:

- drawing number
- drawing name
- SAC code
- area
- discipline
- description
- revision number
- change note
- PDF upload

Aksi:

- save draft
- submit to check
- update draft
- update and submit

### 9.4 Check & Approval

Fitur pada page check/approval:

- PDF preview
- drawing summary
- current revision summary
- decision note
- approve / reject
- reject note required

### 9.5 Drawing Detail

Fitur utama:

- metadata drawing
- current revision snapshot
- PDF preview
- revision history
- approval history
- audit timeline
- contextual action buttons sesuai role

### 9.6 Drawing List & Search

Filter yang tersedia:

- keyword
- status
- area
- drafter
- revision
- date range

### 9.7 User Management

Fitur utama:

- user directory
- create user
- edit user
- activate/deactivate user
- reset password user
- pending request access review

---

## 10. Status Lifecycle

Status revision yang dipakai sistem:

- `DRAFT`
- `WAITING_CHECK`
- `CHECK_REJECTED`
- `WAITING_APPROVAL_1`
- `APPROVAL_1_REJECTED`
- `WAITING_APPROVAL_2`
- `APPROVAL_2_REJECTED`
- `COMPLETED`
- `OBSOLETE`

### Transition utama

1. create drawing -> `DRAFT`
2. submit -> `WAITING_CHECK`
3. check approve -> `WAITING_APPROVAL_1`
4. check reject -> `CHECK_REJECTED`
5. approval L1 approve + ada assignee L2 -> `WAITING_APPROVAL_2`
6. approval L1 approve + tanpa assignee L2 -> `COMPLETED`
7. approval L1 reject -> `APPROVAL_1_REJECTED`
8. final approval approve -> `COMPLETED`
9. final approval reject -> `APPROVAL_2_REJECTED`
10. upload old drawing -> `COMPLETED`
11. create revision baru dari completed drawing -> revision baru `DRAFT`, revision completed lama dapat ditandai `OBSOLETE`

---

## 11. Permission Matrix Ringkas

| Role | Create | Upload Old Drawing | Edit Draft | Submit | Check | Approve L1 | Final Approve | Download Completed |
|---|---|---|---|---|---|---|---|---|
| DRAFTER | Yes | No | Yes | Yes | No | No | No | Yes |
| DRAFT_LEADER | No | Yes | No | No | Yes | No | No | Yes |
| APPROVER_L1 | No | No | No | No | No | Yes | No | Yes |
| HEAD | No | No | No | No | No | No | Yes | Yes |
| CONSUMER | No | No | No | No | No | No | No | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

Tambahan:

- `ADMIN` dapat delete drawing
- `CONSUMER` hanya bisa melihat drawing `COMPLETED`

---

## 12. Modul UI Saat Ini

### Auth

- `login`
- `request-access`
- `reset-password`

### App

- `dashboard`
- `drawings`
- `drawings/new`
- `drawings/[id]`
- `drawings/[id]/edit`
- `drawings/[id]/check`
- `drawings/[id]/approve`
- `revisions/[revisionId]/viewer`
- `account/password`
- `admin/users`

---

## 13. Non-Functional Requirements

### Security

- page dan API menggunakan role guard
- completed drawing untuk consumer bersifat read-only
- akses file final harus melalui route backend
- aktivitas penting dicatat ke audit log

### Performance

- dashboard menggunakan summary query server-side
- drawing list mendukung filter server-side
- relasi inti memiliki index pada status dan foreign key utama

### Reliability

- upload file dibatasi ke PDF
- workflow approval divalidasi di service layer
- file storage dipisahkan dari metadata database

### Maintainability

- business logic berada di service layer
- schema dan type dipisahkan rapi
- UI memakai reusable components berbasis Tailwind

---

## 14. Technical Architecture Aktual

### Stack

- Frontend: React 19 + Next.js App Router
- Backend: Next.js Route Handlers
- Database: MySQL
- ORM: Drizzle ORM
- Auth: Better Auth + Drizzle Adapter
- Validation: Zod
- PDF: `react-pdf`, `pdfjs-dist`, `pdf-lib`
- Email: `nodemailer`
- Styling: Tailwind CSS + custom UI components

### Catatan implementasi

- aplikasi berjalan sebagai monolithic Next.js app
- tidak menggunakan React Hook Form
- tidak menggunakan shadcn/ui package; UI menggunakan komponen internal sederhana

---

## 15. Data Model Ringkas

Entitas utama yang sudah ada:

- `user`
- `session`
- `account`
- `verification`
- `user_access_requests`
- `drawings`
- `drawing_revisions`
- `approval_actions`
- `audit_logs`
- `download_logs`

Dokumen ERD teknis terbaru ada di `docs/Drawing_Management_APP-ERD-Drizzle.md`.

---

## 16. API Aktual

### Auth

- `POST /api/auth/[...all]`

### Access Request

- `POST /api/access-requests`
- `GET /api/admin/access-requests`
- `PATCH /api/admin/access-requests/[id]`
- `POST /api/admin/access-requests/[id]/approve`
- `POST /api/admin/access-requests/[id]/reject`

### Users

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/[id]`
- `PATCH /api/admin/users/[id]/password`
- `GET /api/users/drafters`
- `GET /api/users/approvers?level=1|2`

### Drawings

- `GET /api/drawings`
- `POST /api/drawings`
- `POST /api/drawings/legacy`
- `GET /api/drawings/[id]`
- `PATCH /api/drawings/[id]`
- `DELETE /api/drawings/[id]`
- `POST /api/drawings/[id]/revisions`

### Revisions

- `GET /api/revisions/[revisionId]`
- `PATCH /api/revisions/[revisionId]`
- `POST /api/revisions/[revisionId]/submit`
- `POST /api/revisions/[revisionId]/check`
- `PATCH /api/revisions/[revisionId]/approval-plan`
- `POST /api/revisions/[revisionId]/approve-level-1`
- `POST /api/revisions/[revisionId]/approve-level-2`
- `GET /api/revisions/[revisionId]/preview`
- `GET /api/revisions/[revisionId]/print`
- `GET /api/revisions/[revisionId]/download`

### Dashboard

- `GET /api/dashboard/summary`

### Password

- `POST /api/password/request-reset`
- `POST /api/password/reset`

---

## 17. Business Rules yang Sudah Terkunci di Implementasi

1. `drawingNumber` unik secara global
2. `drawingId + revisionNo` unik
3. approval plan disusun per revision dengan level 1 wajib dan level 2 opsional
4. satu user satu role
5. reject selalu kembali ke Drafter
6. consumer hanya melihat completed drawing
7. reject note wajib
8. completed drawing tidak diedit langsung
9. revision baru dibuat sebagai row baru, bukan overwrite revision lama
10. public access request harus direview admin sebelum akun dibuat
11. legacy import langsung completed dan tidak melewati approval digital
12. `createdBy` adalah uploader, sedangkan `drawnByUserId` adalah pemilik drawing secara bisnis

---

## 18. Gap / Future Enhancements

Fitur yang masih masuk fase lanjutan:

- notification email untuk antrian workflow lain selain request access dan reset password
- compare antar revision
- annotation di PDF
- analytics dashboard lebih detail
- object storage abstraction
- real-time activity feed

---

## 19. Kesimpulan

Saat ini Drawing Filing & Approval System sudah berkembang dari draft MVP menjadi implementasi kerja yang mencakup auth, drawing workflow, revision management, admin management, dan request access flow.

PRD ini sekarang harus dibaca sebagai dokumen snapshot implementasi aktual, bukan lagi asumsi awal proyek.
