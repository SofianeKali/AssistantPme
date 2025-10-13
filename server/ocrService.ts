import Tesseract from 'tesseract.js';

// pdf-parse is a CommonJS module, we need to import it dynamically
async function loadPdfParse() {
  const pdfParse = await import('pdf-parse');
  return pdfParse.default || pdfParse;
}

/**
 * Extract text from an image buffer using Tesseract OCR
 */
export async function extractTextFromImage(buffer: Buffer, language: string = 'fra+eng'): Promise<string> {
  try {
    console.log('[OCR] Starting image text extraction...');
    
    const result = await Tesseract.recognize(buffer, language, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    console.log(`[OCR] Extraction complete. Extracted ${result.data.text.length} characters`);
    return result.data.text.trim();
  } catch (error) {
    console.error('[OCR] Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from a PDF buffer
 * Note: This works best for text-based PDFs. For scanned PDFs, use extractTextFromImage on each page
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('[OCR] Starting PDF text extraction...');
    
    const pdfParse = await loadPdfParse();
    const data = await pdfParse(buffer);
    
    console.log(`[OCR] PDF extraction complete. Extracted ${data.text.length} characters from ${data.numpages} pages`);
    return data.text.trim();
  } catch (error) {
    console.error('[OCR] Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Process a document buffer and extract text based on MIME type
 */
export async function processDocument(buffer: Buffer, mimeType: string): Promise<{
  text: string;
  method: 'pdf' | 'ocr' | 'scanned_pdf' | 'none';
  warning?: string;
}> {
  try {
    // PDF processing
    if (mimeType === 'application/pdf') {
      try {
        const text = await extractTextFromPDF(buffer);
        
        // If PDF has little text, it might be scanned
        // Note: Direct PDF OCR requires pdf-to-image conversion (not implemented)
        if (text.length < 100) {
          console.log('[OCR] PDF has minimal text (<100 chars), likely scanned. OCR not available for PDFs.');
          return { 
            text, 
            method: 'scanned_pdf',
            warning: 'This appears to be a scanned PDF. Direct OCR for PDFs requires pdf-to-image conversion which is not currently implemented. Please extract pages as images and process separately.'
          };
        }
        
        return { text, method: 'pdf' };
      } catch (error) {
        console.log('[OCR] PDF text extraction failed, document might be corrupted or scanned');
        return { 
          text: '', 
          method: 'none',
          warning: 'PDF text extraction failed. The document may be corrupted, encrypted, or scanned.'
        };
      }
    }
    
    // Image processing (OCR)
    if (mimeType.startsWith('image/')) {
      const text = await extractTextFromImage(buffer);
      return { text, method: 'ocr' };
    }
    
    // Unsupported type
    console.log(`[OCR] Unsupported MIME type: ${mimeType}`);
    return { 
      text: '', 
      method: 'none',
      warning: `Unsupported file type: ${mimeType}. Only images and text-based PDFs are supported.`
    };
  } catch (error) {
    console.error('[OCR] Error processing document:', error);
    return { 
      text: '', 
      method: 'none',
      warning: 'An error occurred during OCR processing.'
    };
  }
}
