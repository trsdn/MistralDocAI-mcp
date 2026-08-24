# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 2.0.0 - 2026-08-24

Release 1.0.4 could not be installed. `python/mcp_requirements.txt` declared
`mcp>=1.0.0` and `mistralai>=0.0.12` with no upper bound, so a fresh install
resolved both to incompatible 2.x majors and the server crashed on import
before a client could list a single tool. This release repairs that path and
adds the checks that would have caught it.

### Breaking

- **Node.js 22 or later is now required.** Node 18 and 20 have both reached end
  of life, and the previous floor of Node 18 no longer receives security fixes.
- **The Python server now targets `mcp` 2.x.** Anyone pinning `mcp` 1.x in a
  hand-managed environment must upgrade. The managed virtual environment under
  `~/.mistraldocai-mcp/` handles this automatically.

### Fixed

- Bound every Python requirement below the next major version, so an install
  can no longer silently resolve to an incompatible API.
- Ported the MCP server to the `mcp` 2.x `MCPServer` API and restored the
  `process_directory` tool alongside `process_document` and
  `get_supported_formats`.
- Corrected the `mistralai` 2.x import path, which moved to `mistralai.client`.
- Fixed a dependency check that compared `pip freeze` output against a
  requirement specifier. It never matched, so every server start reinstalled
  the entire Python environment.
- Stopped packing `python/.env` and `__pycache__` into the published tarball.
  The file list covered `python/` wholesale, so a real API key present on the
  publishing machine would have been published. No released version contained
  a real key.

### Added

- `scripts/verify_python_server.py`, which imports the server and asserts its
  tool contract. It runs across Python 3.10 to 3.13 in CI and is the regression
  guard for the failure that broke 1.0.4.
- A release pipeline that verifies the tag against `package.json`, requires a
  changelog entry, installs the built tarball into a clean project, publishes
  with npm provenance, and then creates the GitHub release.
- ESLint and Ruff, so `npm run lint` performs real static analysis instead of
  silently succeeding.
- `npm run verify`, which runs lint, build, and tests in one command.

### Changed

- Replaced the `which` dependency with a version probe that both locates the
  interpreter and proves it runs.
- CI now covers Node 22 and 24, Python 3.10 to 3.13, and an end-to-end setup
  test on Linux, macOS, and Windows.
- Dependabot now tracks the Python requirements in `python/`, where they live.

## 1.0.4 - 2025-09-09

### Fixed

- Moved console output to stderr so that it cannot corrupt the MCP JSON
  protocol stream.
- Created the Python virtual environment under the user's home directory rather
  than inside the installed package, which is read-only for global installs.

## 1.0.3 - 2025-09-09

### Fixed

- Raised the documented Python requirement to 3.10 or later.

## 1.0.2 - 2025-09-09

### Fixed

- Corrected the repository and package URLs in the documentation.

## 1.0.1 - 2025-09-08

### Fixed

- Replaced Unicode characters in console output with ASCII for Windows
  compatibility.

## 1.0.0 - 2025-09-08

### Added

- Initial release: an MCP server that converts documents and images to Markdown
  using Mistral AI OCR, with `process_document`, `process_directory`, and
  `get_supported_formats` tools.

[Unreleased]: https://github.com/trsdn/MistralDocAI-mcp/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/trsdn/MistralDocAI-mcp/compare/v1.0.4...v2.0.0
[1.0.4]: https://github.com/trsdn/MistralDocAI-mcp/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/trsdn/MistralDocAI-mcp/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/trsdn/MistralDocAI-mcp/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/trsdn/MistralDocAI-mcp/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/trsdn/MistralDocAI-mcp/releases/tag/v1.0.0
