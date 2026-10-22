## Evidence Bundle — Spec 002 (002-bounded-local-fixture-qualification)
Spec: `specs/active/002-bounded-local-fixture-qualification.md` · Commit: `7e466e8`

Retained results: [verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-a9iKQ81D/results.json](verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-a9iKQ81D/results.json)

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
# Smoke test — 2026-10-22T12:14:56+11:00
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
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/b1a5d36650ea45c3a6bf65c8a2f67d99e5ebf9bc9d6187edd6fdf8acc0b9d4fa
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/c4b40d0b052c6a999a4d8f8f5adb6b34ade1952ccbe251f87df681058b8c00b5
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/b2bd9f8a2cec7c5d5ee1cbbbeaf62ae952428b37ade90529669387c6dde67144
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/f562c8760bba7d3efc4e4c318cf2b0c150826882fdb333b8902535cf9272e022
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/5ccd9c4d4f3d7ed80d19948f855ca93deb24ae751829c147d3c85eb097c8291d
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/897d18caee624dbf7f086b3930a53279baea7f311e884ed3a4954318a93a19ab
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/observations-index.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/authentication-result.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/verifier-root.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/native/provenance.sigstore.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-LFnGf7CQ/smoke.out
- verify/2026-10-22-002-bounded-local-fixture-qualification/pr-body.md
- verify/2026-10-22-002-bounded-local-fixture-qualification/EVIDENCE.md
- verify/2026-10-22-002-bounded-local-fixture-qualification/results.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/smoke.log
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-a9iKQ81D/results.json
- verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-a9iKQ81D/smoke.out

## Scope and proof binding

See AC-MAPPING.md for complete native controls, QUALIFICATION-CONTEXT.md and APPLICATION-CONTEXT.md for full exact source, and native/authentication-result.json for the prior signature validation. Observed executable source is7e466e8; later proof-only commits require proof-source-equivalence.py to demonstrate equality of every tracked non-verify path,mode and Git blob. Its scope digest is invariant under adding proof files, avoiding an impossible self-referencing commit ID. No old/current-head/native-review acceptance is conflated.

## Retained lightweight artifact index

- `verify/2026-10-22-002-bounded-local-fixture-qualification/AC-MAPPING.md`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/APPLICATION-CONTEXT.md`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/EVIDENCE.md`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/HISTORICAL-PROOF.md`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/QUALIFICATION-CONTEXT.md`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-a9iKQ81D/results.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/attempt-a9iKQ81D/smoke.out`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/coverage-summary.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/evidence.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/5ccd9c4d4f3d7ed80d19948f855ca93deb24ae751829c147d3c85eb097c8291d`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/897d18caee624dbf7f086b3930a53279baea7f311e884ed3a4954318a93a19ab`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/b1a5d36650ea45c3a6bf65c8a2f67d99e5ebf9bc9d6187edd6fdf8acc0b9d4fa`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/b2bd9f8a2cec7c5d5ee1cbbbeaf62ae952428b37ade90529669387c6dde67144`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/c4b40d0b052c6a999a4d8f8f5adb6b34ade1952ccbe251f87df681058b8c00b5`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/artifacts/f562c8760bba7d3efc4e4c318cf2b0c150826882fdb333b8902535cf9272e022`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/authentication-result.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/observations-index.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/provenance.sigstore.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/native/verifier-root.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/pr-body.md`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/proof-source-equivalence.py`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/results.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/smoke.log`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/source-equivalence-tests.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/source-equivalence.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/unskipped-collector.json`
- `verify/2026-10-22-002-bounded-local-fixture-qualification/unskipped-collector.log`
