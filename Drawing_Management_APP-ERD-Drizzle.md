# Drawing Management App - ERD Final & Drizzle Schema Draft

## 1. Tujuan Dokumen

Dokumen ini merupakan turunan teknis dari PRD untuk kebutuhan implementasi MVP aplikasi:

**Drawing Filing & Approval System**

Fokus dokumen ini:

1. menyusun **ERD final MVP**
2. mendefinisikan **entitas utama dan relasinya**
3. menyusun **enum dan status workflow**
4. memberikan **draft schema Drizzle ORM** untuk MySQL
5. menjadi acuan implementasi backend pada Next.js App Router

---

## 2. Asumsi MVP yang Dipakai

Dokumen ini menggunakan asumsi berikut:

- approval flow bersifat **fixed 3 level**
- role utama: `DRAFTER`, `DRAFT_LEADER`, `APPROVER_L1`, `HEAD`, `CONSUMER`, `ADMIN`
- drawing utama memiliki banyak revisi
- approval dicatat per revisi
- file PDF original tidak ditimpa
- file hasil watermark dapat disimpan terpisah
- drawing final yang boleh didownload user umum hanyalah revision dengan status `COMPLETED`
- reject pada semua level akan mengembalikan proses ke Drafter untuk revisi/resubmit

---

## 3. Entitas Utama

Untuk MVP, struktur data disarankan terdiri dari tabel berikut:

1. `users`
2. `sessions` *(dikelola Better Auth atau sistem auth terkait)*
3. `accounts` *(opsional sesuai Better Auth provider)*
4. `drawings`
5. `drawing_revisions`
6. `approval_actions`
7. `audit_logs`
8. `download_logs` *(opsional tapi direkomendasikan)*

Untuk implementasi bisnis inti, tabel yang paling penting adalah:

- `users`
- `drawings`
- `drawing_revisions`
- `approval_actions`
- `audit_logs`

---

## 4. ERD Konseptual

## 4.1 Gambaran hubungan

```text
users
 ├──< drawings.created_by
 ├──< drawing_revisions.submitted_by
 ├──< approval_actions.actor_id
 ├──< audit_logs.user_id
 └──< download_logs.user_id

drawings
 └──< drawing_revisions
           ├──< approval_actions
           ├──< audit_logs (via entity reference)
           └──< download_logs
```

---

## 4.2 ERD tekstual

```text
users
- id (PK)
- name
- email
- username
- role
- is_active
- created_at
- updated_at


drawings
- id (PK)
- drawing_number
- drawing_name
- sac_code
- area
- discipline
- description
- created_by (FK -> users.id)
- current_revision_id (nullable FK -> drawing_revisions.id)
- current_status
- latest_completed_revision_id (nullable FK -> drawing_revisions.id)
- created_at
- updated_at


drawing_revisions
- id (PK)
- drawing_id (FK -> drawings.id)
- revision_no
- file_original_path
- file_watermarked_path
- status
- change_note
- submitted_by (nullable FK -> users.id)
- submitted_at
- is_latest
- is_completed
- created_at
- updated_at


approval_actions
- id (PK)
- revision_id (FK -> drawing_revisions.id)
- approval_level
- actor_id (FK -> users.id)
- actor_role
- decision
- decision_note
- acted_at
- created_at


audit_logs
- id (PK)
- entity_type
- entity_id
- action
- user_id (nullable FK -> users.id)
- note
- metadata_json
- created_at


download_logs
- id (PK)
- revision_id (FK -> drawing_revisions.id)
- user_id (nullable FK -> users.id)
- downloaded_at
- source
```

---

## 5. Penjelasan Desain Entitas

## 5.1 `users`

Tabel ini menyimpan user aplikasi.

### Catatan desain

Karena menggunakan Better Auth, tabel user inti bisa mengikuti kebutuhan Better Auth, lalu ditambah field custom seperti:

- `username`
- `role`
- `is_active`

### Kenapa role disimpan langsung di user?

Untuk MVP, satu user satu role akan jauh lebih sederhana.

Kalau di masa depan dibutuhkan multi-role, bisa di-refactor menjadi:

- `roles`
- `user_roles`

Tapi untuk MVP, menyimpan role di kolom enum user lebih cepat dan cukup aman.

---

## 5.2 `drawings`

Tabel ini merepresentasikan identitas utama drawing.

### Fungsi tabel `drawings`

- menjadi master dokumen
- menyimpan identitas tetap drawing
- menyimpan referensi ke revisi aktif dan revisi final terakhir

### Kenapa `drawings` dipisah dari `drawing_revisions`?

Karena satu drawing dapat memiliki banyak revisi.
Jika semua informasi dicampur dalam satu tabel, tracking revisi dan approval akan cepat kacau.

### Field penting

- `drawing_number` → nomor unik drawing
- `drawing_name` → nama drawing
- `sac_code` → kode aset / SBI asset code
- `current_revision_id` → revisi yang saat ini aktif dalam workflow
- `latest_completed_revision_id` → revisi final terakhir yang valid untuk user umum
- `current_status` → status terkini dokumen berdasarkan revisi aktif

---

## 5.3 `drawing_revisions`

Tabel ini menyimpan setiap versi/revisi drawing.

### Fungsi

- menyimpan file PDF per revisi
- menyimpan status workflow per revisi
- menyimpan note perubahan
- menjadi anchor untuk approval history

### Field penting

- `revision_no` → nomor revisi, misalnya `0`, `1`, `2` atau `A`, `B`, `C`
- `file_original_path` → path file PDF asli
- `file_watermarked_path` → path PDF hasil watermark
- `status` → status proses revision
- `change_note` → catatan perubahan revisi
- `submitted_by` → siapa yang submit revisi
- `is_latest` → hanya 1 revision aktif/latest untuk tiap drawing
- `is_completed` → menandai revisi final

### Catatan desain

`is_latest` dan `is_completed` memudahkan query dan render dashboard.
Walaupun sebagian informasi bisa diturunkan dari status, flag ini sering berguna untuk performa dan kesederhanaan query.

---

## 5.4 `approval_actions`

Tabel ini menyimpan setiap keputusan approval.

### Kenapa tidak menyimpan approval langsung di kolom `drawing_revisions`?

Karena satu revisi bisa mengalami:

- check approve/reject
- approval level 1 approve/reject
- approval level 2 approve/reject
- bahkan resubmit dan siklus baru

Kalau approval hanya disimpan sebagai beberapa kolom statis, histori akan sulit dibaca dan kurang fleksibel.

### Keuntungan model ini

- histori approval lengkap
- note per keputusan tersimpan rapi
- mudah dibuat jadi timeline
- mudah dikembangkan jika nanti approval chain berubah

---

## 5.5 `audit_logs`

Digunakan untuk logging aktivitas sistem.

### Contoh action

- `DRAWING_CREATED`
- `DRAWING_UPDATED`
- `REVISION_CREATED`
- `REVISION_UPDATED`
- `SUBMITTED_FOR_CHECK`
- `CHECK_APPROVED`
- `CHECK_REJECTED`
- `APPROVAL_1_APPROVED`
- `APPROVAL_1_REJECTED`
- `APPROVAL_2_APPROVED`
- `APPROVAL_2_REJECTED`
- `DRAWING_DOWNLOADED`

### Kenapa tetap perlu audit log padahal ada approval_actions?

Karena approval_actions hanya mencatat aksi approval.
Audit log mencatat seluruh event sistem, termasuk edit metadata, submit ulang, dan download.

---

## 5.6 `download_logs`

Tabel ini opsional, tetapi sangat direkomendasikan bila file drawing final dianggap sensitif atau penting untuk ditelusuri.

### Manfaat

- mengetahui siapa mengunduh file final
- membantu audit distribusi drawing
- membantu investigasi penggunaan dokumen

---

## 6. Enum yang Disarankan

## 6.1 User Role Enum

```ts
export const userRoleEnum = [
  'ADMIN',
  'DRAFTER',
  'DRAFT_LEADER',
  'APPROVER_L1',
  'HEAD',
  'CONSUMER',
] as const;
```

> Catatan: `APPROVER_L1` sengaja dibuat generik supaya bisa diisi Engineer, Requestor, SI, atau approver level 1 lain sesuai kebijakan bisnis.

---

## 6.2 Drawing Revision Status Enum

```ts
export const revisionStatusEnum = [
  'DRAFT',
  'WAITING_CHECK',
  'CHECK_REJECTED',
  'WAITING_APPROVAL_1',
  'APPROVAL_1_REJECTED',
  'WAITING_APPROVAL_2',
  'APPROVAL_2_REJECTED',
  'COMPLETED',
  'OBSOLETE',
] as const;
```

---

## 6.3 Approval Decision Enum

```ts
export const approvalDecisionEnum = ['APPROVED', 'REJECTED'] as const;
```

---

## 6.4 Audit Entity Type Enum

```ts
export const auditEntityTypeEnum = [
  'DRAWING',
  'REVISION',
  'USER',
] as const;
```

---

## 6.5 Audit Action Enum

```ts
export const auditActionEnum = [
  'DRAWING_CREATED',
  'DRAWING_UPDATED',
  'REVISION_CREATED',
  'REVISION_UPDATED',
  'SUBMITTED_FOR_CHECK',
  'CHECK_APPROVED',
  'CHECK_REJECTED',
  'APPROVAL_1_APPROVED',
  'APPROVAL_1_REJECTED',
  'APPROVAL_2_APPROVED',
  'APPROVAL_2_REJECTED',
  'DRAWING_DOWNLOADED',
] as const;
```

---

## 7. Rule Relasi dan Constraint yang Direkomendasikan

## 7.1 Constraint utama

1. `drawing_number` sebaiknya unik
2. kombinasi `drawing_id + revision_no` harus unik
3. satu drawing hanya boleh punya satu `is_latest = true`
4. satu drawing hanya boleh punya satu `latest_completed_revision_id` aktif
5. approval level hanya boleh `0`, `1`, `2`

---

## 7.2 Validasi bisnis

### Saat create drawing baru

- system membuat row di `drawings`
- system membuat row awal di `drawing_revisions` dengan status `DRAFT`
- `current_revision_id` mengarah ke row revision baru
- `current_status` menjadi `DRAFT`

### Saat submit

- hanya revision dengan status `DRAFT`, `CHECK_REJECTED`, `APPROVAL_1_REJECTED`, atau `APPROVAL_2_REJECTED` yang dapat di-submit ulang
- status revision berubah ke `WAITING_CHECK`
- status drawing ikut berubah ke `WAITING_CHECK`

### Saat Draft Leader approve

- insert row ke `approval_actions`
- status revision menjadi `WAITING_APPROVAL_1`
- status drawing ikut diperbarui

### Saat Approver Level 1 approve

- insert row ke `approval_actions`
- status revision menjadi `WAITING_APPROVAL_2`

### Saat Head approve

- insert row ke `approval_actions`
- status revision menjadi `COMPLETED`
- `is_completed = true`
- `latest_completed_revision_id` pada drawing menunjuk ke revision ini
- jika ada revision completed lama, dapat ditandai `OBSOLETE`

### Saat reject di level mana pun

- insert row ke `approval_actions`
- status revision berubah ke status reject terkait
- proses kembali ke Drafter

---

## 8. Draft Skema Drizzle ORM

Di bawah ini adalah draft schema yang bisa dijadikan titik awal implementasi.

> Catatan: ini adalah **starter schema**. Detail integrasi Better Auth bisa perlu penyesuaian sesuai adapter dan versi yang digunakan.

```ts
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  mysqlEnum,
  json,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

export const userRoleEnum = mysqlEnum('user_role', [
  'ADMIN',
  'DRAFTER',
  'DRAFT_LEADER',
  'APPROVER_L1',
  'HEAD',
  'CONSUMER',
]);

export const revisionStatusEnum = mysqlEnum('revision_status', [
  'DRAFT',
  'WAITING_CHECK',
  'CHECK_REJECTED',
  'WAITING_APPROVAL_1',
  'APPROVAL_1_REJECTED',
  'WAITING_APPROVAL_2',
  'APPROVAL_2_REJECTED',
  'COMPLETED',
  'OBSOLETE',
]);

export const approvalDecisionEnum = mysqlEnum('approval_decision', [
  'APPROVED',
  'REJECTED',
]);

export const auditEntityTypeEnum = mysqlEnum('audit_entity_type', [
  'DRAWING',
  'REVISION',
  'USER',
]);

export const auditActionEnum = mysqlEnum('audit_action', [
  'DRAWING_CREATED',
  'DRAWING_UPDATED',
  'REVISION_CREATED',
  'REVISION_UPDATED',
  'SUBMITTED_FOR_CHECK',
  'CHECK_APPROVED',
  'CHECK_REJECTED',
  'APPROVAL_1_APPROVED',
  'APPROVAL_1_REJECTED',
  'APPROVAL_2_APPROVED',
  'APPROVAL_2_REJECTED',
  'DRAWING_DOWNLOADED',
]);

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 191 }).notNull(),
  username: varchar('username', { length: 80 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: userRoleEnum.notNull().default('CONSUMER'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
}, (table) => ({
  emailUniqueIdx: uniqueIndex('users_email_unique').on(table.email),
  usernameUniqueIdx: uniqueIndex('users_username_unique').on(table.username),
  roleIdx: index('users_role_idx').on(table.role),
}));

export const drawings = mysqlTable('drawings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  drawingNumber: varchar('drawing_number', { length: 100 }).notNull(),
  drawingName: varchar('drawing_name', { length: 255 }).notNull(),
  sacCode: varchar('sac_code', { length: 100 }).notNull(),
  area: varchar('area', { length: 100 }),
  discipline: varchar('discipline', { length: 100 }),
  description: text('description'),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  currentRevisionId: varchar('current_revision_id', { length: 36 }),
  currentStatus: revisionStatusEnum.notNull().default('DRAFT'),
  latestCompletedRevisionId: varchar('latest_completed_revision_id', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
}, (table) => ({
  drawingNumberUniqueIdx: uniqueIndex('drawings_number_unique').on(table.drawingNumber),
  statusIdx: index('drawings_status_idx').on(table.currentStatus),
  sacCodeIdx: index('drawings_sac_code_idx').on(table.sacCode),
  drawingNameIdx: index('drawings_name_idx').on(table.drawingName),
  createdByIdx: index('drawings_created_by_idx').on(table.createdBy),
}));

export const drawingRevisions = mysqlTable('drawing_revisions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  drawingId: varchar('drawing_id', { length: 36 }).notNull(),
  revisionNo: varchar('revision_no', { length: 50 }).notNull(),
  fileOriginalPath: varchar('file_original_path', { length: 500 }).notNull(),
  fileWatermarkedPath: varchar('file_watermarked_path', { length: 500 }),
  status: revisionStatusEnum.notNull().default('DRAFT'),
  changeNote: text('change_note'),
  submittedBy: varchar('submitted_by', { length: 36 }),
  submittedAt: timestamp('submitted_at'),
  isLatest: boolean('is_latest').notNull().default(true),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
}, (table) => ({
  drawingRevisionUniqueIdx: uniqueIndex('drawing_revision_unique').on(table.drawingId, table.revisionNo),
  drawingIdx: index('drawing_revisions_drawing_idx').on(table.drawingId),
  statusIdx: index('drawing_revisions_status_idx').on(table.status),
  latestIdx: index('drawing_revisions_latest_idx').on(table.drawingId, table.isLatest),
  completedIdx: index('drawing_revisions_completed_idx').on(table.drawingId, table.isCompleted),
}));

export const approvalActions = mysqlTable('approval_actions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  revisionId: varchar('revision_id', { length: 36 }).notNull(),
  approvalLevel: int('approval_level').notNull(),
  actorId: varchar('actor_id', { length: 36 }).notNull(),
  actorRole: userRoleEnum.notNull(),
  decision: approvalDecisionEnum.notNull(),
  decisionNote: text('decision_note'),
  actedAt: timestamp('acted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  revisionIdx: index('approval_actions_revision_idx').on(table.revisionId),
  actorIdx: index('approval_actions_actor_idx').on(table.actorId),
  approvalLevelIdx: index('approval_actions_level_idx').on(table.approvalLevel),
}));

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  entityType: auditEntityTypeEnum.notNull(),
  entityId: varchar('entity_id', { length: 36 }).notNull(),
  action: auditActionEnum.notNull(),
  userId: varchar('user_id', { length: 36 }),
  note: text('note'),
  metadataJson: json('metadata_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  userIdx: index('audit_logs_user_idx').on(table.userId),
}));

export const downloadLogs = mysqlTable('download_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  revisionId: varchar('revision_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }),
  downloadedAt: timestamp('downloaded_at').defaultNow().notNull(),
  source: varchar('source', { length: 50 }),
}, (table) => ({
  revisionIdx: index('download_logs_revision_idx').on(table.revisionId),
  userIdx: index('download_logs_user_idx').on(table.userId),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdDrawings: many(drawings),
  submittedRevisions: many(drawingRevisions),
  approvalActions: many(approvalActions),
  auditLogs: many(auditLogs),
  downloadLogs: many(downloadLogs),
}));

export const drawingsRelations = relations(drawings, ({ one, many }) => ({
  creator: one(users, {
    fields: [drawings.createdBy],
    references: [users.id],
  }),
  revisions: many(drawingRevisions),
}));

export const drawingRevisionsRelations = relations(drawingRevisions, ({ one, many }) => ({
  drawing: one(drawings, {
    fields: [drawingRevisions.drawingId],
    references: [drawings.id],
  }),
  submitter: one(users, {
    fields: [drawingRevisions.submittedBy],
    references: [users.id],
  }),
  approvals: many(approvalActions),
  downloadLogs: many(downloadLogs),
}));

export const approvalActionsRelations = relations(approvalActions, ({ one }) => ({
  revision: one(drawingRevisions, {
    fields: [approvalActions.revisionId],
    references: [drawingRevisions.id],
  }),
  actor: one(users, {
    fields: [approvalActions.actorId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const downloadLogsRelations = relations(downloadLogs, ({ one }) => ({
  revision: one(drawingRevisions, {
    fields: [downloadLogs.revisionId],
    references: [drawingRevisions.id],
  }),
  user: one(users, {
    fields: [downloadLogs.userId],
    references: [users.id],
  }),
}));
```

---

## 9. Catatan Penting tentang Foreign Key Circular Reference

Pada desain ini ada potensi circular reference karena tabel `drawings` memiliki:

- `current_revision_id`
- `latest_completed_revision_id`

sementara tabel `drawing_revisions` memiliki:

- `drawing_id`

Ini normal secara desain bisnis, tapi implementasi foreign key di migration perlu hati-hati.

### Opsi aman untuk MVP

1. buat tabel tanpa foreign key circular penuh di awal
2. gunakan relasi logis di layer aplikasi terlebih dahulu
3. atau tambahkan FK circular dalam migration bertahap jika benar-benar diperlukan

### Saran praktis

Untuk MVP, tidak masalah jika:

- `drawing_revisions.drawing_id` dijadikan FK
- sedangkan `drawings.current_revision_id` dan `latest_completed_revision_id` diperlakukan sebagai reference logis dulu

Ini lebih aman dan mengurangi kerumitan migration.

---

## 10. Query-Driven Design yang Direkomendasikan

Agar sistem terasa cepat dan mudah dikembangkan, desain query berikut harus dipikirkan sejak awal.

## 10.1 Dashboard Drafter

Butuh query:

- draft milik user
- drawing milik user yang sedang waiting
- drawing milik user yang direject
- recent submissions milik user

## 10.2 Dashboard Draft Leader

Butuh query:

- revision dengan status `WAITING_CHECK`
- sort by submitted_at ASC

## 10.3 Dashboard Approver Level 1

Butuh query:

- revision dengan status `WAITING_APPROVAL_1`

## 10.4 Dashboard Head

Butuh query:

- revision dengan status `WAITING_APPROVAL_2`

## 10.5 Consumer Search

Butuh query:

- hanya revision `COMPLETED`
- filter berdasarkan drawing number, drawing name, sac code, area

---

## 11. Workflow Service yang Disarankan

Agar codebase tidak cepat menjadi spaghetti, logic bisnis sebaiknya dipisah ke service layer.

### Service minimum

- `drawing.service.ts`
- `revision.service.ts`
- `approval.service.ts`
- `audit.service.ts`
- `download.service.ts`
- `watermark.service.ts`

### Contoh tanggung jawab

#### `drawing.service.ts`
- create drawing
- update metadata draft
- get drawing detail
- list drawings

#### `revision.service.ts`
- create revision baru
- mark old revision as not latest
- resubmit rejected revision

#### `approval.service.ts`
- check level 0
- approve level 1
- approve level 2
- validate status transition
- validate actor role

#### `audit.service.ts`
- insert audit log
- build activity timeline

#### `download.service.ts`
- authorize download access
- create download log
- resolve final file path

---

## 12. Status Transition Matrix

| Current Status | Action | By Role | Next Status |
|---|---|---|---|
| DRAFT | Submit | Drafter | WAITING_CHECK |
| CHECK_REJECTED | Resubmit | Drafter | WAITING_CHECK |
| APPROVAL_1_REJECTED | Resubmit | Drafter | WAITING_CHECK |
| APPROVAL_2_REJECTED | Resubmit | Drafter | WAITING_CHECK |
| WAITING_CHECK | Approve | Draft Leader | WAITING_APPROVAL_1 |
| WAITING_CHECK | Reject | Draft Leader | CHECK_REJECTED |
| WAITING_APPROVAL_1 | Approve | Approver L1 | WAITING_APPROVAL_2 |
| WAITING_APPROVAL_1 | Reject | Approver L1 | APPROVAL_1_REJECTED |
| WAITING_APPROVAL_2 | Approve | Head | COMPLETED |
| WAITING_APPROVAL_2 | Reject | Head | APPROVAL_2_REJECTED |
| COMPLETED | New Revision Created | Drafter/Admin | DRAFT (new revision), old can become OBSOLETE later |

---

## 13. Rekomendasi Naming Convention

## 13.1 File naming

Contoh format file storage:

```text
/drawings/{drawingId}/rev-{revisionNo}/original.pdf
/drawings/{drawingId}/rev-{revisionNo}/watermarked.pdf
```

Contoh:

```text
/drawings/DRW-001/rev-0/original.pdf
/drawings/DRW-001/rev-0/watermarked.pdf
```

Kalau `drawingId` berbasis UUID:

```text
/drawings/8f2e9a3f-.../rev-0/original.pdf
```

---

## 13.2 API naming

Gunakan naming konsisten:

- `/api/drawings`
- `/api/drawings/:id`
- `/api/drawings/:id/revisions`
- `/api/revisions/:revisionId/submit`
- `/api/revisions/:revisionId/check`
- `/api/revisions/:revisionId/approve-level-1`
- `/api/revisions/:revisionId/approve-level-2`
- `/api/revisions/:revisionId/download`

---

## 14. Potensi Refactor Versi Lanjutan

Jika nanti kebutuhan naik, desain ini mudah ditingkatkan ke:

1. tabel `roles`
2. tabel `user_roles`
3. tabel `approval_workflows`
4. tabel `approval_workflow_steps`
5. object storage abstraction
6. async queue untuk watermark generation

Artinya desain MVP ini masih punya jalur upgrade yang cukup sehat.

---

## 15. Kesimpulan

Struktur data yang paling aman untuk MVP adalah:

- satu tabel master `drawings`
- satu tabel versi `drawing_revisions`
- satu tabel histori keputusan `approval_actions`
- satu tabel histori audit `audit_logs`
- user disimpan sederhana dengan enum role di tabel `users`

Keuntungan pendekatan ini:

- workflow approval lebih mudah dikontrol
- revision history rapi
- search dan dashboard lebih gampang dibangun
- audit trail lebih jelas
- mudah diimplementasikan di Next.js + Drizzle + MySQL

---

## 16. Next Deliverables yang Disarankan

Setelah dokumen ini, urutan terbaik berikutnya adalah:

1. **Buat schema TypeScript aktual untuk project**
2. **Buat migration awal Drizzle**
3. **Buat route/service blueprint**
4. **Buat page breakdown dan UI wireframe ringan**
5. **Buat backlog implementation per modul**

Jika dilanjutkan, next paling efektif adalah:

- `schema.ts` actual Drizzle file
- `approval.service.ts` pseudo-code
- `route map + folder structure final`
