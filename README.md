# DocMistral

A Python tool that converts documents and images to Markdown using Mistral AI's powerful OCR and document processing capabilities.

## Features

- Convert PDF, PPTX, and DOCX files using Mistral's OCR API
- Process image files (PNG, JPG, JPEG, GIF, BMP, AVIF)
- Advanced document understanding with AI
- OCR support for scanned documents and handwritten text
- Batch processing of entire directories
- Preserves directory structure in output
- Environment variable support via .env file

## Installation

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

### Basic Usage

```bash
# Process all files in the input directory
python docmistral.py

# Convert a single file
python docmistral.py --file document.pdf
```

### Custom Directories

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

## Notes

- The tool preserves the directory structure when converting files
- All documents are processed through Mistral AI for consistency
- Output files are saved with the `.md` extension
- Supports fallback processing for edge cases
- API key is required for all operations