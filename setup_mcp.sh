#!/bin/bash
# Setup script for DocMistral MCP Server

echo "Setting up DocMistral MCP Server..."

# Check if Python 3.8+ is installed
python3 --version >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Python 3.8+ is required"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install MCP requirements
echo "Installing MCP requirements..."
pip install -r mcp_requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file and add your MISTRAL_API_KEY"
else
    echo ".env file already exists"
fi

# Make the MCP server executable
chmod +x mcp_server.py

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your Mistral API key"
echo "2. Test the MCP server: python mcp_server.py"
echo "3. Configure your MCP client to use the server (see mcp_config.json)"
echo ""
echo "MCP Server command: python $(pwd)/mcp_server.py"