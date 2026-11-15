#!/usr/bin/env python3
"""
Open Source OCR Runner for FinGuard AI
Supports:
1. Tesseract OCR CLI with 'ara+eng' language packs
2. EasyOCR (bilingual Arabic & English neural network) with graceful fallback
"""

import sys
import os
import json
import shutil
import subprocess

def is_tool_available(name: str) -> bool:
    return shutil.which(name) is not None

def run_tesseract(image_path: str) -> str:
    """Run native Tesseract CLI with Arabic and English traineddata."""
    if not is_tool_available("tesseract"):
        raise RuntimeError("Tesseract binary is not installed on this system.")

    cmd = [
        "tesseract",
        image_path,
        "stdout",
        "-l", "ara+eng",
        "--psm", "6"
    ]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return proc.stdout.strip()
    except Exception:
        # Fallback to default PSM if 6 fails
        cmd_fallback = ["tesseract", image_path, "stdout", "-l", "ara+eng"]
        proc2 = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return proc2.stdout.strip()

def run_easyocr(image_path: str) -> tuple[str, str]:
    """Run EasyOCR with Arabic and English language models, fallback to Tesseract if missing."""
    try:
        import easyocr
        reader = easyocr.Reader(['ar', 'en'], gpu=False, verbose=False)
        results = reader.readtext(image_path, detail=0)
        return "\n".join(results), "easyocr"
    except Exception as e:
        # Fall back to Tesseract if available
        if is_tool_available("tesseract"):
            return run_tesseract(image_path), "tesseract_fallback"
        raise RuntimeError(f"EasyOCR is not installed ({e}) and Tesseract is not available.")

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: run_ocr.py <engine: tesseract|easyocr> <image_path>"}))
        sys.exit(0)

    engine = sys.argv[1].lower()
    image_path = sys.argv[2]

    if not os.path.exists(image_path):
        print(json.dumps({"success": False, "error": f"Image file not found: {image_path}"}))
        sys.exit(0)

    try:
        engine_used = engine
        if engine == "easyocr":
            text, engine_used = run_easyocr(image_path)
        else:
            text = run_tesseract(image_path)
            engine_used = "tesseract"

        print(json.dumps({
            "success": True,
            "engine": engine_used,
            "raw_text": text
        }, ensure_ascii=False))
        sys.exit(0)
    except Exception as ex:
        print(json.dumps({
            "success": False,
            "error": str(ex),
            "engine": engine,
            "can_fallback_vision": True
        }, ensure_ascii=False))
        sys.exit(0)

if __name__ == "__main__":
    main()
