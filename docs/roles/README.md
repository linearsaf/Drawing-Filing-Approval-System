# Role Documentation

Dokumentasi ini menjelaskan cara kerja aplikasi berdasarkan peran pengguna.

Daftar dokumen:

- [ADMIN.md](./ADMIN.md)
- [DRAFTER.md](./DRAFTER.md)
- [DRAFT_LEADER.md](./DRAFT_LEADER.md)
- [APPROVER_L1.md](./APPROVER_L1.md)
- [HEAD.md](./HEAD.md)
- [CONSUMER.md](./CONSUMER.md)

Catatan umum:

- Login dilakukan melalui halaman `Sign In` menggunakan email atau username.
- Opsi `Remember me` akan mempertahankan sesi login pada perangkat yang sama.
- Fitur `Lupa password?` tersedia pada halaman login.
- Setiap user juga dapat mengubah password sendiri dari menu `Ubah Password`.
- Status revisi utama pada aplikasi:
  - `DRAFT`
  - `WAITING_CHECK`
  - `CHECK_REJECTED`
  - `WAITING_APPROVAL_1`
  - `APPROVAL_1_REJECTED`
  - `WAITING_APPROVAL_2`
  - `APPROVAL_2_REJECTED`
  - `COMPLETED`
  - `OBSOLETE`
