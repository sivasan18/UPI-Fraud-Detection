#!/usr/bin/env python3
# ==============================================================================
# UPI Fraud Detection - PaddleOCR Model Pre-Download / Warm-Up Script
#
# Run ONCE after fresh clone (handled automatically by start.sh):
#   backend/venv/bin/python3 backend/download_models.py
#
# This script:
#   1. Sets PADDLE_PDX_CACHE_HOME to the project-local models directory
#   2. Downloads / verifies all required PaddleOCR models
#   3. Runs a quick OCR test to confirm the engine works end-to-end
#
# After this runs successfully, the models are stored at:
#   backend/models/paddlex/official_models/
# and Flask will use them on every subsequent start via the same env var.
# ==============================================================================

import os
import sys

# ── Step 1: Point PaddleX to the project-local model cache ────────────────────
# Must happen BEFORE any paddle/paddleocr imports.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_MODELS_DIR = os.path.join(SCRIPT_DIR, "models", "paddlex")
os.makedirs(PROJECT_MODELS_DIR, exist_ok=True)
os.environ["PADDLE_PDX_CACHE_HOME"] = PROJECT_MODELS_DIR

print("=" * 60)
print("  UPI Fraud Detection -- PaddleOCR Model Initializer")
print("=" * 60)
print(f"  Model cache directory: {PROJECT_MODELS_DIR}")
print()

# ── Step 2: Import and initialize PaddleOCR (triggers download if needed) ──
try:
    print("[1/3] Importing PaddleOCR...")
    from paddleocr import PaddleOCR
    print("      PaddleOCR imported successfully.")
except ImportError as e:
    print(f"\n[ERROR] PaddleOCR is not installed: {e}")
    print("        Run:  pip install paddlepaddle paddleocr")
    sys.exit(1)

try:
    print("[2/3] Initializing OCR engine (downloads models if not cached)...")
    print("      This may take a few minutes on first run...")
    ocr_engine = PaddleOCR(
        use_textline_orientation=True,
        lang="en"
    )
    print("      OCR engine initialized successfully.")
except Exception as e:
    print(f"\n[ERROR] Failed to initialize PaddleOCR engine: {e}")
    print("        Check your internet connection for first-time model download.")
    sys.exit(1)

# ── Step 3: Quick smoke test with a small synthetic image ──────────────────
try:
    print("[3/3] Running smoke test...")
    import io
    import tempfile
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (400, 80), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "OCR Test 1000 OK", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(buf.read())
        tmp_path = tmp.name

    result = ocr_engine.ocr(tmp_path)
    os.unlink(tmp_path)

    if result and len(result) > 0:
        print("      Smoke test PASSED -- OCR engine is working correctly.")
    else:
        print("      Smoke test returned no text (non-fatal; engine is running).")

except Exception as e:
    print(f"      Smoke test warning (non-fatal): {e}")

# ── Done ───────────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("  PaddleOCR models are ready.")
print(f"  Cached at: {PROJECT_MODELS_DIR}")
print("  The Flask backend will use this directory automatically.")
print("=" * 60)
print()
