# Admin Guide

## Ringkasan

Admin adalah role dengan kontrol penuh terhadap user, request access, dan seluruh workflow drawing.

## Akses Utama

- Dashboard
- Drawing List
- Create Drawing
- User Management
- Account Password

## Kemampuan Admin

Admin dapat:

- melihat seluruh drawing di semua status
- create drawing
- edit revision pada status `DRAFT` dan seluruh status rejected
- submit revision ke proses check
- melakukan `Check`
- melakukan `Approval` level 1
- melakukan `Final Approval`
- create revision baru dari drawing `COMPLETED`
- preview, print, dan download final drawing
- delete drawing
- create user
- edit user
- activate/deactivate user
- reset password user lain
- review, approve, dan reject `Request Access`

## User Management

Pada halaman `User Management`, Admin dapat:

- melihat user directory
- mencari user berdasarkan nama, email, username, role, dan status
- membuat user baru secara manual
- memperbarui data user
- mengganti status `Active` atau `Inactive`
- reset password user
- memutus session user saat reset password

## Request Access Review

Admin juga menangani request dari calon user baru:

1. buka panel `Pending Access Requests`
2. pilih request yang masuk
3. sesuaikan nama, email, username, dan role bila perlu
4. simpan review atau langsung `Approve Request` / `Reject Request`

Saat request diapprove:

- sistem membuat user aktif
- default password dibuat dari nama final tanpa spasi + `123!`
- email notifikasi approval diproses

## Penggunaan Harian

1. Buka `Dashboard` untuk memantau queue dan activity feed.
2. Gunakan `Drawing List` untuk mencari drawing dan menjalankan aksi lintas status.
3. Buka `Drawing Detail` untuk membaca konteks dan lanjut ke `Check` atau `Approval`.
4. Gunakan `User Management` untuk menjaga user dan request access tetap rapi.

## Poin Penting

- Admin sebaiknya menjadi fallback operator, bukan pelaku utama semua approval.
- Menonaktifkan user tidak menghapus histori akun.
- Delete drawing hanya digunakan saat memang diperlukan, karena akan menghapus data dari workflow aktif.
