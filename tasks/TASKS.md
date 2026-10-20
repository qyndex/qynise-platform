# Tasks

Append-only product authority. Add tasks only from approved specifications and plans.

## Active

## Archive

## Approved bounded local phase — 2026-10-19

- [x] T-001 Implement and publish the bounded local fixture workflow demonstration with honest full-spec limitations. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: bash scripts/verify-application.sh
- [x] T-002 Serialize local identity submissions to prevent response/cookie reordering. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test app/local/ui.test.ts
- [x] T-003 Stop scheduling on a failed initial storage claim, preserve queued state and recover on restart. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test --test-name-pattern="initial storage-claim failure" app/local/demo.test.ts
- [x] T-004 Reject delayed cancellation after a terminal success is committed. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test --test-name-pattern="late cancel body" app/local/demo.test.ts
- [x] T-005 Characterize existing HTTP input and quota bounds; no invented failing transport behavior. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test --test-name-pattern="HTTP input and retained-run limits" app/local/demo.test.ts
- [x] T-006 Convert actual engine coverage into a weighted fail-closed summary for both application sources. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test scripts/coverage-reporter.test.mjs
- [x] T-007 Publish verified cross-tab context rejection with the initial browser tooling failure explicitly retained; no original chronological TDD credit. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test app/local/browser.test.ts

Completed local regressions are not full Spec001, authenticated factory or product acceptance. The host-specific ledger command paths are retained verbatim as actual observations; portable CI uses scripts/verify-application.sh on pinned Node24.

## Factory credential boundary hardening — 2026-10-19

- [x] T-008 Narrow adopter reporting and shadow credential capabilities without activating factory authority. | spec:001 | phase:implementation | priority:normal | created:2026-10-19 | est:1h
  spec: specs/active/001-first-workflow-slice.md
  accept: bash scripts/verify-factory-least-privilege.sh

## Approved bounded local qualification

- [ ] T-009 Implement complete bounded local qualification mapping and real source/tool/browser verification without changing original001 or live authority. | spec:002 | phase:implementation | priority:normal | created:2026-10-20 | est:2h
  spec: specs/active/002-bounded-local-fixture-qualification.md
  accept: node --test scripts/local-qualification.test.mjs
