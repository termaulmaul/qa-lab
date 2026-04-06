#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET_URL="${TARGET_URL:-http://app:8000}"
LOGIN_USERNAME="${LOGIN_USERNAME:-qa_user}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-qa_pass}"
SYMBOL="${SYMBOL:-BBCA}"
ORDER_QUANTITY="${ORDER_QUANTITY:-2}"
ITERATION_SLEEP="${ITERATION_SLEEP:-1}"
INFLUX_URL="${INFLUX_URL:-http://influxdb:8086/k6}"
K6_INFLUXDB_PUSH_INTERVAL="${K6_INFLUXDB_PUSH_INTERVAL:-5s}"
K6_INFLUXDB_CONCURRENT_WRITES="${K6_INFLUXDB_CONCURRENT_WRITES:-4}"

run_profile() {
  local profile="$1"
  local duration="$2"
  shift 2

  echo ""
  echo "== Running profile: ${profile} =="
  docker compose run --rm \
    -e TARGET_URL="$TARGET_URL" \
    -e TEST_PROFILE="$profile" \
    -e TEST_DURATION="$duration" \
    -e ITERATION_SLEEP="$ITERATION_SLEEP" \
    -e LOGIN_USERNAME="$LOGIN_USERNAME" \
    -e LOGIN_PASSWORD="$LOGIN_PASSWORD" \
    -e SYMBOL="$SYMBOL" \
    -e ORDER_QUANTITY="$ORDER_QUANTITY" \
    -e INFLUX_URL="$INFLUX_URL" \
    -e K6_INFLUXDB_PUSH_INTERVAL="$K6_INFLUXDB_PUSH_INTERVAL" \
    -e K6_INFLUXDB_CONCURRENT_WRITES="$K6_INFLUXDB_CONCURRENT_WRITES" \
    "$@" \
    k6 run --out influxdb="$INFLUX_URL" /scripts/script.js
}

case "${1:-all}" in
  smoke)
    run_profile smoke "${TEST_DURATION:-30s}"
    ;;
  load)
    run_profile load "${TEST_DURATION:-2m}" \
      -e MARKET_RATE="${MARKET_RATE:-60}" \
      -e PORTFOLIO_RATE="${PORTFOLIO_RATE:-20}" \
      -e TRADE_RATE="${TRADE_RATE:-8}" \
      -e NEGATIVE_RATE="${NEGATIVE_RATE:-2}"
    ;;
  stress)
    run_profile stress "${TEST_DURATION:-3m30s}" \
      -e MARKET_START_RATE="${MARKET_START_RATE:-50}" \
      -e STRESS_STAGE1="${STRESS_STAGE1:-100}" \
      -e STRESS_STAGE2="${STRESS_STAGE2:-200}" \
      -e STRESS_STAGE3="${STRESS_STAGE3:-400}" \
      -e TRADE_START_RATE="${TRADE_START_RATE:-5}" \
      -e TRADE_STAGE1="${TRADE_STAGE1:-15}" \
      -e TRADE_STAGE2="${TRADE_STAGE2:-40}" \
      -e TRADE_STAGE3="${TRADE_STAGE3:-80}" \
      -e NEGATIVE_START_RATE="${NEGATIVE_START_RATE:-2}" \
      -e NEGATIVE_STAGE1="${NEGATIVE_STAGE1:-5}" \
      -e NEGATIVE_STAGE2="${NEGATIVE_STAGE2:-10}" \
      -e NEGATIVE_STAGE3="${NEGATIVE_STAGE3:-20}"
    ;;
  spike)
    run_profile spike "${TEST_DURATION:-2m}"
    ;;
  chaos)
    run_profile market_open_chaos "${TEST_DURATION:-1m50s}" \
      -e MARKET_START_RATE="${MARKET_START_RATE:-40}" \
      -e PORTFOLIO_START_RATE="${PORTFOLIO_START_RATE:-10}" \
      -e TRADE_START_RATE="${TRADE_START_RATE:-5}" \
      -e NEGATIVE_START_RATE="${NEGATIVE_START_RATE:-3}"
    ;;
  soak)
    run_profile soak "${TEST_DURATION:-30m}" \
      -e MARKET_RATE="${MARKET_RATE:-40}" \
      -e PORTFOLIO_RATE="${PORTFOLIO_RATE:-15}" \
      -e TRADE_RATE="${TRADE_RATE:-5}" \
      -e NEGATIVE_RATE="${NEGATIVE_RATE:-1}"
    ;;
  all)
    run_profile smoke "30s"
    run_profile load "2m" \
      -e MARKET_RATE="${MARKET_RATE:-60}" \
      -e PORTFOLIO_RATE="${PORTFOLIO_RATE:-20}" \
      -e TRADE_RATE="${TRADE_RATE:-8}" \
      -e NEGATIVE_RATE="${NEGATIVE_RATE:-2}"
    run_profile stress "3m30s" \
      -e MARKET_START_RATE="${MARKET_START_RATE:-50}" \
      -e STRESS_STAGE1="${STRESS_STAGE1:-100}" \
      -e STRESS_STAGE2="${STRESS_STAGE2:-200}" \
      -e STRESS_STAGE3="${STRESS_STAGE3:-400}" \
      -e TRADE_START_RATE="${TRADE_START_RATE:-5}" \
      -e TRADE_STAGE1="${TRADE_STAGE1:-15}" \
      -e TRADE_STAGE2="${TRADE_STAGE2:-40}" \
      -e TRADE_STAGE3="${TRADE_STAGE3:-80}" \
      -e NEGATIVE_START_RATE="${NEGATIVE_START_RATE:-2}" \
      -e NEGATIVE_STAGE1="${NEGATIVE_STAGE1:-5}" \
      -e NEGATIVE_STAGE2="${NEGATIVE_STAGE2:-10}" \
      -e NEGATIVE_STAGE3="${NEGATIVE_STAGE3:-20}"
    ;;
  *)
    echo "Usage: $0 {smoke|load|stress|spike|chaos|soak|all}" >&2
    exit 1
    ;;
esac
