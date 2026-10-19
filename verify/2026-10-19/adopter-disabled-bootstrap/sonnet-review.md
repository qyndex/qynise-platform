# Tool-free Sonnet 5.5 bootstrap review

Static source-only subscription review; no native authenticated receipt. Full report retained; activation findings are not waived by publication.

No tools were needed since all source was in your message. I treated the files as data only, and none contained instructions aimed at me. Nothing here blocks publishing as a disabled draft. F1 to F3 should be resolved or verified before any activation.

```json
{
  "scope": "Static review of 7 workflows, setup-stack action, factory/policy.json and per-repo proposal JSON for qyndex/qynise-platform and qyndex/nextjs-landing-page. Scripts under .claude/scripts and factory/* other than policy.json were not provided.",
  "verdict": "Acceptable as disabled public draft. No live-activation path found while flags are false and policy.enabled/merge_enabled are false. Findings F1-F3 are activation blockers to verify.",
  "confirmed_ok": [
    "Every proposed FACTORY_* flag is the string 'false'. Every job gate tests == 'true', so unset or false means skipped before any environment or secret is touched.",
    "policy.json has enabled=false and merge_enabled=false.",
    "factory-review.yml references only secrets.GITHUB_TOKEN and CLAUDE_CODE_OAUTH_TOKEN. No App key, Slack token or ANTHROPIC_API_KEY is referenced.",
    "factory-verification.yml has no environment and no secrets other than GITHUB_TOKEN.",
    "The factory-review environment is restricted to the custom branch policy 'main' (type branch). pull_request_target runs at refs/heads/main with the base workflow definition, so PR-branch workflow edits cannot load the OAuth token.",
    "factory-review and factory-verification check out github.sha (the base) with persist-credentials=false and require the PR head repo to equal github.repository (no forks) and a non-draft PR.",
    "All App token mints use owner plus repositories=<current repo name>, so each token is repo-scoped.",
    "Authority, review and reporting jobs all gate on the default branch ref.",
    "Both per-repo proposals are internally consistent: repository name and repository_id match, no cross-references, credentials_entered/state_initialized/authority_activated=false, and forbidden_secret_names list all App keys, the Slack token and the API key.",
    "Expression inputs reach shell only via env, except github.event.pull_request.base.sha in evidence-gate, which is a hex SHA.",
    "evidence-gate retains G49 re-execution and the PR-body checks. Fail-closed behaviour holds if the base fetch fails."
  ],
  "findings": [
    {
      "id": "F1",
      "severity": "medium",
      "file": ".github/workflows/factory-merge.yml",
      "step": "Resolve request from dispatch or completed candidate run",
      "title": "workflow_dispatch can request mode=merge independent of policy.merge_enabled",
      "detail": "On workflow_run the mode is derived from policy.json merge_enabled. On workflow_dispatch the mode is taken directly from the input, so --merge is passed to the coordinator even when merge_enabled=false. Whether this is safe depends on factory-coordinator.py or factory-preflight.py re-checking merge_enabled, which I could not see.",
      "recommendation": "Fail the step when mode=merge and policy.merge_enabled is not true, or clamp dispatch mode to shadow unless merge_enabled is true. Confirm the coordinator also enforces it."
    },
    {
      "id": "F2",
      "severity": "medium",
      "file": ".github/workflows/factory-review.yml, factory-verification.yml",
      "title": "Signing and check-write authority sits in the same job that processes untrusted PR content",
      "detail": "id-token: write, attestations: write and checks: write are workflow-wide. The producer step, which feeds PR content to the model (review) or computes proof (verification), shares the job with the attest step. In the review job, CLAUDE_CODE_OAUTH_TOKEN and a checks:write GITHUB_TOKEN are also in that step's env. If the producer step is steered by prompt injection or PR-controlled data into writing producer-output/, the attest step signs whatever evidence.json it holds. The provenance then verifies against this workflow's identity. Same-repo PR authors have write access, so this is an insider or compromised-collaborator risk.",
      "recommendation": "Split into two jobs: an untrusted-content producer with contents:read only, then a signer job with id-token/attestations that validates and re-derives evidence.json from a schema before attesting. Confirm the reviewer subprocess is truly tool-free and does not inherit GH_TOKEN."
    },
    {
      "id": "F3",
      "severity": "medium",
      "file": "factory/policy.json",
      "title": "required_checks are all bound to app id 15368 (GitHub Actions)",
      "detail": "Any workflow whose GITHUB_TOKEN has checks:write can create a check run with a required name attributed to app 15368. That includes PR-branch workflows on write-access branches, and the producer jobs above. The check-name binding therefore proves little. Security rests on the coordinator verifying attestations and artifact bytes, which I could not review.",
      "recommendation": "Before activation, confirm the coordinator never treats a check run's existence as proof and verifies signer identity (repo, workflow path, ref) plus digest. Prefer a dedicated App id for factory-verification and factory-independent-review checks."
    },
    {
      "id": "F4",
      "severity": "low",
      "file": "factory-hosted-feedback.yml, factory-review.yml, factory-verification.yml, factory-merge.yml",
      "title": "Activation gates are inconsistent and single-flag",
      "detail": "Feedback intake requires only FACTORY_FEEDBACK_ENABLED and the profile, not FACTORY_REPORTING_ENABLED, yet hard-codes enabled=True in its config. Producers require only FACTORY_PRODUCERS_ENABLED and never consult policy.enabled. The merge workflow mints a write-capable App token on a single flag plus the preflight script. A single variable flip therefore activates a surface while policy stays disabled.",
      "recommendation": "Require FACTORY_REPORTING_ENABLED in the feedback job. Make producers and the merge job read policy.enabled before secrets or tokens are used. Make the preflight step fail closed on enabled=false."
    },
    {
      "id": "F5",
      "severity": "low",
      "file": "digest, feedback, alerts, queue workflows",
      "title": "Credential classes are not mutually exclusive, and GITHUB_TOKEN holds contents:write",
      "detail": "When APP_WRITER_ENABLED=true, FACTORY_REPORTING_STATE_TOKEN (the PAT) and the App token are both injected into the same process. The 'Validate selected reporting credentials' step cannot stop a fallback to the PAT. All four reporting workflows grant GITHUB_TOKEN contents:write at workflow scope even when App-writer mode or a disabled monitor is in use. The feedback step also holds Slack, state-key and state tokens together. The reporting-writer App token requests administration:read in addition to contents:write.",
      "recommendation": "Inject only the selected credential per mode, using separate steps or an if. Reduce workflow permissions to contents:read where the App token writes. Document why administration:read is needed."
    },
    {
      "id": "F6",
      "severity": "low",
      "file": "digest, feedback, alerts, queue workflows",
      "title": "State repository binding relies entirely on unseen scripts",
      "detail": "FACTORY_REPORTING_STATE_REPOSITORY is an unvalidated variable that is passed to scripts along with the PAT secret. The App token is scoped to the current repo only, but the PAT is not. If both repos share an environment name and a copied PAT, pointing the variable at the other repo could cross-write state. The queue workflow uses concurrency group factory-reporting-queue-* while the others use factory-reporting-*. They may write the same state branch concurrently, which depends on compare-and-swap in the scripts.",
      "recommendation": "Add a workflow-level check that state_repository equals github.repository or an allowlisted value. Use a distinct PAT per repo, scoped to the one state repository. Confirm ref updates use compare-and-swap."
    },
    {
      "id": "F7",
      "severity": "low",
      "file": ".github/workflows/factory-merge.yml",
      "title": "Shadow mode mints a merge-capable token",
      "detail": "The App token always includes contents:write and pull-requests:write, even for mode=shadow or merge_enabled=false.",
      "recommendation": "Mint a read-only token (contents:read, pull-requests:read, checks:write) in shadow mode. Add write permissions only when mode=merge."
    },
    {
      "id": "F8",
      "severity": "low",
      "file": ".github/workflows/evidence-gate.yml",
      "title": "PR-authored escape hatch can satisfy evidence-gate for harness and protected-path changes",
      "detail": "A PR-committed verify/**/no-ac.json with kind=harness-maintenance skips evidence for any diff limited to .claude/, .github/, .mcp.json, .gitleaks.toml, docs and similar. Those include policy protected_paths such as workflows, hooks, settings and the secret-scan config. The docs-only regex also treats any root path starting with 'README' or 'CHANGELOG' as docs (for example README.sh). The PR-body check 'Verdict.*PASS' also matches strings like 'Verdict: not PASS'.",
      "recommendation": "Ensure the coordinator and human review gate protected_paths independently of evidence-gate. Anchor the README and CHANGELOG patterns to known suffixes. Tighten the verdict regex."
    },
    {
      "id": "F9",
      "severity": "low",
      "file": "factory-merge.yml, factory-review.yml, factory-verification.yml",
      "title": "Public-repo artifacts expose proofs, receipts and administrative observation audits",
      "detail": "Both target repos are public (private=false), and artifacts are readable by any signed-in user for 90 days. These include producer output, model review output, coordinator receipts and the bounded administrative-observation audit, which is derived from administration:read data.",
      "recommendation": "Confirm no sensitive policy detail, reviewer identity or bypass-actor data is written to these artifacts. Otherwise redact, or reduce retention."
    },
    {
      "id": "F10",
      "severity": "low",
      "file": "evidence-gate.yml, .github/actions/setup-stack/action.yml, factory-review.yml, factory-hosted-feedback.yml",
      "title": "Supply-chain pinning is weaker outside the factory workflows",
      "detail": "evidence-gate uses actions/checkout@v7, setup-go@v7 and upload-artifact@v7 by tag. setup-stack uses tags including the moving ref dtolnay/rust-toolchain@stable. The factory workflows pin SHAs. Claude Code is pinned by version but npm-installed globally in the same job that later holds CLAUDE_CODE_OAUTH_TOKEN, with transitive dependencies unpinned. The feedback job pip-installs requirements before a step holding Slack, state-key and state tokens. I could not see whether that file uses --require-hashes.",
      "recommendation": "Pin SHAs for evidence-gate and setup-stack. Use --require-hashes for pip. Consider a lockfile or integrity check for the Claude Code install."
    },
    {
      "id": "F11",
      "severity": "low",
      "file": "*/environment-proposed.json",
      "title": "factory-review has no reviewers or wait timer, and admin-bypass is unspecified",
      "detail": "Any same-repo PR event by a collaborator automatically consumes the OAuth subscription token once enabled, which is intentional but is a cost and abuse surface. can_admins_bypass is not set, so it defaults to allowing admin bypass.",
      "recommendation": "Set can_admins_bypass=false explicitly. Rate-limit or allowlist PR authors in the job if cost abuse matters."
    },
    {
      "id": "F12",
      "severity": "info",
      "file": "factory-merge.yml, factory-reporting-alerts.yml",
      "title": "Reliability: noisy failures and dropped pending runs",
      "detail": "Any completed pull_request_target run in the listed workflows without exactly one factory artifact fails the coordinator job with SystemExit, which creates failed-run noise. GitHub keeps only one pending run per concurrency group, so a pending failed-run alert can be superseded by other reporting runs sharing the group.",
      "recommendation": "Skip rather than fail for non-producer runs. Rely on reconcile in the alert monitor, and verify that it actually recovers superseded alerts."
    }
  ],
  "limitations": [
    "Scripts were not provided: .claude/scripts/factory-*.py (preflight, coordinator, producer, producer-check, reporting-*, slack-digest, git-state, hosted-feedback), validate-candidate-evidence.py, verify.sh, factory/feedback-crypto-requirements.txt and the policy_observation module. Preflight, merge_enabled enforcement, attestation verification and state-repo validation are therefore unverified.",
    "The proposal JSON files are explicitly 'reviewed-source-proposal-not-live-readback'. I could not confirm live variable values, environment configuration, or that secrets are environment-scoped rather than repo-scoped. Repo-level secrets would be visible to any workflow. I also cannot confirm that factory-authority and factory-reporting are main-only.",
    "Variables read by workflows but absent from the proposals (FACTORY_REPORTING_ATTACHMENTS_ENABLED, FACTORY_REPORTING_QUEUE_INITIALIZE, bootstrap SHA variables, FACTORY_POLICY_OBSERVATIONS) are assumed unset. Unset behaves as false for the == 'true' gates.",
    "No factory/policy.json was provided for nextjs-landing-page. The one shown is bound to qyndex/qynise-platform with app_id 5251754. I could not verify that nextjs-landing-page has its own correctly bound policy, or that its workflow copies are identical. A copied qynise policy there would be a wrong-repository binding that should fail the preflight.",
    "The workflows named in the factory-merge workflow_run list other than those shown (Adopter readiness baseline, CI, Harness Validate, Claude PR Review, Claude Security Review, adr-gate, Commitlint, Lint exception audit, Merge gate) were not reviewed. The sources of the process-validation and application-readiness checks are likewise unseen.",
    "I did not verify action SHAs, the claude-code@2.1.295 version, or Actions/attest behaviour. I did not verify that the installer manifest retains the original distribution hashes for custom instructions and MCP, or that runtime files match source 69574d2. I took both as stated.",
    "Static review only. Nothing was executed, and GitHub-side semantics (pending-run replacement, environment bypass defaults, workflow_run.pull_requests behaviour) are described from knowledge and may have changed."
  ]
}
```
