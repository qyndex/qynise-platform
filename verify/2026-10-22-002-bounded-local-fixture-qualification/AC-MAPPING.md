# Signed native observation map

Observed source `7e466e8a5605fca8dfc3ed3acd3bb77b90b9ed00`, registered base `dbb95cd53b980620631e2e57b4871944225420d5`, verifier run39703579864. All six exact criteria passed and the root/observation bytes were authenticated. This is historical verification of this executable source, not independent review or a new head's acceptance.

|Criterion|Source-bound complete native suite observations|
|---|---|
|AC-1|app:22 complete cases, browser:2 complete cases; 12 recorded commands|
|AC-2|app:22 complete cases; 10 recorded commands|
|AC-3|app:22 complete cases; 10 recorded commands|
|AC-4|app:22 complete cases, recovery:9 complete cases; 12 recorded commands|
|AC-5|app:22 complete cases, browser:2 complete cases; 12 recorded commands|
|AC-6|app:22 complete cases, reporter:2 complete cases, contract:18 complete cases, recovery:9 complete cases, browser:2 complete cases, coverage:22 complete cases; 27 recorded commands|

The derived results.json is a six-row index, not a manually normalized original command output. The signed root and all six raw native blobs are retained byte-for-byte. A generic tagged-test label earns no credit independently of that root and its observations. Full expected suite cases and coverage/setup negative controls are in QUALIFICATION-CONTEXT.md. Native browser,HTTP,recovery,strict/syntax and coverage were exercised by those protected commands.

Ephemeral paths in these raw observations belong to isolated GitHub/Linux toolchain containers, not a user's private home. Reproduction uses the pinned image and registered commands, not copied temporary directories. Previous source81/f25/local-tool paths remain only in already-published Git ancestry; no current result imports them.

Smoke is a separate bootstrap check. Its generic assertion-density scanner does not cover app/ and earns no acceptance credit. The generic full collector still lacks custom Node autodetection; its failed record has no generated result file. Supported supplied-results collection consumes the authenticated native index and runs smoke against dbb95cd. No fabricated replacement output or skipped gate is used.
