# Draft Leader Guide

## Ringkasan

Draft Leader bertugas melakukan pemeriksaan awal terhadap drawing yang sudah disubmit oleh Drafter.

## Akses Utama

- Dashboard
- Daftar Drawing
- Ubah Password akun sendiri

## Cara Kerja

Draft Leader dapat melihat semua drawing, tetapi aksi `Check` hanya tersedia untuk revisi dengan status `WAITING_CHECK`.

Draft Leader dapat:

- membuka detail drawing
- meninjau metadata drawing
- melihat preview dokumen PDF
- melakukan check approval
- melakukan reject dengan catatan
- menambahkan e-sign pada PDF saat approve
- download drawing final yang sudah completed

Draft Leader tidak dapat:

- membuat drawing baru
- mengedit drawing
- membuat revisi baru
- melakukan approval level 1
- melakukan final approval
- mengakses manajemen user

## Alur Check

1. Buka `Daftar Drawing` atau `Dashboard`.
2. Cari drawing dengan status `WAITING_CHECK`.
3. Masuk ke halaman `Check`.
4. Tinjau metadata dan preview dokumen.
5. Isi catatan keputusan bila diperlukan.
6. Pilih:
   - `Approve Check` untuk meneruskan ke `WAITING_APPROVAL_1`
   - `Reject` untuk mengembalikan ke Drafter

## Ketentuan Keputusan

- Reject wajib diikuti catatan.
- Approve dapat disertai e-sign pada PDF.
- Setelah approve, revisi masuk ke antrean Approver Level 1.

## Poin Penting

- Fokus utama Draft Leader adalah validasi awal dokumen.
- Pastikan drawing yang diperiksa sesuai metadata dan file yang diunggah.
- Gunakan catatan reject yang spesifik agar Drafter mudah melakukan perbaikan.
