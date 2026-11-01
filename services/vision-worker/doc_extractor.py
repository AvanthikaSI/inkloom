import os
import sys
import json
import re
import zipfile
import xml.etree.ElementTree as ET


def extract_text_from_docx(docx_path: str) -> dict:
    """Extract text from .docx using native zipfile and xml parsing (zero dependencies)."""
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File not found: {docx_path}")

    paragraphs = []
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            for p in tree.findall('.//w:p', namespaces):
                texts = [node.text for node in p.findall('.//w:t', namespaces) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
        
        full_text = '\n\n'.join(paragraphs)
        return {
            "format": "docx",
            "paragraph_count": len(paragraphs),
            "word_count": len(full_text.split()),
            "text": full_text
        }
    except Exception as e:
        return {"format": "docx", "error": str(e), "text": ""}


def extract_text_from_pdf(pdf_path: str) -> dict:
    """Extract readable text streams from PDF files using pure Python stream and CMap decoding."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")

    try:
        with open(pdf_path, 'rb') as f:
            content = f.read()

        import zlib

        # Find stream objects
        stream_matches = re.findall(b'stream[\r\n]+(.*?)[\r\n]+endstream', content, re.DOTALL)
        cmaps = {}
        decompressed_streams = []

        for stream in stream_matches:
            stream_data = None
            try:
                stream_data = zlib.decompress(stream)
            except Exception:
                stream_data = stream

            if stream_data:
                decompressed_streams.append(stream_data)
                # Parse ToUnicode CMaps if present
                try:
                    text_stream = stream_data.decode('latin1', errors='ignore')
                    if 'beginbfrange' in text_stream or 'beginbfchar' in text_stream:
                        for m in re.finditer(r'<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>', text_stream):
                            start = int(m.group(1), 16)
                            end = int(m.group(2), 16)
                            target = int(m.group(3), 16)
                            for code in range(start, end + 1):
                                cmaps[code] = chr(target + (code - start))
                        for m in re.finditer(r'<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>', text_stream):
                            code = int(m.group(1), 16)
                            target = int(m.group(2), 16)
                            cmaps[code] = chr(target)
                except Exception:
                    pass

        extracted_text = []

        for stream_data in decompressed_streams:
            try:
                # 1. Plain ASCII strings in parenthesis: (Hello) Tj
                matches = re.findall(rb'\((.*?)\)\s*Tj', stream_data)
                for m in matches:
                    extracted_text.append(m.decode('latin1', errors='ignore'))

                # 2. Array format: [ (Hello) 10 (World) ] TJ
                array_matches = re.findall(rb'\[(.*?)\]\s*TJ', stream_data)
                for am in array_matches:
                    sub_m = re.findall(rb'\((.*?)\)', am)
                    for sm in sub_m:
                        extracted_text.append(sm.decode('latin1', errors='ignore'))

                # 3. Hex-encoded strings: <00480065...> Tj
                text_content = stream_data.decode('latin1', errors='ignore')
                if 'BT' in text_content and 'ET' in text_content:
                    hex_matches = re.findall(r'<([0-9a-fA-F]+)>\s*Tj', text_content)
                    for h in hex_matches:
                        step = 4 if len(h) % 4 == 0 else 2
                        word = []
                        for i in range(0, len(h), step):
                            val = int(h[i:i+step], 16)
                            char = cmaps.get(val)
                            if not char and val >= 32 and val <= 126:
                                char = chr(val)
                            if char:
                                word.append(char)
                        if word:
                            extracted_text.append(''.join(word))
            except Exception:
                pass

        if extracted_text:
            raw = " ".join(extracted_text)
            clean_text = re.sub(r'\s+', ' ', raw).strip()
            if len(clean_text) > 0:
                return {
                    "format": "pdf",
                    "extracted_length": len(clean_text),
                    "text": clean_text
                }

        return {
            "format": "pdf",
            "extracted_length": 0,
            "text": "",
            "error": "No extractable text found in this PDF document."
        }
    except Exception as e:
        return {"format": "pdf", "error": str(e), "text": ""}


def extract_plain_text(file_path: str) -> dict:
    """Reads txt, md, json, html files."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        return {
            "format": "text",
            "word_count": len(text.split()),
            "text": text
        }
    except Exception as e:
        return {"format": "text", "error": str(e), "text": ""}


def extract_image_summary(file_path: str) -> dict:
    """Extract metadata and basic color summary from image files using Pillow."""
    try:
        from PIL import Image
        with Image.open(file_path) as img:
            w, h = img.size
            mode = img.mode
            fmt = img.format or "IMAGE"
        return {
            "format": fmt.lower(),
            "width": w,
            "height": h,
            "aspect_ratio": round(w / max(h, 1), 2),
            "text": f"Creative Asset Image: {fmt} {w}x{h} ({mode} mode). Visual brand compliance scan ready."
        }
    except Exception as e:
        return {"format": "image", "error": str(e), "text": ""}


def parse_document(file_path: str) -> dict:
    """Dispatcher for document extraction based on extension."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.docx':
        return extract_text_from_docx(file_path)
    elif ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif']:
        return extract_image_summary(file_path)
    else:
        return extract_plain_text(file_path)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = parse_document(sys.argv[1])
        print(json.dumps(res, indent=2))
