# DrafTerra Implementation Constraints and Mitigations

## 1. Tujuan

Dokumen ini merangkum constraint yang perlu dipertimbangkan bila aplikasi DrafTerra diimplementasikan di lingkungan perusahaan, beserta mitigasi praktisnya.

Dokumen ini sengaja fokus pada risiko implementasi nyata, bukan hanya fitur aplikasi. Artinya, yang dibahas adalah keterbatasan storage, operasional server, backup, keamanan file, performa, audit, dan sustainability saat volume drawing terus bertambah.

---

## 2. Ringkasan Eksekutif

Constraint terbesar untuk sistem seperti ini biasanya bukan di UI atau approval flow, tetapi di area berikut:

- pertumbuhan file PDF yang terus-menerus
- keterbatasan storage server atau VPS
- coupling antara aplikasi dan file storage pada satu mesin
- backup dan restore yang makin berat seiring data membesar
- performa preview, upload, download, dan watermarking
- keamanan file perusahaan yang sensitif
- kesiapan operasional saat ada server failure, human error, atau lonjakan penggunaan

Jika sistem akan dipakai serius di perusahaan, rekomendasi utamanya adalah:

- jangan mengandalkan local disk VPS sebagai strategi storage jangka menengah/panjang
- pisahkan storage file dari compute server aplikasi
- siapkan retention policy, backup policy, dan capacity planning sejak awal
- siapkan monitoring disk, database, dan error rate sebelum sistem dipakai luas

---

## 3. Constraint Utama dan Mitigasi

## 3.1 Pertumbuhan Storage PDF

### Constraint

Setiap drawing menghasilkan minimal satu file PDF per revision. Dalam implementasi tertentu, satu revision juga bisa menghasilkan:

- file original
- file watermarked
- file print-ready
- backup copy
- salinan pada environment lain

Jika sistem dipakai bertahun-tahun, storage akan tumbuh terus dan hampir tidak pernah mengecil secara alami.

### Dampak

- disk VPS cepat penuh
- upload gagal
- preview atau download gagal
- migration atau deploy menjadi lebih berat
- backup harian makin lama dan makin mahal
- risiko downtime meningkat saat disk hampir habis

### Contoh kasar pertumbuhan

Asumsi sederhana:

- rata-rata 1 PDF = 5 MB
- 300 revision baru per bulan
- disimpan 2 copy per revision: original + watermarked

Maka kebutuhan per bulan sekitar:

- `300 x 5 MB x 2 = 3.000 MB` atau sekitar `3 GB / bulan`

Dalam 12 bulan:

- sekitar `36 GB / tahun`

Jika ditambah backup dan offsite copy:

- bisa menjadi `70 GB - 100+ GB / tahun`, tergantung strategi backup

Jika rata-rata file lebih besar, misalnya 15 MB sampai 30 MB, pertumbuhannya akan naik drastis.

### Mitigasi

- gunakan object storage terpisah, misalnya S3-compatible storage, Cloudflare R2, Wasabi, MinIO, atau storage enterprise internal
- pertahankan VPS hanya untuk app runtime dan metadata database, bukan sebagai storage utama file
- hindari menyimpan banyak turunan file permanen jika bisa di-generate on demand
- evaluasi apakah watermarked PDF perlu disimpan permanen, atau cukup dibuat saat dibutuhkan
- buat storage quota monitoring dan alert sebelum disk mencapai threshold berbahaya
- siapkan lifecycle policy untuk file turunan yang tidak wajib disimpan selamanya
- lakukan capacity planning minimal per kuartal

### Rekomendasi keputusan

Untuk production perusahaan, storage file sebaiknya:

- `Recommended`: object storage terpisah
- `Not recommended`: local disk VPS sebagai storage utama jangka panjang

---

## 3.2 Coupling App Server dan File Storage

### Constraint

Jika file disimpan di local filesystem server aplikasi, maka app dan file menjadi sangat tergantung pada mesin yang sama.

### Dampak

- ketika server pindah, file ikut harus dipindah
- scale-out ke beberapa instance menjadi rumit
- restore aplikasi tidak otomatis memulihkan file
- risiko kehilangan file lebih besar bila server rusak
- deploy di platform stateless atau container menjadi sulit

### Mitigasi

- abstraction layer storage harus dipertahankan sehingga backend tidak bergantung pada local path langsung
- file disimpan di shared storage atau object storage
- database hanya menyimpan metadata dan storage key
- buat prosedur restore yang memulihkan database dan file secara konsisten

### Rekomendasi keputusan

Kalau targetnya lebih dari pilot kecil, file storage harus dipisah dari app node.

---

## 3.3 Backup dan Disaster Recovery

### Constraint

Sistem ini tidak hanya menyimpan data transaksi, tetapi juga dokumen final yang akan dipakai user operasional. Kehilangan file tidak bisa dipulihkan hanya dari database.

### Dampak

- file hilang walaupun row database masih ada
- audit trail tidak lagi sinkron dengan dokumen
- consumer tidak bisa mengakses drawing completed
- downtime recovery bisa lama bila backup besar dan restore tidak teruji

### Mitigasi

- backup database dan file harus dianggap dua aset berbeda yang saling terkait
- gunakan backup harian database
- gunakan snapshot atau replication untuk object storage atau file storage
- lakukan restore drill berkala, bukan hanya backup
- definisikan RPO dan RTO yang realistis

### Minimum policy yang disarankan

- database backup harian
- offsite copy untuk file storage
- retention backup minimal 30 hari
- uji restore minimal per kuartal

---

## 3.4 Keterbatasan CPU dan RAM VPS

### Constraint

Preview PDF, upload file besar, watermarking, print generation, dan multiple concurrent downloads dapat membebani CPU serta RAM.

### Dampak

- halaman preview lambat
- timeout saat upload atau print
- proses approval yang menandatangani PDF terasa berat
- seluruh aplikasi melambat walaupun masalah utamanya ada di file handling

### Mitigasi

- pisahkan job berat ke background worker bila volume meningkat
- batasi ukuran upload per file
- gunakan streaming untuk download, jangan load seluruh file besar ke memory bila tidak perlu
- buat rate limiting untuk operasi berat
- monitor CPU, memory, response time, dan queue processing time

### Rekomendasi keputusan

Jika watermarking atau PDF processing meningkat, pertimbangkan arsitektur:

- app server untuk request web
- worker server untuk PDF jobs

---

## 3.5 Keterbatasan Network dan Upload Reliability

### Constraint

User perusahaan bisa mengunggah file dari site, plant, atau jaringan internal yang tidak stabil. File PDF gambar teknik juga kadang cukup besar.

### Dampak

- upload sering gagal di tengah jalan
- user mengulang upload berkali-kali
- duplicate file dan duplicate request meningkat
- persepsi sistem menjadi buruk walaupun masalahnya di jaringan

### Mitigasi

- tetapkan batas ukuran file yang jelas
- tampilkan error handling yang spesifik saat upload gagal
- pertimbangkan resumable upload jika volume file besar
- gunakan checksum atau validation pasca upload
- simpan audit sederhana untuk upload failure rate

---

## 3.6 Pertumbuhan Database Metadata dan Log

### Constraint

Selain file PDF, sistem juga akan menumbuhkan:

- drawing metadata
- revision history
- approval actions
- approval assignment
- audit logs
- download logs

Volume database memang biasanya lebih kecil dari file, tetapi tetap akan membesar terus.

### Dampak

- query dashboard dan drawing list melambat
- audit timeline menjadi berat
- backup database makin lama
- biaya maintenance naik

### Mitigasi

- pastikan index untuk query list, status, assignee, dan date filter terjaga
- siapkan archive strategy untuk log yang sangat lama bila diperlukan
- pisahkan operational log dari business log bila volume sudah tinggi
- evaluasi kebutuhan retention untuk download logs

---

## 3.7 Keamanan Dokumen Perusahaan

### Constraint

Drawing dapat mengandung informasi teknis yang sensitif. Bila file tersimpan di public path tanpa kontrol yang tepat, ada risiko akses yang tidak semestinya.

### Dampak

- kebocoran informasi teknis
- pelanggaran kebijakan internal
- audit security finding
- hilangnya kepercayaan stakeholder

### Mitigasi

- jangan anggap path file sebagai security boundary
- akses download dan preview harus melalui authorization backend
- file sebaiknya disimpan di storage private lalu diberikan signed access atau proxied access
- audit semua download penting
- gunakan TLS/HTTPS penuh
- pertimbangkan encryption at rest bila diwajibkan perusahaan

---

## 3.8 Malware atau File Upload Berbahaya

### Constraint

Walaupun format utamanya PDF, perusahaan tetap perlu menganggap semua file upload sebagai input yang tidak sepenuhnya aman.

### Dampak

- storage terisi file yang tidak sesuai
- potensi file berbahaya lolos ke lingkungan internal
- risiko compliance dan security review

### Mitigasi

- validasi MIME type dan extension
- scan file upload dengan antivirus atau malware scanner bila diwajibkan
- batasi hanya PDF
- log upload source dan actor
- blok file yang gagal validation atau scanning

---

## 3.9 Legal dan Validitas Approval Digital

### Constraint

Di sebagian perusahaan, approval digital belum otomatis dianggap setara dengan wet sign untuk semua jenis dokumen.

### Dampak

- user tetap menyimpan proses approval paralel di luar sistem
- potensi konflik antara final drawing di sistem dan final drawing legal versi dokumen manual
- kebingungan saat audit

### Mitigasi

- definisikan sejak awal apakah approval di sistem bersifat operasional, legal, atau keduanya
- dokumentasikan kebijakan internal mengenai status final drawing
- pisahkan flow legacy ready dari approval digital aktif, seperti yang sudah dirancang
- bila dibutuhkan, integrasikan dengan tanda tangan elektronik yang diakui kebijakan perusahaan

---

## 3.10 Kesiapan Audit dan Traceability

### Constraint

Saat sistem dipakai perusahaan, pertanyaan audit biasanya bukan “siapa yang bisa klik approve”, tetapi:

- siapa upload file ini
- siapa drafter sebenarnya
- siapa yang assign approver
- siapa download final drawing
- kapan status berubah

### Dampak

- sulit menjawab audit internal
- terjadi sengketa data ownership
- sulit melakukan root cause analysis

### Mitigasi

- pertahankan pemisahan `createdBy` dan `drawnByUserId`
- audit log harus konsisten untuk create, submit, check, approval, reassign, download, dan legacy import
- tampilkan `Uploaded by`, `Drawn by`, dan `Legacy Ready Note` secara jelas di UI

---

## 3.11 Single Point of Failure Operasional

### Constraint

Jika hanya ada satu VPS, satu database instance, dan satu storage node, maka kegagalan satu komponen bisa menghentikan seluruh layanan.

### Dampak

- aplikasi down total
- seluruh preview, download, dan approval berhenti
- recovery sepenuhnya bergantung pada backup

### Mitigasi

- minimal siapkan backup terjadwal dan monitoring health
- untuk fase lebih matang, gunakan managed database atau replica
- gunakan object storage yang lebih durable daripada disk lokal VPS
- siapkan runbook insiden sederhana untuk tim operasional

---

## 3.12 Ketergantungan pada Tim Operasional Internal

### Constraint

Sistem bisa berjalan baik secara teknis, tetapi tetap gagal secara operasional bila tidak ada owner yang memantau:

- kapasitas storage
- user access
- backup status
- failed jobs
- email failure

### Dampak

- masalah diketahui terlambat
- storage penuh tanpa peringatan
- akun nonaktif masih memiliki akses
- backup gagal tapi tidak ada yang sadar

### Mitigasi

- tentukan system owner
- tentukan admin operasional dan backup person
- buat checklist operasional mingguan atau bulanan
- pasang alerting ke email atau channel internal perusahaan

---

## 4. Prioritas Mitigasi Berdasarkan Fase

## 4.1 Fase Pilot

Masih bisa menggunakan VPS sederhana jika:

- user masih terbatas
- volume file masih rendah
- ada backup rutin
- ada monitoring disk

Tetap wajib:

- validasi ukuran upload
- audit log dasar
- backup database
- backup file

## 4.2 Fase Production Awal

Minimal yang sebaiknya sudah ada:

- object storage atau shared storage
- disk monitoring dan alert
- backup dan restore test
- private file access pattern
- capacity planning kuartalan

## 4.3 Fase Skala Menengah

Yang mulai penting:

- worker untuk PDF processing
- archive policy
- storage lifecycle policy
- observability lebih lengkap
- HA atau failover untuk database dan storage

---

## 5. Rekomendasi Arsitektur Storage

## Opsi A: Local Disk VPS

### Cocok untuk

- demo
- dev
- pilot kecil sementara

### Kelebihan

- paling cepat diimplementasikan
- murah di awal
- sederhana

### Kekurangan

- tidak scalable
- risk tinggi saat disk penuh
- sulit untuk multi-instance
- restore dan migration lebih berat

## Opsi B: Object Storage Terpisah

### Cocok untuk

- production perusahaan
- penggunaan jangka menengah dan panjang

### Kelebihan

- scalable
- durability lebih baik
- mudah dipisahkan dari server aplikasi
- lebih cocok untuk backup dan lifecycle policy

### Kekurangan

- butuh integrasi storage layer lebih matang
- ada biaya storage dan transfer

## Opsi C: Enterprise Storage Internal / On-Prem Object Storage

### Cocok untuk

- perusahaan dengan kebijakan data residency ketat
- kebutuhan integrasi internal
- volume besar

### Kelebihan

- kontrol lebih tinggi
- bisa mengikuti kebijakan internal perusahaan

### Kekurangan

- perlu dukungan infra internal
- setup dan operasi lebih kompleks

### Rekomendasi final

Untuk implementasi perusahaan, opsi yang paling sehat biasanya:

- `App Server`: Next.js + API + auth + metadata
- `Database`: MySQL terkelola atau server database terpisah
- `File Storage`: object storage private
- `Backup`: database backup + storage replication/offsite copy

---

## 6. Action Plan yang Disarankan

Urutan mitigasi yang paling realistis:

1. definisikan volume usage awal: estimasi jumlah drawing, revision, ukuran rata-rata file, dan pertumbuhan per bulan
2. tentukan batas maksimal upload file
3. pasang monitoring disk, CPU, memory, dan database
4. pindahkan storage file dari local VPS ke object storage sebelum volume membesar
5. siapkan backup dan restore test
6. siapkan kebijakan retention dan archive
7. siapkan kebijakan security untuk preview dan download
8. siapkan owner operasional setelah go-live

---

## 7. Kesimpulan

Constraint yang paling cepat menjadi masalah nyata adalah storage PDF, terutama bila file:

- terus bertambah
- disimpan ganda
- dibackup berlapis
- tetap berada di local disk server aplikasi

Karena itu, storage tidak boleh dianggap detail kecil implementasi. Untuk sistem perusahaan, storage harus diperlakukan sebagai komponen arsitektur utama.

Mitigasi terbaik bukan hanya menambah kapasitas disk, tetapi:

- memisahkan storage dari app server
- menyiapkan backup dan restore yang benar
- mengendalikan pertumbuhan file turunan
- menyiapkan monitoring dan capacity planning

Jika hal-hal ini disiapkan sejak awal, sistem akan jauh lebih siap dipakai jangka panjang tanpa sering terhambat oleh limit server atau risiko operasional.
