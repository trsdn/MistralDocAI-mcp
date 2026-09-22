# MistralDocAI MCP Server

[![License](https://img.shields.io/github/license/trsdn/MistralDocAI-mcp)](LICENSE)
[![Node.js](https://img.shields.io/node/v/@trsdn/mistraldocai-mcp-server)](package.json)
[![CI](https://github.com/trsdn/MistralDocAI-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/trsdn/MistralDocAI-mcp/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/@trsdn/mistraldocai-mcp-server)](https://www.npmjs.com/package/@trsdn/mistraldocai-mcp-server)
[![Conformance](.github/badges/conformance.svg)](docs/self-assessment.md)

An [MCP](https://modelcontextprotocol.io/) server that converts documents and
images to Markdown using Mistral AI's OCR and vision models. Point it at a PDF,
a slide deck, a Word document, or a scanned image, and your MCP client gets
Markdown back.

It is for people who already use an MCP client such as Claude Desktop and want
document conversion inside it, rather than as a separate tool.

**Status:** actively maintained, best-effort, as a personal project. Version 2.0
is current. See [Versioning and compatibility](#versioning-and-compatibility)
before upgrading from 1.x.

**Language:** this project is English-only. Interface text, documentation, and
error messages are English, and no localized builds are published. Documents you
process may be in any language Mistral's models support.

## Requirements

| | |
|---|---|
| Node.js | 22 or later, declared in `engines.node` in [`package.json`](package.json) |
| Python | 3.10 or later, on your `PATH` as `python3` or `python` |
| Mistral API key | Free to create at [console.mistral.ai](https://console.mistral.ai/) |
| Platforms | Linux, macOS, and Windows, all covered by CI |

You do not install the Python dependencies yourself. The server creates a
virtual environment under `~/.mistraldocai-mcp/` on first run.

## Install

Verify that your machine can run it:

```sh
npx @trsdn/mistraldocai-mcp-server --test
```

That creates the Python environment, installs the dependencies, imports the
server, and reports what it found. Run it before configuring a client, because
it turns a silent client-side failure into a readable error.

## Configure

### Your API key

Either export it in the environment your client launches the server from:

```sh
export MISTRAL_API_KEY=your_key_here
```

Or put it in `~/.mistraldocai-mcp/.env`, which the server seeds on first run:

```text
MISTRAL_API_KEY=your_key_here
```

The file is usually the more reliable option, because desktop MCP clients often
do not inherit your shell environment.

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mistraldocai": {
      "command": "npx",
      "args": ["@trsdn/mistraldocai-mcp-server"],
      "env": {
        "MISTRAL_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Other clients

Any client that launches an MCP server over stdio works. Use
`npx @trsdn/mistraldocai-mcp-server` as the command and provide
`MISTRAL_API_KEY` in the environment.

## Tools

### `process_document`

Converts one document or image to Markdown. Give it either a path or base64
content.

| Parameter | Type | Notes |
|---|---|---|
| `file_path` | string | Path to the file. Use this or `base64_content`. |
| `base64_content` | string | File content, base64 encoded. Requires `file_name`. |
| `file_name` | string | Original file name, used to determine the format. |
| `mime_type` | string | Optional. Inferred from the extension when omitted. |

```json
{ "name": "process_document", "arguments": { "file_path": "/path/to/report.pdf" } }
```

### `process_directory`

Converts every supported file in a directory, writing one `.md` file per input
and preserving the directory structure.

| Parameter | Type | Notes |
|---|---|---|
| `input_directory` | string | Directory to read. |
| `output_directory` | string | Directory to write Markdown into. |

### `get_supported_formats`

Returns the supported formats and their limits. Takes no parameters.

## Supported formats

| Kind | Extensions |
|---|---|
| Documents | `.pdf`, `.pptx`, `.docx` |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.avif` |

Limits are set by Mistral's OCR API: 50 MB per file and 1,000 pages per
document. Pricing and throughput are Mistral's, not this project's; check
[their pricing page](https://mistral.ai/pricing) for current figures rather than
trusting a number copied into a README.

## Data and privacy

**Documents you process are sent to Mistral AI.** This is the entire point of
the server, but it means the content leaves your machine. Do not process
material you are not permitted to share with a third-party AI provider.

| Question | Answer |
|---|---|
| What is collected | Nothing by this project. It has no telemetry, no analytics, and no crash reporting. |
| Where data goes | `api.mistral.ai`, to convert your document. That is the only outbound destination, other than PyPI and npm during installation. |
| Who receives your content | [Mistral AI](https://mistral.ai/). Their [privacy policy](https://mistral.ai/terms) governs what they do with it. |
| What is stored locally | `~/.mistraldocai-mcp/.env` holds your API key. `~/.mistraldocai-mcp/venv/` holds the Python environment. Converted Markdown goes wherever you asked for it. |
| Retention | This project keeps nothing beyond those files. Delete `~/.mistraldocai-mcp/` to remove everything it created. Retention at Mistral is governed by their terms. |
| Logging | Diagnostics go to stderr and never include your API key or document content. |

## Accessibility

Console output is plain ASCII with no colour and no decorative symbols, so it
stays readable in a screen reader, in a Windows terminal, and in a client log
that strips formatting.

Known limitation: the server has no interface of its own. Everything you see
comes from your MCP client, so keyboard access, focus handling, and contrast are
your client's behaviour, not this project's. Accessibility problems in the
conversation view belong in your client's issue tracker.

## Versioning and compatibility

This project follows [Semantic Versioning](https://semver.org/). A major version
is where the Node floor rises, the Python `mcp` dependency crosses a major, or a
tool's contract changes.

Upgrading from 1.x requires Node.js 22 or later. Version 1.0.4 and earlier
cannot be installed from a clean environment at all: their Python requirements
were unbounded and now resolve to incompatible releases. There is no supported
1.x fallback. The full account is in [CHANGELOG.md](CHANGELOG.md).

## How it works

```text
MCP client  --stdio-->  dist/index.js  --spawn-->  python/mcp_server.py  --HTTPS-->  api.mistral.ai
                             |                            |
                    manages ~/.mistraldocai-mcp/    docmistral.py does the
                    venv, deps, and .env            conversion
```

Two constraints explain most of the design:

- **stdout is the protocol.** The MCP client parses stdout as JSON-RPC, so every
  diagnostic in both languages goes to stderr. A stray `print` corrupts the
  session.
- **The package directory is read-only.** A global npm install cannot be written
  to, so the virtual environment, the `.env`, and all other state live under
  `~/.mistraldocai-mcp/`.

## Development

```sh
git clone https://github.com/trsdn/MistralDocAI-mcp.git
cd MistralDocAI-mcp
npm ci
npm run build
```

Validate a change with the single command that CI also runs:

```sh
npm run verify
```

If you changed anything under `python/`, also run `ruff check .` and
`python3 scripts/verify_python_server.py` against an interpreter that has
`python/mcp_requirements.txt` installed.

[AGENTS.md](AGENTS.md) holds the full layout, conventions, and the list of
operations that are off limits. It is written for AI agents, and it is the
fastest orientation for a human too.

## Repository stats

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/trsdn/MistralDocAI-mcp/stats/.github/stats/repo-card-dark.svg">
  <img alt="Repository statistics" src="https://raw.githubusercontent.com/trsdn/MistralDocAI-mcp/stats/.github/stats/repo-card.svg">
</picture>

Generated on a schedule by [`.github/workflows/stats.yml`](.github/workflows/stats.yml)
and committed to the `stats` branch; the image is a 404 until the first run.

## Project documents

| Document | What it covers |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release, and upgrade concerns |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, validation, and what gets a pull request sent back |
| [AGENTS.md](AGENTS.md) | Repository layout, conventions, and forbidden operations |
| [SECURITY.md](SECURITY.md) | Supported versions and private vulnerability reporting |
| [SUPPORT.md](SUPPORT.md) | Common problems and where to ask |
| [docs/self-assessment.md](docs/self-assessment.md) | Conformance against the repository quality standard |

## License

[MIT](LICENSE).

This repository is assessed against the
[trsdn Repository Quality Standard](https://github.com/trsdn/.github/blob/main/docs/repository-quality-standard.md).
The result is recorded in [`.github/conformance.yml`](.github/conformance.yml),
with per-criterion evidence in [docs/self-assessment.md](docs/self-assessment.md).
