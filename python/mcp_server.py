#!/usr/bin/env python3
"""
MCP Server for DocMistral - Document to Markdown converter using Mistral AI
"""

import os
import sys
import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
import tempfile
import base64

from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
import mcp.server.stdio
from pydantic import BaseModel

from docmistral import MistralDocumentProcessor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize the MCP server
app = Server("docmistral-mcp")

# Global processor instance
processor: Optional[MistralDocumentProcessor] = None

class ProcessDocumentRequest(BaseModel):
    """Request model for processing documents"""
    file_path: Optional[str] = None
    base64_content: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None

def initialize_processor():
    """Initialize the Mistral document processor"""
    global processor
    
    mistral_api_key = os.getenv('MISTRAL_API_KEY')
    if not mistral_api_key:
        raise ValueError("MISTRAL_API_KEY environment variable is required")
    
    processor = MistralDocumentProcessor(mistral_api_key)
    logger.info("Mistral document processor initialized")

@app.list_tools()
async def list_tools() -> List[Tool]:
    """List available MCP tools"""
    return [
        Tool(
            name="process_document",
            description="Convert documents and images to Markdown using Mistral AI OCR",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the document file to process"
                    },
                    "base64_content": {
                        "type": "string",
                        "description": "Base64 encoded content of the file (alternative to file_path)"
                    },
                    "file_name": {
                        "type": "string",
                        "description": "Original file name (required when using base64_content)"
                    },
                    "mime_type": {
                        "type": "string",
                        "description": "MIME type of the file (optional, will be inferred from file extension)"
                    }
                },
                "anyOf": [
                    {"required": ["file_path"]},
                    {"required": ["base64_content", "file_name"]}
                ]
            }
        ),
        Tool(
            name="get_supported_formats",
            description="Get list of supported document and image formats",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls"""
    global processor
    
    if processor is None:
        try:
            initialize_processor()
        except Exception as e:
            return [TextContent(type="text", text=f"Error initializing processor: {str(e)}")]
    
    try:
        if name == "process_document":
            return await handle_process_document(arguments)
        elif name == "get_supported_formats":
            return await handle_get_supported_formats()
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    except Exception as e:
        logger.error(f"Error in tool {name}: {str(e)}")
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def handle_process_document(arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle document processing requests"""
    file_path = arguments.get("file_path")
    base64_content = arguments.get("base64_content")
    file_name = arguments.get("file_name")
    
    if file_path:
        # Process file from path
        input_path = Path(file_path)
        if not input_path.exists():
            return [TextContent(type="text", text=f"File not found: {file_path}")]
        
        try:
            markdown_content = processor.convert_with_mistral_document_ai(input_path)
            return [TextContent(
                type="text", 
                text=f"Document processed successfully:\n\n{markdown_content}"
            )]
        except Exception as e:
            return [TextContent(type="text", text=f"Processing failed: {str(e)}")]
    
    elif base64_content and file_name:
        # Process base64 content
        try:
            # Create temporary file
            file_extension = Path(file_name).suffix.lower()
            with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False) as tmp_file:
                content = base64.b64decode(base64_content)
                tmp_file.write(content)
                tmp_file_path = Path(tmp_file.name)
            
            try:
                markdown_content = processor.convert_with_mistral_document_ai(tmp_file_path)
                return [TextContent(
                    type="text",
                    text=f"Document processed successfully:\n\n{markdown_content}"
                )]
            finally:
                # Clean up temporary file
                if tmp_file_path.exists():
                    tmp_file_path.unlink()
                    
        except Exception as e:
            return [TextContent(type="text", text=f"Processing failed: {str(e)}")]
    
    else:
        return [TextContent(type="text", text="Either file_path or (base64_content + file_name) is required")]


async def handle_get_supported_formats() -> List[TextContent]:
    """Return supported file formats"""
    formats_info = """Supported File Formats:

**Documents** (processed via Mistral OCR API):
- PDF (.pdf)
- PowerPoint (.pptx) 
- Word (.docx)

**Images** (processed via Mistral OCR API):
- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- BMP (.bmp)
- AVIF (.avif)

**Limitations:**
- File size limit: 50 MB
- Page limit: 1,000 pages per document
- Processing speed: up to 2,000 pages per minute
- Pricing: $0.001 per page ($1 per 1,000 pages)

**Features:**
- Advanced document understanding
- Complex layout handling (tables, equations)
- OCR for scanned documents and handwritten text
- Batch processing with directory structure preservation
"""
    
    return [TextContent(type="text", text=formats_info)]

async def main():
    """Main entry point for the MCP server"""
    try:
        # Initialize processor on startup
        initialize_processor()
        logger.info("DocMistral MCP Server starting...")
        
        # Run the server
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options()
            )
    except KeyboardInterrupt:
        logger.info("Server interrupted by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())