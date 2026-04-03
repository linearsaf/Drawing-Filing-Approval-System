# Head Guide

## Ringkasan

Head bertugas memberikan persetujuan akhir sebelum drawing dinyatakan selesai dan tersedia sebagai dokumen final.

## Akses Utama

- Dashboard
- Daftar Drawing
- Ubah Password akun sendiri

## Cara Kerja

Head hanya dapat melakukan aksi final approval pada revisi dengan status `WAITING_APPROVAL_2`.

Head dapat:

- melihat detail drawing
- meninjau preview PDF dan metadata
- melakukan final approval
- melakukan reject dengan catatan
- menambahkan e-sign pada PDF saat approve
- download drawing final yang sudah completed

Head tidak dapat:

- membuat drawing
- mengedit drawing
- membuat revisi baru
- melakukan check awal
- melakukan approval level 1
- mengakses manajemen user

## Alur Final Approval

1. Buka drawing dengan status `WAITING_APPROVAL_2`.
2. Masuk ke halaman `Approve`.
3. Tinjau dokumen final yang masuk ke tahap persetujuan akhir.
4. Isi catatan jika diperlukan.
5. Pilih:
   - `Approve Final` untuk mengubah revisi menjadi `COMPLETED`
   - `Reject` untuk mengembalikan revisi ke Drafter

## Dampak Final Approval

Jika final approval diberikan:

- revisi aktif berubah menjadi `COMPLETED`
- drawing masuk mode read-only untuk user pembaca
- drawing final dapat diunduh oleh role yang memiliki hak akses
- e-sign dapat ditambahkan pada PDF final

## Poin Penting

- Final approval adalah titik akhir workflow revisi aktif.
- Pastikan seluruh aspek dokumen sudah sesuai sebelum menekan approve.
- Reject wajib disertai alasan yang jelas agar revisi berikutnya lebih terarah.
