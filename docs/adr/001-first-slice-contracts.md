# ADR 001 — First-slice execution and trust contracts

Status: local spike approved 2026-10-19. Managed infrastructure, production identity and provider execution remain pending.

## Context and recommendation

Implement the approved feature-brief workflow as a versioned TypeScript contract with interchangeable persistence, identity and model adapters. Preserve the blueprint's AWS/CDK preference. Select actual managed services only after the deployment/budget decision and a restart/duplicate-delivery spike; an in-memory Promise.all demonstration cannot establish durable execution.

## Proposed contracts

A run is identified by tenant ID plus server-generated run ID. A tenant-scoped idempotency key is bound to the canonical input digest and workflow/schema version. Reusing the key with a different digest conflicts. Authorization checks precede lookup and artifact access; opaque identifiers alone do not grant access.

Persist a transition and its outgoing work atomically through a transaction/outbox or an equivalent proven durable-engine primitive. Each task has a stable ID, attempt ID, lease/fencing generation and terminal result digest. Duplicate events are harmless; a stale worker cannot commit over a newer generation. Provider calls may still execute twice after an ambiguous timeout: retain attempt evidence, bound retries and never claim exactly-once external execution.

The three planning tasks may run concurrently. The reviewer has a distinct task identity and writes only a reviewer verdict, never a planning result. All outputs must validate against versioned runtime schemas. A blocking verdict permits one revision cycle; further failure becomes terminal. Provider text cannot change policy, budgets, roles or human approvals.

Artifact records include origin, workflow/schema version, provider/model identity, content digest and attempt provenance. Publish one committed final set after aggregate validation. A human approval, where required, binds the tenant, run, proposed action digest, decision and authenticated actor; changed action bytes invalidate it.

## Acceptance spike before commitment

Prove cross-tenant denials, idempotent start, conflicting key rejection, duplicate completion, stale-worker fencing, cancellation versus completion, crash after state commit/before dispatch, crash after provider response/before commit, and replay with no duplicate committed final set. Test fixtures prove mechanics only. Genuine model execution and a browser journey remain separate evidence requirements.

## Unresolved decisions

1. Decision: local contract/recovery spike first. AWS staging/account/region and provisioning budget are deferred.
2. Durable engine and storage transaction semantics after the spike, with measured recovery behavior.
3. Authenticated operator identity and initial tenant onboarding; no production password scheme or client-supplied roles.
4. Decision: provider execution stays disabled. Native provider, capacity route, spend authorization and real reviewer independence remain unresolved.
5. Input, token, spend, deadline, retry, concurrency and retention limits. Missing limits or credentials fail closed.

## Consequences and revisit triggers

This prevents choosing infrastructure merely to make CI green. It adds up-front failure-case work, but makes recovery claims testable. Revisit if workflows require long-lived human waits, multi-region writes, external side effects or sensitive customer data. No service is provisioned, no paid provider called, and no product acceptance is claimed by this ADR.

## Local observation

The disposable experiments/recovery-spike implementation passed seven runtime tests on Node24.13.1. It uses a local SQLite transaction/outbox and fault-injected child processes. See the experiment README and verify/2026-10-19/T-Q001-spike for exact scope, red/green logs and limitations. This does not select SQLite for deployed storage or satisfy all Spec001 acceptance criteria.

## Bounded local phase approved after the recovery spike

Operator reply `1A, 2A, 3A, 4A, 5A` on 2026-10-19 selects local test identities, a single-host local application contract, disabled provider execution, operator-entered credentials after bootstrap review, and a bounded readiness completion boundary. Production identity, managed storage, real-provider acceptance and deployment are deferred. These choices permit the fixture-backed local contract demonstration, not production authentication or native model acceptance.

The latest strict-compile/recovery observation has nine passing tests; the earlier seven-test observation above is historical. Tenant parameters in that experiment are not authenticated identities. The local application must reject client-supplied tenant/role authority and bind test sessions to server-side identities. Local fixtures must be visibly identified and the provider adapter must fail closed.

Engineering limits for synthetic local tests can be explicit, versioned, conservative fixture settings; they grant no paid token budget, retention authorization for customer data, or deployment capacity. Keep all original Spec001 acceptance criteria and genuine-provider gaps visible. A successful bounded demonstration cannot turn deferred criteria into PASS.
