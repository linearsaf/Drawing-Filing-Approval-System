# Draft Leader Guide

## Ringkasan

Draft Leader melakukan `Check` terhadap revision yang sudah dikirim Drafter sebelum masuk ke approval level berikutnya.

## Akses Utama

- Dashboard
- Drawing List
- Upload Old Drawing
- Account Password

## Kemampuan Draft Leader

Draft Leader dapat:

- melihat drawing yang visible pada role-nya
- membuka `Drawing Detail`
- membuka halaman `Check Drawing` untuk revision `WAITING_CHECK`
- membuka halaman `Upload Old Drawing`
- meninjau metadata dan preview PDF
- `Mark as Approved` atau `Mark as Rejected`
- memilih approver level 1 yang wajib dan approver level 2 yang opsional
- menambahkan decision note
- menambahkan e-sign saat approve
- mengunggah drawing lama yang sudah wet sign sebagai `COMPLETED`
- preview, print, dan download final drawing

Draft Leader tidak dapat:

- create drawing
- edit drawing
- create revision baru
- melakukan approval level 1
- melakukan final approval
- membuka `User Management`

## Alur Check

1. Buka `Dashboard` atau `Drawing List`.
2. Cari revision dengan status `WAITING_CHECK`.
3. Masuk ke halaman `Check Drawing`.
4. Tinjau PDF dan drawing summary.
5. Isi note bila diperlukan.
6. Pilih `Mark as Approved` untuk meneruskan ke `WAITING_APPROVAL_1` dengan approver level 1 yang sudah dipilih.
7. Pilih `Mark as Rejected` untuk mengembalikan revision ke Drafter.
8. Jika perlu, isi approver level 2. Bila dikosongkan, revisi akan selesai setelah approval level 1.

## Poin Penting

- reject wajib menyertakan note
- check adalah quality gate pertama, jadi validasi teknis harus jelas
- pastikan approver level 1 selalu dipilih sebelum approve
- gunakan level 2 hanya bila revisi memang perlu final approval tambahan
- gunakan note reject yang spesifik agar perbaikan Drafter lebih cepat
- saat memakai `Upload Old Drawing`, drawing langsung completed dan tidak membuat approval history digital
- pada flow legacy, `Drawn by` dapat berbeda dengan uploader
