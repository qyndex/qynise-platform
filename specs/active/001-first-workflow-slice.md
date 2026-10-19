---
id: 001
slug: first-workflow-slice
status: draft
owner: "@codex"
human_owner: "@qyndex"
created: 2026-10-19
updated: 2026-10-19
complexity: L
service_tier: T2
---

# Spec 001: First observable, recoverable workflow

## Problem statement

The master blueprint describes an AI Workflow OS but the repository has no runnable product. The first delivery must prove one useful workflow across identity, durable execution, parallel agents, review and observable evidence before expanding the platform.

This is a proposal for review, not an approved product implementation or deployment instruction. It derives from README sections 18, 22, 26 and 29. The current approved source brief names the product Qynise. The naming update on main is preserved.

## Proposed first use case

An authenticated operator submits a non-sensitive software feature brief. Three independent native agents concurrently produce (1) requirements and assumptions, (2) risks and dependencies, and (3) a testable acceptance checklist. An independent reviewer evaluates the aggregate against a versioned workflow contract. The result is a draft planning package with evidence, limitations and explicit human decisions, useful for planning subsequent implementation. It cannot approve its own scope, modify a Git repository or deploy anything.

This first use case is proposed, not already selected by the blueprint. Confirm it with the operator before implementation. Input must exclude secrets and regulated/customer data for this initial slice.

## Goals

- One versioned workflow with explicit input, output, state-transition and event contracts.
- Authenticated tenant-scoped start and read APIs and a minimal accessible run-status UI.
- Durable task state, bounded parallel agent execution, independent review and at most one revision cycle.
- Structured artifacts, provenance, progress, usage/cost observations, retries and audit history.
- Replay/restart/duplicate-event behavior proven without duplicate committed effects.

## Non-goals

- General workflow canvas, marketplace, billing, enterprise SSO or broad connector catalog.
- Autonomous software implementation, Git writes or production deployment.
- Multiple production deployment models, telephony, customer-hosted egress or external A2A integration.
- Production certification or processing sensitive customer data.

## Acceptance criteria

1. **AC-1**: An unauthenticated start/read is rejected. A tenant-A caller cannot list, read, resume or fetch artifacts for a tenant-B run; contract and integration tests prove the denials without leaking run contents.
2. **AC-2**: A valid brief creates one durable run bound to workflow ID/version and schema versions. Invalid/oversized input is rejected before provider execution. Repeated start with the same tenant-scoped idempotency key and payload returns the same run; a changed payload conflicts.
3. **AC-3**: Three independently identified agent tasks overlap in execution, each receives only its allowlisted context and produces runtime-schema-validated output. A deterministic fixture proves orchestration semantics; a separately labelled genuine provider run proves actual model execution.
4. **AC-4**: An independent reviewer consumes the validated aggregate, original brief and workflow acceptance contract. A blocking finding permits at most one bounded revision, then produces success or an explicit review-failed state. Implementation agents cannot write their own review verdict.
5. **AC-5**: Durable transitions cover queued, running, awaiting-approval when policy requires, succeeded, failed and cancelled. Worker restart, duplicate completion events and out-of-order messages preserve legal transitions and a single committed artifact set.
6. **AC-6**: Per-run and per-task deadlines, retry counts, concurrency and token/spend budgets are enforced. Exhaustion stops new provider calls with an explicit failure reason; missing provider credentials never silently select another paid route.
7. **AC-7**: The operator can inspect task progress, failures, reviewer findings, artifacts, usage/cost observations (with unknown cost labelled unknown) and correlated audit events in one minimal keyboard-accessible run view.
8. **AC-8**: Every final planning artifact records the originating run/task, workflow/schema version, provider/model identity and result digest. Logs, errors and artifacts contain no credential values or another tenant's content.
9. **AC-9**: Policy-required approval is attributed to an authorized human and is auditable. No agent output or client-supplied role grants approval; absent approval blocks the protected transition.
10. **AC-10**: A clean-checkout CI run executes strict TypeScript checks, lint, unit/contract/integration tests and an actual browser journey. The evidence distinguishes fixture tests, real provider execution and any environment-dependent checks that remain pending.

## Decisions to resolve before implementation

Record short ADRs with options, recommendation, rationale, risks and revisit triggers:

- Confirm the proposed feature-brief planning use case and initial operator/tenant model.
- Select durable execution and storage contracts, with an interruption/duplicate spike before commitment. Preserve the blueprint's AWS/TypeScript/CDK preference; do not provision every candidate AWS service.
- Select identity, UI framework, model provider/runtime and approved credential/capacity route. Keep test fixtures distinct from genuine provider acceptance.
- Agree explicit input limit, retry/deadline/concurrency/token/spend budgets and retention/deletion policy. No unlimited defaults.
- Choose an isolated development/staging target and real health/rollback contract if deployment is requested. Production remains disabled.

A spec approval must identify which of these decisions are settled; unresolved decisions continue to block dependent work. This draft does not create subscriptions, spend limits, credentials or infrastructure.

## Verification and delivery sequence

1. Review this spec and decisions, then obtain explicit operator scope approval.
2. Write the initial contracts, ADRs, threat model, acceptance matrix and dependency-ordered tasks.
3. Build the smallest authenticated durable fixture-backed slice and prove restart/duplicate/tenant-isolation negatives.
4. Add the bounded native provider adapter and independent review; retain genuine execution evidence.
5. Exercise the real browser journey and independent exact-head review, then produce a reviewable PR with complete evidence.
6. Request repository-specific bounded factory activation only after its own signed/shadow gates pass. Product acceptance remains separate from engineering merge.

## Rollout and rollback

Default disabled outside the isolated development environment. Initially allow only the explicitly configured operator and non-sensitive briefs. Revocation stops new runs; existing run state remains auditable. Roll back code through a reviewed revert and preserve versioned records; never reset durable state to make acceptance pass.
