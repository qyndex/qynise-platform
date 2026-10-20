# Proposed Qynise bounded local factory qualification

Status: proposal for operator review only. Prepared2026-10-19 from approved local-phase decisions and retained source/test evidence. No repository files, provider, configuration or live state are changed by this proposal.

## Decision and boundaries

Recommended **A: approve a separate local qualification contract**, retaining original Spec001 and all ten original acceptance criteria unchanged and incomplete. This qualifies the harness against a real bounded local application; it does not certify Qynise's intended genuine-agent product, production identity, cloud operation or production release.

Alternative **B: retain the current bounded application observation without native factory qualification**. Original Spec001 stays incomplete and adopter factory authority stays disabled. Real-provider/product implementation can be considered later with its own identity, runtime, spending and deployment decisions.

Alternative **C: resume the original full product slice**. This requires separate concrete decisions and approval for provider/capacity/credential route, token/spend limits, real identity, revision/approval lifecycle and any infrastructure. Existing Claude subscription PR-review authorization is not application model-runtime authorization. Choosing C alone is not permission to spend or provision anything.

The local phase was already approved through `1A, 2A, 3A, 4A, 5A`; the additional decision concerns the bounded acceptance contract used for **native harness qualification**. No approval should be inferred merely because existing synthetic tests pass. Do not replace Spec001's genuine-provider ACs with fixtures, mark it shipped, or turn its retained `FAIL0/10` into a PASS.

## Proposed independently testable qualification criteria

Use a separately versioned, operator-approved specification, for example Spec002 with a final title selected during preparation. The IDs below are proposal labels, not existing approved acceptance tags.

| ID | Required observation | Negative/control that must also pass |
| --- | --- | --- |
| LQ-1 | Explicitly enabled local fixture application binds only loopback; server-owned Alice/Bob test sessions govern tenant-scoped list/read/start/cancel. | Missing/forged session, foreign tenant run, forged Host/origin and conflicting identity hint are rejected without run content. Cross-tab cookie changes reset stale UI context; request data cannot select tenant authority. |
| LQ-2 | A bounded synthetic brief creates a durable versioned run; repeated same-tenant key/input returns the same run and conflicting input returns409. | Empty, invalid, oversized and split-UTF8 input cases are handled correctly; client tenant/role fields cannot expand authority. Raw accepted Unicode text survives chunk boundaries unchanged. |
| LQ-3 | Three named deterministic planning fixtures overlap, produce validated outputs and yield one distinct fixture review/final artifact set. Artifact envelopes expose workflow/schema, task role/attempt, fixture provider/model, timestamps and digests. | Provider execution is visibly disabled and the provider endpoint rejects execution. A public caller cannot write a review verdict. Literal fixture review is explicitly not independent model review or useful product planning. |
| LQ-4 | Restart after queued work and actual child-process SIGKILL after partial committed planning evidence resumes to one final set without replacing earlier task provenance. | Queued/running cancellation prevents final publication; delayed cancel bodies cannot overwrite a committed success. Storage claim failure becomes unavailable without process death, false success or uncontrolled retries. The separate recovery spike supplies labelled duplicate/fencing mechanics only, not application event-engine proof. |
| LQ-5 | Actual Chromium exercises brief→task evidence at desktop/mobile sizes, session switching, empty foreign history and foreign-run404; the basic workflow is keyboard operable with labelled controls and visible fixture limitations. | Delayed prior-session responses cannot render after an identity switch. Native browser exceptions fail. No usage/cost/audit-completeness or production-accessibility certification is claimed by this minimal journey. |
| LQ-6 | A clean checkout runs pinned tool installation, strict TypeScript, syntax lint, unit/HTTP/UI integration, actual server/controller coverage and actual Chromium. | Missing/duplicate/malformed coverage cannot become PASS; enforced coverage floors remain90% lines/85% branches. Dependency/tool/browser setup failure blocks verification. Output distinguishes fixtures, recovery experiment, genuine provider deferred and production deferred. |

These criteria deliberately avoid claiming the absent product features: native agents, a blocking-review revision cycle, a human approval transition, provider budgets, full cost/audit UI or managed/multi-host execution. They still require concrete tenant isolation, persistence, process recovery and browser behavior rather than an installation-only smoke/no-op.

## Existing evidence and its limits

Application source and tests are retained under `/private/tmp/factory-greenfield-qynise-20261019`:

- `app/local/server.ts`: loopback session/tenant API, durable SQLite state, explicit fixture outputs/provider denial, conditional terminal cancellation and unavailable-storage containment.
- `app/local/demo.test.ts`: actual HTTP session/tenant/input/idempotency tests, split Unicode, cancellation, delayed cancellation, partial-commit process death and storage-failure cases.
- `app/local/ui.test.ts`: stale-response, concurrent login and shared-cookie identity-consistency negatives, polling/cancellation/error observations.
- `app/local/browser.test.ts`: actual Chromium desktop/mobile fixture journey and two-page identity switch/foreign-read denial. Test comments are not a complete acceptance-results emitter by themselves.
- `scripts/verify-application.sh`, `scripts/test-coverage.sh` and `scripts/coverage-reporter{,.test}.mjs`: strict application checks, browser and fail-closed coverage normalization.
- `.github/workflows/adopter-baseline.yml`: clean npm-ci/no-lifecycle-scripts local verification and a separate labelled recovery-spike job.
- `experiments/recovery-spike/recovery.test.ts` and its README: nine process/fencing/replay observations from a disposable experiment. Trusted tenant strings in that spike are not authenticated application sessions.

Exact ordinary native application/readiness evidence was retained for head `2274779185f33d1f024f4371b54939b85de2399a`, run39242602605/attempt1, including process-validation, application-readiness and recovery-spike. The source-first bootstrap merged as `ac6f8437707ac10c2dd3567578d680c8601973e4` with the exact expected tree/sole base parent; independent GET-only restoration verification is `/private/tmp/factory-consolidated-approvals-20261019/qynise-independent-verification.json`. That record proves six strict requirements restored, empty bypass and all eight activation flagsfalse at observation time. It is not a current perpetual configuration guarantee, native factory producer receipt, full Spec001 PASS or product acceptance.

## Native factory qualification sequence still required

1. Obtain explicit operator approval of the final bounded spec text, criteria and permitted file scope. Record it separately from Spec001. Keep both acceptance histories visible; no waived/rewritten original ACs.
2. Prepare acceptance commands/results mapped to each bounded criterion. Existing Node tests and browser comments do not automatically give the collector the complete expected AC evidence. Add only the necessary honest result mapping/tests; failures and tooling gaps stay failures. No fabricated tagged PASS based on descriptions.
3. Prepare a repository-specific protected policy/runtime registration package from the actual merged workflow IDs and final source hashes. Register the exact bounded spec digest, acceptance command/image contracts, allowed candidate paths and verifier/reviewer identities. Do not copy claude-init's Spec048, source-pilot IDs, trust records or twenty-delivery history. Any protection/bootstrap source change needs its own concrete reviewed maintenance route.
4. Verify effective main protection and separate main-only environments through non-secret readbacks. Follow the existing operator-entered credential checklist: only review OAuth in factory-review; merge/reporting keys and Slack secrets stay isolated. No local secret extraction/copy or application API route. Reviewer credential entry may require operator action; this proposal does not claim credentials already exist.
5. Run a genuine repository-native protected verifier and an independent Sonnet5.5 repository code reviewer on an exact bounded candidate. Verify signed evidence subject/digest, issuer, repository/workflow/ref/base, run/attempt, head/spec/policy and transitive trusted runtime pins. Native model code review is distinct from the application's disabled fixture planner/reviewer. A skipped job, local tool-free report, unsigned fixture or ordinary application CI is insufficient.
6. Prepare the adopter's own protected state/trust/receipt settings only if required for the approved qualification. Preserve separate repository state and shared approved Slack destination; no private feedback or public plaintext disclosure. Readiness inspection alone does not authorize reporting dispatch, state initialization or authority activation.
7. Demonstrate authentic shadow evaluation and fail-closed negative cases: wrong source/head/spec, missing/forged proof, protected-path change, foreign state binding and stale policy. Complete the exact native eligibility contract before proposing any autonomous merge activation. Qualification may be accepted while authority remains disabled; a successful shadow is not permission to turn it on.
8. Record two distinct outcomes: **bounded harness/adopter qualification** and **operator product acceptance**. Original genuine-provider/identity/revision/approval/budget requirements remain deferred. Pilot useful-delivery counts require meaningful authenticated deliveries under their own criteria; bootstrap maintenance, replay, fixture output and adoption checks do not qualify automatically.

The proposal authorizes no environment change, secret entry/copy, model application call, state write, workflow dispatch, Slack message, main-policy transaction, autonomous merge or deployment. Those payloads must be concrete and reviewed at their respective stage. Scope approval can settle the local qualification question once without pretending that future unknown activation payloads are already approved.
