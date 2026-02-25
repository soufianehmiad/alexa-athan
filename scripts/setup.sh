#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Athan for Alexa — Setup ==="
echo ""

# Core Prayer Engine (TypeScript)
echo "[1/3] Installing core-prayer-engine/typescript dependencies..."
cd "$ROOT_DIR/core-prayer-engine/typescript"
npm install
echo "  Done."

# Backend
echo "[2/3] Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install
echo "  Done."

# Alexa Skill
echo "[3/3] Installing alexa-skill dependencies..."
cd "$ROOT_DIR/alexa-skill"
npm install
echo "  Done."

echo ""
echo "=== All npm dependencies installed ==="
echo ""
echo "--- iOS Setup (manual) ---"
echo "1. Open Xcode 15+ (requires macOS)"
echo "2. Open ios-app/Package.swift or the .xcodeproj"
echo "3. Xcode will resolve Swift Package dependencies automatically"
echo "4. Select a simulator or device target and build (Cmd+B)"
echo ""
echo "Setup complete."
