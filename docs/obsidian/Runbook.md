# Runbook

## Start Lab

```bash
cd /Users/maul/github/qa-lab
docker compose up -d --build
docker compose ps
```

## Health Check

```bash
curl http://localhost:8000/health
curl http://localhost:3000/api/health
curl http://localhost:9090/-/healthy
curl http://localhost:8081/healthz
curl -I http://localhost:8086/ping
```

## Functional API

```bash
./scripts/run_api_functional.sh
```

## UI Smoke

```bash
./scripts/run_ui_smoke.sh
```

## k6 Smoke

```bash
docker compose run --rm \
  -e TARGET_URL=http://app:8000 \
  -e TEST_PROFILE=smoke \
  -e TEST_DURATION=20s \
  -e ITERATION_SLEEP=1 \
  -e LOGIN_USERNAME=qa_user \
  -e LOGIN_PASSWORD=qa_pass \
  -e SYMBOL=BBCA \
  -e ORDER_QUANTITY=1 \
  -e K6_INFLUXDB_PUSH_INTERVAL=5s \
  -e K6_INFLUXDB_CONCURRENT_WRITES=4 \
  k6 run --out influxdb=http://influxdb:8086/k6 /scripts/script.js
```

## Regression Automation Loop

Jalankan suite yang sama berulang:

```bash
chmod +x scripts/run_regression_automation.sh
./scripts/run_regression_automation.sh
```

Atur jumlah iterasi dan jeda:

```bash
ITERATIONS=5 INTERVAL_SECONDS=30 ./scripts/run_regression_automation.sh
```

Mode yang sering dipakai:

```bash
RUN_UI=false ./scripts/run_regression_automation.sh
STOP_ON_FAILURE=false ./scripts/run_regression_automation.sh
PERF_PROFILE=smoke PERF_DURATION=30s ./scripts/run_regression_automation.sh
```

Artifact regression:

- `reports/regression/<timestamp>/summary.log`
- `reports/regression/<timestamp>/iter-*-api.log`
- `reports/regression/<timestamp>/iter-*-ui.log`
- `reports/regression/<timestamp>/iter-*-perf.log`

## Jenkins Trigger

Gunakan job:

- <http://localhost:8080/job/qa-k6-lab/>

## Artifact Penting

- `reports/newman/functional-api.xml`
- `reports/newman/functional-api.json`
- `output/playwright/smoke/ui-home.png`
- `output/playwright/smoke/ui-order-success.png`
- `output/playwright/smoke/trace.zip`

## Navigasi

- [[QA Lab Home]]
- [[Lab Architecture]]
- [[Test Strategy]]
