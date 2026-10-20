# Approved bounded local qualification

Spec002 is the separate human-approved six-criterion local fixture contract. Original Spec001 remains unchanged and incomplete0/10; deterministic fixtures do not become genuine agents or product acceptance. Scope authority is the recorded proposal SHA256 and direct humanA in docs/adoption/local-qualification/operator-approval.json.

Native per-criterion command: `node scripts/qualify-local.mjs --criterion AC-N`, N1–6. Aggregate local command: `node scripts/qualify-local.mjs --output-dir /private/tmp/qynise-qualification-proof`. A new output directory outside the owned temporary workspace retains actual JSON results/events/logs; without it the command prints bounded JSON including actual native test events and deletes temporary files. Failed native outcomes are retained before cleanup too. Never treat this local result as an authenticated independent producer/reviewer receipt.

The runner requires exactNode24.13.1, git/tar, the locked root and experiment tool versions, an explicitly seeded public npm cache (`QYNISE_QUALIFICATION_NPM_CACHE` or `npm_config_cache`, default /opt/npm-cache), and actual Playwright1.64.1 Chromium/dependencies (`PLAYWRIGHT_BROWSERS_PATH`, default /opt/playwright-browsers). Cache contents are copied to owned temporary storage; no host node_modules, coverage or environment credentials are inherited. All installation is real offline `npm ci --ignore-scripts --no-audit --no-fund`. Missing cache/tools/browser or install failure blocks verification. No network/provider call is introduced.

A fresh git archive of committed, clean tracked source is materialized into an owned temporary checkout. Process capture preserves binary bytes. Child environments are explicitly bounded; work/cache/home are removed on success or failure. Native worker memory/CPU/PID/tmpfs limits are not increased by this runner. A Linuxarm local observation is not Linuxamd64 GitHub Actions certification; the image preparation/testing is separate and no image is published by this code.

Complete-criterion mapping:

| Criterion | Required real groups |
| --- | --- |
| AC1 tenant/session/loopback | All22 HTTP/UI cases plus actual Chromium identity/foreign-run/mobile controls |
| AC2 durable bounded input | All22 HTTP/UI cases, including Unicode chunk boundaries and authority hints |
| AC3 fixture artifacts | All22 HTTP/UI cases with full envelope/digest/overlap/review/provider-denial assertions |
| AC4 process recovery | All22 application cases plus9 separately labelled recovery-mechanics cases |
| AC5 real browser journey | All22 HTTP/UI cases plus actual desktop and mobile brief→evidence, keyboard and tenant-switch Chromium journey |
| AC6 reproducibility | All groups,18 completeness/coverage/process-capture contract fixtures,2 coverage-normalizer fixtures, strict app/experiment TypeScript, syntax and measured server/controller coverage90/85 |

Fixed case identities live in scripts/local-qualification-cases.json. Native events must match every expected name and file exactly, with one global successful summary and successful process exit. Missing/duplicate/failed/cancelled/skipped/todo/foreign/malformed cases fail. Printed stdout cannot impersonate test events. The reporter distinguishes Node's per-file summaries from its global invocation summary. Native coverage must contain exactly the two actual application source files, one real coverage event, valid counts, unchanged90/85 floors and an identical freshly emitted summary; cached/missing/malformed data does not count.

`node --test scripts/local-qualification.test.mjs` runs small synthetic contract negatives, separately from real application qualification. Those synthetic fixtures prove failure handling only. The aggregate runner emits genuine per-criterion Jest-shaped results compatible with the existing evidence parser. The generic unskipped collector does not automatically execute a native Node qualification command: any separately consumed `--check-only` mapping must be labelled and kept distinct from the mandatory full collector invocation. Parent publication retains both specifications' full results honestly.

No live policy/profile/state/flag/secret/environment change, workflow dispatch, merge, image publication, provider spending, cloud or deployment is performed. A fixture review is not independent model review; the recovery spike is not application event-engine proof. Genuine native signed verifier/reviewer and later protected registration remain separate gates.

The archive is now byte-verified against the immutable Git tree (raw blob hashes, complete file inventory and executable modes); export substitutions/omissions, symlinks and gitlinks fail. Explicit output directories must be absent or empty. Temporary setup failures clean owned workspaces, and native case identities use the canonical real path. Earlier75f7 observations remain historical after these runner repairs.
