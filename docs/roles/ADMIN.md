# Admin Guide

## Ringkasan

Admin memiliki akses penuh ke seluruh area aplikasi, termasuk manajemen user dan seluruh tahapan workflow drawing.

## Akses Utama

- Dashboard
- Daftar Drawing
- Input Drawing
- User Management
- Ubah Password akun sendiri

## Cara Kerja

Admin dapat bertindak sebagai pengawas sistem sekaligus operator cadangan untuk seluruh proses drawing.

Admin dapat:

- melihat semua drawing di seluruh status
- membuat drawing baru
- mengedit revisi dengan status `DRAFT`, `CHECK_REJECTED`, `APPROVAL_1_REJECTED`, dan `APPROVAL_2_REJECTED`
- submit revisi ke proses check
- melakukan check untuk status `WAITING_CHECK`
- melakukan approval level 1 untuk status `WAITING_APPROVAL_1`
- melakukan final approval untuk status `WAITING_APPROVAL_2`
- membuat revisi baru dari drawing `COMPLETED`
- download drawing final
- membuat user baru
- mengubah data user
- mengaktifkan atau menonaktifkan user
- mengganti password user lain

## Penggunaan Harian

1. Masuk ke sistem melalui halaman login.
2. Buka `Dashboard` untuk melihat ringkasan pekerjaan dan antrean proses.
3. Gunakan `Daftar Drawing` untuk mencari drawing berdasarkan nomor, nama, SAC, area, status, revisi, atau rentang tanggal.
4. Jika perlu, buka `Input Drawing` untuk membuat drawing baru.
5. Saat ada drawing yang menunggu proses, Admin dapat langsung membuka detail drawing lalu menjalankan aksi sesuai statusnya.
6. Untuk pengelolaan akun, buka `User Management`.

## User Management

Pada halaman `User Management`, Admin dapat:

- membuat user baru beserta role dan status aktif
- mengubah nama, email, username, role, dan status aktif user
- mengubah password user tertentu
- memutus seluruh sesi user saat password diubah

## Approval dan E-Sign

Saat Admin melakukan check atau approval, sistem menyediakan:

- kolom catatan keputusan
- tombol `Approve`
- tombol `Reject`
- opsi menambahkan e-sign pada PDF saat approve

Catatan penting:

- reject wajib menyertakan catatan
- e-sign akan menambahkan stempel digital pada PDF
- final approval akan mengubah revisi menjadi `COMPLETED`

## Poin Penting

- Admin sebaiknya hanya mengambil alih proses operasional jika diperlukan.
- Menonaktifkan user tidak menghapus data histori pengguna.
- Perubahan password user lain sebaiknya dilakukan dengan komunikasi yang jelas ke pemilik akun.
- Drawing `COMPLETED` dapat menjadi dasar pembuatan revisi baru.
