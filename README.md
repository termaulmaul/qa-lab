Repo ini untuk latihan interview QA Engineer, fokus di performance testing dan CI/CD.
- Performance testing dengan `k6`
- CI/CD basic dengan `Jenkins`
- Setup environment reproducible dengan `Docker Compose`
```text
qa-lab/
├── docker-compose.yml
├── k6/
│   └── script.js
├── AGENTS.md
└── README.md
```
- Docker Desktop (atau Docker Engine + Compose)
- Git
Cek cepat:
```bash
docker --version
docker compose version
git --version
```
Start services:
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
Script default ada di `k6/script.js` dan mengetes `https://test.k6.io`.
Run manual:
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
4. Jenkins CI/CD: konsep pipeline, stage, automation
5. Mini project: k6 + Jenkins + Docker dengan dokumentasi jelas
Tema:
- **Performance Testing API dengan k6 + Jenkins + Docker**
Checklist:
- Script k6 untuk endpoint utama
- Jenkins pipeline untuk run test otomatis
- Catatan hasil test dan analisis bottleneck
- Opsional: Grafana/Prometheus
- Apa beda load test vs stress test?
- Metrik apa untuk menilai overload?
- Kenapa CI/CD penting untuk quality?
- Bagaimana test login API saat traffic tinggi?
Lihat logs:
```bash
docker compose logs
```
Reset environment:
```bash
docker compose down -v
```
- Tambah dummy API (Express/FastAPI) sebagai target test
- Tambah Grafana + Prometheus untuk visualisasi
- Pisahkan test profile: smoke, load, stress
