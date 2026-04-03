# Drawing Management App PRD

## 1. Informasi Dokumen

- **Nama Dokumen:** Product Requirements Document (PRD)
- **Nama Produk:** Drawing Filing & Approval System
- **Format:** Web Application Full Stack
- **Target Stack:** Next.js, MySQL, Drizzle ORM, Better Auth
- **Dokumen File:** `Drawing_Management_APP-PRD.md`

---

## 2. Latar Belakang

Proses pengelolaan mechanical drawing saat ini masih memiliki potensi kendala seperti:

- file drawing tersebar dan sulit dicari
- approval dilakukan secara manual atau tidak terdokumentasi rapi
- revisi drawing sulit dilacak
- user berisiko menggunakan drawing yang belum final
- dokumen manual masih terlalu dominan dalam proses kerja

Dibutuhkan sebuah sistem berbasis web yang dapat menjadi pusat filing, approval, revision tracking, dan distribusi drawing final secara terkendali.

---

## 3. Objective

Membangun sistem berbasis web untuk:

1. menyimpan dan mengelola filing mechanical drawing
2. mengatur proses approval drawing secara berjenjang
3. memudahkan pencarian drawing berdasarkan metadata
4. memudahkan tracking revisi dan histori keputusan
5. mengurangi penggunaan dokumen manual
6. memastikan hanya drawing dengan status valid/final yang digunakan oleh user

---

## 4. Business Process

### Alur bisnis utama

**Input Drawing → Process Approval → Filing Drawing → Output Drawing**

### Alur proses operasional

1. **Drafter** meng-upload drawing PDF dan mengisi metadata
2. Drawing dikirim ke **Draft Leader** untuk proses check/review
3. Jika lolos, drawing diteruskan ke **Approver Level 1** untuk approval
4. Jika lolos, drawing diteruskan ke **Head** untuk approval final
5. Jika semua tahapan approve selesai, drawing menjadi **Completed**
6. Drawing completed dapat dicari, dibuka, dan diunduh oleh user sesuai hak akses

### Catatan alur MVP

Untuk tahap MVP, approval disarankan menggunakan alur tetap:

- **Level 0:** Draft Leader
- **Level 1:** Engineer / designated approver user / requestor representative
- **Level 2:** Head Mechanic RMK/FMD

Catatan ini tetap bisa dikembangkan di versi berikutnya bila approval chain perlu dibuat dinamis.

---

## 5. User Roles dan Fungsi

## 5.1 Drafter

Hak akses:

- upload drawing PDF
- membuat drawing baru
- edit metadata drawing yang masih draft atau dikembalikan
- submit drawing ke proses checking
- melihat status dan histori approval
- upload revisi jika drawing ditolak

## 5.2 Draft Leader / Drafter Supervisor

Hak akses:

- melihat drawing yang menunggu check
- melakukan review/check
- approve atau reject pada level 0
- menuliskan catatan keputusan

## 5.3 Approver Level 1

Contoh peran:

- Area Engineer
- User representative
- SI / Requestor / designated approver sesuai kebijakan bisnis

Hak akses:

- melihat drawing yang lolos checking
- approve atau reject pada level 1
- menuliskan catatan keputusan

## 5.4 Head

Hak akses:

- melihat drawing yang menunggu final approval
- approve atau reject pada level 2
- menuliskan catatan keputusan
- menghasilkan status final completed bila approve

## 5.5 User / Consumer

Hak akses:

- mencari drawing
- melihat metadata drawing final
- download drawing yang sudah completed
- akses read-only

## 5.6 Admin

Hak akses:

- mengelola user dan role
- mengelola akses sistem
- melihat semua drawing dan audit trail
- membantu maintenance data jika diperlukan

---

## 6. Ruang Lingkup MVP

## 6.1 In Scope

Fitur yang masuk dalam MVP:

- login page
- multi-user authentication
- role-based authorization
- dashboard ringkas sesuai role
- upload drawing PDF
- input metadata drawing
- check/review drawing
- approval bertingkat 3 level
- approval/reject dengan catatan
- status tracking
- revision tracking
- pencarian dan filtering drawing
- watermark berdasarkan status drawing
- download drawing final/completed
- read-only untuk drawing completed
- audit log aktivitas utama

## 6.2 Out of Scope

Fitur berikut tidak menjadi prioritas MVP:

- workflow approval dinamis tak terbatas
- digital signature legal/compliance
- OCR drawing
- compare visual antar revisi PDF
- notifikasi multi-channel yang kompleks
- integrasi ERP/SAP/DMS eksternal
- mobile app native
- annotation langsung di atas PDF

---

## 7. Requirement Fungsional

## 7.1 Authentication & Authorization

Sistem harus menyediakan:

- login page untuk user
- session login yang aman
- role-based authorization berdasarkan fungsi user
- pembatasan akses halaman dan aksi berdasarkan role

### Acceptance criteria

- user hanya dapat masuk dengan credential valid
- user nonaktif tidak dapat login
- setiap role hanya dapat melihat menu dan aksi yang sesuai hak akses

---

## 7.2 Dashboard

Dashboard harus menampilkan ringkasan status drawing sesuai role user.

### Informasi minimum dashboard

- total drawing
- drawing waiting check
- drawing waiting approval level 1
- drawing waiting approval level 2
- drawing rejected
- drawing completed
- recent activity / recent submissions

### Per role

- **Drafter:** fokus ke draft milik sendiri, reject, waiting process
- **Draft Leader:** fokus ke waiting check
- **Approver Level 1:** fokus ke waiting approval level 1
- **Head:** fokus ke waiting approval level 2
- **User/Consumer:** fokus ke completed drawings
- **Admin:** seluruh data agregat

---

## 7.3 Input Drawing Page

Halaman ini digunakan oleh Drafter untuk membuat drawing baru.

### Field minimum

- drawing number
- drawing name
- SAC / SBI Asset Code
- area
- discipline
- description
- revision number
- upload file PDF

### Aksi

- save as draft
- submit for checking

### Acceptance criteria

- file yang di-upload harus berformat PDF
- field wajib tidak boleh kosong
- drawing dapat disimpan sebagai draft
- drawing dapat disubmit ke status waiting check

---

## 7.4 Drawing Check Page

Digunakan oleh Draft Leader untuk review dan pengambilan keputusan level 0.

### Fitur

- preview PDF
- melihat metadata drawing
- approve
- reject
- menuliskan catatan tambahan atas keputusan

### Acceptance criteria

- hanya Draft Leader/Admin yang dapat mengakses halaman check
- reject wajib menyertakan catatan
- jika approve, drawing lanjut ke approval level 1
- jika reject, drawing kembali ke Drafter untuk revisi

---

## 7.5 Drawing Approval Page

Digunakan oleh Approver Level 1 dan Head.

### Fitur

- preview PDF
- melihat metadata
- approve / reject
- catatan keputusan

### Acceptance criteria

- Approver Level 1 hanya dapat memproses drawing yang menunggu level 1
- Head hanya dapat memproses drawing yang menunggu level 2
- reject wajib memberi catatan
- jika level 2 approve, drawing berubah menjadi completed

---

## 7.6 Drawing List & Search

Sistem harus menyediakan halaman daftar drawing yang searchable dan filterable.

### Search/filter minimum

- drawing number
- drawing name
- SAC code
- status
- area
- revision
- created date / submitted date

### Acceptance criteria

- user dapat mencari drawing berdasarkan kata kunci utama
- filter dapat digabungkan minimal untuk status dan SAC code
- hasil pencarian harus menampilkan status dan revisi terkini

---

## 7.7 Drawing Detail Page

Halaman detail drawing harus menampilkan satu sumber informasi lengkap untuk dokumen.

### Informasi minimum

- metadata utama
- preview PDF
- current status
- revision history
- approval history
- notes / decision log
- tombol aksi sesuai role

---

## 7.8 Drawing Completed / Output Drawing

Ketika drawing telah final approved:

- status berubah menjadi `COMPLETED`
- drawing menjadi read-only
- drawing dapat di-download sesuai role
- drawing final menjadi reference resmi untuk user

### Acceptance criteria

- completed drawing tidak dapat diedit langsung
- revisi baru harus dibuat sebagai revision baru, bukan overwrite file lama
- user/consumer hanya dapat mengunduh drawing final/completed

---

## 7.9 Revision Management

Sistem harus mendukung histori revisi untuk setiap drawing.

### Kebutuhan

- satu drawing dapat memiliki banyak revisi
- revisi lama tidak boleh hilang
- sistem menandai revisi terbaru
- jika ada revisi final baru, revisi final lama dapat ditandai obsolete/superseded

### Acceptance criteria

- histori revisi dapat dilihat di halaman detail drawing
- hanya ada satu revisi latest aktif per drawing
- revisi completed lama tetap bisa ditelusuri oleh role internal

---

## 7.10 Audit Trail

Setiap aktivitas utama harus tercatat.

### Aktivitas minimum yang dicatat

- drawing dibuat
- metadata diubah
- file di-upload
- drawing disubmit
- check approved/rejected
- approval level 1 approved/rejected
- approval level 2 approved/rejected
- drawing di-download

### Tujuan

- mempermudah pelacakan histori
- menjaga accountability proses
- membantu investigasi bila terjadi masalah

---

## 8. Status Lifecycle

Status drawing/revisi yang disarankan untuk MVP:

- `DRAFT`
- `WAITING_CHECK`
- `CHECK_REJECTED`
- `WAITING_APPROVAL_1`
- `APPROVAL_1_REJECTED`
- `WAITING_APPROVAL_2`
- `APPROVAL_2_REJECTED`
- `COMPLETED`
- `OBSOLETE` *(opsional untuk revisi lama)*

### Flow utama

1. create drawing → `DRAFT`
2. submit → `WAITING_CHECK`
3. check approve → `WAITING_APPROVAL_1`
4. check reject → `CHECK_REJECTED`
5. approval level 1 approve → `WAITING_APPROVAL_2`
6. approval level 1 reject → `APPROVAL_1_REJECTED`
7. approval level 2 approve → `COMPLETED`
8. approval level 2 reject → `APPROVAL_2_REJECTED`
9. jika ada revisi baru yang menggantikan revisi final lama → revisi lama `OBSOLETE`

### Aturan MVP yang direkomendasikan

- semua status reject kembali ke Drafter untuk revisi
- drawing completed tidak bisa diedit langsung
- perubahan setelah reject dilakukan dengan update revision/draft yang relevan

---

## 9. Watermark Rules

Drawing akan mendapatkan watermark sesuai status.

| Status | Watermark |
|---|---|
| WAITING_CHECK | LEAD CHECK |
| WAITING_APPROVAL_1 | APPROVAL LEVEL 1 |
| WAITING_APPROVAL_2 | HEAD APPROVAL |
| COMPLETED | COMPLETED |

### Catatan

- teks watermark level 1 dapat disesuaikan menjadi `ENGINEER APPROVAL` atau `USER APPROVAL` sesuai keputusan bisnis final
- drawing rejected dapat diberi watermark internal seperti `REJECTED` bila dibutuhkan, namun tidak wajib untuk MVP
- file original sebaiknya tetap disimpan terpisah dari file hasil watermark

---

## 10. Permission Matrix Ringkas

| Role | Create | Edit Draft | Submit | Check Lv.0 | Approve Lv.1 | Approve Lv.2 | Download Completed |
|---|---|---|---|---|---|---|---|
| Drafter | Yes | Yes | Yes | No | No | No | Optional/Internal |
| Draft Leader | No | No | No | Yes | No | No | Yes |
| Approver Level 1 | No | No | No | No | Yes | No | Yes |
| Head | No | No | No | No | No | Yes | Yes |
| User/Consumer | No | No | No | No | No | No | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

---

## 11. Desain Halaman / Modul UI

## 11.1 Login Page

Komponen:

- username/email
- password
- login button

## 11.2 Dashboard

Komponen:

- status summary cards
- recent activity
- task list berdasarkan role

## 11.3 Drawing List Page

Komponen:

- table daftar drawing
- search bar
- filter panel
- status badge
- revision info
- action buttons

## 11.4 Input Drawing Page

Komponen:

- metadata form
- PDF upload field
- save draft button
- submit button

## 11.5 Drawing Detail Page

Komponen:

- PDF preview
- metadata panel
- status badge
- approval history
- revision history
- audit timeline
- action buttons sesuai role

## 11.6 Check Page

Komponen:

- preview PDF
- metadata summary
- note form
- approve/reject button

## 11.7 Approval Page

Komponen:

- preview PDF
- metadata summary
- note form
- approve/reject button

## 11.8 User Management Page

Komponen:

- user list
- create user
- edit role
- activate/deactivate user

---

## 12. Non-Functional Requirements

## 12.1 Security

- role-based authorization wajib diterapkan di server side
- file tidak boleh diakses langsung via path publik tanpa validasi session/permission
- session harus aman
- audit log disimpan untuk aktivitas penting
- completed drawing bersifat read-only

## 12.2 Performance

- list drawing menggunakan pagination
- index database diterapkan pada field pencarian utama
- dashboard summary dioptimalkan agar cepat dimuat

## 12.3 Reliability

- validasi upload file harus ketat
- transaksi database harus aman pada proses approval
- file dan database harus memiliki strategi backup

## 12.4 Maintainability

- business logic tidak diletakkan seluruhnya di route handler
- gunakan service layer untuk workflow approval, revision, dan audit
- pisahkan storage logic dan watermark logic dari UI logic

---

## 13. Technical Architecture

## 13.1 Tech Stack

- **Frontend:** React + Next.js
- **Backend:** Next.js App Router API / Route Handlers
- **Database:** MySQL
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **PDF Processing:** Node-based PDF library seperti `pdf-lib`
- **Validation:** Zod
- **Form Handling:** React Hook Form
- **UI:** Tailwind CSS + shadcn/ui

## 13.2 Architecture Decision

Sistem dibangun sebagai **monolithic full-stack Next.js app** agar:

- development lebih cepat
- deployment lebih sederhana
- frontend dan backend berada dalam satu codebase
- cocok untuk MVP dan iterasi awal

## 13.3 File Storage Recommendation

File PDF **tidak** disimpan di MySQL.

Rekomendasi:

- simpan metadata di MySQL
- simpan file di filesystem server atau object storage
- simpan path/identifier file di database

### Pola penyimpanan yang disarankan

- **original file** disimpan immutable
- **watermarked file** disimpan sebagai derived/generated file atau di-generate saat proses status berubah

---

## 14. Struktur Folder Aplikasi yang Disarankan

```bash
src/
  app/
    (auth)/
      login/page.tsx
    dashboard/page.tsx
    drawings/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      [id]/edit/page.tsx
      [id]/check/page.tsx
      [id]/approve/page.tsx
    admin/
      users/page.tsx
    api/
      drawings/
      revisions/
      approvals/
      dashboard/
      admin/
  components/
    ui/
    drawings/
    dashboard/
    forms/
  lib/
    auth/
    db/
    permissions/
    validations/
    storage/
    pdf/
  server/
    services/
      drawing.service.ts
      revision.service.ts
      approval.service.ts
      audit.service.ts
      watermark.service.ts
      storage.service.ts
  drizzle/
    schema/
    migrations/
```

---

## 15. Konsep Data Model / ERD

## 15.1 Tabel `users`

Menyimpan data user aplikasi.

Field utama:

- id
- name
- email
- username
- role
- is_active
- created_at
- updated_at

## 15.2 Tabel `drawings`

Mewakili identitas utama drawing.

Field utama:

- id
- drawing_number
- drawing_name
- sac_code
- area
- discipline
- description
- created_by
- current_revision_id
- current_status
- latest_completed_revision_id
- created_at
- updated_at

## 15.3 Tabel `drawing_revisions`

Menyimpan histori revisi per drawing.

Field utama:

- id
- drawing_id
- revision_no
- file_original_path
- file_watermarked_path
- status
- change_note
- submitted_by
- submitted_at
- is_latest
- is_completed
- created_at
- updated_at

## 15.4 Tabel `approval_actions`

Menyimpan histori keputusan approval.

Field utama:

- id
- revision_id
- approval_level
- actor_id
- actor_role
- decision
- decision_note
- acted_at

## 15.5 Tabel `audit_logs`

Menyimpan histori aktivitas sistem.

Field utama:

- id
- entity_type
- entity_id
- action
- user_id
- note
- metadata_json
- created_at

### Relasi konseptual

- satu `drawing` memiliki banyak `drawing_revisions`
- satu `drawing_revision` memiliki banyak `approval_actions`
- aktivitas penting direkam ke `audit_logs`

---

## 16. API Design Awal

Contoh endpoint awal untuk MVP:

### Auth

- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`

### Drawings

- `GET /api/drawings`
- `POST /api/drawings`
- `GET /api/drawings/:id`
- `PATCH /api/drawings/:id`

### Revisions

- `POST /api/drawings/:id/revisions`
- `GET /api/drawings/:id/revisions`
- `GET /api/revisions/:revisionId`

### Workflow

- `POST /api/revisions/:revisionId/submit`
- `POST /api/revisions/:revisionId/check`
- `POST /api/revisions/:revisionId/approve-level-1`
- `POST /api/revisions/:revisionId/approve-level-2`

### Download

- `GET /api/revisions/:revisionId/download`
- `GET /api/revisions/:revisionId/preview`

### Dashboard

- `GET /api/dashboard/summary`

### Admin

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`

---

## 17. Business Rules yang Perlu Dikunci

Sebelum development dimulai, aturan berikut harus dipastikan:

1. apakah `drawing_number` unik secara global atau per area
2. format `revision_no` yang dipakai
3. apakah Approver Level 1 akan fixed atau bisa berganti tergantung kebutuhan bisnis
4. apakah satu user bisa memiliki multi-role
5. apakah reject selalu kembali ke Drafter
6. apakah metadata boleh diubah setelah submit
7. apakah user/consumer boleh melihat drawing yang belum completed
8. apakah note reject wajib
9. apakah completed drawing lama otomatis menjadi obsolete saat ada completed revision baru
10. bagaimana naming convention dan lokasi file storage produksi

### Rekomendasi untuk MVP

- approval flow fixed 3 level
- reject selalu kembali ke Drafter
- note reject wajib
- completed drawing tidak bisa diedit langsung
- user/consumer hanya melihat drawing completed
- revisi final lama menjadi obsolete jika revisi final baru sudah completed

---

## 18. Backlog MVP

## 18.1 Epic 1 - Foundation

- setup Next.js project
- setup Tailwind + shadcn/ui
- setup MySQL
- setup Drizzle ORM
- setup Better Auth
- setup RBAC dasar

## 18.2 Epic 2 - User Management

- login page
- session handling
- role guard
- admin user management sederhana

## 18.3 Epic 3 - Drawing Core

- create drawing
- upload PDF
- metadata validation
- drawing list
- drawing detail

## 18.4 Epic 4 - Approval Workflow

- submit to check
- check level 0
- approval level 1
- approval level 2
- reject notes
- audit log activity

## 18.5 Epic 5 - Revision & Output

- revision history
- watermark generation
- completed download
- read-only completed drawing

## 18.6 Epic 6 - Dashboard & Polishing

- dashboard summary
- filter dan search optimization
- loading/error states
- hardening & bug fixing

---

## 19. Estimasi Tahapan Development

Estimasi kasar untuk 1 full-stack developer:

- foundation setup: 3-5 hari
- drawing core: 4-6 hari
- approval workflow: 4-7 hari
- revision + audit: 3-5 hari
- watermark + download control: 3-6 hari
- dashboard + testing + bugfix: 4-7 hari

### Total estimasi MVP

Sekitar **3-5 minggu**, tergantung:

- kejelasan business rules
- kompleksitas UI
- format file drawing aktual
- detail implementasi watermark dan file storage

---

## 20. Risiko dan Catatan Teknis

### Risiko utama

1. logic approval bisa menjadi rumit bila rule bisnis belum dikunci
2. watermark PDF bisa menjadi area berat jika file besar atau layout kompleks
3. penyimpanan file harus dirancang aman sejak awal
4. jika revision tracking tidak dipisah dari drawing master, sistem akan cepat sulit dirawat

### Mitigasi

- lock business rules sebelum coding besar
- gunakan struktur drawing + revision terpisah
- semua akses file lewat backend authorization
- buat service layer khusus approval dan revision

---

## 21. Future Enhancements

Fitur lanjutan yang bisa masuk fase berikutnya:

- notification email/internal saat drawing masuk antrian approval
- approval workflow dinamis
- perbandingan antar revisi
- dashboard analytics lebih detail
- digital signature
- integration dengan ERP/DMS
- comment thread atau annotation langsung pada drawing
- activity feed real-time

---

## 22. Kesimpulan

Drawing Filing & Approval System dirancang sebagai aplikasi web full stack untuk mengelola siklus hidup mechanical drawing dari upload, review, approval, filing, hingga distribusi final. Dengan pendekatan Next.js monolith, MySQL, Drizzle ORM, dan Better Auth, MVP dapat dibangun relatif cepat tanpa memisahkan backend menjadi service terpisah.

Kunci keberhasilan proyek ini bukan hanya pada implementasi UI, tetapi pada kejelasan:

- status flow
- approval rules
- revision model
- permission matrix
- file access control

Jika lima area tersebut dikunci dengan baik sejak awal, development akan jauh lebih stabil dan risiko rewrite bisa ditekan.

---

## 23. Next Recommended Deliverables

Setelah PRD ini, deliverable berikut yang paling disarankan adalah:

1. **ERD final**
2. **Drizzle schema MVP**
3. **Status flow diagram**
4. **Folder architecture dan coding blueprint Next.js**
5. **Backlog task breakdown per sprint**
