#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --test --test-timeout=30000 --experimental-test-coverage \
  --test-coverage-lines=90 --test-coverage-branches=85 \
  --test-coverage-include=app/local/server.ts --test-coverage-include=public/app.js \
  --test-reporter=spec --test-reporter-destination=stdout \
  --test-reporter=./scripts/coverage-reporter.mjs --test-reporter-destination=stdout \
  app/local/demo.test.ts app/local/ui.test.ts
