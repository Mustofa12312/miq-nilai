# PRD MIQ Smart Assessment System

## FASE 1 — Vision & Scope (Analisis dan Perancangan)

**Versi:** 1.0
**Status:** Draft
**Nama Proyek:** MIQ Smart Assessment System (MIQ-SAS)

---

# 1. Pendahuluan

## 1.1 Latar Belakang

Madrasah Ilmu Al-Qur'an (MIQ) setiap periode ujian melaksanakan penilaian bacaan Al-Qur'an terhadap seluruh santri.

Saat ini proses penilaian masih dilakukan secara manual menggunakan kertas sehingga memiliki beberapa kendala:

- Penguji harus menghitung nilai secara manual.
- Rekapitulasi nilai membutuhkan waktu lama.
- Kesalahan penjumlahan nilai sering terjadi.
- Sulit mengetahui progres ujian secara langsung.
- Sulit mengetahui santri yang belum dinilai.
- Laporan akhir harus diketik ulang.
- Data lama sulit dicari kembali.

Dengan semakin banyaknya jumlah santri dan penguji, proses tersebut menjadi kurang efisien.

Oleh karena itu diperlukan sebuah sistem digital yang sederhana, cepat, dan mudah digunakan menggunakan smartphone oleh seluruh tim penguji.

---

# 2. Visi Produk

Membangun sistem penilaian Al-Qur'an yang modern, cepat, akurat, dan mudah digunakan sehingga seluruh proses ujian dapat dilakukan secara digital, mulai dari persiapan peserta hingga laporan hasil ujian.

Aplikasi ini diharapkan menjadi sistem resmi penilaian MIQ yang dapat digunakan setiap tahun dan terus dikembangkan sesuai kebutuhan.

---

# 3. Misi Produk

- Mempermudah proses penilaian Al-Qur'an.
- Menghilangkan perhitungan manual.
- Mempercepat proses input nilai.
- Mempermudah rekapitulasi nilai.
- Menyediakan laporan otomatis.
- Menjadi pusat data penilaian MIQ.
- Menyediakan sistem yang dapat dikembangkan untuk berbagai jenis ujian.

---

# 4. Permasalahan Saat Ini

## Bagi Penguji

- Menulis nilai di kertas.
- Menghitung nilai secara manual.
- Kesalahan perhitungan.
- Kesalahan penulisan.
- Sulit mengetahui peserta yang sudah dinilai.

---

## Bagi Admin

- Rekap membutuhkan waktu lama.
- Harus mengetik ulang nilai.
- Sulit mencari data lama.
- Sulit membuat laporan.

---

## Bagi Pimpinan

- Tidak mengetahui progres ujian.
- Tidak mengetahui statistik hasil ujian.
- Tidak memiliki dashboard pemantauan.

---

# 5. Solusi yang Ditawarkan

MIQ Smart Assessment System menyediakan sistem penilaian berbasis web yang dioptimalkan untuk perangkat mobile.

Tim penguji cukup:

- Login.
- Memilih periode ujian.
- Memilih tingkatan.
- Memilih kelas.
- Memilih nama santri.
- Menginput jumlah kesalahan.
- Sistem menghitung nilai otomatis.
- Menyimpan hasil.

Seluruh data langsung tersimpan di Supabase secara realtime.

---

# 6. Tujuan Produk

## Tujuan Utama

Mengurangi waktu penilaian dan meningkatkan akurasi hasil ujian.

---

## Tujuan Khusus

- Input nilai kurang dari 20 detik per santri.
- Rekap nilai otomatis.
- Perhitungan nilai otomatis.
- Dashboard realtime.
- Export laporan.
- Penyimpanan data jangka panjang.

---

# 7. Sasaran Pengguna

## Super Admin

Mengelola seluruh sistem.

---

## Admin MIQ

Mengelola data ujian.

---

## Tim Penguji

Melakukan penilaian menggunakan HP.

---

## Pimpinan

Melihat laporan dan statistik.

---

# 8. Ruang Lingkup (Scope)

## Yang termasuk pada versi pertama

✅ Login

✅ Dashboard

✅ Manajemen Periode Ujian

✅ Manajemen Tingkatan

✅ Manajemen Kelas

✅ Manajemen Santri

✅ Import Excel

✅ Manajemen Penguji

✅ Penilaian Al-Qur'an

✅ Perhitungan Otomatis

✅ Dashboard Progress

✅ Export Excel

✅ Export PDF

✅ Laporan

---

## Yang belum termasuk

❌ QR Code

❌ Mode Offline

❌ Aplikasi Flutter

❌ Notifikasi

❌ Multi Bahasa

❌ Analisis AI

Fitur-fitur tersebut direncanakan untuk versi berikutnya.

---

# 9. Target Platform

## Versi 1

Web Application

Framework

- React + Vite
- Tailwind CSS
- React Router
- Axios
- Supabase JS

Backend

Supabase

- Authentication
- PostgreSQL
- Storage
- Realtime

---

## Versi 2

Android Application

Framework

Flutter

Database

Supabase (database yang sama dengan aplikasi web)

---

# 10. Target Penggunaan

Target penggunaan awal:

- 3 Tingkatan Al-Qur'an.
- ±43 kelas.
- Ratusan hingga ribuan santri.
- Puluhan penguji yang dapat melakukan penilaian secara bersamaan.
- Satu database terpusat.

Sistem harus tetap mampu dikembangkan apabila jumlah kelas, santri, atau jenis ujian bertambah di masa mendatang.

---

# 11. Prinsip Desain

Aplikasi dirancang berdasarkan prinsip berikut:

### Mobile First

Karena penguji menggunakan smartphone.

---

### Cepat

Semua proses seminimal mungkin jumlah klik.

---

### Sederhana

Tidak menampilkan informasi yang tidak diperlukan.

---

### Konsisten

Semua halaman memiliki pola yang sama.

---

### Responsif

Berjalan baik di HP, Tablet, Laptop, dan Desktop.

---

### Modern

Menggunakan UI modern yang bersih, ringan, dan mudah dipahami.

---

# 12. Nilai Utama Produk

Produk ini harus memiliki karakteristik berikut:

- Mudah dipelajari.
- Cepat digunakan.
- Aman.
- Stabil.
- Realtime.
- Mudah dikembangkan.
- Tidak bergantung pada satu pengembang.

---

# 13. Arsitektur Sistem

```text
                 MIQ Smart Assessment System

                        Frontend

              ┌──────────────────────┐
              │   React + Vite Web   │
              └──────────┬───────────┘
                         │
                  Supabase JS SDK
                         │
────────────────────────────────────────────────────

                     SUPABASE

 Authentication

 PostgreSQL Database

 Storage

 Realtime

 Edge Functions (Opsional)

────────────────────────────────────────────────────

                Future Client

              Flutter Android
```

> Seluruh platform (Web dan Flutter) menggunakan **database, autentikasi, dan aturan bisnis yang sama** untuk menjaga konsistensi data dan memudahkan pemeliharaan.

---

# 14. Target Keberhasilan (Success Metrics)

Proyek dianggap berhasil apabila:

- Penguji dapat menyelesaikan input nilai satu santri dalam waktu kurang dari 20 detik.
- Tidak ada perhitungan nilai yang dilakukan secara manual.
- Rekap nilai tersedia secara otomatis setelah ujian selesai.
- Admin dapat memantau progres penilaian secara realtime.
- Data ujian tersimpan dengan aman dan dapat diakses kembali pada periode berikutnya.
- Struktur sistem mendukung penambahan modul baru tanpa perubahan besar pada arsitektur.

---

# 15. Visi Jangka Panjang

MIQ Smart Assessment System dirancang sebagai **platform penilaian MIQ**, bukan hanya aplikasi untuk ujian Al-Qur'an I, II, dan III.

Dalam pengembangannya, sistem dapat diperluas untuk mendukung berbagai kegiatan akademik MIQ, seperti:

- Penilaian Al-Qur'an.
- Penilaian Tahfidz.
- Munaqasyah.
- Imtihan Akhir.
- Kenaikan Tingkat.
- Sertifikasi Internal.
- Statistik perkembangan santri.
- Arsip nilai lintas tahun.

Dengan pendekatan modular, setiap fitur baru dapat ditambahkan tanpa mengubah fondasi sistem yang telah dibangun.

---

## Catatan Desain Penting

Satu keputusan desain yang saya rekomendasikan sejak awal adalah **memisahkan aplikasi Admin dan aplikasi Penguji** meskipun menggunakan database Supabase yang sama.

- **Admin** menggunakan dashboard lengkap di desktop maupun laptop untuk mengelola data dan laporan.
- **Penguji** menggunakan antarmuka mobile-first yang sangat sederhana dan fokus hanya pada proses penilaian.

Pendekatan ini akan membuat pengalaman pengguna lebih baik, mempermudah pemeliharaan, dan menjadi fondasi yang kuat ketika nanti dikembangkan menjadi aplikasi Android menggunakan Flutter.

# PRD MIQ Smart Assessment System

# FASE 2 — Business Process (Proses Bisnis)

**Versi:** 1.0
**Status:** Draft
**Nama Proyek:** MIQ Smart Assessment System (MIQ-SAS)

---

# 1. Tujuan Fase

Fase ini mendefinisikan bagaimana proses bisnis berjalan dari awal hingga akhir. Seluruh fitur yang akan dikembangkan pada web maupun Flutter nantinya harus mengikuti alur proses ini.

Business Process menjadi acuan utama bagi:

- Pengembang
- UI/UX Designer
- Database Designer
- Tester (QA)
- Administrator MIQ

---

# 2. Gambaran Umum Proses

Secara sederhana proses bisnis adalah sebagai berikut.

```text
Persiapan Ujian

↓

Input Data

↓

Pelaksanaan Ujian

↓

Penilaian

↓

Verifikasi

↓

Laporan

↓

Arsip
```

---

# 3. Tahapan Business Process

## Tahap 1 — Persiapan Ujian

Dilakukan oleh Admin MIQ.

### Aktivitas

- Membuat Periode Ujian
- Menentukan tanggal ujian
- Menentukan status periode (Aktif / Nonaktif)
- Menyiapkan data kelas
- Menyiapkan data santri
- Menyiapkan akun penguji

Output:

Semua data siap digunakan.

---

## Tahap 2 — Import Data Santri

Admin hanya mengimpor data sederhana.

Contoh Excel

| Nama    | Tingkatan   | Kelas |
| ------- | ----------- | ----- |
| Ahmad   | Al Quran I  | A1    |
| Hasan   | Al Quran I  | A1    |
| Mustofa | Al Quran II | B3    |

Setelah import

Sistem otomatis

- membuat data santri
- menghubungkan dengan kelas
- menghubungkan dengan tingkatan

---

## Tahap 3 — Login Penguji

Penguji membuka aplikasi.

Login menggunakan

- Email
- Password

atau

Username + Password (opsional, jika dipilih sebagai metode autentikasi).

Supabase Authentication melakukan validasi.

Jika berhasil

↓

Masuk Dashboard Penguji

---

# 4. Dashboard Penguji

Penguji hanya melihat menu sederhana.

```
Dashboard

↓

Pilih Periode

↓

Pilih Tingkatan

↓

Pilih Kelas

↓

Daftar Santri
```

Tidak ada menu lain.

Tujuannya agar penguji tidak bingung.

---

# 5. Memilih Periode

Apabila terdapat lebih dari satu periode ujian.

Misal

```
Semester Genap 2027

↓

Semester Ganjil 2027
```

Jika hanya ada satu periode aktif.

Sistem langsung memilih otomatis.

---

# 6. Memilih Tingkatan

Contoh

```
Al Quran I

Al Quran II

Al Quran III
```

Admin dapat menambah tingkatan baru kapan saja.

Misal

Tahfidz

Qiraat

Tajwid

Tanpa mengubah kode.

---

# 7. Memilih Kelas

Setelah memilih tingkatan.

Misal

```
Al Quran II
```

langsung muncul

```
B1

B2

B3

...

B9
```

---

# 8. Menampilkan Daftar Santri

Misalnya

Kelas

B4

Muncul

```
Cari Nama

____________________

🟡 Ahmad

🟡 Hasan

🟢 Mustofa

🟡 Yusuf
```

Status

🟡 Belum dinilai

🟢 Sudah dinilai

Di bagian atas

```
Total

34 Santri

Sudah

18

Belum

16
```

---

# 9. Memilih Santri

Penguji menyentuh nama santri.

Tidak ada tombol edit.

Tidak ada popup.

Langsung membuka halaman penilaian.

---

# 10. Proses Penilaian

Halaman penilaian menampilkan

Nama

Kelas

Tingkatan

Kemudian

Kategori

TAJWID

FASOHAH

---

## Penguji hanya menginput jumlah kesalahan.

Contoh

```
Makhroj

[-]

2

[+]
```

Sistem menghitung otomatis.

```
30

-

2×3

=

24
```

Penguji tidak menghitung nilai.

---

# 11. Menyimpan Nilai

Setelah selesai.

Penguji menekan

```
SIMPAN
```

Sistem akan

- Menghitung total
- Menghitung predikat
- Menyimpan ke Supabase
- Mengubah status santri menjadi

```
Sudah Dinilai
```

---

# 12. Kembali ke Daftar

Setelah berhasil.

Aplikasi otomatis kembali.

```
Daftar Santri
```

Mustofa berubah menjadi

```
🟢 Sudah Dinilai
```

Tanpa klik tambahan.

---

# 13. Monitoring Admin

Admin dapat melihat

```
Progress

80%
```

Contoh

| Kelas | Total | Sudah | Belum |
| ----- | ----: | ----: | ----: |
| A1    |    30 |    30 |     0 |
| A2    |    31 |    25 |     6 |
| B1    |    29 |    29 |     0 |
| B2    |    30 |    17 |    13 |

Progress berubah secara realtime.

---

# 14. Verifikasi Nilai

Setelah semua selesai.

Admin dapat

- melihat seluruh nilai
- mengubah jika diperlukan
- memberi catatan
- mengunci nilai

Setelah dikunci

Penguji tidak dapat mengubah nilai lagi.

---

# 15. Hasil Akhir

Setelah semua kelas selesai.

Admin dapat melihat

```
Ranking

↓

Nilai

↓

Predikat

↓

Laporan
```

---

# 16. Export

Admin dapat mengunduh

- Excel
- PDF
- CSV

Filter

- Periode
- Tingkatan
- Kelas

---

# 17. Arsip

Semua data disimpan.

Misal

```
2026

↓

Semester Genap

↓

Al Quran II

↓

B4
```

Lima tahun kemudian data masih dapat dibuka.

---

# 18. Kondisi Khusus (Exception Flow)

## Penguji kehilangan koneksi internet

- Form penilaian menampilkan informasi bahwa koneksi terputus.
- Data yang belum tersimpan tetap berada di layar.
- Penguji dapat mencoba menyimpan kembali setelah koneksi tersedia.

> **Catatan:** Mode offline penuh akan menjadi fitur versi berikutnya.

---

## Penguji menekan tombol Simpan dua kali

Sistem harus mencegah penyimpanan ganda (double submit).

---

## Santri sudah dinilai

Secara default, penguji tetap dapat membuka data santri yang sudah dinilai untuk melihat hasilnya.

Kemampuan mengubah nilai bergantung pada status:

- **Belum dikunci:** dapat diubah oleh penguji yang berwenang.
- **Sudah dikunci:** hanya dapat dilihat, tidak dapat diubah.

---

## Admin menghapus kelas

Sistem tidak boleh menghapus kelas yang sudah memiliki data nilai.

Admin harus memindahkan seluruh santri ke kelas lain terlebih dahulu.

---

# 19. Business Rules (Aturan Bisnis)

### BR-001

Satu santri hanya boleh memiliki **satu nilai** untuk **satu periode ujian** pada **jenis ujian yang sama**.

---

### BR-002

Penguji hanya dapat mengakses menu penilaian.

---

### BR-003

Admin dapat melihat seluruh data.

---

### BR-004

Nilai dihitung otomatis oleh sistem.

---

### BR-005

Penguji tidak memasukkan nilai akhir.

Yang diinput hanyalah **jumlah kesalahan**.

---

### BR-006

Predikat dihitung otomatis.

---

### BR-007

Nilai yang sudah dikunci tidak dapat diubah oleh penguji.

---

### BR-008

Setiap perubahan nilai harus tercatat dalam **audit log**, termasuk siapa yang mengubah, kapan, dan perubahan apa yang dilakukan.

---

### BR-009

Progress dashboard harus diperbarui secara realtime setelah nilai berhasil disimpan.

---

### BR-010

Admin dapat menambah tingkatan, kelas, dan kriteria penilaian tanpa perlu mengubah kode aplikasi.

---

# 20. Business Process Diagram

```text
                ADMIN

Buat Periode
      │
Import Santri
      │
Kelola Kelas
      │
Kelola Penguji
      │
────────────── UJIAN DIMULAI ──────────────

              PENGUJI

Login
      │
Pilih Periode
      │
Pilih Tingkatan
      │
Pilih Kelas
      │
Daftar Santri
      │
Pilih Santri
      │
Input Jumlah Kesalahan
      │
Hitung Nilai Otomatis
      │
Simpan
      │
Status Santri → Sudah Dinilai

────────────── UJIAN SELESAI ──────────────

               ADMIN

Monitoring
      │
Verifikasi
      │
Kunci Nilai
      │
Export
      │
Arsip
```

---

# Catatan Arsitektur (Rekomendasi)

Sebelum masuk ke fase berikutnya, saya menyarankan satu perubahan kecil pada alur bisnis agar aplikasi lebih fleksibel.

Daripada alur:

**Tingkatan → Kelas → Santri**

lebih baik gunakan:

**Periode Ujian → Jenis Ujian → Tingkatan → Kelas → Santri**

Contohnya:

```
Periode:
Semester Genap 2027

↓

Jenis Ujian:
Ujian Kenaikan Tingkat

↓

Tingkatan:
Al-Qur'an II

↓

Kelas:
B4

↓

Santri:
Mustofa
```

Dengan tambahan **Jenis Ujian**, sistem nantinya bisa mendukung berbagai kegiatan seperti Ujian Al-Qur'an, Tahfidz, Munaqasyah, atau Imtihan tanpa mengubah alur utama. Ini akan menjadi fondasi yang kuat untuk pengembangan jangka panjang, termasuk saat aplikasi Android Flutter dibuat.

# PRD MIQ Smart Assessment System

# FASE 3 — User Roles & Permissions

**Versi:** 1.0
**Status:** Draft
**Nama Proyek:** MIQ Smart Assessment System (MIQ-SAS)

---

# 1. Tujuan

Fase ini mendefinisikan seluruh pengguna (User Roles) beserta hak akses (Permissions) pada sistem.

Tujuannya adalah:

- Menjamin keamanan data.
- Membatasi akses sesuai tugas.
- Mempermudah pengembangan.
- Menjadi dasar implementasi Supabase Authentication dan Row Level Security (RLS).

---

# 2. Konsep Hak Akses

Sistem menggunakan **Role-Based Access Control (RBAC)**.

Setiap pengguna memiliki **satu role utama**.

```text
User

↓

Role

↓

Permission

↓

Menu

↓

Action
```

Contoh

```text
Mustofa

↓

Penguji

↓

Input Nilai

↓

Penilaian
```

---

# 3. Daftar Role

| Role        | Deskripsi                     |
| ----------- | ----------------------------- |
| Super Admin | Pengelola seluruh sistem      |
| Admin MIQ   | Operator administrasi         |
| Penguji     | Tim penilai ujian             |
| Pimpinan    | Melihat laporan dan statistik |

---

# 4. Struktur Role

```text
Super Admin
│
├── Admin MIQ
│
├── Penguji
│
└── Pimpinan
```

---

# 5. Super Admin

### Tanggung Jawab

Mengelola seluruh sistem.

### Menu

- Dashboard
- Periode Ujian
- Tingkatan
- Kelas
- Santri
- Penguji
- User
- Kriteria
- Penilaian
- Laporan
- Pengaturan

### Hak Akses

✅ Tambah

✅ Edit

✅ Hapus

✅ Import

✅ Export

✅ Verifikasi Nilai

✅ Kunci Nilai

✅ Membuka kembali nilai

✅ Mengelola seluruh user

---

# 6. Admin MIQ

Admin bukan penguji.

Admin hanya mengelola data.

### Menu

Dashboard

Periode

Tingkatan

Kelas

Santri

Penguji

Penilaian

Laporan

Import Excel

Export

---

### Hak Akses

✅ Tambah Santri

✅ Edit Santri

✅ Nonaktifkan Santri

✅ Import Excel

✅ Membuat Kelas

✅ Membuat Tingkatan

✅ Menambah Penguji

✅ Mengatur Periode

✅ Melihat Nilai

✅ Export

❌ Tidak boleh menghapus nilai

❌ Tidak boleh menghapus user Super Admin

---

# 7. Penguji

Role paling sederhana.

Tujuannya agar tidak bingung saat ujian.

### Menu

Dashboard

↓

Penilaian

↓

Profil

Selesai.

---

### Hak Akses

✅ Login

✅ Memilih Periode

✅ Memilih Tingkatan

✅ Memilih Kelas

✅ Memilih Santri

✅ Menginput Nilai

✅ Mengedit nilai sebelum dikunci

✅ Melihat progres kelas yang sedang dinilai

❌ Tidak bisa melihat dashboard admin

❌ Tidak bisa melihat seluruh kelas (jika diberi pembatasan)

❌ Tidak bisa menghapus data

❌ Tidak bisa import

❌ Tidak bisa export

---

# 8. Pimpinan

Role khusus melihat laporan.

### Menu

Dashboard

Laporan

Statistik

Ranking

---

### Hak Akses

✅ Melihat hasil

✅ Melihat statistik

✅ Melihat ranking

✅ Export PDF

❌ Tidak dapat mengubah data

---

# 9. Matrix Permission

| Fitur            | Super Admin |  Admin   | Penguji | Pimpinan |
| ---------------- | :---------: | :------: | :-----: | :------: |
| Login            |     ✅      |    ✅    |   ✅    |    ✅    |
| Dashboard        |     ✅      |    ✅    |   ✅    |    ✅    |
| Kelola Periode   |     ✅      |    ✅    |   ❌    |    ❌    |
| Kelola Tingkatan |     ✅      |    ✅    |   ❌    |    ❌    |
| Kelola Kelas     |     ✅      |    ✅    |   ❌    |    ❌    |
| Kelola Santri    |     ✅      |    ✅    |   ❌    |    ❌    |
| Import Excel     |     ✅      |    ✅    |   ❌    |    ❌    |
| Kelola Penguji   |     ✅      |    ✅    |   ❌    |    ❌    |
| Input Nilai      |     ✅      |    ❌    |   ✅    |    ❌    |
| Edit Nilai       |     ✅      | Terbatas |  ✅\*   |    ❌    |
| Verifikasi Nilai |     ✅      |    ✅    |   ❌    |    ❌    |
| Kunci Nilai      |     ✅      |    ✅    |   ❌    |    ❌    |
| Export           |     ✅      |    ✅    |   ❌    |    ✅    |
| Pengaturan       |     ✅      |    ❌    |   ❌    |    ❌    |

- Hanya sebelum nilai dikunci dan sesuai hak akses yang diberikan.

---

# 10. Pembatasan Berdasarkan Periode

Penguji hanya dapat melihat:

- Periode yang aktif.
- Kelas yang ditugaskan.
- Santri pada kelas tersebut.

Contoh

Penguji Ahmad

```text
Periode

Semester Genap

↓

Al Quran II

↓

B4
```

Tidak dapat membuka

```text
A1

A2

C5
```

---

# 11. Penugasan Penguji

Menurut saya, satu penguji **tidak sebaiknya bebas memilih semua kelas**.

Lebih baik admin memberikan penugasan.

Contoh

| Penguji    | Tingkatan    | Kelas |
| ---------- | ------------ | ----- |
| Ust. Ahmad | Al Quran I   | A1    |
| Ust. Ahmad | Al Quran I   | A2    |
| Ust. Budi  | Al Quran II  | B1    |
| Ust. Hasan | Al Quran III | C3    |

Keuntungannya:

- Tidak salah input kelas.
- Penguji lebih fokus.
- Keamanan lebih baik.

---

# 12. Status User

Setiap user mempunyai status.

| Status       | Keterangan                                 |
| ------------ | ------------------------------------------ |
| Aktif        | Bisa login                                 |
| Nonaktif     | Tidak bisa login                           |
| Ditangguhkan | Tidak bisa login sampai diaktifkan kembali |

---

# 13. Audit Log

Setiap aktivitas penting harus tercatat.

Contoh

| Waktu | User  | Aktivitas              |
| ----- | ----- | ---------------------- |
| 08:10 | Admin | Import 320 santri      |
| 08:30 | Ahmad | Login                  |
| 08:35 | Ahmad | Menilai Mustofa        |
| 08:36 | Ahmad | Mengubah nilai Mustofa |
| 09:15 | Admin | Mengunci nilai B4      |

Audit log tidak boleh dapat diubah oleh pengguna biasa.

---

# 14. Authentication (Supabase Auth)

Semua pengguna login melalui Supabase Authentication.

Data login dipisahkan dari data profil.

```text
Supabase Auth

↓

User UID

↓

Profiles

↓

Role
```

Keuntungan:

- Login lebih aman.
- Mudah mengelola sesi pengguna.
- Mendukung reset password.
- Mendukung pengembangan aplikasi Flutter tanpa perubahan sistem login.

---

# 15. Struktur Data User

## auth.users

Dikelola oleh Supabase.

```text
id

email

encrypted_password
```

---

## profiles

Dikelola aplikasi.

```text
id

full_name

role

status

created_at
```

---

# 16. Konsep Row Level Security (RLS)

Semua tabel penting menggunakan **Row Level Security**.

Contoh aturan:

### Super Admin

Melihat seluruh data.

---

### Admin

Melihat seluruh data operasional.

---

### Penguji

Hanya dapat:

- Melihat santri yang ditugaskan.
- Membuat dan mengubah nilai sesuai penugasannya.
- Tidak dapat mengakses data di luar tugasnya.

---

### Pimpinan

Hanya membaca data laporan.

Tidak dapat mengubah apa pun.

---

# 17. Desain Masa Depan

Agar sistem siap berkembang, saya menyarankan untuk **memisahkan "Role" dan "Permission"** dalam database, bukan menyimpan hak akses langsung di tabel `profiles`.

Struktur yang direkomendasikan:

```text
profiles
    │
    ▼
roles
    │
    ▼
role_permissions
    │
    ▼
permissions
```

Contoh permission:

- `student.create`
- `student.update`
- `student.view`
- `exam.score.create`
- `exam.score.update`
- `exam.verify`
- `report.export`

Dengan pendekatan ini, jika nanti MIQ menambahkan role baru seperti **Koordinator Penguji**, **Sekretariat**, atau **Operator Tahfidz**, kita tidak perlu mengubah kode aplikasi secara besar-besaran. Cukup membuat role baru dan memberikan kombinasi permission yang sesuai.

---

## Keputusan Arsitektur Fase 3

Saya merekomendasikan agar **setiap penguji hanya dapat mengakses kelas yang telah ditugaskan oleh admin**, bukan bebas memilih semua kelas. Keputusan ini memberikan beberapa manfaat:

- Mengurangi risiko salah input nilai.
- Mempermudah pengaturan jadwal ujian.
- Meningkatkan keamanan data.
- Mempermudah penerapan Row Level Security di Supabase.
- Memudahkan pengembangan aplikasi Flutter karena aturan akses tetap konsisten di semua platform.

Pendekatan ini akan menjadi fondasi yang kuat untuk fase berikutnya, yaitu **desain database (ERD dan struktur tabel Supabase)**.

# PRD MIQ Smart Assessment System

# FASE 4 — Database Design & ERD (Supabase)

**Versi:** 1.0
**Status:** Draft
**Nama Proyek:** MIQ Smart Assessment System (MIQ-SAS)

---

# 1. Tujuan

Fase ini mendefinisikan arsitektur database yang akan digunakan oleh aplikasi.

Database harus memenuhi kebutuhan:

- Web React
- Android Flutter (masa depan)
- Realtime
- Aman
- Mudah dikembangkan
- Cepat melakukan query
- Mendukung ribuan data santri

Database menggunakan **Supabase PostgreSQL**.

---

# 2. Prinsip Perancangan Database

Database dirancang dengan prinsip:

- Normalisasi data
- Tidak ada duplikasi data
- Mudah dikembangkan
- Mudah melakukan backup
- Mendukung multi periode
- Mendukung multi jenis ujian
- Mendukung multi penguji
- Mendukung banyak tingkatan
- Mendukung banyak kelas

---

# 3. Gambaran ERD

```text
                 exam_periods
                      │
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   exam_types                 score_sessions
                                   │
                                   │
              ┌────────────────────┴───────────────────┐
              ▼                                        ▼
         students                               examiners
              │                                        │
              │                                        │
              ▼                                        ▼
            scores  ─────────────────────────────► profiles
              │
              │
              ▼
        score_details
              │
              ▼
          criteria

students
     │
     ▼
classes
     │
     ▼
levels
```

---

# 4. Tabel Profiles

Semua pengguna aplikasi.

```text
profiles
```

| Field      | Type      |
| ---------- | --------- |
| id         | uuid      |
| full_name  | text      |
| email      | text      |
| role       | text      |
| status     | boolean   |
| created_at | timestamp |

Role

- super_admin
- admin
- examiner
- leader

---

# 5. Tabel Levels

Menyimpan tingkatan.

```text
levels
```

| Field      | Type    |
| ---------- | ------- |
| id         | bigint  |
| name       | text    |
| prefix     | text    |
| sort_order | integer |
| active     | boolean |

Contoh

| name         |
| ------------ |
| Al Quran I   |
| Al Quran II  |
| Al Quran III |

---

# 6. Tabel Classes

```text
classes
```

| Field    | Type    |
| -------- | ------- |
| id       | bigint  |
| level_id | bigint  |
| name     | text    |
| active   | boolean |

Contoh

| name |
| ---- |
| A1   |
| A2   |
| A3   |

---

# 7. Tabel Students

Karena kebutuhan sederhana.

```text
students
```

| Field      | Type      |
| ---------- | --------- |
| id         | bigint    |
| class_id   | bigint    |
| full_name  | text      |
| active     | boolean   |
| created_at | timestamp |

Tidak diperlukan

- alamat
- nomor HP
- foto

karena bukan sistem akademik.

---

# 8. Tabel Exam Periods

```text
exam_periods
```

| Field      | Type    |
| ---------- | ------- |
| id         | bigint  |
| name       | text    |
| start_date | date    |
| end_date   | date    |
| active     | boolean |

Contoh

Semester Genap 2027

---

# 9. Tabel Exam Types

Supaya bisa berkembang.

```text
exam_types
```

| Field | Type   |
| ----- | ------ |
| id    | bigint |
| name  | text   |

Contoh

Al Quran

Tahfidz

Munaqosyah

Kenaikan Tingkat

---

# 10. Tabel Criteria

Ini salah satu tabel terpenting.

```text
criteria
```

| Field         | Type    |
| ------------- | ------- |
| id            | bigint  |
| category      | text    |
| name          | text    |
| default_score | numeric |
| deduction     | numeric |
| sort_order    | integer |
| active        | boolean |

Contoh

| Category | Name          |
| -------- | ------------- |
| Tajwid   | Makhroj       |
| Tajwid   | Sifat         |
| Tajwid   | Ahkam Huruf   |
| Fasohah  | Waqof Ibtida' |

---

# 11. Tabel Score Sessions

**Ini tabel baru yang saya rekomendasikan.**

Mengapa?

Karena satu penguji bisa membuka satu kelas.

```text
score_sessions
```

| Field        | Type      |
| ------------ | --------- |
| id           | bigint    |
| examiner_id  | uuid      |
| class_id     | bigint    |
| period_id    | bigint    |
| exam_type_id | bigint    |
| started_at   | timestamp |
| finished_at  | timestamp |

Keuntungan

- bisa mengetahui penguji sedang menilai kelas apa
- progress realtime
- statistik penguji

---

# 12. Tabel Scores

```text
scores
```

Satu record = satu santri.

| Field       | Type      |
| ----------- | --------- |
| id          | bigint    |
| session_id  | bigint    |
| student_id  | bigint    |
| total_score | numeric   |
| grade       | text      |
| notes       | text      |
| locked      | boolean   |
| created_at  | timestamp |

---

# 13. Tabel Score Details

Ini inti sistem.

```text
score_details
```

| Field       | Type    |
| ----------- | ------- |
| id          | bigint  |
| score_id    | bigint  |
| criteria_id | bigint  |
| mistakes    | integer |
| score       | numeric |

Contoh

| Criteria | Mistakes | Score |
| -------- | -------- | ----- |
| Makhroj  | 2        | 24    |

---

# 14. Tabel Examiner Assignments

Saya menyarankan dibuat.

```text
examiner_assignments
```

| Field       | Type   |
| ----------- | ------ |
| id          | bigint |
| examiner_id | uuid   |
| class_id    | bigint |
| period_id   | bigint |

Keuntungan

Penguji tidak bisa membuka kelas lain.

---

# 15. Relasi Database

```text
Level

↓

Class

↓

Student

↓

Score

↓

Score Detail
```

Sedangkan

```text
Exam Period

↓

Score Session

↓

Score
```

---

# 16. Index Database

Agar cepat.

Students

```sql
class_id
```

Scores

```sql
student_id
```

```sql
session_id
```

Score Details

```sql
score_id
```

Assignments

```sql
examiner_id
```

---

# 17. Constraint

Contoh

Satu santri

Tidak boleh mempunyai dua nilai

Pada

Periode sama

Jenis ujian sama

Dapat dibuat dengan **UNIQUE constraint** pada kombinasi:

```text
student_id
period_id
exam_type_id
```

---

# 18. Storage

Supabase Storage.

Belum digunakan.

Disiapkan untuk

- QR Code
- Foto Santri
- Berita Acara
- Dokumen

---

# 19. Row Level Security

Students

Penguji

Hanya melihat kelas yang ditugaskan.

---

Scores

Penguji

Hanya boleh membuat nilai.

---

Admin

Melihat semua.

---

Leader

Read Only.

---

# 20. Backup

Backup database.

- Harian
- Mingguan

Supabase menyediakan backup otomatis (sesuai paket yang digunakan).

---

# 21. Seed Data

Saat aplikasi pertama kali dibuat.

Data otomatis

```text
Al Quran I

A1

...

A29
```

```text
Al Quran II

B1

...

B9
```

```text
Al Quran III

C1

...

C5
```

Tidak perlu membuat satu per satu.

---

# 22. Struktur Folder React

Saya menyarankan menggunakan struktur Feature-Based.

```text
src/

├── app/
├── assets/
├── components/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── students/
│   ├── levels/
│   ├── classes/
│   ├── exams/
│   ├── scores/
│   ├── reports/
│   ├── users/
│   └── settings/
│
├── hooks/
├── layouts/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── constants.ts
│
├── routes/
├── services/
├── types/
├── utils/
└── main.tsx
```

Dengan struktur ini, Flutter nantinya juga bisa memakai pembagian modul yang serupa sehingga konsisten.

---

# 23. Keputusan Arsitektur Penting

Selama menyusun fase-fase sebelumnya, saya melihat ada satu kebutuhan khas MIQ yang belum tercermin di database. Saya menyarankan **menambahkan konsep "Sesi Ujian (Exam Session)"** sebagai entitas utama.

Contohnya:

```text
Periode:
Semester Genap 2027

↓

Jenis Ujian:
Al-Qur'an

↓

Sesi:
Hari Senin Pagi

↓

Penguji:
Ust. Ahmad

↓

Kelas:
A3
```

Dengan konsep **Sesi Ujian**, aplikasi akan mampu menangani kondisi nyata seperti:

- Ujian berlangsung beberapa hari.
- Satu kelas diuji oleh penguji berbeda pada sesi berbeda.
- Penggantian penguji di tengah ujian.
- Riwayat aktivitas penguji yang lengkap.
- Statistik durasi dan produktivitas penguji.

Keputusan ini akan sangat membantu ketika aplikasi berkembang ke Flutter, karena aplikasi Android dapat langsung menampilkan **"Sesi Ujian Saya Hari Ini"** tanpa penguji harus memilih terlalu banyak menu. Menurut saya, ini akan membuat pengalaman pengguna jauh lebih cepat dan profesional.

# PRD MIQ Smart Assessment System

# FASE 5 — UI/UX & User Experience Design

**Versi:** 1.0
**Status:** Draft
**Nama Proyek:** MIQ Smart Assessment System (MIQ-SAS)

> **Catatan Penting**
>
> Pada fase ini kita tidak membahas warna atau tampilan saja, tetapi bagaimana aplikasi **terasa cepat, sederhana, dan nyaman** digunakan oleh penguji ketika ujian sedang berlangsung.

---

# 1. Filosofi Desain

Aplikasi ini dibuat **bukan untuk admin**, tetapi untuk **penguji yang sedang menguji santri**.

Artinya UI harus memenuhi prinsip berikut:

- Sangat cepat
- Tombol besar
- Sedikit klik
- Tidak membingungkan
- Tidak banyak tulisan
- Fokus ke satu pekerjaan

Prinsip utama:

> **One Screen, One Task**

Setiap halaman hanya memiliki satu tujuan.

---

# 2. Design Language

Style yang digunakan

- Clean
- Modern
- Minimalis
- Mobile First
- Rounded UI
- Soft Shadow
- Smooth Animation

Inspirasi

- Google Material 3
- Apple Human Interface
- Linear
- Vercel Dashboard

---

# 3. Warna

## Primary

Hijau Islami

Digunakan untuk

- Button
- Progress
- Status berhasil

---

## Secondary

Putih

---

## Accent

Biru

Digunakan untuk

- Link
- Informasi

---

## Error

Merah

---

## Warning

Kuning

---

# 4. Typography

Font

Inter

atau

Plus Jakarta Sans

Ukuran

Heading

24

Sub Heading

18

Body

16

Small

14

---

# 5. Layout

Desktop

```text
┌────────────┬──────────────────────────────┐
│ Sidebar    │ Content                      │
│            │                              │
│            │                              │
└────────────┴──────────────────────────────┘
```

---

Mobile

```text
Header

↓

Content

↓

Bottom Navigation
```

---

# 6. User Flow Penguji

Ini adalah flow utama aplikasi.

```text
Login

↓

Dashboard

↓

Pilih Periode

↓

Pilih Tingkatan

↓

Pilih Kelas

↓

Daftar Santri

↓

Input Nilai

↓

Simpan

↓

Daftar Santri Lagi
```

Target

Kurang dari 20 detik.

---

# 7. Dashboard Penguji

Halaman pertama.

Menampilkan

```
Selamat Datang

Ust. Ahmad

Semester Genap

Al Quran II

B4
```

Di bawahnya

```
34 Santri

28 Sudah

6 Belum
```

Lalu tombol

```
Lanjut Penilaian
```

---

# 8. Halaman Pilih Kelas

Bukan dropdown panjang.

Lebih baik berbentuk kartu.

```
A1

34 Santri

──────────────

A2

31 Santri

──────────────

A3

35 Santri
```

Lebih mudah disentuh menggunakan HP.

---

# 9. Halaman Daftar Santri

Ini halaman yang paling sering dibuka.

Harus sangat cepat.

```
Cari Santri

______________
```

Di bawahnya

```
🟢 Mustofa

Sudah Dinilai

────────────

🟡 Ahmad

Belum Dinilai

────────────

🟡 Hasan

Belum Dinilai
```

Klik nama

↓

Masuk form.

---

# 10. Halaman Penilaian

Bagian atas

```
Mustofa

Al Quran II

B4
```

---

Di bawahnya

## Tajwid

```
Makhroj

[-]

0

[+]

Nilai

30
```

---

Sifat

```
[-]

1

[+]

18
```

---

Semua sama.

Tidak ada keyboard.

Penguji cukup menekan

-

atau

- ***

# 11. Total Nilai

Paling bawah

```
TOTAL

95

Mumtaz
```

Lalu

```
[ Simpan Nilai ]
```

Button dibuat besar.

---

# 12. Feedback

Saat berhasil.

```
✓

Nilai berhasil disimpan
```

Lalu otomatis

Kembali.

---

# 13. Loading

Tidak boleh menggunakan loading lama.

Gunakan

Skeleton Loading

Contoh

```
████████

████████

████████
```

---

# 14. Empty State

Jika belum ada santri.

```
Belum ada santri
```

-

Button

```
Import Excel
```

---

# 15. Error State

Jika internet mati.

```
⚠

Tidak dapat terhubung

[ Coba Lagi ]
```

---

# 16. Search

Search realtime.

Misal mengetik

```
mus
```

langsung

```
Mustofa
```

Tidak perlu klik tombol cari.

---

# 17. Dashboard Admin

Desktop.

Widget

```
Jumlah Santri

Jumlah Penguji

Jumlah Kelas

Sudah Dinilai

Belum Dinilai

Progress

Grafik
```

---

# 18. Halaman Import

Drag and Drop

```
Drop Excel

atau

Klik di sini
```

---

# 19. Responsive

Mobile

360 px

Tablet

768 px

Desktop

1024+

---

# 20. Dark Mode

Support

Dark

Light

Auto

---

# 21. Micro Animation

Contoh

Saat

```
+

```

Ditekan.

Angka berubah dengan animasi kecil.

Saat

Simpan

Button berubah menjadi

Loading

Lalu

Check

Tidak berlebihan.

---

# 22. Design System

Komponen yang harus dibuat sejak awal.

## Button

- Primary
- Secondary
- Danger
- Success
- Outline

---

## Card

- Student Card
- Dashboard Card
- Statistic Card

---

## Input

- Text Input
- Search
- Select
- Number

---

## Badge

- Aktif
- Belum Dinilai
- Sudah Dinilai
- Terkunci

---

## Dialog

- Confirm
- Delete
- Success
- Error

---

## Toast

- Success
- Error
- Warning

---

# 23. Accessibility

Minimal mengikuti standar berikut.

- Ukuran tombol minimal 44×44 px.
- Kontras warna memadai.
- Fokus keyboard untuk admin desktop.
- Ikon selalu disertai teks pada aksi penting.
- Status tidak hanya dibedakan berdasarkan warna (gunakan ikon dan label).

---

# 24. Performance UX

Target pengalaman pengguna:

- Halaman berpindah kurang dari 500 ms (data lokal/cache).
- Hasil pencarian muncul kurang dari 100 ms.
- Simpan nilai terasa instan dengan optimistik (optimistic UI) bila memungkinkan.
- Tidak ada refresh halaman penuh.

---

# 25. Progressive Web App (PWA)

Versi web sebaiknya dibuat sebagai **PWA**, sehingga penguji dapat:

- Menambahkan aplikasi ke layar utama HP.
- Membuka aplikasi seperti aplikasi Android.
- Mendapatkan performa yang lebih baik melalui caching.
- Menjadi jembatan sebelum aplikasi Flutter dirilis.

---

# 26. Wireframe Navigasi

## Admin

```text
Dashboard
│
├── Periode Ujian
├── Tingkatan
├── Kelas
├── Santri
├── Penguji
├── Kriteria Penilaian
├── Penilaian
├── Laporan
├── Pengaturan
└── Profil
```

---

## Penguji

```text
Dashboard
│
├── Pilih Kelas
├── Daftar Santri
├── Form Penilaian
└── Profil
```

---

# 27. UX Improvement yang Saya Rekomendasikan

Setelah membaca seluruh PRD dari Fase 1 sampai Fase 4, saya melihat satu peluang besar untuk membuat aplikasi ini jauh lebih cepat.

Saat ini alurnya adalah:

```text
Dashboard
↓

Pilih Tingkatan

↓

Pilih Kelas

↓

Daftar Santri
```

Menurut saya, alur ini masih terlalu banyak langkah jika digunakan puluhan kali dalam sehari.

Saya menyarankan **Dashboard Penguji berubah menjadi halaman "Tugas Saya Hari Ini"**.

Contohnya:

```text
===========================

Ust. Ahmad

Hari ini Anda bertugas

──────────────────────

Al-Quran II

Kelas B4

34 Santri

18 Sudah Dinilai

[ Lanjut ]

──────────────────────

Al-Quran II

Kelas B5

31 Santri

5 Sudah Dinilai

[ Lanjut ]

===========================
```

Dengan pendekatan ini:

- Penguji **tidak perlu memilih tingkatan dan kelas setiap kali login**.
- Semua tugas sudah disiapkan oleh admin melalui penugasan.
- Cukup tekan **Lanjut**, lalu langsung masuk ke daftar santri.
- Alur menjadi lebih cepat, lebih sederhana, dan sangat cocok diterapkan baik pada web maupun aplikasi Flutter nantinya.

# PRD MIQ Smart Assessment System

# FASE 6 — Functional Requirements (Kebutuhan Fungsional)

**Versi:** 1.0
**Status:** Draft
**Nama Proyek:** MIQ Smart Assessment System (MIQ-SAS)

---

# 1. Tujuan

Fase ini menjelaskan seluruh fitur yang harus dimiliki oleh sistem.

Berbeda dengan fase sebelumnya yang membahas alur bisnis, fase ini menjelaskan **apa yang harus dapat dilakukan oleh sistem**.

Dokumen ini akan menjadi acuan utama saat proses development React, Supabase, dan Flutter.

---

# 2. Modul Sistem

Sistem terdiri dari beberapa modul.

```text
MIQ Smart Assessment System

├── Authentication
├── Dashboard
├── Periode Ujian
├── Tingkatan
├── Kelas
├── Santri
├── Penugasan Penguji
├── Penilaian
├── Hasil
├── Laporan
├── Pengaturan
└── Profil
```

---

# 3. Authentication Module

## Tujuan

Memastikan hanya pengguna yang memiliki akun dapat menggunakan aplikasi.

### Functional Requirements

### FR-001

User dapat login.

---

### FR-002

User dapat logout.

---

### FR-003

Session otomatis diperbarui.

---

### FR-004

User tidak dapat membuka halaman tanpa login.

---

### FR-005

Role menentukan menu yang tampil.

---

# 4. Dashboard Module

## Dashboard Admin

Harus menampilkan

- Jumlah santri
- Jumlah kelas
- Jumlah penguji
- Periode aktif
- Progress penilaian
- Grafik
- Aktivitas terbaru

---

## Dashboard Penguji

Menampilkan

- Tugas hari ini
- Progress penilaian
- Jumlah santri
- Jumlah sudah dinilai
- Jumlah belum dinilai

---

# 5. Periode Ujian

Admin dapat

- membuat periode
- mengubah periode
- mengaktifkan periode
- menutup periode

Business Rule

Hanya satu periode aktif.

---

# 6. Tingkatan

Admin dapat

Tambah

Edit

Nonaktifkan

Contoh

```text
Al Quran I

Al Quran II

Al Quran III
```

Jumlah tidak dibatasi.

---

# 7. Kelas

Admin dapat

Tambah

Edit

Nonaktifkan

Contoh

```text
A1

A2

A3
```

---

# 8. Santri

Karena aplikasi fokus pada ujian.

Data cukup sederhana.

Field

Nama

Kelas

Status

Admin dapat

Tambah

Edit

Import Excel

Nonaktifkan

---

# 9. Import Excel

Admin memilih file.

↓

Upload.

↓

Preview.

↓

Import.

↓

Selesai.

Sistem harus

- validasi data
- menolak duplikasi
- memberi laporan import

---

# 10. Penugasan Penguji

Menurut saya ini modul terpenting.

Admin memilih

Penguji

↓

Periode

↓

Kelas

↓

Simpan

Sehingga dashboard penguji otomatis berisi kelas tersebut.

---

# 11. Daftar Santri

Penguji membuka kelas.

Sistem menampilkan

Nama

Status

Nilai

Jika sudah dinilai.

Search harus realtime.

---

# 12. Penilaian

Ini adalah modul utama.

Saat membuka santri.

Muncul

Nama

Kelas

Tingkatan

Lalu

Kategori

TAJWID

FASOHAH

---

# 13. Penilaian Tajwid

Komponen

## Makhroj

Nilai Awal

30

Pengurangan

3

Input

Jumlah Kesalahan

---

## Sifat

20

Pengurangan

2

---

## Ahkam Huruf

10

Pengurangan

1

---

## Ahkam Mad Qoshr

10

Pengurangan

1

---

# 14. Penilaian Fasohah

## Waqof Ibtida'

20

↓

2

---

## Muro'atul Huruf

20

↓

2

---

## Tawallud

10

↓

1

---

## Miring

10

↓

1

---

## Kelancaran

10

↓

1

---

# 15. Perhitungan Nilai

Formula

```text
Nilai

=

Nilai Awal

-

(Kesalahan × Pengurangan)
```

Semua otomatis.

---

# 16. Predikat

Default

| Nilai  | Predikat      |
| ------ | ------------- |
| 90–100 | Mumtaz        |
| 80–89  | Jayyid Jiddan |
| 70–79  | Jayyid        |
| 60–69  | Maqbul        |
| <60    | I'adah        |

Admin dapat mengubah rentang nilai jika diperlukan.

---

# 17. Simpan Nilai

Saat tombol

Simpan

ditekan.

Sistem harus

- validasi
- hitung total
- hitung predikat
- simpan detail nilai
- simpan total
- update status santri
- update progress dashboard

Semua dalam satu transaksi.

---

# 18. Edit Nilai

Jika

Belum dikunci

↓

Penguji boleh mengubah.

Jika

Sudah dikunci

↓

Tidak boleh.

---

# 19. Verifikasi

Admin dapat

Melihat

↓

Memeriksa

↓

Memberi catatan

↓

Mengunci

---

# 20. Hasil

Admin melihat

Nama

Kelas

Nilai

Predikat

Tanggal

Penguji

---

# 21. Laporan

Laporan

Per Kelas

Per Tingkatan

Per Penguji

Per Periode

Ranking

Statistik

---

# 22. Export

Export

Excel

PDF

CSV

---

# 23. Profil

Semua user dapat

Mengubah

Nama

Password

Foto Profil (opsional)

---

# 24. Notification

Minimal

Toast Success

Toast Error

Toast Warning

---

# 25. Audit Log

Sistem mencatat

Login

Logout

Tambah

Edit

Import

Hapus (soft delete)

Input Nilai

Edit Nilai

Verifikasi

---

# 26. Pengaturan

Admin dapat mengubah

Bobot Nilai

Predikat

Logo MIQ

Nama MIQ

Tahun

---

# 27. Kebutuhan Khusus MIQ (Business-Specific Requirements)

Ini adalah kebutuhan yang menurut saya akan membedakan aplikasi ini dengan aplikasi penilaian biasa.

## FR-MIQ-001 — Resume Ujian

Jika penguji keluar dari aplikasi atau koneksi terputus, saat login kembali sistem langsung menawarkan melanjutkan sesi terakhir.

Contoh:

```text
Anda memiliki sesi yang belum selesai.

Kelas B4

18 dari 34 santri telah dinilai.

[ Lanjutkan ]
```

---

## FR-MIQ-002 — Penilaian Cepat

Pada halaman penilaian **tidak menggunakan input angka**.

Setiap komponen hanya memiliki tombol:

```
[-]   0   [+]
```

Sehingga penguji tidak perlu membuka keyboard.

---

## FR-MIQ-003 — Auto Next Student

Setelah nilai berhasil disimpan, aplikasi otomatis membuka santri berikutnya yang **belum dinilai**.

Alur menjadi:

```text
Mustofa

↓

Simpan

↓

Hasan

↓

Simpan

↓

Ahmad
```

Penguji tidak perlu kembali ke daftar santri setiap kali selesai menilai.

---

## FR-MIQ-004 — Progress Realtime

Dashboard admin menampilkan secara langsung:

```
A1

█████████░░

90%

27 / 30
```

Tanpa perlu refresh.

---

## FR-MIQ-005 — Riwayat Perubahan Nilai

Jika nilai diubah, sistem menyimpan:

- Nilai lama
- Nilai baru
- Pengguna yang mengubah
- Waktu perubahan
- Alasan perubahan (opsional)

---

## FR-MIQ-006 — Lock Per Kelas

Selain mengunci seluruh periode, admin dapat mengunci nilai **per kelas**.

Misalnya:

- A1 → Terkunci
- A2 → Masih dapat dinilai
- B1 → Terkunci

Ini sangat berguna ketika sebagian kelas sudah selesai diverifikasi.

---

## FR-MIQ-007 — Dashboard Penguji Berbasis Tugas

Dashboard penguji **tidak menampilkan seluruh kelas**.

Yang muncul hanya kelas yang memang ditugaskan.

Contoh:

```text
Hari Ini

✓ Al-Qur'an I - A3

18/30

[Lanjut]

──────────────

✓ Al-Qur'an II - B2

9/28

[Lanjut]
```

---

# 28. Prioritas Pengembangan (MVP)

Agar proyek dapat selesai lebih cepat, saya menyarankan pembagian prioritas sebagai berikut.

### 🔴 Prioritas Tinggi (Wajib)

- Login
- Dashboard
- Periode
- Tingkatan
- Kelas
- Santri
- Penugasan Penguji
- Penilaian
- Perhitungan Otomatis
- Simpan Nilai
- Laporan
- Export

---

### 🟡 Prioritas Menengah

- Audit Log
- Profil
- Pengaturan
- Statistik
- Ranking

---

### 🟢 Prioritas Lanjutan

- QR Code
- Offline Mode
- PWA
- Flutter
- Notifikasi
- AI Analytics

---

# 29. Keputusan Desain Penting

Setelah menyusun seluruh fase dari Vision hingga Functional Requirements, saya menyarankan satu perubahan besar pada konsep aplikasi:

## Pisahkan menjadi dua aplikasi web

### 1. Admin Portal

Alamat:

```
admin.miq.sch.id
```

Fitur:

- Dashboard
- Import
- Pengaturan
- Monitoring
- Laporan
- User Management

Dioptimalkan untuk desktop.

---

### 2. Examiner Portal

Alamat:

```
ujian.miq.sch.id
```

Fitur:

- Login
- Tugas Saya
- Daftar Santri
- Penilaian
- Profil

Dioptimalkan khusus untuk HP.

---

Keuntungan pendekatan ini:

- Antarmuka penguji menjadi jauh lebih sederhana.
- Kode React lebih bersih karena setiap portal memiliki fokus yang berbeda.
- Keamanan meningkat karena hak akses dan rute lebih mudah dipisahkan.
- Saat nanti dibuat aplikasi Flutter, portal **Examiner** hampir dapat dipindahkan 1:1 ke Android tanpa perubahan konsep.

Menurut saya, arsitektur dua portal ini akan membuat MIQ Smart Assessment System lebih mudah dipelihara, lebih nyaman digunakan, dan siap berkembang dalam jangka panjang.
