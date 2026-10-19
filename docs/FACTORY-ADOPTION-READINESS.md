# qyndex/qynise-platform factory adoption readiness

Status: local installation proposal; activation is disabled. Application readiness and autonomous readiness are separate gates.

Repository baseline: `5ddcfa54a470b3758339f3a35f7ad73675ad5883`. Harness source: [`6e89cc6f3d8e368fd078f5652c928225bec10f03`](https://github.com/qyndex/claude-init/tree/6e89cc6f3d8e368fd078f5652c928225bec10f03). The source checkout was clean and immutable. The exact installation observation is [recorded here](adoption/installation-observation.json).

## Installation observed

The actual transactional installer proposed 637 files. Installation, unchanged repeat (zero writes), exact revert and reinstall passed locally. Existing application/product baseline files remain byte-identical except the deliberately composed root instructions and, for brownfield, shared Claude settings. Brownfield originals are preserved in `docs/adoption/original/`; its original permission allow entries are retained alongside the harness guard settings.

`CLAUDE.md` is intentionally customized for this application. Brownfield `.claude/settings.json` is also customized. The unchanged upstream ownership manifest is preserved: a subsequent automatic upgrade correctly rejects these files. Before upgrading, reconcile the upstream changes with these project customizations in an isolated branch. Do not rewrite ownership hashes to pretend customized files match stock bytes.

The installer omits generic supporting scaffold files required by structural validation. This branch explicitly adds the pinned neutral autopilot/swarm manuals and three swarm templates, plus repository-owned empty objectives/roadmap/SLO/deprecation scaffolds. These are supplemental project files, not inherited source-pilot authority. An empty SLO registry does not certify production readiness.

## Protected boundaries

No source pilot policy, receipt trust, active backlog, fleet state or live factory workflows were imported. No GitHub App was installed, no secret was copied, no main policy was changed and no production adapter was activated. Native prompts remain advisory until the guarded console and the repository's own trusted intake configuration are established. Never interpret stock prompt hooks as authenticated human-origin proof.

The selected reporting destination is the existing private `qyndex-alerts` channel, team `T0B2VADDUG4`, channel `C0C7T1Y29K5`, operator `U0B3L0TRCTA`. Each repository must have its own protected state and reporting origin; do not share the source pilot state branch, feedback database or receipt archive. Reporting is disabled pending per-repository configuration and a real receipt. Keep tokens and private keys out of this branch and chat.

## Remaining acceptance

- Run actual application lint, typecheck, tests, build and meaningful browser journey; retain failures honestly.
- Approve the bounded product/remediation specs before feature or dependency implementation.
- Review per-repository workflow/producer identities, protected environments, App scope, approved spec paths and signed exact-head evidence.
- Prove shadow eligibility and stale-head, failed-check, forged-proof, out-of-scope and recovery negatives.
- Prove real reporting and authenticated feedback delivery if those capabilities are enabled.
- Supply deployment platform, health/SLO and rollback contract before any production activation.

Use the pinned source [adopter setup](https://github.com/qyndex/claude-init/blob/6e89cc6f3d8e368fd078f5652c928225bec10f03/docs/FACTORY-ADOPTER-SETUP.md), [activation guide](https://github.com/qyndex/claude-init/blob/6e89cc6f3d8e368fd078f5652c928225bec10f03/docs/FACTORY-ACTIVATION.md) and [quickstart](https://github.com/qyndex/claude-init/blob/6e89cc6f3d8e368fd078f5652c928225bec10f03/docs/FACTORY-ADOPTER-QUICKSTART.md) for documents intentionally not distributed locally. Source-pilot success does not certify this target.
