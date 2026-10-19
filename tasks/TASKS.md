# Tasks

Append-only product authority. Add tasks only from approved specifications and plans.

## Active

## Archive

## Approved bounded local phase — 2026-10-19

- [ ] T-001 Implement and publish the bounded local fixture workflow demonstration with honest full-spec limitations.
  spec: specs/active/001-first-workflow-slice.md
  accept: bash scripts/verify-application.sh
- [x] T-002 Serialize local identity submissions to prevent response/cookie reordering.
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test app/local/ui.test.ts
- [x] T-003 Stop scheduling on a failed initial storage claim, preserve queued state and recover on restart.
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test --test-name-pattern="initial storage-claim failure" app/local/demo.test.ts
- [x] T-004 Reject delayed cancellation after a terminal success is committed.
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test --test-name-pattern="late cancel body" app/local/demo.test.ts
- [x] T-005 Characterize existing HTTP input and quota bounds; no invented failing transport behavior.
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test --test-name-pattern="HTTP input and retained-run limits" app/local/demo.test.ts
- [x] T-006 Convert actual engine coverage into a weighted fail-closed summary for both application sources.
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test scripts/coverage-reporter.test.mjs
- [ ] T-007 Publish verified cross-tab context rejection with the initial browser tooling failure explicitly retained; no original chronological TDD credit.
  spec: specs/active/001-first-workflow-slice.md
  accept: node --test app/local/browser.test.ts

Completed local regressions are not full Spec001, authenticated factory or product acceptance. The host-specific ledger command paths are retained verbatim as actual observations; portable CI uses scripts/verify-application.sh on pinned Node24.
