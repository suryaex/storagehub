#!/usr/bin/env bash
# Quick health probe for a running StorageHub instance.
set -euo pipefail
BASE_URL="${1:-http://localhost:8000}"
echo "Checking ${BASE_URL}/api/v1/health ..."
curl -fsS "${BASE_URL}/api/v1/health" && echo
echo "Checking ${BASE_URL}/api/v1/ready ..."
curl -fsS "${BASE_URL}/api/v1/ready" && echo
echo "OK"
