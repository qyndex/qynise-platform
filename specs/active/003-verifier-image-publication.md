---
id: 003
slug: verifier-image-publication
status: approved
scope_approved: 2026-10-21
owner: "@codex"
human_owner: "@qyndex"
created: 2026-10-21
updated: 2026-10-21
complexity: M
service_tier: T2
---

# Bounded verifier-image publication implementation

The operator approved implementation and local verification only on2026-10-21.
This continues existing adopter qualification; product001 scope is unchanged.
Qynise002 remains a separate reserved qualification contract. No image build,
push, dispatch, public visibility, OIDC/signing, live environment/flag/config
change, policy registration or activation is authorized. Package names remain
proposed until separately approved.

## Acceptance criteria

1. **AC-1**: A disabled/manual trusted-main workflow accepts only this repository,
   exact reviewed three-file context, immutable base/tool pins and fixed package.
   Wrong ref/event/fork/context/hash/symlink/package fails closed.
2. **AC-2**: Read-only build/tooling and package-write publication jobs are separate.
   Pre-created main-only environment metadata is verified with explicit Actions
   read permissions; missing/403/ambiguous/tag/wildcard policy blocks publication.
3. **AC-3**: The publisher binds same-run source/artifact/hash and exact OCI image
   manifest identity, rejects mutation/unsafe layout, and executes no candidate
   application. Native provenance is explicitly pending, not self-asserted.
4. **AC-4**: Deterministic local positive/negative contracts and source-bound
   evidence prove the disabled implementation without actual build/push effects.
5. **AC-5**: After separately approved live changes, verify actual hosted build,
   image provenance, exact remote digest, public anonymous pull and unchanged
   sandbox tooling controls. This remains PENDING; local fixtures cannot satisfy it.

Implementation note: docs/adoption/image-publication/IMPLEMENTATION.md.
