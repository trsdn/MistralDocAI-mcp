#!/usr/bin/env python3
"""Verify that the packaged Python MCP server is usable.

This is the regression guard for the failure that broke release 1.0.4: an
unbounded `mcp>=1.0.0` requirement resolved to the incompatible 2.x API, so
every fresh install crashed on import. Importing the module and listing its
tools is exactly what a client does on start-up.

Run from the repository root:

    python3 scripts/verify_python_server.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPOSITORY_ROOT / "python"))

EXPECTED_TOOLS = {
    "process_document": {"file_path", "base64_content", "file_name", "mime_type"},
    "process_directory": {"input_directory", "output_directory"},
    "get_supported_formats": set(),
}


async def verify() -> list[str]:
    """Return a list of problems; empty means the server contract holds."""
    from mcp_server import app

    problems: list[str] = []
    tools = {tool.name: tool for tool in await app.list_tools()}

    missing = sorted(set(EXPECTED_TOOLS) - set(tools))
    if missing:
        problems.append(f"missing tools: {', '.join(missing)}")

    for name, expected_parameters in EXPECTED_TOOLS.items():
        tool = tools.get(name)
        if tool is None:
            continue

        schema = getattr(tool, "input_schema", None) or getattr(tool, "inputSchema", {})
        actual_parameters = set(schema.get("properties", {}))
        if actual_parameters != expected_parameters:
            problems.append(
                f"{name}: expected parameters {sorted(expected_parameters)}, "
                f"got {sorted(actual_parameters)}"
            )

        if not tool.description:
            problems.append(f"{name}: tool has no description")

    return problems


def main() -> int:
    try:
        problems = asyncio.run(verify())
    except Exception as error:  # noqa: BLE001 - the import failure is the point
        print(f"FAIL: the MCP server could not be loaded: {error!r}", file=sys.stderr)
        return 1

    if problems:
        for problem in problems:
            print(f"FAIL: {problem}", file=sys.stderr)
        return 1

    print(f"OK: {len(EXPECTED_TOOLS)} tools exposed by the MCP server")
    return 0


if __name__ == "__main__":
    sys.exit(main())
