#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploying Backend to AWS ==="
cd "$ROOT_DIR/backend"
npx serverless deploy --stage prod
echo "=== Backend deployment complete ==="
