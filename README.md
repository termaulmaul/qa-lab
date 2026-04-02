Repo ini dibuat untuk latihan interview QA Engineer, khususnya area:
- Performance testing dengan `k6`
- CI/CD basic dengan `Jenkins`
- Setup environment reproducible dengan `Docker Compose`
- Paham mindset QA dan alur testing dasar
- Bisa menjalankan load test sederhana pakai k6
- Bisa integrasikan test ke Jenkins pipeline
- Punya mini project yang bisa dipakai sebagai bahan portfolio/interview
- Docker Compose
- Jenkins (LTS)
- k6 (Grafana k6 image)
```text
qa-lab/
├── docker-compose.yml
├── k6/
│   └── script.js
├── AGENTS.md
└── README.md
```
Pastikan sudah install:
- Docker Desktop (atau Docker Engine + Compose)
- Git
Cek cepat:
```bash
docker --version
docker compose version
git --version
```
Jalankan service:
```bash
docker compose up -d
```
Cek container:
```bash
docker ps
```
Akses Jenkins:
- `http://localhost:8080`
Ambil initial admin password Jenkins:
```bash
docker exec jenkins-lab cat /var/jenkins_home/secrets/initialAdminPassword
```
Saat setup awal Jenkins, pilih:
- **Install suggested plugins**
Script default ada di `k6/script.js` dan saat ini mengetes `https://test.k6.io`.
Jalankan manual:
```bash
docker run --rm -v $(pwd)/k6:/scripts grafana/k6 run /scripts/script.js
```
Contoh pipeline sederhana:
```groovy
pipeline {
  agent any
  stages {
    stage('Run k6 Load Test') {
      steps {
        sh 'docker run --rm -v $(pwd)/k6:/scripts grafana/k6 run /scripts/script.js'
      }
    }
  }
}
```
1. Fundamental QA: jenis testing, SDLC, mindset tester
2. Web/API dasar: HTTP, REST, status code, Postman
3. Performance testing: load vs stress, latency, throughput, RPS
4. Jenkins CI/CD: konsep pipeline, stage, integration test
5. Mini project: k6 + Jenkins + Docker dengan README yang jelas
Tema:
- **Performance Testing API dengan k6 + Jenkins + Docker**
Checklist:
- Script k6 untuk skenario endpoint utama
- Pipeline Jenkins untuk run test otomatis
- Dokumentasi hasil dan analisis bottleneck
- (Opsional) tambah Grafana/Prometheus untuk observability
- Apa bedanya load test dan stress test?
- Metric apa yang kamu lihat untuk menentukan sistem overload?
- Kenapa pipeline CI/CD penting untuk quality?
- Kalau login API traffic tinggi, bagaimana desain skenario test?
Container tidak jalan:
```bash
docker compose logs
```
Reset environment:
```bash
docker compose down -v
```
Kalau mau lab lebih realistis, tambahkan:
- Dummy API (mis. Express/FastAPI) sebagai target test
- Grafana + Prometheus untuk visualisasi metric
- Multiple test profile (smoke, load, stress)
