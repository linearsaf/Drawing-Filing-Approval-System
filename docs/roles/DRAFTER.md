# Drafter Guide

## Ringkasan

Drafter bertanggung jawab membuat drawing, memperbarui revision, dan mengirim revision ke alur check dan approval.

## Akses Utama

- Dashboard
- Drawing List
- Create Drawing
- Account Password

## Kemampuan Drafter

Drafter dapat:

- create drawing baru
- upload file PDF
- save draft
- edit revision dengan status `DRAFT`, `CHECK_REJECTED`, `APPROVAL_1_REJECTED`, dan `APPROVAL_2_REJECTED`
- submit revision ke proses check
- melihat `Drawing Detail`, revision history, approval history, dan audit timeline
- create revision baru dari drawing `COMPLETED`
- preview, print, dan download final drawing

Drafter tidak dapat:

- melakukan `Check`
- melakukan `Approval`
- melakukan `Final Approval`
- membuka `User Management`

## Alur Kerja Utama

1. Buka `Create Drawing`.
2. Isi metadata drawing dan `Current Revision`.
3. Upload PDF.
4. Pilih `Save Draft` bila pekerjaan belum siap diperiksa.
5. Pilih `Submit to Check` bila revision siap diproses Draft Leader.

## Saat Revision Rejected

Jika revision ditolak:

- status berubah ke salah satu status rejected
- drawing kembali bisa diedit oleh Drafter
- perbaikan dilakukan di halaman edit
- setelah selesai, revision dikirim ulang ke `WAITING_CHECK`

## Revision Baru dari Final Drawing

Jika drawing sudah `COMPLETED`, Drafter dapat membuat revision baru.

Hasilnya:

- revision baru dimulai dari `DRAFT`
- final drawing lama tetap tersimpan di histori
- workflow berjalan ulang dari tahap awal

## Penggunaan Drawing List

Halaman `Drawing List` membantu Drafter untuk:

- search drawing
- filter berdasarkan status, area, drafter, revision, dan tanggal
- scan cepat dengan `Compact List`
- membuka action berikutnya dari card/list

## Poin Penting

- gunakan `drawing number` yang unik
- pastikan file yang diupload berformat PDF
- isi `Change Note` dengan jelas agar reviewer memahami konteks perubahan
- sebelum submit, cek ulang file, revision number, dan metadata utama
