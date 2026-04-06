#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
MOUNT_ROOT_DIR="${HOST_REPO_PATH:-$ROOT_DIR}"

BASE_URL="${BASE_URL:-http://app:8000}"
USERNAME="${LOGIN_USERNAME:-qa_user}"
PASSWORD="${LOGIN_PASSWORD:-qa_pass}"
SYMBOL="${SYMBOL:-BBCA}"
REPORT_DIR="${REPORT_DIR:-$ROOT_DIR/reports/newman}"

mkdir -p "$REPORT_DIR"

docker run --rm \
  --network qa-lab-net \
  -v "$MOUNT_ROOT_DIR/postman:/etc/newman:ro" \
  -v "$REPORT_DIR:/newman/reports" \
  postman/newman:alpine run /etc/newman/trading-api.postman_collection.json \
  --env-var "baseUrl=$BASE_URL" \
  --env-var "username=$USERNAME" \
  --env-var "password=$PASSWORD" \
  --env-var "symbol=$SYMBOL" \
  --reporters cli,junit,json \
  --reporter-junit-export /newman/reports/functional-api.xml \
  --reporter-json-export /newman/reports/functional-api.json
