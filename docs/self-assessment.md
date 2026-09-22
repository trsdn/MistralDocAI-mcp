# Self-assessment

Assessment of `trsdn/MistralDocAI-mcp` against version 1.21.0 of the
[Repository Quality Standard](https://github.com/trsdn/.github/blob/v1.21.0/docs/repository-quality-standard.md),
reassessed from the prior 1.2.0 record of 2026-08-24. The whole standard was
re-read, not diffed, per the fleet-rollout procedure.

| | |
|---|---|
| Standard version | 1.21.0 |
| Assessed on | 2026-09-22 |
| State | Healthy |
| Record | [`.github/conformance.yml`](../.github/conformance.yml) |

**Result:** 76 pass, 2 partial, 0 fail, 29 not applicable.

Nothing fails. Two criteria are partial, both about polish rather than a real
gap.

## Published Site

`W01`-`W09` are `na`. This repository ships an MCP server: it has no audience
that installs or runs it by name. It is configured inside an MCP client
(Claude Desktop and others) the way a library or agent tool is configured, per
[decision 0020](https://github.com/trsdn/.github/blob/main/docs/decisions/0020-public-applications-need-a-site.md)'s
own exclusion for "an MCP server or agent tool that other software or a
developer configures rather than installs by name." The README documents this
plainly: "It is for people who already use an MCP client such as Claude
Desktop and want document conversion inside it." There is no separate
non-developer audience for a site to serve.

## What changed since 1.2.0's assessment

New criteria at this version, decided fresh:

| Criterion | Result | Evidence |
|---|---|---|
| `B13` | partial | The validation command `npm run verify` and the Python floor (3.10) are restated by hand across README, `AGENTS.md`, and `CONTRIBUTING.md`. All three agree with each other and with `package.json`/`python/mcp_requirements.txt`, so this is a repetition that agrees rather than one that has drifted. |
| `B14` | pass | `SECURITY.md` now names both credentials this project touches: the user's own `MISTRAL_API_KEY` (revoke at console.mistral.ai) and the npm publishing identity (`NPM_TOKEN`, unused since release.yml moved to OIDC trusted publishing; revoke on npmjs.com if it is ever found exposed). Added in this pass. |
| `B15` | pass | `AGENTS.md` now states plainly that nothing third-party is bundled or vendored: Node dependencies are resolved by npm and Python dependencies by pip, both at install/first-run time. Added in this pass. |
| `P09` | pass | `.github/workflows/stats.yml` runs the shared `trsdn/.github` repo-stats workflow, added in this pass, committing to the `stats` branch (created in this pass, since `main` is protected). Triggered by hand after merge (run [35704751642](https://github.com/trsdn/MistralDocAI-mcp/actions/runs/35704751642), 2026-09-22): both `repo-card.svg` and `repo-card-dark.svg` landed on `stats`. README links the card with the `stats`-branch raw URLs. |
| `P10` | pass | `.github/ISSUE_TEMPLATE/bug.yml` collects expected/actual behaviour, reproduction steps, the environment-check output, package version, MCP client, and OS: every field `P10` asks for. |
| `P11` | pass | `.github/pull_request_template.md` covers what changed (linked issue), how it was verified (`npm run verify` checklist), and impact (breaking change, security/privacy, new dependency, new network destination). |
| `R07` | pass | `release.yml`'s "Verify the changelog documents this version" step extracts the tagged version's `CHANGELOG.md` section with `awk` and fails the release if it is empty; that extracted text is passed as `--notes-file` to `gh release create`, so the published release notes are the changelog entry, not a second description. Confirmed on `v2.0.0`. |
| `R08` | pass | `release.yml` publishes with `npm publish --provenance --access public` over OIDC trusted publishing (no `NODE_AUTH_TOKEN`); npm attaches a provenance attestation, verifiable with `npm view @trsdn/mistraldocai-mcp-server@2.0.0` or on the package's npm page. |
| `R09` | pass | Secret scan: GitHub secret scanning is enabled and shows no open alert. Dependency check: no open Dependabot alert at the time of this record — the two open **high** alerts found at the start of this pass (`js-yaml`, via `package-lock.json`) were cleared by merging the repository's own Dependabot PR [#34](https://github.com/trsdn/MistralDocAI-mcp/pull/34) during this pass. |
| `S11`, `S12`, `S13` | pass / pass / na | Decided by `scripts/assess.py` from the workflow files: all workflows declare `permissions`, every `uses:` reference satisfies the `S12` table (GitHub-published actions on major tags, the account's own reusable workflow on `@main`), and no workflow uses `pull_request_target` or `workflow_run`. |
| `B16` | pass | `scripts/assess.py`: the default branch blocks force pushes and deletion. |

## Notable passes carried forward

The 1.2.0 assessment's findings still hold and were re-checked against the
current tree: `S02` (57+ unit tests with failure paths and coverage
thresholds), `S03` (ESLint and Ruff both run in CI), `S04` (Node 22/24, Python
3.10-3.13, Linux/macOS/Windows), `R03`-`R06` (tag-triggered release, verified
tag/version/changelog agreement, tarball smoke-tested before publish,
changelog-derived release notes), `I04`/`I06` (`--version`/`--help` and the
release workflow both read identity from `package.json`, nothing hand-typed),
`Y01`-`Y06` (README's *Data and privacy* table), and `X04`/`X05` (ASCII-only
console output; the one known accessibility limitation, that the server has no
interface of its own, is stated).

## Partial results

| Criterion | Assessment |
|---|---|
| `T02` | Internal links are still reviewed by hand; no automated link checker runs. Unchanged from 1.2.0. |
| `B13` | See above. |

## Not applicable

| Criteria | Rationale |
|---|---|
| `D01`-`D06` | Nothing is deployed; the project ships as an npm package that runs on the user's machine. |
| `I05` | No icon surface: no installer, store listing, or site. |
| `T04`, `T05` | Nothing generated in the documentation sense; no superseded material found. |
| `W01`-`W09` | See *Published Site* above. |
| `L04`-`L06` | English-only, declared in the README, no string catalogs. |
| `X01`-`X03` | No interface of this project's own; the MCP client hosts the conversation. |
| `S13` | No workflow uses `pull_request_target` or `workflow_run`. |
| `A01`-`A04` | The repository is not archived. |

## What was fixed in this pass

Pull request [#39](https://github.com/trsdn/MistralDocAI-mcp/pull/39) (pipeline
and safety net), the merge of the repository's own Dependabot PR
[#34](https://github.com/trsdn/MistralDocAI-mcp/pull/34) (js-yaml, closing two
open high-severity alerts), and triggering the new stats workflow once by hand
so `P09` reflects a real, verified card rather than an untested workflow. No
criterion regressed; every 1.2.0 `Pass` that still applies at 1.21.0 was
re-verified, not assumed.

## How this was assessed

`scripts/assess.py` decided the criteria a fact settles (see
`.github/conformance.yml` for the full list); every other criterion was
decided by hand against the current tree, GitHub settings read with `gh api`,
and the release history. `npm ci` could not be run in the assessing sandbox
(its outbound registry access is restricted); `B05`, `G02`, `S02`, and `S03`
instead rest on the green CI run on `main` for this tree, per the standard's
allowance for an assessor that cannot reach the network.

Regenerate the badge after changing this record:

```sh
python3 scripts/conformance.py --repository .
```
