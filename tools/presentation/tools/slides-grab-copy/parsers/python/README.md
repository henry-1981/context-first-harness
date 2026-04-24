# slides-grab-copy parser bootstrap

## Python dependencies

- `python-pptx`
- `pdfplumber`
- `pytesseract`

## CLI dependencies

- PDF text/bbox: `pdftotext`, `pdfplumber`
- Scanned PDF/PNG OCR: `tesseract`, `ocrmypdf`
- Raster fallback only: `pdftoppm`, `qlmanage`

## Bootstrap

```bash
bash tools/slides-grab-copy/parsers/python/bootstrap.sh
```
