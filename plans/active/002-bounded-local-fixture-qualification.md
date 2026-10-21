---
id: 002
slug: bounded-local-fixture-qualification
status: approved
spec: specs/active/002-bounded-local-fixture-qualification.md
created: 2026-10-20
updated: 2026-10-20
---

# Plan002: Real bounded local qualification

1. Preserve Spec001 and record the exact approvedLQ1–6 toAC1–6 translation.
2. Freeze scripts/qualify-local.mjs per-AC argv: node scripts/qualify-local.mjs --criterion AC-N. Aggregate invocation accepts --output-dir <directory>. Add a native event reporter and a complete required-case map; reject absent/duplicate/malformed/skipped/todo/failed/spoofed observations and coverage.
3. Start from a fresh tracked source checkout. Require exactNode24.13.1, root/experiment pinned dependencies and offline clean npmci without lifecycle hooks. Run strict compilation/syntax, realHTTP/UI/Chromium/recovery suites and actual server/controller coverage90/85.
4. Add only necessary genuine assertions for the six approved criteria; no product features, provider calls or replacements for original001.
5. Run RED/GREEN contract fixtures and actual qualification, retaining tools/commands/raw outcomes/source hashes and precise fixture/recovery/production limits. Image agent separately prepares an offline Linuxamd64 runtime; require real architecture test before any GitHub-hosted image claim.
6. Parent performs independent review, required full collectors/draft publication and later protected native registration/proof. Local source or fixture success does not activate authority or count as native independence.
