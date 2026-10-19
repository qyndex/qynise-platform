#!/usr/bin/env bash
# Bounded local contract verification; genuine provider/production acceptance is deferred.
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'if(Number(process.versions.node.split(".")[0]) < 24) throw Error("Node24+ required")'
node node_modules/typescript/bin/tsc --project app/local/tsconfig.json
node --check public/app.js
node --test --test-timeout=30000 app/local/demo.test.ts app/local/ui.test.ts scripts/coverage-reporter.test.mjs
bash scripts/test-coverage.sh
node --test --test-timeout=30000 app/local/browser.test.ts
printf '%s\n' 'PASS: approved local fixture application contract; provider execution and production acceptance DEFERRED.'
