import PyPDF2
import json
import os

pdf_path = "Elenco_angrafiche_paghe.pdf"
output_path = "scratch/extracted_data.json"

def extract_text():
    if not os.path.exists(pdf_path):
        print(f"File {pdf_path} not found")
        return

    data = []
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            data.append({
                "page": i + 1,
                "content": text
            })
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Extracted {len(data)} pages to {output_path}")

if __name__ == "__main__":
    extract_text()
