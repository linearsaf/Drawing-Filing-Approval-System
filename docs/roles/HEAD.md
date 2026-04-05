# Head Guide

## Ringkasan

Head memberikan `Final Approval` sebelum revision dinyatakan selesai dan menjadi final drawing resmi, tetapi hanya untuk revision yang memang memakai level 2 dan ditugaskan kepadanya.

## Akses Utama

- Dashboard
- Drawing List
- Account Password

## Kemampuan Head

Head dapat:

- membuka `Drawing Detail`
- membuka halaman `Approval` untuk revision `WAITING_APPROVAL_2` yang memang ditugaskan kepadanya
- meninjau metadata dan preview PDF
- `Mark as Approved` atau `Mark as Rejected`
- menambahkan decision note
- menambahkan e-sign saat approve
- preview, print, dan download final drawing

Head tidak dapat:

- create drawing
- edit drawing
- create revision baru
- melakukan `Check`
- melakukan approval level 1
- membuka `User Management`

## Alur Final Approval

1. Buka drawing dengan status `WAITING_APPROVAL_2` dari queue Anda.
2. Masuk ke halaman `Approval`.
3. Tinjau file, metadata, dan konteks approval.
4. Isi note bila diperlukan.
5. Pilih:
   - `Mark as Approved` untuk mengubah revision menjadi `COMPLETED`
   - `Mark as Rejected` untuk mengembalikan revision ke Drafter

## Dampak Final Approval

Jika final approval diberikan:

- revision aktif menjadi `COMPLETED`
- drawing masuk mode final
- final drawing menjadi visible untuk consumer
- final drawing dapat dipreview, print, dan download sesuai hak akses

## Poin Penting

- ini adalah gate akhir sebelum final drawing dipakai sebagai referensi resmi
- reject wajib menyertakan note yang jelas
- tidak semua revision akan sampai ke Head; level ini hanya aktif bila Draft Leader menyiapkan final approval
- pastikan seluruh konteks approval sebelumnya sudah lengkap sebelum approve
