---
id: 001
slug: first-workflow-slice
status: review
spec: specs/active/001-first-workflow-slice.md
created: 2026-10-19
updated: 2026-10-19
---

# Plan 001: Bounded first workflow

## Approved preparation

Scope approved; local-only contract/recovery spike approved; provider execution disabled; AWS staging deferred. ADR001 records execution/trust contracts. The disposable experiment proves selected persistence/fencing mechanics, not product acceptance. Seven runtime tests and an independent read-only review are retained. Node type stripping does not establish strict compilation.

## Dependency order

1. Completed local experiment observation: idempotency, caller-supplied tenant separation, stale completion, cancellation, fixture review ordering and process-exit recovery (partial mechanics for AC1/2/4/5/8; no full AC PASS).
2. Propose actual identity/tenant onboarding, runtime schema, storage/engine and approved retry/deadline/concurrency/retention budgets. Strict TypeScript and concurrent-worker failure cases must be added before treating the experimental store as application code.
3. Implement authenticated fixture-backed API/UI only after dependent design decisions settle. Prove tenant isolation, real browser behavior and restart/duplicate handling (AC1/2/5/7/9/10).
4. Select approved provider/capacity/spend route separately; then implement bounded genuine agent execution and independent review (AC3/4/6/8). Missing approval/credentials fails closed.
5. Obtain exact-head independent review and complete tagged evidence before factory activation. Deployment requires separate staging/health/rollback decisions.

Do not replace the missing application verification contract with the experiment runner. Both the product acceptance collector and application-readiness gate remain incomplete.

## Current approved next stage

The operator selected local test identity and single-host persistence after the nine-test recovery spike, with application provider execution disabled. Implement and verify a bounded fixture-backed local demonstration: server-owned test sessions and tenant authorization, durable idempotent start/read, fixed synthetic planning/review tasks, restart-safe artifacts and an accessible local status view. Preserve all native-provider and production acceptance as deferred, not satisfied. No paid execution, cloud provisioning or production release is authorized. Prepare one consolidated adopter credential checklist, but do not enter keys or activate authority before the exact bootstrap package is reviewed.

## Bounded credential hardening continuation

Resolve retained bootstrap F5/F7 in adopter workflow definitions only: require App-only reporting jobs, avoid unused legacy credentials/ordinary token write authority, and select Contents/PR-read for shadow while preserving eligibility Checks-write. Reject forbidden merge before write-token mint. Keep all live flags, secrets, profile registrations and protection unchanged; whole-spec/native acceptance remains pending. scripts/verify-factory-least-privilege.sh provides offline authorization/route regressions, with separate YAML validation and later genuine native permission checks.
