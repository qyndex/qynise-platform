---
id: 002
slug: bounded-local-fixture-qualification
status: approved
scope_approved: 2026-10-20
owner: "@codex"
human_owner: "@qyndex"
created: 2026-10-20
updated: 2026-10-20
complexity: M
service_tier: T2
---

# Spec002: Bounded local fixture factory qualification

The operator approved optionA for the separate six-criterion local qualification proposal (SHA256 a72233b2f17a69806c2d7034b58e0a6398c19c4cb49a191350b0fc5486a4a00c). This specification translates LQ1–6 to AC1–6 without changing their meaning. It qualifies a real bounded local application for later native harness verification; it does not qualify the genuine-agent product or authorize any live configuration action.

Original Spec001 and all ten acceptance criteria remain unchanged, incomplete and deferred. Its retained FAIL0/10 is not replaced by this contract. Native agents, production identity, provider execution/spending, revision/approval lifecycle, full cost/audit UI and cloud/multi-host/deployment remain deferred. Existing subscription PR review is not application runtime capacity authorization.

## Acceptance criteria

1. **AC-1** (approved LQ-1): Explicitly enabled local fixture application binds only loopback; server-owned Alice/Bob test sessions govern tenant-scoped list/read/start/cancel. **Required negative/control:** Missing/forged session, foreign tenant run, forged Host/origin and conflicting identity hint are rejected without run content. Cross-tab cookie changes reset stale UI context; request data cannot select tenant authority.

2. **AC-2** (approved LQ-2): A bounded synthetic brief creates a durable versioned run; repeated same-tenant key/input returns the same run and conflicting input returns409. **Required negative/control:** Empty, invalid, oversized and split-UTF8 input cases are handled correctly; client tenant/role fields cannot expand authority. Raw accepted Unicode text survives chunk boundaries unchanged.

3. **AC-3** (approved LQ-3): Three named deterministic planning fixtures overlap, produce validated outputs and yield one distinct fixture review/final artifact set. Artifact envelopes expose workflow/schema, task role/attempt, fixture provider/model, timestamps and digests. **Required negative/control:** Provider execution is visibly disabled and the provider endpoint rejects execution. A public caller cannot write a review verdict. Literal fixture review is explicitly not independent model review or useful product planning.

4. **AC-4** (approved LQ-4): Restart after queued work and actual child-process SIGKILL after partial committed planning evidence resumes to one final set without replacing earlier task provenance. **Required negative/control:** Queued/running cancellation prevents final publication; delayed cancel bodies cannot overwrite a committed success. Storage claim failure becomes unavailable without process death, false success or uncontrolled retries. The separate recovery spike supplies labelled duplicate/fencing mechanics only, not application event-engine proof.

5. **AC-5** (approved LQ-5): Actual Chromium exercises brief→task evidence at desktop/mobile sizes, session switching, empty foreign history and foreign-run404; the basic workflow is keyboard operable with labelled controls and visible fixture limitations. **Required negative/control:** Delayed prior-session responses cannot render after an identity switch. Native browser exceptions fail. No usage/cost/audit-completeness or production-accessibility certification is claimed by this minimal journey.

6. **AC-6** (approved LQ-6): A clean checkout runs pinned tool installation, strict TypeScript, syntax lint, unit/HTTP/UI integration, actual server/controller coverage and actual Chromium. **Required negative/control:** Missing/duplicate/malformed coverage cannot become PASS; enforced coverage floors remain90% lines/85% branches. Dependency/tool/browser setup failure blocks verification. Output distinguishes fixtures, recovery experiment, genuine provider deferred and production deferred.

## Permitted implementation and evidence

Formalize this spec/plan/task record; add only the bounded native Node qualification runner/reporter, its completeness/negative fixtures, and necessary assertions in the existing HTTP/UI/Chromium suites. Preserve application behavior and the labelled separate recovery experiment. Use exact Node24.13.1, committed root/experiment lockfiles, clean offline npmci with lifecycle scripts disabled, strict TypeScript, actual browser dependencies and unchanged90/85 coverage floors. Missing tools/setup/coverage/test observations fail rather than skip.

The runner maps one entire criterion to all required test observations and controls. A single tagged pass, skipped case, printed success line or fixture review is insufficient. Emit actual per-criterion results with source/tool/command/coverage evidence and explicit fixture/recovery/provider/production limits. This local result is not an authenticated independent native producer/reviewer receipt.

No policy/profile/state/flag/secret change, workflow dispatch, main protection/merge, image publication, Slack message or production/provider action is authorized. A locally built image is only a proposal until exact architecture/runtime testing, digest registration and native signed proof are reviewed separately. Source-pilot identities and useful-delivery history must not be imported.

## Scope authority and rollback

See docs/adoption/local-qualification/operator-approval.json for the direct human decision. The six approved proposal rows are retained at proposal.md as historical proposal text; this approval and specification supersede its proposal-only status for this bounded scope. Revert any later source merge through a separately reviewed rollback PR. No database data or reporting state rollback is included.
