# DocMistral MCP Server

An MCP (Model Context Protocol) server that provides document-to-Markdown conversion capabilities using Mistral AI's OCR and document processing services.

## Features

- **Document Processing**: Convert PDF, PPTX, and DOCX files to Markdown
- **Image OCR**: Process PNG, JPG, JPEG, GIF, BMP, and AVIF images
- **Batch Processing**: Convert entire directories while preserving structure
- **MCP Integration**: Works with any MCP-compatible client
- **Advanced OCR**: Handles complex layouts, tables, and equations

## Quick Setup

1. **Run the setup script:**
   ```bash
   ./setup_mcp.sh
   ```

2. **Add your Mistral API key to `.env`:**
   ```bash
   MISTRAL_API_KEY=your_actual_api_key_here
   ```

3. **Test the server:**
   ```bash
   source venv/bin/activate
   python mcp_server.py
   ```

## Manual Setup

1. **Install dependencies:**
   ```bash
   pip install -r mcp_requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your MISTRAL_API_KEY
   ```

## MCP Tools Available

### 1. `process_document`
Convert a single document or image to Markdown.

**Parameters:**
- `file_path` (string): Path to the file to process
- OR `base64_content` (string) + `file_name` (string): Base64 encoded content with filename
- `mime_type` (string, optional): MIME type of the file

**Example:**
```json
{
  "name": "process_document",
  "arguments": {
    "file_path": "/path/to/document.pdf"
  }
}
```

### 2. `process_directory`
Batch process all supported files in a directory.

**Parameters:**
- `input_directory` (string): Directory containing files to process
- `output_directory` (string): Directory where Markdown files will be saved

**Example:**
```json
{
  "name": "process_directory", 
  "arguments": {
    "input_directory": "/path/to/input",
    "output_directory": "/path/to/output"
  }
}
```

### 3. `get_supported_formats`
Get information about supported file formats and limitations.

**Example:**
```json
{
  "name": "get_supported_formats",
  "arguments": {}
}
```

## Client Configuration

### Claude Desktop
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "docmistral": {
      "command": "python",
      "args": ["/Users/torstenmahr/GitHub/MistralDocAI-mcp/mcp_server.py"],
      "env": {
        "MISTRAL_API_KEY": "${MISTRAL_API_KEY}"
      }
    }
  }
}
```

### Other MCP Clients
Use the provided `mcp_config.json` as a template, adjusting the paths as needed.

## Supported Formats

### Documents (via Mistral OCR API)
- **PDF** (.pdf)
- **PowerPoint** (.pptx)
- **Word** (.docx)

### Images (via Mistral OCR API)
- **PNG** (.png)
- **JPEG** (.jpg, .jpeg)
- **GIF** (.gif)
- **BMP** (.bmp)
- **AVIF** (.avif)

## Limitations

- **File size limit**: 50 MB per file
- **Page limit**: 1,000 pages per document
- **Processing speed**: Up to 2,000 pages per minute
- **API cost**: $0.001 per page ($1 per 1,000 pages)

## Troubleshooting

### Common Issues

1. **"MISTRAL_API_KEY environment variable is required"**
   - Ensure your `.env` file contains a valid Mistral API key
   - Get your API key from [console.mistral.ai](https://console.mistral.ai/)

2. **"File not found" errors**
   - Verify file paths are absolute, not relative
   - Check file permissions and accessibility

3. **MCP connection issues**
   - Ensure the server path in your client configuration is correct
   - Check that the virtual environment is properly activated

### Debug Mode
Run the server with debug logging:
```bash
PYTHONPATH=/Users/torstenmahr/GitHub/MistralDocAI-mcp python mcp_server.py
```

## Development

The MCP server is built on top of the existing `docmistral.py` functionality, providing these additional capabilities:

- **Async operations**: Non-blocking document processing
- **Base64 support**: Handle file content directly without filesystem access
- **Error handling**: Comprehensive error reporting for MCP clients
- **Logging**: Detailed operation logs for debugging

## API Reference

The server implements the standard MCP protocol with these specific tools. All responses follow the MCP TextContent format for easy integration with clients.