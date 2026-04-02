#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
MOUNT_ROOT_DIR="${HOST_REPO_PATH:-$ROOT_DIR}"
UI_BASE_URL="${UI_BASE_URL:-http://app:8000}"
PLAYWRIGHT_OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR:-$ROOT_DIR/output/playwright}"
LOGIN_USERNAME="${LOGIN_USERNAME:-qa_user}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-qa_pass}"
SYMBOL="${SYMBOL:-BBCA}"
ORDER_QUANTITY="${ORDER_QUANTITY:-1}"
mkdir -p "$PLAYWRIGHT_OUTPUT_DIR"
docker run --rm \
  --network qa-lab-net \
  -v "$MOUNT_ROOT_DIR/ui:/work/ui:ro" \
  -v "$PLAYWRIGHT_OUTPUT_DIR:/work/output" \
  -e UI_BASE_URL="$UI_BASE_URL" \
  -e PLAYWRIGHT_OUTPUT_DIR="/work/output" \
  -e LOGIN_USERNAME="$LOGIN_USERNAME" \
  -e LOGIN_PASSWORD="$LOGIN_PASSWORD" \
  -e SYMBOL="$SYMBOL" \
  -e ORDER_QUANTITY="$ORDER_QUANTITY" \
  mcr.microsoft.com/playwright:v1.54.0-noble \
  bash -lc '
    set -euo pipefail
    mkdir -p /tmp/pw
    cd /tmp/pw
    npm init -y >/dev/null 2>&1
    npm install playwright@1.54.0 >/dev/null 2>&1
    cp /work/ui/playwright-smoke.mjs /tmp/pw/playwright-smoke.mjs
    node /tmp/pw/playwright-smoke.mjs
  '
