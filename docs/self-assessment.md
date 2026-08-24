# Self-assessment

Assessment of `trsdn/MistralDocAI-mcp` against version 1.2.0 of the
[Repository Quality Standard](https://github.com/trsdn/.github/blob/main/docs/repository-quality-standard.md).

| | |
|---|---|
| Standard version | 1.2.0 |
| Assessed on | 2026-08-24 |
| State | Healthy |
| Record | [`.github/conformance.yml`](../.github/conformance.yml) |

**Result:** 63 pass, 2 partial, 0 fail, 18 not applicable.

Nothing fails. The two partials are both waiting on an event rather than on
work: `R03` needs a tag to have produced a release, and `T02` needs a link
checker that has not been adopted.

## Settings applied

These were the three failures. All were repository configuration rather than
code, and all are now in place.

| Criterion | What was missing | What was done |
|---|---|---|
| `B06` | The default branch had no merge policy. Anyone with write access could push straight to `main`, and nothing had to pass first. | A ruleset named `main` targeting the default branch, requiring a pull request, blocking force pushes and branch deletion. Approvals are set to zero so a sole maintainer is not locked out; the gate is the pull request and its checks. Dependabot reports no open alerts. |
| `B09` | `homepage` was unset, so the published package was not linked from the repository header. | Set to the npm package page. Topics and visibility were already deliberate. |
| `B12` | The `trsdn-standard` topic was absent, so this repository was not discoverable as part of the assessed set. | Topic added, alongside the existing descriptive ones. |
| `S09` | No ruleset or branch protection existed, so no required check protected `main`. | The same ruleset requires `Node 24.x / ubuntu-latest`, `Python 3.12`, and `conformance / Conformance record`. |

The last of those names carries the calling job's prefix, because the check comes
from a reusable workflow. Entered without it, the rule would wait on a check that
never reports and block every pull request. Neither `test.yml` nor
`conformance.yml` filters on paths, so all three checks report on every pull
request and none can stall a documentation-only change. Confirmed by the ruleset
being active while pull request #16 reports `CLEAN`.

## Partial results

| Criterion | Assessment |
|---|---|
| `R03` | Trusted publishing over OIDC is configured on npmjs.com, and the release workflow is complete, with `NPM_TOKEN` kept as a fallback. No tag has produced a release asset yet, which is the evidence the criterion asks for. This becomes `pass` on the first successful release. |
| `T02` | Internal links are reviewed by hand. No automated link checker runs, and the standard's `markdown.yml` reusable workflow is not yet adopted here. |

## The release credential

`R03` is `partial`, but not for want of a credential. Authentication is
[trusted publishing](https://docs.npmjs.com/trusted-publishers) over OIDC,
configured on npmjs.com against `trsdn/MistralDocAI-mcp` and `release.yml`, with
the optional environment constraint left unset. The publish job satisfies the
matching rules: it requests `id-token: write`, sets `registry-url`, and runs on
Node 24, whose bundled npm 11.17 supports OIDC. The environment being unset is
what makes the job's own `environment: npm` harmless, since npm checks only the
claims it has been given a constraint for.

`NPM_TOKEN` remains configured as a fallback until a release has published over
OIDC. The token was checked against the registry and authenticates as `trsdn`
with read-write collaborator access, so a release cannot fail for lack of a
credential either way. It should not stay: it is a granular access token that
bypasses 2FA, and npm
[has announced](https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens/)
that such tokens lose direct publish around January 2027, having already lost
package management. The fallback is silent, so the first release's publish log
has to be read to confirm OIDC was actually used before the secret is deleted.

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
settings, not against intent. A criterion that could not be demonstrated was
recorded as failing rather than as pending, so that the record never claims a
result the repository has not earned. The three failures in the first pass were
all repository configuration; they are recorded above as fixed, with what was
actually applied.

Regenerate the badge after changing this record:

```sh
python3 scripts/conformance.py --repository .
```

The [conformance workflow](../.github/workflows/conformance.yml) runs the same
check on every push and monthly, and turns red when the badge drifts from the
record or when the assessment ages past the review cadence.
