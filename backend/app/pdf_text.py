"""Extract text from an uploaded PDF entirely in memory (never written to disk)."""
import io

from pypdf import PdfReader

MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_PAGES = 5


def pdf_bytes_to_text(data: bytes) -> str:
    if len(data) > MAX_PDF_BYTES:
        raise ValueError("PDF is larger than 5 MB.")
    reader = PdfReader(io.BytesIO(data))
    if len(reader.pages) > MAX_PAGES:
        raise ValueError(f"PDF has more than {MAX_PAGES} pages; a resume should be 1-2.")
    text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    if not text:
        raise ValueError("No text found. Is this a scanned image? Paste the text instead.")
    return text
