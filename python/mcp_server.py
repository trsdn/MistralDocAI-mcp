#!/usr/bin/env python3
"""MCP server for DocMistral - document to Markdown conversion using Mistral AI.

Diagnostics go to stderr only. stdout carries the MCP JSON-RPC stream and must
never be written to directly.
"""

import base64
import logging
import os
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from mcp.server import MCPServer

from docmistral import MistralDocumentProcessor

# Installed globally by the npm wrapper, so the user's configuration lives in
# their home directory. A local .env is honoured for development checkouts.
_USER_ENV_FILE = Path.home() / ".mistraldocai-mcp" / ".env"
load_dotenv(_USER_ENV_FILE if _USER_ENV_FILE.exists() else None)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

app = MCPServer("docmistral-mcp")

_processor: MistralDocumentProcessor | None = None

SUPPORTED_EXTENSIONS = (
    ".pdf",
    ".pptx",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".avif",
)


def get_processor() -> MistralDocumentProcessor:
    """Return the shared processor, creating it on first use.

    Initialisation is lazy so that importing this module - which is how the
    npm wrapper verifies the installation - never requires an API key.
    """
    global _processor

    if _processor is None:
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError(
                "MISTRAL_API_KEY is not set. Add it to "
                f"{Path.home() / '.mistraldocai-mcp' / '.env'} or export it in the environment."
            )
        _processor = MistralDocumentProcessor(api_key)
        logger.info("Mistral document processor initialized")

    return _processor


@app.tool(
    description="Convert a document or image to Markdown using Mistral AI OCR. "
    "Provide either file_path, or base64_content together with file_name."
)
async def process_document(
    file_path: str | None = None,
    base64_content: str | None = None,
    file_name: str | None = None,
    mime_type: str | None = None,
) -> str:
    """Convert a single document or image to Markdown."""
    del mime_type  # Inferred from the file extension.

    try:
        processor = get_processor()
    except ValueError as error:
        return f"Error: {error}"

    if file_path:
        source = Path(file_path)
        if not source.exists():
            return f"File not found: {file_path}"

        try:
            return processor.convert_with_mistral_document_ai(source)
        except Exception as error:  # noqa: BLE001 - surfaced to the MCP client
            logger.error("Processing failed for %s: %s", source.name, error)
            return f"Processing failed: {error}"

    if base64_content and file_name:
        suffix = Path(file_name).suffix.lower()
        temporary_path: Path | None = None

        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as handle:
                handle.write(base64.b64decode(base64_content))
                temporary_path = Path(handle.name)

            return processor.convert_with_mistral_document_ai(temporary_path)
        except Exception as error:  # noqa: BLE001 - surfaced to the MCP client
            logger.error("Processing failed for %s: %s", file_name, error)
            return f"Processing failed: {error}"
        finally:
            if temporary_path is not None and temporary_path.exists():
                temporary_path.unlink()

    return "Either file_path or (base64_content and file_name) is required."


@app.tool(
    description="Convert every supported document in a directory to Markdown, "
    "preserving the directory structure."
)
async def process_directory(input_directory: str, output_directory: str) -> str:
    """Batch convert a directory tree."""
    try:
        processor = get_processor()
    except ValueError as error:
        return f"Error: {error}"

    source = Path(input_directory)
    if not source.is_dir():
        return f"Directory not found: {input_directory}"

    try:
        succeeded, failed = processor.process_directory(source, Path(output_directory))
    except Exception as error:  # noqa: BLE001 - surfaced to the MCP client
        logger.error("Batch processing failed for %s: %s", input_directory, error)
        return f"Batch processing failed: {error}"

    return (
        f"Converted {succeeded} file(s) to {output_directory}. "
        f"{failed} file(s) failed; see the server log for details."
    )


@app.tool(description="List the document and image formats this server can convert.")
async def get_supported_formats() -> str:
    """Describe the supported formats and the known service limits."""
    extensions = ", ".join(SUPPORTED_EXTENSIONS)

    return f"""Supported formats (all processed via the Mistral OCR API): {extensions}

Limits imposed by the Mistral OCR API:
- 50 MB per file
- 1,000 pages per document

Capabilities:
- Layout-aware extraction, including tables and equations
- OCR for scanned documents and handwriting
- Batch conversion that preserves the directory structure
"""


def main() -> None:
    """Run the MCP server on the stdio transport."""
    try:
        app.run("stdio")
    except KeyboardInterrupt:
        logger.info("Server interrupted by user")
    except Exception as error:  # noqa: BLE001 - top-level guard
        logger.error("Server error: %s", error)
        sys.exit(1)


if __name__ == "__main__":
    main()
