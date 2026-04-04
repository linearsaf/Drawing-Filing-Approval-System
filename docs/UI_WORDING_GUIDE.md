# UI Wording Guide

## Tujuan

Panduan ini dipakai agar wording di seluruh aplikasi tetap konsisten, terasa profesional, dan tidak berubah-ubah antar page.

Campuran bahasa Indonesia dan English diperbolehkan, tetapi istilah teknis utama harus tetap sama di seluruh app.

## Prinsip Utama

- Gunakan English untuk istilah domain yang sudah menjadi vocabulary produk.
- Gunakan bahasa Indonesia untuk kalimat penjelas, helper text, empty state, dan deskripsi umum.
- Jangan memakai dua istilah berbeda untuk konsep yang sama.
- Pilih satu bentuk istilah lalu pertahankan di semua page, modal, alert, badge, dan navigation.

## Vocabulary Produk

Istilah yang dipertahankan dalam English:

- `Drawing`
- `Drawing List`
- `Create Drawing`
- `Edit Drawing`
- `Current Revision`
- `Final Drawing`
- `Check`
- `Approval`
- `Final Approval`
- `Approved`
- `Rejected`
- `Request Access`
- `Reset Password`
- `User Management`
- `Visible`
- `Completion Rate`
- `Workflow Health`

Istilah yang tetap dalam bahasa Indonesia:

- `Ringkasan`
- `Langkah berikutnya`
- `Riwayat revisi`
- `Jejak aktivitas`
- `Cari`
- `Reset Filter`
- `Belum ada data`
- `Tidak tersedia`
- `Muat Ulang`

## Status Yang Dipakai

Gunakan label berikut secara konsisten:

- `Draft`
- `Waiting Check`
- `Check Rejected`
- `Waiting Approval L1`
- `Approval L1 Rejected`
- `Waiting Final Approval`
- `Final Approval Rejected`
- `Completed`
- `Obsolete`

## Action Label

Gunakan label berikut untuk tombol dan CTA:

- `Create Drawing`
- `Open Drawing List`
- `Open Drawing`
- `Open Drawing Detail`
- `Open Approval`
- `Open Final Approval`
- `Start Check`
- `View Document`
- `Open Final Drawing`
- `Create User`
- `Update User`
- `Approve Request`
- `Reject Request`

## Pola Wording Per Area

### Auth

- `Sign In`
- `Request Access`
- `Reset Password`
- `Kembali ke Sign In`

### Dashboard

- Pakai `Visible`, bukan `Terlihat` atau `Tampil`
- Pakai `Workflow Health`, bukan variasi lain untuk blok health
- Pakai `Activity Feed`, bukan `Recent Activity` di satu page lalu `Aktivitas` di page lain untuk komponen yang sama

### Drawing Flow

- Pakai `Current Revision`, bukan campur dengan `Revisi Aktif`
- Pakai `Final Drawing`, bukan campur dengan `Dokumen Final`
- Pakai `Drawing Detail`, `Check Drawing`, dan `Approval`

### Admin

- Pakai `User Management`
- Pakai `Request Access`
- Pakai `Active` dan `Inactive`
- Pakai `Visible` untuk count hasil list

## Hindari Variasi Berikut

- `Daftar Drawing` jika di tempat lain memakai `Drawing List`
- `Input Drawing` jika di tempat lain memakai `Create Drawing`
- `Dokumen Final` jika di tempat lain memakai `Final Drawing`
- `Revisi Aktif` jika di tempat lain memakai `Current Revision`
- `Tampil` atau `Terlihat` jika di tempat lain memakai `Visible`
- `Menunggu Check` jika di tempat lain memakai `Waiting Check`
- `Approval Head` jika di tempat lain memakai `Final Approval`

## Contoh Penggunaan

- Benar: `12 drawing visible`
- Salah: `12 drawing tampil`

- Benar: `Current Revision`
- Salah: `Revisi Aktif`

- Benar: `Open Drawing List`
- Salah: `Lihat Daftar Drawing`

- Benar: `Final Drawing`
- Salah: `Dokumen Final`

## Rule Singkat Saat Menambah Fitur

Sebelum menulis label baru, cek apakah konsep itu sudah ada di page lain. Jika sudah ada, gunakan istilah yang sama persis.
