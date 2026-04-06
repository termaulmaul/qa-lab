#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ITERATIONS="${ITERATIONS:-3}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-10}"
STOP_ON_FAILURE="${STOP_ON_FAILURE:-true}"
RUN_API="${RUN_API:-true}"
RUN_UI="${RUN_UI:-true}"
RUN_PERF="${RUN_PERF:-true}"
PERF_PROFILE="${PERF_PROFILE:-smoke}"
PERF_DURATION="${PERF_DURATION:-20s}"
RESULT_ROOT="${RESULT_ROOT:-$ROOT_DIR/reports/regression}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$RESULT_ROOT/$TIMESTAMP"
SUMMARY_FILE="$RUN_DIR/summary.log"

mkdir -p "$RUN_DIR"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$SUMMARY_FILE"
}

run_suite() {
  local name="$1"
  local iteration="$2"
  shift 2
  local log_file="$RUN_DIR/iter-${iteration}-${name}.log"

  log "START suite=${name} iteration=${iteration}"
  if "$@" >"$log_file" 2>&1; then
    log "PASS suite=${name} iteration=${iteration} log=${log_file}"
  else
    log "FAIL suite=${name} iteration=${iteration} log=${log_file}"
    if [[ "$STOP_ON_FAILURE" == "true" ]]; then
      log "Regression stopped because STOP_ON_FAILURE=true"
      exit 1
    fi
  fi
}

log "Regression run started"
log "run_dir=${RUN_DIR}"
log "iterations=${ITERATIONS} interval_seconds=${INTERVAL_SECONDS} stop_on_failure=${STOP_ON_FAILURE}"
log "run_api=${RUN_API} run_ui=${RUN_UI} run_perf=${RUN_PERF} perf_profile=${PERF_PROFILE} perf_duration=${PERF_DURATION}"

for iteration in $(seq 1 "$ITERATIONS"); do
  log "ITERATION begin=${iteration}/${ITERATIONS}"

  if [[ "$RUN_API" == "true" ]]; then
    run_suite api "$iteration" ./scripts/run_api_functional.sh
  fi

  if [[ "$RUN_UI" == "true" ]]; then
    run_suite ui "$iteration" ./scripts/run_ui_smoke.sh
  fi

  if [[ "$RUN_PERF" == "true" ]]; then
    run_suite perf "$iteration" docker compose run --rm \
      -e TARGET_URL="${TARGET_URL:-http://app:8000}" \
      -e TEST_PROFILE="$PERF_PROFILE" \
      -e TEST_DURATION="$PERF_DURATION" \
      -e ITERATION_SLEEP="${ITERATION_SLEEP:-1}" \
      -e LOGIN_USERNAME="${LOGIN_USERNAME:-qa_user}" \
      -e LOGIN_PASSWORD="${LOGIN_PASSWORD:-qa_pass}" \
      -e SYMBOL="${SYMBOL:-BBCA}" \
      -e ORDER_QUANTITY="${ORDER_QUANTITY:-1}" \
      -e INFLUX_URL="${INFLUX_URL:-http://influxdb:8086/k6}" \
      -e K6_INFLUXDB_PUSH_INTERVAL="${K6_INFLUXDB_PUSH_INTERVAL:-5s}" \
      -e K6_INFLUXDB_CONCURRENT_WRITES="${K6_INFLUXDB_CONCURRENT_WRITES:-4}" \
      k6 run --out influxdb="${INFLUX_URL:-http://influxdb:8086/k6}" /scripts/script.js
  fi

  log "ITERATION end=${iteration}/${ITERATIONS}"

  if [[ "$iteration" -lt "$ITERATIONS" ]]; then
    sleep "$INTERVAL_SECONDS"
  fi
done

log "Regression run completed successfully"
log "Artifacts stored in ${RUN_DIR}"
