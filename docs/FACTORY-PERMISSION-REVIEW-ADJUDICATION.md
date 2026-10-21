# Permission review adjudication

This addresses the retained Sonnet 5.5 M1–M3 observations for this local source proposal. No native token or reporting run was dispatched.

## M1: shadow coordinator call graph

In `.claude/scripts/factory-coordinator.py`, `coordinate` (125–247) makes read requests until the `if merge` branch (241–244), which contains POST check-runs and PUT merge. Its source/artifact helpers (272–299) use GET/default-GET. In `main` (314–347), the exception-path POST check is also inside `if args.merge` (333–338). Thus both successful and failed shadow coordinator paths do not issue repository non-GET requests. Receipt/audit writes (341–347) are local filesystem writes. Token issuance and artifact upload elsewhere in the job are separate network effects; this is not a claim that the whole job has no POST. Checks-write remains conservatively requested but is not demonstrated necessary by the current shadow call graph. No coordinator guard was weakened. Real native denied-write/token proof remains pending.

## M2: repository gate configuration

The retained post-merge-registration `disabled-flags.json` for this repository contains all eight repository flags explicitly false, including PRODUCERS, MONITOR and WATCHDOG. `capture-public-metadata.py` obtains these through `repos/{repo}/actions/variables?per_page=100`; these are not environment-only observations. The protected bootstrap transaction's `actual-result.json` independently records restored requirements and false flags. These timestamped observations do not certify present live operation. An environment-only false flag is insufficient for a job-level gate: repository variables override organization defaults, while environment variables become available after job start. [GitHub variable precedence](https://docs.github.com/en/actions/reference/workflows-and-actions/variables).

## M3: test boundaries repaired

The review repair preserves the production workflow bytes. Negative fixtures insert job-level write escalation and move intact credential validation after effects; the real workflow contract rejects both. Every relevant reporting flag is tested independently false and absent, with monitor and optional watchdog included. Current disabled policy is recorded in proof, while the order test accepts a synthetic future approved policy. The limited expression interpreter matches case-insensitive ASCII string equality and explicitly rejects mixed-type coercion and Unicode equality; GitHub itself supports broader loose equality. [GitHub expression semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions).

## Remaining limits

Selected state stays in this repository on a separate state branch, as chosen by the operator. Generic legacy transport remains for compatibility; the adopter workflow does not inject its token. No real PAT deletion/revocation is claimed. Actual App permission readback, denied-write shadow behavior, protected native signing, consumer pull-request-read compatibility and the pull_request_target resolver artifact route remain unverified. Disabled/skipped jobs provide no health, delivery or acceptance credit. Full specification acceptance remains incomplete; broad collectors are recorded separately by the parent task.
