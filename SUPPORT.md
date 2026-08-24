# Support

## Before asking

Run the built-in environment check first. It reports most setup problems
directly:

```sh
npx @trsdn/mistraldocai-mcp-server --test
```

## Where to go

| You want to | Go to |
|---|---|
| Report a bug | [Open a bug report](https://github.com/trsdn/MistralDocAI-mcp/issues/new?template=bug.yml) |
| Request a feature | [Open a feature request](https://github.com/trsdn/MistralDocAI-mcp/issues/new?template=feature.yml) |
| Ask a question | [Open an issue](https://github.com/trsdn/MistralDocAI-mcp/issues/new/choose) and say it is a question |
| Report a vulnerability | [Security policy](SECURITY.md). Not a public issue. |
| Understand a change | [CHANGELOG.md](CHANGELOG.md) |

## Common problems

**`Python 3.8+ is required but not found`** — the server could not run `python3`
or `python`. Install Python 3.10 or later and make sure it is on your `PATH`.

**`MISTRAL_API_KEY` errors** — add your key to `~/.mistraldocai-mcp/.env`, or
export it in the environment your MCP client launches the server from. Note that
desktop MCP clients often do not inherit your shell environment, so the file is
usually the reliable option.

**The client shows no tools** — check the client's own log. The server writes
its diagnostics to stderr, which the client captures. Running `--test` from a
terminal reproduces most start-up failures outside the client.

**Installation warns about your Node version** — this package requires Node.js
22 or later. Version 1.x is not a supported fallback; it cannot be installed
from a clean environment.

## Maintenance status

Actively maintained, as a personal project, on a best-effort basis. Bug reports
that include the output of `--test` get answered fastest. There is no service
level agreement, and no commitment to a response time for feature requests.
