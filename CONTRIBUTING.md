# Contributing

Thanks for contributing. This project has a two-language toolchain, so the setup
is slightly more involved than a typical npm package.

The [Code of Conduct](https://github.com/trsdn/.github/blob/main/CODE_OF_CONDUCT.md)
applies to every project space here.

## Before you start

Open an issue for bugs, new capabilities, or anything that changes behavior, so
the approach can be agreed before implementation. Small, focused pull requests
are reviewed faster than broad ones.

If you are using an AI agent, point it at [AGENTS.md](AGENTS.md) first. It holds
the layout, the conventions, and the operations that are off limits.

## Set up

You need Node.js 22 or later and Python 3.10 or later.

```sh
npm ci
npm run build
```

The Python dependencies live in a managed virtual environment under
`~/.mistraldocai-mcp/`, not in the repository. Create it with:

```sh
npm run test:smoke
```

## Validate before review

This must succeed:

```sh
npm run verify
```

It runs ESLint, the TypeScript build, and the Jest suite with coverage
thresholds enforced. A coverage failure means new code arrived without tests,
which is a real failure rather than a nuisance.

If you changed anything under `python/`, also run, using an interpreter that has
`python/mcp_requirements.txt` installed:

```sh
ruff check .
python3 scripts/verify_python_server.py
```

The second command imports the MCP server and asserts its tool contract. Release
1.0.4 shipped a server that could not be imported at all, and nothing caught it.
That check exists so it cannot happen again.

## Things that will get a pull request sent back

- **Writing to stdout.** MCP clients speak the protocol over stdout. Diagnostics
  belong on stderr.
- **An unbounded Python dependency.** Every entry in
  `python/mcp_requirements.txt` needs an upper bound below the next major. This
  is exactly what broke 1.0.4.
- **Non-ASCII console output.** Windows terminals and screen readers both mangle
  it.
- **A hardcoded version, URL, or package name.** Identity is read from
  `package.json` at run time.
- **Behavior changes without tests.** Failure paths count as behavior.

## Open a pull request

- Describe the problem, the change, and how you verified it.
- Link the related issue.
- Call out user-visible, operational, security, or compatibility impact.
- Update [CHANGELOG.md](CHANGELOG.md) under `## Unreleased` when the change is
  user-visible.
- Never include secrets, credentials, or personal data. If you tested against
  the real Mistral API, make sure your key did not reach a log, a fixture, or a
  screenshot.

## Releases

Releases are cut by the maintainer. A `v*` tag triggers
`.github/workflows/release.yml`, which verifies that the tag matches
`package.json`, that the changelog documents the version, and that the built
tarball installs and runs in a clean project before anything is published.

Do not run `npm publish` by hand, and do not create tags or GitHub releases.

The quality expectations behind this project are described in the
[Repository Quality Standard](https://github.com/trsdn/.github/blob/main/docs/repository-quality-standard.md).
