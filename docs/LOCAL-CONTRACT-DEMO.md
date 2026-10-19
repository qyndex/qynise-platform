# Local contract demonstration

Approved boundary: operator decisions1A–5A, 2026-10-19. This implements the local fixture journey after the recovery experiment; it does not change the master blueprint or declare full Spec001 acceptance.

The native Node HTTP server binds127.0.0.1 and refuses to start without explicit local-fixture mode. Alice and Bob are server-defined synthetic identities in separate tenants. Opaque one-hour HttpOnly/SameSite=Strict session cookies select the tenant; request fields cannot grant roles or choose a tenant. Host and mutation Origin checks limit browser-origin confusion. This is a test identity selector, not a production login or authorization issuer.

A versioned brief is persisted atomically with its tenant-scoped idempotency binding. Changed payloads conflict. SQL reads/cancellation use the authenticated test tenant. SQLite WAL/full synchronization persists transitions and results. Restart increments a run generation, resumes absent task results and retains original result attempts/digests. A real child-process kill after a planner commit proves that local recovery boundary. Multi-host orchestration is not implemented or certified.

Three deterministic planning fixtures overlap; a separate fixture task validates their committed aggregate and records a labelled review result. No model or external provider is invoked. There is no public review-verdict write or approval endpoint. Final artifact digests are committed once. Cancellation rejects later publication. Fixed synthetic limits are recorded in Spec001's approved local-phase amendment; none grant a paid budget.

The UI escapes text through textContent, clears all view/input state on identity changes and fences delayed requests by session generation. Actual Chromium covers brief-to-four-task evidence, Unicode, viewport adaptation and a cross-tenant404 after identity change. HTTP/VM tests cover malformed fields, origin/session denial, conflicts, byte-exact chunked Unicode, cancellation, late-response isolation and interrupted recovery. Syntax/strict type checks are local engineering checks, not a claim of configured ESLint or full native model acceptance.

Only synthetic data is supported. State contains briefs in plaintext in a disposable local database. Keep it out of Git; no private Slack feedback, credentials or customer content should enter this demonstration. Stop the server before deleting its synthetic database. No migration from this test database to production is defined.

Deferred: genuine provider acceptance and independent model review; provider token/spend enforcement; production identity/onboarding; distributed durability; staging/production health and rollback; full Spec001 acceptance; authenticated factory bootstrap/activation and operational delivery sample. The local CI job must label this boundary even when green.


## Reviewed limitations and verification discipline

Actual V8 coverage includes both `app/local/server.ts` and `public/app.js`; the unchanged90% line/85% branch floor is enforced. The summary reporter rejects missing/duplicate/foreign source files and invalid counters. Node/VM coverage is separate from the genuine Chromium journey; browser screenshots are observations, not fabricated coverage or native verifier receipts.

Review fixes include atomic terminal-aware cancellation and cross-tab identity-context checking. A client identity hint never selects a tenant: it can only reject a mismatch with the existing server-owned session. The UI clears its prior view on mismatch and requires a new session.

Nonblocking local limitations retained from Sonnet review: replaced test-session tokens expire rather than being individually revoked; session and retained-run quotas are global; the scheduler's two-run upper bound is not a throughput guarantee; a storage fault requires restart and some mid-save errors may become explicit terminal fixture failures. HTTP413 behavior was tested successfully, so the speculative transport-reset concern was not reproduced. The fixture remains single-process/single-host, synthetic-only and unsuitable for production identity or customer data.

Initial missing-module and browser-context setup failures are preserved as tooling observations, not qualifying TDD. Actual assertion red/green evidence exists for Unicode, session response isolation, review-gap recovery and the ledger-recorded session-lock, storage-claim, cancellation and coverage-summary regressions. Task acceptance commands use portable `node` on the pinned runtime; raw local ledgers retain the actual absolute Node binary used. The cross-tab fix's first browser setup was invalid; later historical replay, if retained, must not be relabelled as original chronological TDD. Full Spec001 proof remains incomplete.
