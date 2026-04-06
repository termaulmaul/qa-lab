# Lab Architecture

## Komponen

- App lokal: target API dan UI yang diuji
- Newman: regression API
- Playwright: UI smoke dan negative automation
- k6: smoke, load, stress, spike, soak, chaos profile
- Jenkins: pipeline automation
- InfluxDB: storage metric k6
- Prometheus: metric scraping
- cAdvisor: CPU dan memory container
- Grafana: dashboard KPI dan trend

## Data Flow

1. Test runner menembak app lokal.
2. k6 mengirim metrik ke InfluxDB.
3. Prometheus scrape cAdvisor.
4. Grafana membaca InfluxDB dan Prometheus.
5. Jenkins menyatukan functional, UI, performance, dan artifact archive.

## KPI Utama

- RPS Overall
- TPS Overall
- Avg. Resp Time (API) <= 200 ms
- Overall Error Rate < 0.1%
- CPU Utilization < 50%
- Memory Utilization < 60%

## Catatan

- KPI memory bisa gagal walau lab sehat. Itu berarti threshold bekerja.
- Target 1 juta user tidak realistis dijalankan sebagai 1 juta VU di laptop lokal.
