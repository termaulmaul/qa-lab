# SKRIP PENJELASAN QA LAB

Dokumen ini saya buat supaya lebih gampang menjelaskan project ini saat presentasi, interview, demo, atau diskusi biasa.

## Versi Singkat

Project ini adalah lab QA automation sederhana yang saya jalankan di Docker untuk mensimulasikan alur testing yang cukup dekat ke real case.

Di dalamnya saya gabungkan beberapa bagian:

- API lokal untuk dijadikan target test
- automation API dengan Newman
- UI automation dengan Playwright
- performance testing dengan k6
- pipeline automation dengan Jenkins
- observability dengan InfluxDB, Prometheus, cAdvisor, dan Grafana

Jadi idenya bukan cuma ngetes 1 endpoint, tapi mencoba membangun alur QA yang lebih utuh: test dijalankan, hasil disimpan, lalu bisa dibaca lagi dari dashboard atau artifact.

## Tujuan Project

Tujuan saya membuat lab ini adalah untuk belajar bagaimana automation testing itu tidak berdiri sendiri.

Biasanya kalau di real case, QA automation bukan hanya bikin script test, tapi juga perlu memikirkan:

- target aplikasi yang dites
- cara test dijalankan berulang
- bagaimana hasil test dibaca
- bagaimana pipeline menentukan pass atau fail
- bagaimana tim melihat trend performa dari waktu ke waktu

Karena itu saya buat lab ini dalam bentuk container supaya lebih mudah dijalankan ulang dan lebih konsisten.

## Gambaran Arsitektur

Secara sederhana alurnya seperti ini:

1. aplikasi lokal bertindak sebagai target API dan UI
2. Newman dipakai untuk functional API regression
3. Playwright dipakai untuk UI automation
4. k6 dipakai untuk smoke, load, dan stress test
5. Jenkins dipakai untuk menjalankan pipeline automation
6. hasil performance dikirim ke InfluxDB
7. metric resource dibaca dari Prometheus dan cAdvisor
8. semua hasil divisualkan di Grafana

## Kenapa Tool-nya Dipilih

Saya pilih tool ini karena masing-masing punya peran yang cukup jelas.

`k6`

- cocok untuk performance testing
- konfigurasi test-nya cukup ringan
- mudah dijalankan di Docker

`Jenkins`

- dipakai untuk simulasi CI/CD
- berguna untuk menjalankan test secara berurutan dan otomatis
- bisa menyimpan artifact hasil test

`Playwright`

- dipakai untuk automation di level UI
- cocok untuk simulasi interaksi user dari browser

`Newman`

- dipakai untuk regression API
- cukup praktis untuk memastikan endpoint penting tetap stabil

`InfluxDB + Grafana`

- dipakai untuk membaca hasil performance test dalam bentuk time-series
- lebih enak dipahami daripada hanya melihat output terminal

`Prometheus + cAdvisor`

- dipakai untuk menambah konteks penggunaan CPU dan memory container
- jadi saat performa berubah, saya bisa lihat apakah ada korelasi dengan resource

## Apa yang Dites

Untuk simulasi real case, saya buat aplikasi lokal bertema trading app.

Flow utamanya mencakup:

- login
- lihat market ticker
- lihat market depth
- lihat watchlist
- lihat portfolio
- create order
- cek order detail

Selain happy path, saya juga tambahkan negative case seperti:

- login gagal
- akses tanpa token
- invalid symbol
- invalid quantity
- invalid side
- insufficient buying power
- duplicate order
- market closed

Jadi test-nya tidak hanya mengecek apakah sistem hidup, tapi juga apakah rule bisnis dasarnya berjalan.

## Bagian Performance Testing

Untuk performance, saya tidak membuat skenario yang terlalu dibuat-buat.

Saya pakai beberapa profile yang umum:

- smoke
- load
- stress
- spike
- soak
- market open chaos

Dari sini saya belajar bahwa performance test itu bukan sekadar menambah jumlah user, tapi juga memahami pola traffic dan perilaku sistem saat beban naik.

## Bagian Regression Automation

Saya juga menambahkan regression automation loop.

Fungsinya supaya suite yang sudah stabil bisa dijalankan berulang dalam beberapa iterasi.

Tujuannya:

- melihat apakah test tetap stabil saat dijalankan terus
- membantu burn-in sederhana
- mempermudah validasi setelah perubahan

Hasil per iterasi disimpan ke log, jadi bisa dicek lagi kalau ada suite yang gagal di tengah jalan.

## Bagian Jenkins Pipeline

Pipeline Jenkins di lab ini kurang lebih menjalankan urutan berikut:

1. smoke check environment
2. functional API automation
3. UI automation
4. performance smoke
5. load
6. stress
7. regression loop opsional
8. archive artifact

Yang saya anggap penting di sini bukan hanya test-nya jalan, tapi hasilnya juga bisa ditelusuri.

Jadi setelah build selesai, saya bisa lihat:

- console output
- report API
- screenshot dan trace UI
- log k6
- log regression loop

## Bagian Dashboard dan Hasil

Di Grafana saya pakai beberapa KPI dasar supaya hasil test lebih mudah dibaca:

- RPS Overall
- TPS Overall
- Avg. Response Time
- Error Rate
- CPU Utilization
- Memory Utilization

Saya sengaja pakai KPI seperti ini karena lebih mudah dijelaskan dan cukup masuk akal untuk kebutuhan lab.

## Nilai Belajar dari Project Ini

Menurut saya nilai utama project ini bukan pada kompleksitas aplikasinya, tapi pada hubungan antar komponennya.

Project ini membantu menunjukkan bahwa QA automation itu mencakup:

- validasi fungsi
- validasi UI
- validasi performa
- automation pipeline
- observability hasil test

Jadi pendekatannya lebih end-to-end, walaupun tetap dalam skala lab lokal.

## Hal yang Bisa Diakui Secara Jujur

Kalau saya menjelaskan project ini, saya akan tetap jujur bahwa ini adalah lab, bukan production system.

Jadi batasannya ada:

- target app masih dummy app
- semua berjalan di Docker lokal
- skalanya bukan distributed load test
- belum menggantikan observability production yang sesungguhnya

Tapi justru dari situ saya bisa menunjukkan bahwa saya paham fondasinya dan tahu bagaimana alurnya bekerja sebelum dibawa ke sistem yang lebih besar.

## Kalimat Penutup yang Aman

Kalau mau dijelaskan singkat, saya bisa bilang seperti ini:

“Project ini saya buat sebagai lab QA automation end-to-end. Saya pakai API lokal sebagai target test, lalu saya gabungkan Newman untuk regression API, Playwright untuk UI automation, k6 untuk performance testing, Jenkins untuk pipeline, dan Grafana untuk membaca hasil metric. Fokus saya bukan membuat sistem yang kelihatan rumit, tapi memahami alur kerja testing yang benar-benar kepakai saat automation dijalankan berulang dan hasilnya perlu dianalisis.” 
