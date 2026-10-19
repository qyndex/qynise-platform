# Local recovery contract spike

Approved local-only experiment for Spec001. Run with Node24.13.1:

```sh
node --test experiments/recovery-spike/recovery.test.ts
```

Only pinned TypeScript and Node type development dependencies are added in this experiment directory. No credentials, paid provider, provider network call, infrastructure or app verification script is added. Tests create only disposable SQLite files under the OS temporary directory and remove them afterward. Node24 labels its built-in SQLite API experimental. The implementation uses synchronous local transactions and a generation fence; it is not a deployed engine selection.

## Observed mechanics

Nine runtime tests pass, including a shared IPC barrier for two competing child processes. The original seven observations cover: tenant-key idempotency/conflict and foreign lookup denial; stale completion and duplicate-result conflict; cancellation versus late completion; aggregate/reviewer ordering and stable final digest; invalid-role/foreign mutation denial; a real child exit before versus after transaction commit; and child exit after a simulated response with a fenced retry. Red and green logs are retained in verify/2026-10-19/T-Q001-spike.

The persisted outbox survives exit after commit. Exit before commit leaves neither run nor outbox rows. Exit after a simulated response can require re-execution, but only the current generation can commit its result. These observations do not imply exactly-once provider execution.

## Limits

Tenant strings are trusted test inputs, not authenticated sessions. Any local caller with database access is trusted. Task roles and the literal fixture review verdict model ordering, not cryptographic or process-isolated reviewer authority. There is no genuine agent execution, simultaneous dispatch, worker lease expiry, bounded retry scheduler, revision cycle, approval UI, real artifact store, runtime output schema, retention policy or deployed identity. The four-kilobyte experiment input/result limit is not an approved product budget.

Strict TypeScript compilation now passes with the pinned compiler. Two barrier-released real processes prove competing idempotent starts and generation claims on this local SQLite store. These tests do not prove deployed multi-host behavior or power-loss/filesystem guarantees. The exposed Store.db handle and crash injection are experimental test seams, not a public application API.

Spec001 remains incomplete. The missing application-readiness contract must continue to fail; do not point it at this spike to make installation look like an implemented product.

Primary API references: https://nodejs.org/docs/latest-v24.x/api/sqlite.html and https://nodejs.org/docs/latest-v24.x/api/typescript.html.

## Reproducible experiment tooling

With Node24.13.1 selected:

```sh
npm ci --ignore-scripts --prefix experiments/recovery-spike
npm run typecheck --prefix experiments/recovery-spike
npm test --prefix experiments/recovery-spike
```

The separate read-only recovery-spike CI job runs these checks. It cannot satisfy the deliberately missing application-readiness contract. The host default Node22.14 invocation was retained separately as a runtime setup error, not a successful test or the concurrency test's RED. Actual red/green proof uses Node24.13.1.
