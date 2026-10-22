# Complete acceptance observation map

Observed source`6aadc3127321807cba03154551d594e182c9fb3c`; actual registered PR base`dbb95cd53b980620631e2e57b4871944225420d5`. Exact unmodified result bytes, SHA256`f2af74b04c5a0548bb71e8410d7ed2dd95902097af8ad8a297ccea12a311101b`. The generated collector phrase “tagged test” is an index, not the proof contract. Every criterion requires ALL cases in each listed suite, clean setup and successful commands. No skipped/todo/nested/duplicate/missing case can pass the existing runner.

|Criterion|Complete required observations|
|---|---|
|AC-1|app (22 complete cases), browser (2 complete cases)|
|AC-2|app (22 complete cases)|
|AC-3|app (22 complete cases)|
|AC-4|app (22 complete cases), recovery (9 complete cases)|
|AC-5|app (22 complete cases), browser (2 complete cases)|
|AC-6|app (22 complete cases), browser (2 complete cases), recovery (9 complete cases), reporter (2 complete cases), contract (18 complete cases), coverage (22 complete cases), strict (all recorded commands), syntax (all recorded commands)|

## Complete case inventory

### app

- `app/local/demo.test.ts`: explicit local mode, server-owned identities, origin and session boundaries
- `app/local/demo.test.ts`: durable idempotent start validates input and denies cross-tenant access
- `app/local/demo.test.ts`: restart resumes durable fixture work, records overlap, review and digest without a provider
- `app/local/demo.test.ts`: cancellation persists and prevents queued fixture completion
- `app/local/demo.test.ts`: recovery after review commit preserves original task provenance and final set
- `app/local/demo.test.ts`: chunked Unicode brief is preserved byte-for-byte
- `app/local/demo.test.ts`: running cancellation prevents final fixture publication
- `app/local/demo.test.ts`: actual process death after a planner commit resumes without replacing that evidence
- `app/local/demo.test.ts`: initial storage-claim failure stops scheduling without process death or false success
- `app/local/demo.test.ts`: late cancel body cannot overwrite a committed successful run
- `app/local/demo.test.ts`: HTTP input and retained-run limits reject invalid or oversized requests explicitly
- `app/local/demo.test.ts`: static responses and session boundaries retain their explicit contract
- `app/local/demo.test.ts`: a forged Host cannot read even a valid local test session
- `app/local/demo.test.ts`: client identity hints cannot change the server-owned session tenant
- `app/local/demo.test.ts`: foreign Origin cannot read or mutate a valid server-owned session
- `app/local/ui.test.ts`: late Alice response cannot render after a successful Bob identity switch
- `app/local/ui.test.ts`: overlapping identity submissions cannot reorder the browser session cookie
- `app/local/ui.test.ts`: UI polls fixture evidence and preserves provenance and explicit errors
- `app/local/ui.test.ts`: UI cancellation refreshes terminal state and reports failed mutations
- `app/local/ui.test.ts`: UI login and polling failures remain visible without continuing a stale poll
- `app/local/ui.test.ts`: UI rejects a changed shared cookie instead of writing under a stale identity label
- `app/local/browser-errors.test.ts`: browser exception control covers existing and future context pages

### browser

- `app/local/browser.test.ts`: actual Chromium brief-to-evidence journey and tenant switch at desktop/mobile sizes
- `app/local/browser.test.ts`: actual Chromium second-page exception is detected by the browser control

### recovery

- `experiments/recovery-spike/recovery.test.ts`: tenant-scoped idempotency conflicts and denies foreign reads
- `experiments/recovery-spike/recovery.test.ts`: generation fence rejects stale completion and duplicate output conflicts
- `experiments/recovery-spike/recovery.test.ts`: cancelled run refuses claims and late completion
- `experiments/recovery-spike/recovery.test.ts`: final artifact waits for three tasks and independent review; replay is stable
- `experiments/recovery-spike/recovery.test.ts`: review cannot run before aggregate; foreign or unknown task cannot mutate state
- `experiments/recovery-spike/recovery.test.ts`: process death rolls back partial start; committed outbox survives death
- `experiments/recovery-spike/recovery.test.ts`: process death after fixture response requires fenced retry without duplicate committed result
- `experiments/recovery-spike/recovery.test.ts`: simultaneous processes serialize idempotent starts and fence competing claims
- `experiments/recovery-spike/recovery.test.ts`: worker failure closes the competing fixture processes before returning

### reporter

- `scripts/coverage-reporter.test.mjs`: coverage summary weights real counts from both application source files
- `scripts/coverage-reporter.test.mjs`: missing, duplicate, foreign or malformed coverage never becomes a passing summary

### contract

- `scripts/local-qualification.test.mjs`: complete native events require exact cases and a successful command
- `scripts/local-qualification.test.mjs`: missing or duplicate cases cannot qualify a criterion
- `scripts/local-qualification.test.mjs`: skipped todo failed or cancelled native cases never receive pass credit
- `scripts/local-qualification.test.mjs`: printed success and foreign or malformed events cannot spoof native outcomes
- `scripts/local-qualification.test.mjs`: missing duplicate or contradictory native summaries are rejected
- `scripts/local-qualification.test.mjs`: actual coverage requires both measured source files and unchanged floors
- `scripts/local-qualification.test.mjs`: missing duplicate malformed and below-floor coverage cannot become PASS
- `scripts/local-qualification.test.mjs`: whole-criterion results require every mapped suite and setup control
- `scripts/local-qualification.test.mjs`: a pass event carrying a native failure cannot spoof a successful outcome
- `scripts/local-qualification.test.mjs`: empty or duplicate suite requirements cannot vacuously qualify a criterion
- `scripts/local-qualification.test.mjs`: process capture preserves binary archive bytes without UTF8 decoding
- `scripts/local-qualification.test.mjs`: snapshot tree and archive bind captured immutable commit instead of moving HEAD
- `scripts/local-qualification.test.mjs`: actual git archive must preserve every immutable blob including binary bytes
- `scripts/local-qualification.test.mjs`: actual export-ignore and export-subst archives cannot claim the committed source tree
- `scripts/local-qualification.test.mjs`: missing extra altered and unsupported symlink sources fail byte binding
- `scripts/local-qualification.test.mjs`: nonempty output is rejected and output setup failure cleans owned workspace
- `scripts/local-qualification.test.mjs`: immutable Git symlink and gitlink modes are unsupported rather than silently omitted
- `scripts/local-qualification.test.mjs`: fresh empty output works and symlinked temporary roots normalize native identities

## Scope

Smoke checks are not browser/recovery acceptance. The generic assertion-density scan does not cover app/ and its “no test files” output earns no AC credit. Actual qualification separately ran complete Chromium, HTTP, recovery, strict/syntax and coverage suites. Coverage was97.84%lines/86.36%branches, above unchanged90/85 aggregate floors. Missing/duplicate/malformed coverage and setup failures are exercised by the recorded contract/reporter suites below. The full generic collector still cannot autodetect the custom Node runner; its failed observation is retained, and documented supplied-result mode consumed the exact actual full result while still running smoke.

The proof observed this parent source; a later proof-only commit cannot self-reference its own commit ID. Publication must deterministically verify every executable/source blob equals the observed source and changes are under verify/. Local proof is not an authenticated native receipt. Earlier normalized/historical proof is explicitly prior, reachable in Git and labelled separately.
