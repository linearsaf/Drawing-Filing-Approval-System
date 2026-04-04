# Drafter Guide

## Ringkasan

Drafter bertanggung jawab membuat drawing, memperbarui revisi, dan mengirim revisi ke alur persetujuan.

## Akses Utama

- Dashboard
- Daftar Drawing
- Input Drawing
- Ubah Password akun sendiri

## Cara Kerja

Drafter hanya bekerja pada drawing miliknya sendiri.

Drafter dapat:

- membuat drawing baru
- upload file PDF drawing
- melihat preview dokumen pada detail drawing
- menyimpan drawing sebagai draft
- mengedit revisi dengan status `DRAFT`, `CHECK_REJECTED`, `APPROVAL_1_REJECTED`, dan `APPROVAL_2_REJECTED`
- submit revisi ke proses check
- membuat revisi baru dari drawing `COMPLETED`
- download drawing final yang sudah selesai

Drafter tidak dapat:

- melakukan check
- melakukan approval level 1
- melakukan final approval
- mengakses manajemen user

## Alur Kerja Utama

1. Buka `Input Drawing`.
2. Isi metadata drawing:
   - drawing number
   - drawing name
   - SAC code
   - area
   - discipline
   - description
   - revision
   - change note
3. Upload file PDF drawing.
4. Pilih `Simpan Draft` jika pekerjaan belum final.
5. Pilih `Submit` jika drawing siap diperiksa oleh Draft Leader.

## Saat Revisi Ditolak

Jika revisi ditolak pada tahap check atau approval:

- status revisi akan berubah menjadi salah satu status reject
- Drafter dapat membuka kembali drawing tersebut
- perbaikan dapat dilakukan melalui halaman edit
- revisi kemudian disubmit ulang ke proses berikutnya

## Revisi Baru dari Drawing Final

Jika drawing sudah `COMPLETED`, Drafter dapat:

- membuat revisi baru
- sistem akan membuat revisi berikutnya
- revisi baru dimulai dari status `DRAFT`

## Penggunaan Daftar Drawing

Halaman `Daftar Drawing` mendukung:

- pencarian cepat
- filter status
- filter area
- filter `Drawn By`
- filter revisi
- filter tanggal `from - to`
- tampilan compact list untuk scan cepat

## Poin Penting

- Metadata `Drawn By` selalu mengikuti drafter yang membuat drawing.
- Pastikan file yang diunggah adalah PDF.
- Gunakan drawing number yang unik.
- Isi change note dengan jelas agar reviewer memahami perubahan.
- Sebelum submit, pastikan dokumen yang diunggah adalah versi yang benar.
