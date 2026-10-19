---
name: 0001-local-recovery-spike-before-managed-runtime
description: Approved local-only recovery spike; provider and staging remain disabled
status: accepted
created: 2026-10-19
metadata:
  type: decision
  status: accepted
---

# ADR-0001: Local recovery spike before managed runtime

- **Date**: 2026-10-19
- **Deciders**: @qyndex (explicit operator reply)
- **Owners**: [@qyndex]
- **written_by**: architect
- **source_session**: Codex operator conversation, 2026-10-19
- **last_verified**: 2026-10-19
- **Context**: specs/active/001-first-workflow-slice.md and plans/active/001-first-workflow-slice.md
- **Tags**: architecture recovery local-only
- **subsystem**: workflow

## Context

The approved feature-brief scope requires durable execution and tenant isolation, but AWS staging/account/region, production identity and model capacity have not been selected. A harness install cannot certify an absent product.

## Decision

The operator selected a local contract/recovery spike first and explicitly kept provider execution disabled. AWS staging and model capacity are deferred. Use a disposable local fixture only, retaining its limitations and failed acceptance results. This does not select SQLite for deployed storage or approve dependent product features.

The contract design is docs/adr/001-first-slice-contracts.md. Its technical proposals remain subject to the unresolved product decisions; this accepted record covers only the local-only preparation boundary.

## Alternatives considered

- Design/provision AWS staging first: deferred because no account/region/budget is approved.
- Run genuine model calls now: rejected for this stage; provider and spending authorization are unresolved.
- Present an in-memory demo as recovery evidence: rejected because restart behavior would be unproven.

## Consequences

Seven Node24 runtime tests now prove selected SQLite transaction/fencing and process-exit mechanics. See experiments/recovery-spike/README.md and verify/2026-10-19/T-Q001-spike. There is no deployed identity, real reviewer authority, actual provider execution, strict compilation or complete product acceptance. All activation flags remain false and the PR remains draft.

## Re-verification triggers

Revisit before selecting deployed persistence, issuing real identities, enabling model execution, provisioning staging or handling sensitive data. New design decisions cannot silently widen this approval.

## References

- Spec: specs/active/001-first-workflow-slice.md
- Plan: plans/active/001-first-workflow-slice.md
- Design: docs/adr/001-first-slice-contracts.md
