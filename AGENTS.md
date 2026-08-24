# Agent instructions

Read this before changing anything in this repository.

## What this repository is

An MCP (Model Context Protocol) server that converts documents and images to
Markdown using Mistral AI's OCR and vision models. It ships as the npm package
`@trsdn/mistraldocai-mcp-server` and is consumed by MCP clients such as Claude
Desktop, which launch it over stdio and call its tools. A change that breaks
start-up, the tool contract, or the published tarball breaks every client that
has it configured, silently, until someone restarts their client.

The package is a thin Node.js wrapper around a Python server. Node owns the CLI,
the managed virtual environment under `~/.mistraldocai-mcp/`, and the process
lifecycle. Python owns the actual MCP protocol handling and the Mistral calls.

## What this repository is not

It is not a general-purpose OCR library, and it is not the Mistral SDK. It has
no HTTP surface: MCP clients speak to it over stdin and stdout, which is why
every diagnostic message goes to stderr. Writing to stdout corrupts the
protocol stream.

## Layout

| Path | Purpose |
|---|---|
| `src/` | TypeScript CLI and process supervision. Compiled to `dist/`. |
| `src/python-environment.ts` | Interpreter discovery, virtual environment, dependency install. The seam that makes start-up testable. |
| `python/mcp_server.py` | The MCP server itself: tool definitions and dispatch. |
| `python/docmistral.py` | Document conversion and all Mistral API calls. |
| `python/mcp_requirements.txt` | Python runtime dependencies. Every entry needs an upper bound. |
| `scripts/setup.js` | npm `postinstall` hook. Must stay non-fatal; clients install without it. |
| `scripts/verify_python_server.py` | Asserts the Python tool contract. The regression guard for the 1.0.4 breakage. |
| `tests/` | Jest unit tests. `tests/support/` holds test doubles. |
| `docs/self-assessment.md` | Per-criterion evidence behind `.github/conformance.yml`. |

- Generated, never hand-edit: `dist/` (`npm run build`), `package-lock.json`
  (npm), `coverage/` (`npm run test:coverage`), `.github/badges/conformance.svg`
  (generated from `.github/conformance.yml` by the conformance workflow).
- Everything else is hand-maintained.

## Setup

```sh
npm ci
```

Requires Node.js 22 or later and Python 3.10 or later. The Node floor is pinned
in `engines.node` in `package.json`; the Python floor is enforced at run time by
`isSupportedPythonVersion` in `src/python-environment.ts` and declared in
`python/mcp_requirements.txt`.

The Python dependencies are installed into a managed virtual environment on
first run, not by `npm ci`. To create it without starting a client:

```sh
npm run build && npm run test:smoke
```

## Run

```sh
npm run build
node dist/index.js          # start the server on stdio
node dist/index.js --test   # verify the environment and exit
```

A `MISTRAL_API_KEY` is required for real conversions. Put it in
`~/.mistraldocai-mcp/.env`, which is seeded from `python/.env.example` on first
run. Never put it in the repository.

## Validate before proposing a change

This is the single command that must succeed:

```sh
npm run verify
```

It runs ESLint, the TypeScript build, and the Jest suite with coverage
thresholds. A coverage failure is a real failure: it means new code arrived
without tests.

If you touched anything under `python/`, this must also pass, against an
interpreter that has `python/mcp_requirements.txt` installed:

```sh
ruff check .
python3 scripts/verify_python_server.py
```

`verify_python_server.py` imports the server and asserts its tools and their
schemas. It exists because release 1.0.4 shipped a server that could not be
imported at all, and no existing check noticed.

## Conventions

- **Never write to stdout** outside the MCP protocol stream. Diagnostics go to
  `console.error` in TypeScript and to stderr in Python. This is not a style
  preference; stdout is the protocol.
- **Python dependencies need upper bounds.** An unbounded `>=` is what broke
  1.0.4. New entries in `python/mcp_requirements.txt` must be capped below the
  next major.
- **Console output stays ASCII.** Windows terminals and screen readers both
  handle it badly otherwise. Use `+`, `X`, and `Warning:` rather than symbols.
- **Keep start-up testable.** `src/index.ts` depends on the `PythonEnvironment`
  interface, never on `child_process` directly, so tests can substitute
  `tests/support/fake-python-environment.ts` instead of building a real
  virtual environment.
- **Identity comes from the manifest.** `--version` and `--help` read
  `package.json`. Do not hardcode a version, URL, or package name anywhere.

## Do not do these

- Do not rewrite history, force push, or delete branches.
- Do not commit secrets, tokens, credentials, or personal data. `python/.env`
  and `~/.mistraldocai-mcp/.env` hold a real API key and are git-ignored;
  `python/.env.example` is the only one that is tracked.
- Do not widen the `files` list in `package.json` to whole directories. It
  previously covered `python/`, which packed a local `.env` into every published
  tarball.
- Do not run `npm publish` by hand, create or move tags, or create GitHub
  releases. Releases are produced by `.github/workflows/release.yml` from a
  `v*` tag pushed by the maintainer.
- Do not change repository settings, rulesets, or secrets.
- Do not call the Mistral API from tests. It costs money and needs a real key;
  tests use fakes.
- Do not hand-edit `dist/`, `package-lock.json`, or
  `.github/badges/conformance.svg`.
- Do not add a runtime dependency without saying in the pull request why the
  standard library or an existing dependency will not do.

## Attribution

Agent-authored commits carry a `Co-authored-by` trailer naming the agent. Every
change reaches `main` through a pull request that a human reviews, regardless of
who or what wrote it.
