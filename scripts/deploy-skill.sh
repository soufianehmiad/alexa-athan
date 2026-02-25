#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploying Alexa Skill ==="
cd "$ROOT_DIR/alexa-skill"

# Ensure the ASK CLI is installed
if ! command -v ask &> /dev/null; then
  echo "Error: ASK CLI is not installed."
  echo "Install it with: npm install -g ask-cli"
  exit 1
fi

# Deploy the skill package
ask deploy

echo "=== Alexa Skill deployment complete ==="
