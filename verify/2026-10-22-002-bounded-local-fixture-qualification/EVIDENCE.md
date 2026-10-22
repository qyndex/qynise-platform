## Evidence Bundle — Spec 002 (002-bounded-local-fixture-qualification)
Spec: `specs/active/002-bounded-local-fixture-qualification.md` · Commit: `6aadc31`

Retained results: [verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-8oBHj0WG/results.json](verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-8oBHj0WG/results.json)

### Acceptance criteria (6/6 proven)
| AC | Proven by | Result |
|----|-----------|--------|
| AC-1 | tagged test | ✓ PASS |
| AC-2 | tagged test | ✓ PASS |
| AC-3 | tagged test | ✓ PASS |
| AC-4 | tagged test | ✓ PASS |
| AC-5 | tagged test | ✓ PASS |
| AC-6 | tagged test | ✓ PASS |

### Smoke test (exit codes are load-bearing)
```
# Smoke test — 2026-10-22T11:06:34+11:00
$ bash .claude/scripts/verify.sh

→ Integration coverage gate
  ✓ changed API/DB files have integration tests

verify: PASS
exit: 0
---
```

### Visual proof
0 screenshot(s) captured under `verify/2026-10-22-002-bounded-local-fixture-qualification/screenshots/` (named by AC).

### API traces
0 API trace file(s) under `verify/2026-10-22-002-bounded-local-fixture-qualification/traces/`; full HAR at `verify/2026-10-22-002-bounded-local-fixture-qualification/network.har`.

### Coverage
line 97.83783783783784% · branch 86.36363636363636% (gate: line≥90 branch≥85)

### Verdict: **PASS**

## Artifact index
- verify/2026-10-22-002-bounded-local-fixture-qualification/evidence.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/coverage-summary.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/representation.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/pr-body.md
- verify/2026-10-22-002-bounded-local-fixture-qualification/EVIDENCE.md
- verify/2026-10-22-002-bounded-local-fixture-qualification/results.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/original-qualification-results.json.gz.b64
- verify/2026-10-22-002-bounded-local-fixture-qualification/observation-scope.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/smoke.log
- verify/2026-10-22-002-bounded-local-fixture-qualification/history-unskipped-collector.log
- verify/2026-10-22-002-bounded-local-fixture-qualification/history-unskipped-collector.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/registration-history/source-registration-EVIDENCE.md
- verify/2026-10-22-002-bounded-local-fixture-qualification/registration-history/source-registration-collector.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/registration-history/source-registration-smoke.log
- verify/2026-10-22-002-bounded-local-fixture-qualification/registration-history/source-registration-pr-body.md
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-Zw1kDikv/smoke.out
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-Xu40BlbB/smoke.out
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-SyMF942b/results.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-SyMF942b/smoke.out
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-8oBHj0WG/results.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-8oBHj0WG/smoke.out
- verify/2026-10-22-002-bounded-local-fixture-qualification/history-unskipped-smoke.log

## Actual scope and complete controls

See AC-MAPPING.md and current-observation-map.json. Current smoke uses registered base dbb95cd, not the prior f25 base. The result is exact original unmodified output for source6aadc31. Complete unchanged runner/control context is retained in TRUSTED-RUNNER-CONTEXT.md. These are local observations; all native signing/independent acceptance stays pending. Prior proof and failed autodetection are historical, not substituted current success.
