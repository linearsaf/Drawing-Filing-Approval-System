# DrafTerra - ERD & Drizzle Schema Aktual

## 1. Tujuan Dokumen

Dokumen ini adalah snapshot teknis dari model data yang saat ini benar-benar dipakai aplikasi.

Fokus dokumen:

1. merangkum entitas dan relasi aktual
2. menyelaraskan ERD dengan `src/lib/db/schema.ts`
3. mendokumentasikan enum dan constraint yang dipakai
4. menjelaskan implikasi desain terhadap workflow aplikasi

---

## 2. Entitas Aktual

Tabel yang saat ini ada pada schema:

1. `user`
2. `session`
3. `account`
4. `verification`
5. `user_access_requests`
6. `drawings`
7. `drawing_revisions`
8. `approval_actions`
9. `revision_approval_steps`
10. `audit_logs`
11. `download_logs`

---

## 3. ERD Konseptual

```text
user
|-< session
|-< account
|-< drawings.created_by
|-< drawings.drawn_by_user_id
|-< drawing_revisions.submitted_by
|-< approval_actions.actor_id
|-< revision_approval_steps.assigned_user_id
|-< revision_approval_steps.assigned_by_user_id
|-< audit_logs.user_id
|-< download_logs.user_id
'-< user_access_requests.approved_user_id

drawings
'-< drawing_revisions
    |-< approval_actions
    |-< revision_approval_steps
    '-< download_logs

audit_logs
'- mereferensikan entity bisnis via (entity_type, entity_id)
```

Catatan:

- `drawings.current_revision_id` dan `drawings.latest_completed_revision_id` saat ini adalah reference logis, bukan foreign key fisik.
- `audit_logs.action` disimpan sebagai `varchar`, bukan enum ketat.

---

## 4. Enum Aktual

### 4.1 User Role

```ts
type UserRole =
  | "ADMIN"
  | "DRAFTER"
  | "DRAFT_LEADER"
  | "APPROVER_L1"
  | "HEAD"
  | "CONSUMER";
```

### 4.2 Access Request Status

```ts
type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
```

### 4.3 Revision Status

```ts
type RevisionStatus =
  | "DRAFT"
  | "WAITING_CHECK"
  | "CHECK_REJECTED"
  | "WAITING_APPROVAL_1"
  | "APPROVAL_1_REJECTED"
  | "WAITING_APPROVAL_2"
  | "APPROVAL_2_REJECTED"
  | "COMPLETED"
  | "OBSOLETE";
```

### 4.4 Approval Decision

```ts
type ApprovalDecision = "APPROVED" | "REJECTED";
```

### 4.5 Audit Entity Type

```ts
type AuditEntityType = "DRAWING" | "REVISION" | "USER" | "ACCESS_REQUEST";
```

---

## 5. Tabel dan Field Utama

## 5.1 `user`

Tujuan:

- menyimpan user aplikasi utama
- dipakai langsung oleh Better Auth dan business layer

Field utama:

- `id`
- `name`
- `email`
- `emailVerified`
- `image`
- `username`
- `displayUsername`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Constraint penting:

- `email` unique
- `username` unique
- index pada `role`

Catatan:

- tidak ada tabel `roles` atau `user_roles`
- model saat ini adalah satu user satu role

---

## 5.2 `session`

Tujuan:

- menyimpan session Better Auth

Field utama:

- `id`
- `expiresAt`
- `token`
- `ipAddress`
- `userAgent`
- `userId`
- `createdAt`
- `updatedAt`

Constraint penting:

- `token` unique
- `userId` foreign key ke `user.id`

---

## 5.3 `account`

Tujuan:

- menyimpan account auth Better Auth
- saat ini juga menyimpan kolom `password`

Field utama:

- `id`
- `accountId`
- `providerId`
- `userId`
- `password`
- `accessToken`
- `refreshToken`
- `scope`
- `createdAt`
- `updatedAt`

Constraint penting:

- unique pada kombinasi `providerId + accountId`
- `userId` foreign key ke `user.id`

---

## 5.4 `verification`

Tujuan:

- menyimpan token verifikasi/reset flow auth

Field utama:

- `id`
- `identifier`
- `value`
- `expiresAt`
- `createdAt`
- `updatedAt`

---

## 5.5 `user_access_requests`

Tujuan:

- menyimpan request akses dari calon user
- menjadi staging sebelum admin membuat akun user final

Field utama:

- `id`
- `name`
- `email`
- `username`
- `requestedRole`
- `status`
- `adminReviewNote`
- `approvedUserId`
- `createdAt`
- `updatedAt`
- `reviewedAt`

Index:

- `email`
- `username`
- `status`

Relasi:

- `approvedUserId` nullable reference ke `user.id`

Business rule penting:

- request baru disimpan sebagai `PENDING`
- request bisa diubah admin sebelum approve
- approve akan membuat akun user aktif

---

## 5.6 `drawings`

Tujuan:

- master entity untuk identitas utama drawing

Field utama:

- `id`
- `drawingNumber`
- `drawingName`
- `sacCode`
- `area`
- `discipline`
- `description`
- `createdBy`
- `drawnByUserId`
- `workflowSource`
- `legacyReadyNote`
- `currentRevisionId`
- `currentStatus`
- `latestCompletedRevisionId`
- `createdAt`
- `updatedAt`

Constraint penting:

- `drawingNumber` unique
- `createdBy` foreign key ke `user.id`
- `drawnByUserId` foreign key ke `user.id`
- index pada `currentStatus`
- index pada `createdBy`
- index pada `drawnByUserId`
- index pada `workflowSource`

Catatan:

- `currentRevisionId` dan `latestCompletedRevisionId` belum dijadikan foreign key fisik
- `createdBy` menyimpan siapa yang menginput drawing ke sistem
- `drawnByUserId` menyimpan pemilik drawing secara bisnis dan dipakai untuk label/filter `Drafter`
- `workflowSource = LEGACY_READY` menandai old drawing yang langsung completed tanpa approval digital
- `legacyReadyNote` menyimpan penjelasan approval historis di luar sistem
- status master drawing diselaraskan dengan current revision aktif

---

## 5.7 `drawing_revisions`

Tujuan:

- menyimpan seluruh histori revision per drawing

Field utama:

- `id`
- `drawingId`
- `revisionNo`
- `fileName`
- `fileOriginalPath`
- `fileWatermarkedPath`
- `status`
- `changeNote`
- `submittedBy`
- `submittedAt`
- `isLatest`
- `isCompleted`
- `createdAt`
- `updatedAt`

Constraint penting:

- unique pada `drawingId + revisionNo`
- `drawingId` foreign key ke `drawings.id`
- `submittedBy` nullable reference ke `user.id`
- index pada `drawingId`
- index pada `status`

Catatan:

- `fileName` menyimpan nama file display
- `fileOriginalPath` dan `fileWatermarkedPath` menyimpan lokasi file storage
- `isLatest` dipakai untuk menandai current revision
- `isCompleted` dipakai untuk menandai revision final

---

## 5.8 `approval_actions`

Tujuan:

- menyimpan histori keputusan check dan approval per revision

Field utama:

- `id`
- `revisionId`
- `approvalLevel`
- `actorId`
- `actorRole`
- `decision`
- `decisionNote`
- `actedAt`
- `createdAt`

Constraint penting:

- `revisionId` foreign key ke `drawing_revisions.id`
- `actorId` foreign key ke `user.id`
- index pada `revisionId`
- index pada `actorId`

Aturan approval level:

- `0` untuk check oleh Draft Leader
- `1` untuk approval level 1
- `2` untuk final approval oleh Head

Catatan:

- `approval_actions` tetap menjadi histori keputusan aktual
- penentuan siapa approver level 1 dan 2 disimpan di `revision_approval_steps`

---

## 5.9 `revision_approval_steps`

Tujuan:

- menyimpan approval routing per revision
- menentukan approver level 1 yang wajib dan approver level 2 yang opsional
- menjadi sumber queue actionable untuk approver yang ditugaskan

Field utama:

- `id`
- `revisionId`
- `approvalLevel`
- `assignedUserId`
- `assignedByUserId`
- `assignedAt`
- `updatedAt`

Constraint penting:

- `revisionId` foreign key ke `drawing_revisions.id`
- `assignedUserId` nullable reference ke `user.id`
- `assignedByUserId` nullable reference ke `user.id`
- unique pada `revisionId + approvalLevel`
- index pada `assignedUserId + approvalLevel`
- index pada `revisionId`

Aturan implementasi:

- level `1` wajib ada saat check disetujui
- level `2` boleh kosong
- approver level 1 hanya dapat dipilih dari role `APPROVER_L1` atau `ADMIN`
- approver level 2 hanya dapat dipilih dari role `HEAD` atau `ADMIN`
- assignee level aktif menjadi satu-satunya user yang bisa memproses approve/reject pada level tersebut

---

## 5.10 `audit_logs`

Tujuan:

- mencatat aktivitas sistem secara luas

Field utama:

- `id`
- `entityType`
- `entityId`
- `action`
- `userId`
- `note`
- `metadataJson`
- `createdAt`

Constraint penting:

- index pada `entityType + entityId`
- index pada `action`
- `userId` nullable reference ke `user.id`

Catatan:

- `action` memakai `varchar`, jadi daftar action saat ini fleksibel
- entity type sudah mendukung `ACCESS_REQUEST`

Contoh action yang saat ini dipakai:

- `DRAWING_CREATED`
- `DRAWING_UPDATED`
- `DRAWING_DELETED`
- `DRAWING_CREATED_AND_SUBMITTED`
- `DRAWING_UPDATED_AND_SUBMITTED`
- `REVISION_CREATED`
- `SUBMITTED_FOR_CHECK`
- `WAITING_APPROVAL_1`
- `WAITING_APPROVAL_2`
- `CHECK_REJECTED`
- `APPROVAL_1_REJECTED`
- `APPROVAL_2_REJECTED`
- `COMPLETED`
- `DRAWING_DOWNLOADED`
- `REQUEST_CREATED`
- `REQUEST_APPROVED`
- `REQUEST_REJECTED`

---

## 5.11 `download_logs`

Tujuan:

- mencatat distribusi final drawing

Field utama:

- `id`
- `revisionId`
- `userId`
- `downloadedAt`
- `source`

Constraint penting:

- `revisionId` foreign key ke `drawing_revisions.id`
- `userId` nullable reference ke `user.id`
- index pada `revisionId`

Catatan:

- `source` default `APP`
- tabel ini sudah aktif, bukan lagi opsional di implementation saat ini

---

## 6. Relasi Drizzle Aktual

Relasi yang sudah didefinisikan:

- `userRelations`
- `accessRequestRelations`
- `drawingRelations`
- `revisionRelations`
- `approvalActionRelations`
- `revisionApprovalStepRelations`
- `auditLogRelations`
- `downloadLogRelations`

Catatan penting:

- relasi `user -> accessRequests` saat ini merepresentasikan request yang approve ke user tertentu, bukan request yang diajukan oleh user existing
- `drawings` saat ini punya relasi eksplisit ke `creator`, `drawnBy`, dan `revisions`
- `currentRevisionId` dan `latestCompletedRevisionId` belum diekspose sebagai relation Drizzle

---

## 7. Status Transition Aktual

| Current Status | Action | By Role | Next Status |
|---|---|---|---|
| `DRAFT` | Submit | DRAFTER / ADMIN | `WAITING_CHECK` |
| `CHECK_REJECTED` | Resubmit | DRAFTER / ADMIN | `WAITING_CHECK` |
| `APPROVAL_1_REJECTED` | Resubmit | DRAFTER / ADMIN | `WAITING_CHECK` |
| `APPROVAL_2_REJECTED` | Resubmit | DRAFTER / ADMIN | `WAITING_CHECK` |
| `WAITING_CHECK` | Approve | DRAFT_LEADER / ADMIN | `WAITING_APPROVAL_1` |
| `WAITING_CHECK` | Reject | DRAFT_LEADER / ADMIN | `CHECK_REJECTED` |
| `WAITING_APPROVAL_1` | Approve | APPROVER_L1 / ADMIN | `WAITING_APPROVAL_2` |
| `WAITING_APPROVAL_1` | Reject | APPROVER_L1 / ADMIN | `APPROVAL_1_REJECTED` |
| `WAITING_APPROVAL_2` | Approve | HEAD / ADMIN | `COMPLETED` |
| `WAITING_APPROVAL_2` | Reject | HEAD / ADMIN | `APPROVAL_2_REJECTED` |
| `COMPLETED` | Create Revision | DRAFTER / ADMIN | revision baru `DRAFT` |

---

## 8. API dan Data Model yang Perlu Diingat

### Access Request API

- `POST /api/access-requests`
- `GET /api/admin/access-requests`
- `PATCH /api/admin/access-requests/[id]`
- `POST /api/admin/access-requests/[id]/approve`
- `POST /api/admin/access-requests/[id]/reject`

### User API

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/[id]`
- `PATCH /api/admin/users/[id]/password`
- `GET /api/users/drafters`

### Drawing API

- `GET /api/drawings`
- `POST /api/drawings`
- `POST /api/drawings/legacy`
- `GET /api/drawings/[id]`
- `PATCH /api/drawings/[id]`
- `DELETE /api/drawings/[id]`
- `POST /api/drawings/[id]/revisions`

### Revision API

- `GET /api/revisions/[revisionId]`
- `PATCH /api/revisions/[revisionId]`
- `POST /api/revisions/[revisionId]/submit`
- `POST /api/revisions/[revisionId]/check`
- `POST /api/revisions/[revisionId]/approve-level-1`
- `POST /api/revisions/[revisionId]/approve-level-2`
- `GET /api/revisions/[revisionId]/preview`
- `GET /api/revisions/[revisionId]/print`
- `GET /api/revisions/[revisionId]/download`

---

## 9. Kesenjangan antara Model dan Implementasi Awal

Dokumen lama tidak lagi akurat pada beberapa area berikut:

- tabel auth bukan `users/sessions/accounts` generik, tetapi `user/session/account/verification`
- `user_access_requests` sekarang sudah menjadi bagian inti model
- `download_logs` sudah implemented
- `audit_logs.action` tidak lagi enum ketat
- `drawings.currentRevisionId` dan `latestCompletedRevisionId` belum dijadikan FK fisik
- schema saat ini memakai `fileName` pada revision
- legacy import memakai metadata pada `drawings`, bukan tabel approval tambahan

---

## 10. Kesimpulan

Model data aplikasi saat ini sudah stabil untuk workflow inti:

- auth
- request access
- drawing master
- revision tracking
- approval history
- audit logging
- download tracking

Dokumen ini harus dipakai sebagai referensi teknis utama untuk schema dan relasi, selama isinya tetap diselaraskan dengan `src/lib/db/schema.ts`.
