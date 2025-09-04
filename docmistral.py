#!/usr/bin/env python3
"""
DocMistral - Converts documents and images to Markdown using Mistral AI OCR and processing
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional, List
import argparse
from mistralai import Mistral
import pypdf
from PIL import Image
import tempfile
import io
import base64
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MistralDocumentProcessor:
    def __init__(self, mistral_api_key: str):
        """
        Initialize the MistralDocumentProcessor with Mistral AI.
        
        Args:
            mistral_api_key: API key for Mistral AI. Required.
        """
        if not mistral_api_key:
            raise ValueError("Mistral API key is required")
            
        try:
            self.mistral_client = Mistral(api_key=mistral_api_key)
            logger.info("Mistral AI client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Mistral AI client: {e}")
            raise
    
    def extract_images_from_pdf(self, pdf_path: Path) -> List[Image.Image]:
        """
        Extract images from a PDF file for OCR processing.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of PIL Image objects
        """
        images = []
        try:
            with open(pdf_path, 'rb') as file:
                reader = pypdf.PdfReader(file)
                
                for page_num, page in enumerate(reader.pages):
                    if '/XObject' in page['/Resources']:
                        xobjects = page['/Resources']['/XObject'].get_object()
                        
                        for obj_name in xobjects:
                            obj = xobjects[obj_name]
                            if obj['/Subtype'] == '/Image':
                                size = (obj['/Width'], obj['/Height'])
                                data = obj.get_data()
                                
                                if obj['/ColorSpace'] == '/DeviceRGB':
                                    mode = "RGB"
                                else:
                                    mode = "P"
                                
                                try:
                                    img = Image.frombytes(mode, size, data)
                                    images.append(img)
                                except Exception as e:
                                    logger.warning(f"Could not extract image from page {page_num}: {e}")
        except Exception as e:
            logger.error(f"Error extracting images from PDF: {e}")
        
        return images
    
    def perform_ocr_with_mistral(self, image: Image.Image) -> str:
        """
        Perform OCR on an image using Mistral Document AI.
        
        Args:
            image: PIL Image object
            
        Returns:
            Extracted text from the image
        """
        if not self.mistral_client:
            return ""
        
        try:
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                image.save(tmp_file.name)
                tmp_file_path = tmp_file.name
            
            with open(tmp_file_path, 'rb') as img_file:
                img_data = img_file.read()
                base64_img = base64.b64encode(img_data).decode('utf-8')
                
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please extract all text from this image. Format the output as clean text without any additional explanations."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_img}"
                                }
                            }
                        ]
                    }
                ]
                
                response = self.mistral_client.chat.complete(
                    model="pixtral-12b-2409",
                    messages=messages
                )
                
                os.unlink(tmp_file_path)
                return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return ""
    
    def convert_with_mistral_document_ai(self, file_path: Path) -> str:
        """
        Convert a document using Mistral Document AI OCR.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Extracted content as markdown
        """
        if not self.mistral_client:
            raise ValueError("Mistral AI client not initialized. Please provide an API key.")
        
        try:
            logger.info(f"Processing {file_path.name} with Mistral Document AI OCR...")
            
            # Supported document formats by OCR API
            document_formats = ['.pdf', '.pptx', '.docx']
            image_formats = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.avif']
            
            if file_path.suffix.lower() in document_formats:
                # Encode document to base64
                with open(file_path, 'rb') as doc_file:
                    doc_content = doc_file.read()
                    base64_doc = base64.b64encode(doc_content).decode('utf-8')
                
                # Determine MIME type
                mime_types = {
                    '.pdf': 'application/pdf',
                    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
                mime_type = mime_types.get(file_path.suffix.lower(), 'application/octet-stream')
                
                # Process with OCR API
                ocr_response = self.mistral_client.ocr.process(
                    model="mistral-ocr-latest",
                    document={
                        "type": "document_url",
                        "document_url": f"data:{mime_type};base64,{base64_doc}"
                    },
                    include_image_base64=True
                )
                
                # Extract markdown from all pages
                all_content = []
                for page in ocr_response.pages:
                    logger.info(f"Processing page {page.index + 1}...")
                    all_content.append(f"<!-- Page {page.index + 1} -->\n{page.markdown}")
                
                return "\n\n".join(all_content)
                
            elif file_path.suffix.lower() in image_formats:
                # Process image files
                with open(file_path, 'rb') as img_file:
                    img_content = img_file.read()
                    base64_img = base64.b64encode(img_content).decode('utf-8')
                
                ocr_response = self.mistral_client.ocr.process(
                    model="mistral-ocr-latest",
                    document={
                        "type": "image_base64",
                        "document": base64_img
                    }
                )
                
                # Extract markdown from the image
                if ocr_response.pages:
                    return ocr_response.pages[0].markdown
                else:
                    return ""
                    
            else:  # For unsupported formats
                logger.warning(f"File type {file_path.suffix} is not supported by Mistral OCR API.")
                raise ValueError(f"Unsupported file format: {file_path.suffix}")
                
        except Exception as e:
            logger.error(f"Mistral Document AI processing failed: {e}")
            raise
    
    def convert_file(self, input_path: Path, output_path: Path) -> bool:
        """
        Convert a single file using Mistral AI.
        
        Args:
            input_path: Path to the input file
            output_path: Path for the output Markdown file
            
        Returns:
            True if conversion was successful, False otherwise
        """
        try:
            logger.info(f"Converting {input_path} to {output_path} using Mistral AI")
            
            markdown_content = self.convert_with_mistral_document_ai(input_path)
            
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logger.info(f"Successfully converted {input_path.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error converting {input_path}: {e}")
            return False
    
    def process_directory(self, input_dir: Path, output_dir: Path) -> tuple[int, int]:
        """
        Process all PDF and PPTX files in a directory using Mistral AI.
        
        Args:
            input_dir: Path to input directory
            output_dir: Path to output directory
            
        Returns:
            Tuple of (successful conversions, failed conversions)
        """
        supported_extensions = {'.pdf', '.pptx', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.avif'}
        success_count = 0
        failed_count = 0
        
        for file_path in input_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                relative_path = file_path.relative_to(input_dir)
                output_path = output_dir / relative_path.with_suffix('.md')
                
                if self.convert_file(file_path, output_path):
                    success_count += 1
                else:
                    failed_count += 1
        
        return success_count, failed_count


def main():
    parser = argparse.ArgumentParser(description='DocMistral - Convert documents and images to Markdown using Mistral AI')
    parser.add_argument('--input', '-i', type=str, default='input',
                        help='Input directory containing documents and images (default: input)')
    parser.add_argument('--output', '-o', type=str, default='output',
                        help='Output directory for Markdown files (default: output)')
    parser.add_argument('--mistral-api-key', '-k', type=str,
                        help='Mistral AI API key (required, can also use MISTRAL_API_KEY env variable)')
    parser.add_argument('--file', '-f', type=str,
                        help='Convert a single file instead of processing a directory')
    
    args = parser.parse_args()
    
    # Load .env file if it exists
    load_dotenv()
    
    mistral_api_key = args.mistral_api_key or os.getenv('MISTRAL_API_KEY')
    
    if not mistral_api_key:
        logger.error("Mistral API key is required. Provide it via --mistral-api-key or MISTRAL_API_KEY env variable")
        sys.exit(1)
    
    processor = MistralDocumentProcessor(mistral_api_key)
    
    if args.file:
        input_path = Path(args.file)
        if not input_path.exists():
            logger.error(f"File not found: {input_path}")
            sys.exit(1)
        
        output_path = Path(args.output) / input_path.with_suffix('.md').name
        success = processor.convert_file(input_path, output_path)
        
        if success:
            logger.info(f"Conversion completed. Output saved to: {output_path}")
        else:
            logger.error("Conversion failed")
            sys.exit(1)
    else:
        input_dir = Path(args.input)
        output_dir = Path(args.output)
        
        if not input_dir.exists():
            logger.error(f"Input directory not found: {input_dir}")
            sys.exit(1)
        
        logger.info(f"Processing files from {input_dir} to {output_dir} using Mistral AI")
        success_count, failed_count = processor.process_directory(
            input_dir, output_dir
        )
        
        logger.info(f"Conversion completed: {success_count} successful, {failed_count} failed")
        
        if failed_count > 0:
            sys.exit(1)


if __name__ == '__main__':
    main()