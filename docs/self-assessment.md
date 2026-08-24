# Self-assessment

Assessment of `trsdn/MistralDocAI-mcp` against version 1.2.0 of the
[Repository Quality Standard](https://github.com/trsdn/.github/blob/main/docs/repository-quality-standard.md).

| | |
|---|---|
| Standard version | 1.2.0 |
| Assessed on | 2026-08-24 |
| State | Needs work |
| Record | [`.github/conformance.yml`](../.github/conformance.yml) |

**Result:** 58 pass, 4 partial, 3 fail, 18 not applicable.

The state is `Needs work` rather than `Healthy` because three criteria fail, and
all three need a repository setting or a secret that only the owner can supply.
The code, the documentation, and the automation are in place; what is missing is
configuration on GitHub itself.

## What must be fixed

These are the failures, and none of them can be resolved from a pull request.

| Criterion | Why it fails | What resolves it |
|---|---|---|
| `B06` | The default branch has no merge policy. Anyone with write access can push directly to `main`, and no check is required before a merge. | Create a ruleset on `main` requiring a pull request and the CI checks. |
| `B12` | The `trsdn-standard` topic is absent, so this repository is not discoverable as part of the assessed set. | Add the topic in repository settings. |
| `S09` | No ruleset or branch protection exists, so no required status check protects `main`. Resolved by the same action as `B06`. | Same ruleset. Require `Node 24.x / ubuntu-latest`, `Python 3.12`, and `Conformance record`. |

`R03` is `partial` for a related reason: the release workflow exists and is
complete, but `NPM_TOKEN` is not configured as a repository secret, so a tag
would build and verify a release and then fail at the publish step. Until that
secret exists, a tag cannot produce an installable artifact.

## Partial results

| Criterion | Assessment |
|---|---|
| `B09` | Visibility and topics are intentional, but `homepage` is unset, so the npm package is not linked from the repository header. |
| `P07` | Description and topics support discovery. The missing homepage is the gap, as in `B09`. |
| `R03` | The tag-driven release workflow is complete and verified, but `NPM_TOKEN` is missing, so no tag has yet produced an artifact. This becomes `pass` on the first successful release. |
| `T02` | Internal links are reviewed by hand. No automated link checker runs, and the standard's `markdown.yml` reusable workflow is not yet adopted here. |

## Notable passes

Recorded here because the evidence is recent and the previous state was a
failure.

| Criterion | Evidence |
|---|---|
| `S02` | 57 unit tests covering start-up, argument parsing, interpreter discovery, dependency installation, and their failure paths, with coverage thresholds enforced in `jest.config.js`. Before this assessment, two tests failed and every CI run on the default branch was red. |
| `S03` | ESLint (`eslint.config.mjs`) and Ruff (`ruff.toml`) both run in CI. `npm run lint` previously used `--if-present` against a script that did not exist, so it always succeeded without checking anything. |
| `S04` | CI covers Node 22 and 24, Python 3.10 through 3.13, and an end-to-end setup test on Linux, macOS, and Windows. |
| `R04` | `.github/workflows/release.yml` fails when the tag does not match `package.json`, and when `CHANGELOG.md` has no entry for the version. |
| `R05` | The release workflow installs the built tarball into an empty project and runs it before publishing. This is the check whose absence allowed 1.0.4 to be published in an uninstallable state. |
| `I04` | `--version` and `--help` report the version, repository, and issue tracker, all read from `package.json` at run time. |
| `I06` | No identity value is maintained by hand. `src/index.ts` reads the manifest, and the release workflow validates the manifest against the tag. |
| `Y01` to `Y06` | [Data and privacy](../README.md#data-and-privacy) states what is collected (nothing), the only outbound destination (`api.mistral.ai`), that Mistral AI receives document content, where local state lives, and how to delete it. |
| `X04` | Console output is ASCII, with no colour and no decorative symbols, in both the TypeScript and Python halves. |
| `X05` | [Accessibility](../README.md#accessibility) states the limitation plainly: the server has no interface of its own, so the interactive surface belongs to the MCP client. |

## Not applicable

| Criteria | Rationale |
|---|---|
| `D01` to `D06` | Nothing is deployed. The project ships as an npm package that runs on the user's machine; there is no service, no infrastructure, and no persistent state beyond a local directory. |
| `I05` | The product has no icon. It has no graphical surface, no installer, and no store listing to display one on. |
| `T05` | No superseded documentation exists. The legacy root-level duplicates of the Python scripts were deleted in 2.0.0 rather than archived, because they had diverged from `python/` and kept no useful history. |
| `L04` to `L06` | English-only, with no string catalogs and no localized builds. Declared in the README. |
| `X01` to `X03` | No interface of this project's own is presented to a user. Keyboard operation, accessible names, and contrast are properties of the MCP client that hosts the conversation. |
| `A01` to `A04` | The repository is not archived. |

## How this was assessed

Each criterion was checked against evidence in the repository or in GitHub's
settings, not against intent. Where a criterion could not be satisfied from a
pull request, it is recorded as failing rather than as pending, so that the
record does not claim a result the repository has not earned.

Regenerate the badge after changing this record:

```sh
python3 scripts/conformance.py --repository .
```

The [conformance workflow](../.github/workflows/conformance.yml) runs the same
check on every push and monthly, and turns red when the badge drifts from the
record or when the assessment ages past the review cadence.
