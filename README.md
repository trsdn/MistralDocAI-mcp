# DocMistral MCP Server

[![npm version](https://badge.fury.io/js/@mistraldocai%2Fmcp-server.svg)](https://badge.fury.io/js/@mistraldocai%2Fmcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)

A powerful **MCP (Model Context Protocol) server** that converts documents and images to Markdown using Mistral AI's advanced OCR and document processing capabilities. Perfect for integrating document processing into Claude Desktop and other MCP-compatible clients.

## 🚀 Features

### MCP Server Capabilities
- **🔗 MCP Compatible**: Works with Claude Desktop, Continue, and other MCP clients
- **📦 One-Command Install**: `npx @mistraldocai/mcp-server`
- **🔄 Automatic Setup**: Manages Python environment and dependencies
- **🌍 Cross-Platform**: Windows, macOS, and Linux support

### Document Processing
- **📄 Documents**: PDF, PPTX, DOCX via Mistral's OCR API
- **🖼️ Images**: PNG, JPG, JPEG, GIF, BMP, AVIF support
- **🧠 AI-Powered**: Advanced document understanding with complex layouts
- **✍️ OCR Support**: Scanned documents and handwritten text
- **⚡ Fast Processing**: Up to 2,000 pages per minute
- **💰 Cost-Effective**: $0.001 per page ($1 per 1,000 pages)

## 🚀 Quick Start

### Step 1: Install the MCP Server
```bash
# Install and test with one command
npx @mistraldocai/mcp-server --test
```

### Step 2: Get API Key
Get your Mistral API key from [console.mistral.ai](https://console.mistral.ai/)

### Step 3: Configure Your MCP Client

#### For Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mistraldocai": {
      "command": "npx",
      "args": ["@mistraldocai/mcp-server"],
      "env": {
        "MISTRAL_API_KEY": "your_mistral_api_key_here"
      }
    }
  }
}
```

#### For Other MCP Clients
Use the command: `npx @mistraldocai/mcp-server` with environment variable `MISTRAL_API_KEY`

### Step 4: Start Using!
The server provides 2 tools:
- `process_document` - Convert documents/images to Markdown
- `get_supported_formats` - List supported file formats

## Manual Installation (Python Tool)

For direct Python usage:

1. Clone this repository:
```bash
git clone <repository-url>
cd DocMistral
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

### API Key Setup

1. Get a Mistral API key from [console.mistral.ai](https://console.mistral.ai/)

2. Create a `.env` file in the project directory:
```bash
cp .env.example .env
```

3. Edit `.env` and add your API key:
```
MISTRAL_API_KEY=your_api_key_here
```

Alternatively, you can set it as an environment variable:
```bash
export MISTRAL_API_KEY=your_api_key_here
```

## Usage

### MCP Server Usage

The MCP server provides two tools for document processing:

#### 1. Process Single Document
Convert a document or image file to Markdown:
```json
{
  "name": "process_document",
  "arguments": {
    "file_path": "/path/to/document.pdf"
  }
}
```

Or with base64 content (useful for MCP clients):
```json
{
  "name": "process_document",
  "arguments": {
    "base64_content": "base64_encoded_file_content",
    "file_name": "document.pdf"
  }
}
```

#### 2. Get Supported Formats
Get information about supported file formats:
```json
{
  "name": "get_supported_formats",
  "arguments": {}
}
```

### Python Tool Usage

For direct command-line usage:

```bash
# Process all files in the input directory
python docmistral.py

# Convert a single file
python docmistral.py --file document.pdf
```

#### Custom Directories

Specify custom input and output directories:
```bash
python docmistral.py --input /path/to/docs --output /path/to/markdown
```

## Command Line Options

- `--input, -i`: Input directory (default: `input`)
- `--output, -o`: Output directory (default: `output`)
- `--mistral-api-key, -k`: Mistral AI API key (required)
- `--file, -f`: Convert a single file instead of a directory

## Directory Structure

```
DocMistral/
├── docmistral.py       # Main script
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
├── README.md          # This file
├── input/             # Default input directory
│   └── .gitkeep      # Ensures directory is tracked
└── output/            # Default output directory
    └── .gitkeep      # Ensures directory is tracked
```

## Requirements

- Python 3.8+
- See `requirements.txt` for Python package dependencies

## Supported Formats

- **Documents**: PDF, PPTX, DOCX (via OCR API)
- **Images**: PNG, JPG, JPEG, GIF, BMP, AVIF (via OCR API)
- File size limit: 50 MB
- Page limit: 1,000 pages per document

## How it Works

- Uses Mistral's dedicated OCR API (`client.ocr.process`) for all supported formats
- Advanced document understanding handles complex layouts, tables, and equations
- Processes up to 2000 pages per minute
- Pricing: $0.001 per page ($1 per 1,000 pages)

## 🔧 MCP Tools Reference

### `process_document`
Converts documents and images to Markdown format.

**Parameters:**
- `file_path` (string): Path to the document/image file
- OR `base64_content` (string) + `file_name` (string): Base64 content with filename
- `mime_type` (string, optional): MIME type of the file

**Example Usage:**
```json
{
  "name": "process_document",
  "arguments": {
    "file_path": "/path/to/document.pdf"
  }
}
```

**With Base64 Content:**
```json
{
  "name": "process_document",
  "arguments": {
    "base64_content": "base64_encoded_file_content",
    "file_name": "document.pdf"
  }
}
```

### `get_supported_formats`
Lists all supported file formats and their limitations.

**Parameters:** None

**Example Usage:**
```json
{
  "name": "get_supported_formats",
  "arguments": {}
}
```

## 📋 Supported Formats

| Format | Extensions | Processing Method | Notes |
|--------|------------|------------------|-------|
| **Documents** | `.pdf`, `.pptx`, `.docx` | Mistral OCR API | Up to 1,000 pages |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.avif` | Mistral OCR API | Up to 50 MB |

**Limitations:**
- Maximum file size: 50 MB
- Maximum pages: 1,000 per document
- Processing speed: Up to 2,000 pages/minute
- Cost: $0.001 per page

## 🎯 Use Cases

- **Research**: Convert academic papers and reports to Markdown
- **Documentation**: Process technical manuals and guides
- **Data Extraction**: Extract text from scanned documents
- **Content Migration**: Convert legacy documents to modern formats
- **OCR Processing**: Digitize handwritten notes and forms

## 🔌 MCP Compatibility

This server is fully compatible with the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) specification and works with:

- **[Claude Desktop](https://claude.ai/desktop)** - Anthropic's desktop application
- **[Continue](https://continue.dev/)** - VS Code extension
- **[Zed](https://zed.dev/)** - Code editor with MCP support
- **Custom MCP clients** - Any application implementing the MCP protocol

### MCP Registry
This server is available in the MCP ecosystem:
- **Package**: `@mistraldocai/mcp-server`
- **Command**: `npx @mistraldocai/mcp-server`
- **Protocol Version**: MCP 1.0
- **Transport**: stdio

## 🏷️ Tags & Discovery

Find this MCP server using these tags:
- `mcp-server` - MCP compatible server
- `mistral` - Uses Mistral AI
- `ocr` - Optical Character Recognition
- `document-processing` - Document conversion
- `pdf-to-markdown` - PDF conversion
- `image-to-text` - Image text extraction
- `ai-powered` - AI-enhanced processing

## 📦 Installation Methods

### NPX (Recommended)
```bash
npx @mistraldocai/mcp-server
```

### Global Installation
```bash
npm install -g @mistraldocai/mcp-server
mistraldocai-mcp
```

### Local Development
```bash
git clone https://github.com/yourusername/MistralDocAI-mcp.git
cd MistralDocAI-mcp
npm install && npm run build
npm start
```

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd MistralDocAI-mcp

# Install npm dependencies
npm install

# Build TypeScript
npm run build

# Test the build
npm test
```

### Publishing

```bash
npm run build
npm publish
```

## Notes

- The tool preserves the directory structure when converting files
- All documents are processed through Mistral AI for consistency
- Output files are saved with the `.md` extension
- Supports fallback processing for edge cases
- API key is required for all operations
- The MCP server automatically manages Python virtual environments
- Cross-platform support (Windows, macOS, Linux)