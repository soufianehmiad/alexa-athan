#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILURES=0

echo "=== Athan for Alexa — Test Suite ==="
echo ""

# Core Prayer Engine (TypeScript)
echo "[1/3] Testing core-prayer-engine/typescript..."
cd "$ROOT_DIR/core-prayer-engine/typescript"
if npm test; then
  echo "  PASS"
else
  echo "  FAIL"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# Backend
echo "[2/3] Testing backend..."
cd "$ROOT_DIR/backend"
if npm test; then
  echo "  PASS"
else
  echo "  FAIL"
  FAILURES=$((FAILURES + 1))
fi
echo ""

# Alexa Skill
echo "[3/3] Testing alexa-skill..."
cd "$ROOT_DIR/alexa-skill"
if npm test; then
  echo "  PASS"
else
  echo "  FAIL"
  FAILURES=$((FAILURES + 1))
fi
echo ""

if [ "$FAILURES" -gt 0 ]; then
  echo "=== $FAILURES test suite(s) failed ==="
  exit 1
else
  echo "=== All test suites passed ==="
fi
