import os
import tempfile
import io
import easyocr
import pdfplumber

class OCREngine:
    def __init__(self):
        # Load the English model into memory (GPU enabled if available)
        self.reader = easyocr.Reader(['en'], gpu=False)

    async def extract_text_from_image(self, file_bytes: bytes) -> str:
        """Extracts raw text from an image using EasyOCR."""
        try:
            # EasyOCR can read directly from bytes in most recent versions,
            # but using a temp file ensures absolute compatibility.
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
                
            results = self.reader.readtext(temp_path, detail=0)
            os.remove(temp_path)
            
            # Combine all detected text blocks into a single document string
            return "\n".join(results)
        except Exception as e:
            raise RuntimeError(f"OCR Image extraction failed: {str(e)}")

    async def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extracts text from a PDF. If it's a scanned PDF, falls back to OCR on images."""
        extracted_text = []
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text.append(text)
                    else:
                        # Fallback: Render page to image and use EasyOCR for scanned PDFs
                        im = page.to_image(resolution=200)
                        # Save to temp bytes
                        img_byte_arr = io.BytesIO()
                        im.original.save(img_byte_arr, format='PNG')
                        img_bytes = img_byte_arr.getvalue()
                        page_text = await self.extract_text_from_image(img_bytes)
                        extracted_text.append(page_text)
                        
            return "\n".join(extracted_text)
        except Exception as e:
            raise RuntimeError(f"PDF extraction failed: {str(e)}")

ocr_engine = OCREngine()
