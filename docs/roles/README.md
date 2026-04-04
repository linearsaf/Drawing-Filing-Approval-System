# Role Documentation

Dokumentasi ini menjelaskan perilaku aplikasi berdasarkan role yang saat ini aktif di sistem.

Daftar dokumen:

- [ADMIN.md](./ADMIN.md)
- [DRAFTER.md](./DRAFTER.md)
- [DRAFT_LEADER.md](./DRAFT_LEADER.md)
- [APPROVER_L1.md](./APPROVER_L1.md)
- [HEAD.md](./HEAD.md)
- [CONSUMER.md](./CONSUMER.md)

## Catatan Umum

- Sign in dilakukan melalui halaman `Sign In` menggunakan email atau username.
- Calon user baru dapat memakai halaman `Request Access` dari login page.
- Reset password tersedia melalui halaman `Reset Password`.
- Setiap user dapat mengganti password sendiri dari menu `Account Password`.
- Istilah UI utama mengikuti panduan di [UI_WORDING_GUIDE.md](../UI_WORDING_GUIDE.md).

## Status Revision yang Dipakai

- `DRAFT`
- `WAITING_CHECK`
- `CHECK_REJECTED`
- `WAITING_APPROVAL_1`
- `APPROVAL_1_REJECTED`
- `WAITING_APPROVAL_2`
- `APPROVAL_2_REJECTED`
- `COMPLETED`
- `OBSOLETE`

## Aturan Global

- Semua reject wajib disertai note.
- Consumer hanya dapat melihat drawing dengan status `COMPLETED`.
- Revision baru dibuat sebagai row baru, bukan overwrite final drawing lama.
- `ADMIN` memiliki akses lintas role dan dapat mengambil alih seluruh workflow bila diperlukan.
