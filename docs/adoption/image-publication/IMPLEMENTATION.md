# qyndex/qynise-platform: image publisher implementation plan

Scope approved: local implementation/tests only. Recipe inputs are the reviewed
public three-file context; no dynamic candidate lockfile builder.

1. Capture genuine RED for missing fixed-context publication guards.
2. Add disabled manifest, exact context, guard/OCI reader and manual main workflow.
3. Validate deterministic negative cases and source/permission boundaries.
4. Preserve broad live acceptance as pending and prepare exact source for review.

All later live effects need an exact reviewed package: package names/content and
public visibility, context/environment protection, a bounded hosted build/push,
OIDC/signing permissions, remote digest qualification, protected policy cutover.
No application provider or production authorization is inferred.

## Implemented local contract

The committed manifest remains `enabled: false`; all three manual jobs additionally
require the repository enable variable. Build, publish and sign each require this
public repository's exact protected-main source/workflow/run/attempt. No branch,
recipe, destination, executable or model input is accepted from a dispatch user.
The recipe directory contains only Dockerfile. The guard stages that file and the
root package/lock files into a fresh exact three-file directory, checking the
compiled per-repository hashes. Dependency updates require a new reviewed recipe;
this is not a dynamic candidate-lock builder. No application source enters it.

The read-only build job has contents/actions read only. It verifies the existing
`factory-image-publishing` environment and one explicit main branch rule. Missing,
403, missing rule type, wildcard/tag or ambiguous metadata fails closed. This uses
Actions read, not an assumption that contents read can inspect environments.
Writer and signer recheck the same observed environment digest. This is observed
metadata protection, not an atomic guarantee against an administrator deleting
and recreating an environment during a run. No environment is created by code.

The proposed build uses SHA-pinned actions, Buildx v0.38.0 and BuildKit
`moby/buildkit@sha256:b059f8d7226d0b326bc871af489a5dddf65e36af4d20d14251b072974d9ee87c`.
Official public release/registry metadata was read on2026-10-21. ORAS1.3.0's official
Linux/amd64 archive is checksum-pinned to
`6cdc692f929100feb08aa8de584d02f7bcc30ec7d88bc2adc2054d782db57c64`.
The Dockerfile base is digest-pinned; apt and browser delivery remain recipe inputs
that can change. Repeatable recipe does not promise bit-identical future outputs.

The build job's synthetic offline tooling checks do not execute candidate code.
The OCI config digest must equal the tested loaded image ID. The single selected
image manifest digest is separately distinguished from its OCI index/config
hashes. The archive, handoff and same-run artifact ID are independently bound.
Before registry login the publisher validates those bytes, the environment and
fixed package association. Existing packages must belong to this repository;
403/unknown/foreign packages reject. Only an authenticated fixed-target404 is a
create case. It is not proof of public visibility or future namespace availability.
ORAS copies that exact image-manifest digest and reads back its raw manifest hash.
Both command pipes and OCI archive member counts are bounded during consumption.

The separate signing job proposes native GitHub attestations with the exact image
subject digest and trusted-main workflow. Its scoped packages/attestations/id-token
write declarations are unactivated source. The final verifier must first succeed
with native `gh attestation verify`, enforcing repository, signer workflow,
main ref, source/signer SHA and hosted runner, then checks verified certificate
source/run/attempt and subject. Synthetic certificate fixtures establish parser
behavior only; they do not establish authenticated provenance.

## Evidence and remaining live decisions

The deterministic local suite covers wrong ref/event/fork/context/symlink/hash,
OCI identity/member bounds, artifact/run/environment binding, package collisions,
job permissions and immutable tool pins, synthetic certificate mismatch, and
actual subprocess stdout/stderr/deadline/descendant cleanup. Genuine hosted build,
registry transport, native signing, anonymous pull, protected verifier-policy
registration and application sandbox qualification remain pending AC-5. No existing
local image ID is treated as a registry digest and no publication ran here.

A later exact reviewed package must approve publication of workflow/source, the
fixed GHCR package name/content and public visibility, the pre-created main-only
environment/enable state, proposed scoped OIDC/token permissions, one bounded
hosted attempt and retained evidence. No PAT, exported CLI credential, VM or
application-provider authorization is needed or inferred. Do not enable merging
or register an image from a local fixture result.

Primary references: GitHub REST environment and deployment-branch-policy endpoints
require Actions read; GitHub container registry supports ephemeral GITHUB_TOKEN
and initially private packages; GitHub native artifact-attestation documentation
specifies packages/attestations/id-token write for registry provenance. ORAS cp's
`--from-oci-layout` accepts archive@digest; manifest fetch returns raw manifest
bytes. Docker Buildx documents multiple OCI/docker outputs. Official sources:

- https://docs.github.com/en/rest/deployments/environments#get-an-environment
- https://docs.github.com/en/rest/deployments/branch-policies#list-deployment-branch-policies
- https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
- https://oras.land/docs/commands/oras_cp/
- https://oras.land/docs/commands/oras_manifest_fetch/
- https://docs.docker.com/reference/cli/docker/buildx/build/
- https://github.com/docker/buildx/releases/tag/v0.38.0
- https://github.com/moby/buildkit/releases/tag/v0.34.0

OCI layer closure hashes each bounded uncompressed plain/gzip layer against the
config rootfs.diff_id. zstd and extended/PAX/GNU/sparse headers reject; a bounded
header pre-scan runs before tarfile processes any extension payload. The OCI
exporter requests gzip compression. Both ordinary process-validation lanes run
the deterministic Python suite; publishing remains manual and disabled.

Seven cross-process CLI integration checks additionally exercise real event/env/file
parsing, fake gh subprocess metadata, environment policy and GITHUB_OUTPUT binding.
Wrong ref/event, changed environment, denied metadata, tag policy and disabled
contract reject. The fake gh boundary is local only, not native GitHub acceptance.
The integration gate defaults to main; these disposable clones have no local main
ref, so its full-tree fallback exposes brownfield existing waitlist route coverage.
The new publisher has no API/handler/query path and tests do not repair that route.
