# Independent local source review

Actual tool-disabled Sonnet5.5 subscription CLI; no native verifier/reviewer receipt credit. All findings retained, including nonblocking limitations.

## Initial actual Sonnet5.5 review

```json
{
  "verdict": "No P0/P1 blocking findings within the approved local-fixture scope. One P2 breaks a terminal-state invariant the docs imply (cancel vs. completed run). The rest are P3/P4 hardening.",
  "findings": [
    {
      "priority": "P2",
      "file": "app/local/server.ts",
      "line": "90-91 (cancel branch; line numbers approximate, file is dense)",
      "problem": "Cancel has a TOCTOU race. `row` is read via getRun() before `await body(req)`, and the `row.status` terminal check uses that stale snapshot. The UPDATE has no status guard (`WHERE id=? AND tenant=?`). If the run reaches succeeded or failed while the cancel body is in flight (a slow or chunked body makes this deterministic), the UPDATE overwrites it with 'cancelled'. That leaves a cancelled run with a non-null final_digest and a committed review task, contradicting 'cancellation rejects later publication' and the terminal-409 contract. The endpoint also returns 200 {status:'cancelled'} even if zero rows changed. No test covers this.",
      "fix": "Parse the body first, then do the check-and-update atomically: `UPDATE demo_runs SET status='cancelled' WHERE id=? AND tenant=? AND status IN ('queued','running')`. Check `changes`; if 0, re-read the run and return 409 (or 404 for a foreign tenant). Add a test that delays the cancel body until the run has succeeded."
    },
    {
      "priority": "P3",
      "file": "app/local/server.ts",
      "line": "73-75",
      "problem": "Re-login never revokes the session it replaces. The UI creates a new server session on every 'Start test session' click and overwrites the cookie, while the old token stays live until expiry. After 64 logins within an hour, or from any local process that can supply the matching Origin header, POST /api/test-session returns 429 for up to an hour, locking the user out until restart. The fixture can lock itself out during normal identity switching.",
      "fix": "On login, parse the incoming cookie and delete that session token before creating the new one. Optionally add a per-IP/per-burst cap, and evict the oldest session instead of returning 429."
    },
    {
      "priority": "P3",
      "file": "public/app.js",
      "line": "login submit handler / refresh (whole-file design)",
      "problem": "The epoch fence is per-page, but the session cookie is shared across tabs. If tab 2 logs in as Bob, tab 1 still labels itself 'Local test session: Alice'. Its polling, history and 'Create fixture plan' now silently act as Bob (tenant B), so tab 1 shows or writes tenant-B data under an Alice label. There is no cross-tab identity binding, and the UI never reads the server's actual identity (no whoami endpoint).",
      "fix": "Have the server return the session identity on every /api response (or add GET /api/test-session) and have the client compare it with the identity it logged in as. On mismatch, reset UI state and require re-login. Alternatively broadcast identity changes via BroadcastChannel or a storage event. Add a two-page Chromium test."
    },
    {
      "priority": "P3",
      "file": "app/local/server.ts",
      "line": "86",
      "problem": "The 100-run cap is a global COUNT(*) over all tenants and never frees. Tenant A can exhaust it and lock tenant B out with 429, which is a cross-tenant resource-isolation gap and a minor activity side-channel. Runs are never deleted, so the cap is permanent until the DB is replaced.",
      "fix": "Add a per-tenant cap (e.g. 50) alongside the global cap, or reserve per-tenant quota. Document that the cap is permanent for the fixture, or add a terminal-run retention rule."
    },
    {
      "priority": "P3",
      "file": "app/local/server.ts",
      "line": "44-46",
      "problem": "Scheduler head-of-line blocking. The query takes `LIMIT 2-jobs.size` rows ordered by rowid, then skips ids already in `inflight`. With one job running (jobs.size=1), LIMIT is 1 and returns the in-flight run itself, which is skipped. A second queued run therefore waits until the first finishes, so effective concurrency can drop from 2 to 1. This is a liveness and throughput bug, not a correctness bug.",
      "fix": "Exclude in-flight ids in SQL, or fetch all queued/running ids (the table is capped at 100) and start jobs until jobs.size reaches 2."
    },
    {
      "priority": "P3",
      "file": "app/local/server.ts",
      "line": "39",
      "problem": "Any exception in the try block, including a transient SQLITE_BUSY or SQLITE_FULL from a save or the final tx, is classified as the permanent run failure 'fixture-contract-failed'. A transient storage error therefore produces a terminal, non-retried run and masks the cause. Separately, `unavailable` is sticky until process restart, so one transient worker error disables the whole API.",
      "fix": "Classify errors: only HttpError or contract errors (schema invalid, aggregate invalid, deadline) mark the run failed; storage errors should leave the run resumable and set unavailable. Optionally let unavailable clear after a successful probe."
    },
    {
      "priority": "P3",
      "file": "app/local/server.ts",
      "line": "55",
      "problem": "The 413 path is untested and likely broken at the transport level. Throwing from inside `for await (const chunk of req)` makes the async iterator destroy the IncomingMessage, which destroys the socket. The 413 response may never reach the client, which would see ECONNRESET. The existing oversize test is only 4097 bytes, so it hits the 400 path. There is also no request or header timeout configuration, so a slow-body client holds a connection for Node's defaults, and `close()` can wait on it.",
      "fix": "Check Content-Length up front and return 413 before reading. On overflow, stop buffering, drain with req.resume() or set `Connection: close`, then send the 413. Set explicit server.requestTimeout, headersTimeout and maxConnections. Add a test with a roughly 9 KB body."
    },
    {
      "priority": "P4",
      "file": "public/index.html / app/local/server.ts",
      "line": "textarea maxlength (index.html); 83 (server.ts)",
      "problem": "The textarea `maxlength=4096` counts UTF-16 code units, but the server enforces 4096 UTF-8 bytes. Multibyte input such as emoji or CJK passes the client limit and fails with the generic 'invalid brief or key' error. The hint text says bytes. Minor: an idempotent replay returns 201 instead of 200, and a static response has no explicit charset.",
      "fix": "Check byte length in the client before submit and show a specific message. Have the server return distinct error messages for key vs. size vs. empty. Optionally add `; charset=utf-8` to static Content-Type headers."
    }
  ],
  "limitations": [
    "Source-only review; nothing was executed. I did not verify the stated test, tsc or Chromium results, and line numbers in the dense one-line-style server.ts are approximate.",
    "Not provided, so not reviewed: .claude/scripts/validate.sh, experiments/recovery-spike, package-lock.json, and the Spec001 amendment. Pinned action SHAs, the Node 24.13.1 and Playwright 1.64.1 versions, and the node:sqlite API behavior are unverified.",
    "The 413 socket-destroy behavior in the finding above is inferred from Node's stream and IncomingMessage semantics and should be confirmed by a test.",
    "Single-process operation is assumed but not enforced. A second process on the same SQLite file would steal claims from a live worker, because the claim accepts status='running'. This is in line with the documented single-host scope.",
    "Several tests rely on wall-clock timing: fixed 500 ms and 60 ms sleeps, 2 ms polling, and a kill-window between 20 and 400 ms. These may flake on slow CI. The SIGKILL test could observe 3 committed planners if the kill is delayed.",
    "Tests exercise some, but not all, of the error and concurrency edges noted above: cancel racing completion, oversize-body transport, multi-tab identity, and the 64-session cap.",
    "Per scope, the deferred items were not treated as defects: production identity, provider and model review, distributed durability, deployment, and full Spec001 acceptance. Passing results here do not earn native acceptance."
  ]
}
```

## Final actual Sonnet5.5 review

```json
{
  "verdict": "No blocking findings within the approved local-fixture scope. Two low-priority defects found; the rest are retained limitations.",
  "findings": [
    {
      "priority": "P3",
      "file": "app/local/server.ts",
      "line": 44,
      "problem": "schedule() applies LIMIT (2 - jobs.size) before the inflight filter. The oldest queued/running row is often already inflight, so it consumes the single remaining slot and is then skipped. A newly created second run therefore does not start until the first finishes, and effective concurrency is 1 despite the intended bound of 2. Correctness, tenant isolation and recovery are unaffected; the effect is throughput and test timing only.",
      "fix": "Exclude inflight ids in SQL, or select without a LIMIT and break once jobs.size reaches 2 (for example `for (const row of all) { if (jobs.size >= 2) break; if (inflight.has(id)) continue; ... }`). Add a test that two simultaneous runs overlap."
    },
    {
      "priority": "P4",
      "file": "public/app.js",
      "line": 52,
      "problem": "refresh() clears the poll timer on any single error, including a transient one. Polling for a running run stops permanently until the user clicks history or creates a run. The user sees the error text but gets no retry, and a later success never resumes polling.",
      "fix": "On non-session-change errors, re-arm the timer with a bounded retry count or backoff while the run is still active. Keep stopping on 'test session changed' and 503."
    },
    {
      "priority": "P4",
      "file": "public/app.js",
      "line": 69,
      "problem": "The cancel handler shows an error on a 409 'run is terminal' response (the run finished just before the click) but does not refresh. The run view and the cancel button stay stale until the next poll, and the poll has already stopped if the run finished.",
      "fix": "In the cancel catch block, call refresh() when the epoch and selected run are unchanged, then display the error."
    }
  ],
  "verified_by_source_reading": [
    "Tenant scoping: every run read, list and cancel query binds the server-session tenant. Cross-tenant access returns 404.",
    "The client identity header can only cause a 409 mismatch; it never selects a tenant.",
    "Cancellation is a single conditional UPDATE on status. The `active()` check and the following INSERT or UPDATE run synchronously in one process, so late publication after cancel or close is prevented.",
    "Restart recovery re-claims 'running' rows with a generation bump. INSERT OR IGNORE plus the existing-task check preserves original attempt and digest provenance.",
    "Body size is capped at 8192 bytes, chunks are concatenated before UTF-8 decoding, and the brief is capped at 4096 bytes. Host and Origin checks on POST, SameSite=Strict, and a CSP with textContent-only rendering cover the browser surface."
  ],
  "limitations": [
    "Retained, not defects: the 100-run and 64-session quotas are global, never released, and shared across tenants, so one tenant can exhaust them for another.",
    "Retained: the unavailable flag is permanent until restart. After one storage fault, all /api/ routes including test-session return 503.",
    "Retained: sessions are not individually revocable, and there is no request or header timeout beyond Node defaults.",
    "Host must be exactly 127.0.0.1:port, so http://localhost:port gets 403. This is a usability note, not a defect.",
    "The Chromium test only exercises the cross-tab path after the other tab's login; it does not cover same-identity multi-session.",
    "Line numbers are approximate because the sources are dense, one-statement-per-line, and could not be mechanically counted.",
    "I did not run any tests or tools. This is source reading only, as requested.",
    "Full Spec001 remains incomplete. Production identity, genuine model review, provider calls and deployment are deferred and were not assessed. No native acceptance is implied."
  ]
}
```

## Adjudication

Initial P2 cancellation race reproduced by delayed HTTP body and fixed atomically (T004). Cross-tab identity-label mismatch reproduced by hash-bound historical source replay and fixed with server-session consistency checking; the initial browser setup failures are tooling observations, not original TDD. Final source review reports no blocker; P3 throughput and P4 polling/cancel-refresh notes remain visible. Global quotas, restart-required storage health and no production authentication remain explicit local-fixture limitations.
