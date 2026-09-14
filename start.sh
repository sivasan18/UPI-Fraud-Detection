#!/usr/bin/env bash
# ==============================================================================
# UPI Fraud Detection and Risk Assessment System
# One-Click Localhost Launcher (B.Tech Final Year Academic Project)
# Self-Bootstrapping: Auto-provisions venv, dependencies & OCR models if missing
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Project-local PaddleOCR model cache directory.
# Exporting this ensures the Flask process and download_models.py always
# read/write models from the same project-relative location — persistent
# across reboots, shell sessions, and different working directories.
export PADDLE_PDX_CACHE_HOME="$BACKEND_DIR/models/paddlex"

echo "========================================================="
echo "  Starting UPI Fraud Detection & Risk Assessment System"
echo "  Undergraduate B.Tech Final-Year Project"
echo "========================================================="

# ── 1. Backend Provisioning ──────────────────────────────────────────────────
echo ""
echo "[1/3] Checking Backend Environment..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ] || [ ! -f "venv/bin/python3" ]; then
  echo "-> Virtual environment not found. Creating backend/venv..."
  python3 -m venv venv
  echo "-> Installing backend dependencies from requirements.txt..."
  venv/bin/pip install --upgrade pip
  venv/bin/pip install -r requirements.txt
else
  echo "-> Backend virtual environment verified."
fi

# ── 2. PaddleOCR Model Provisioning (persistent, project-local) ──────────────
echo ""
echo "[2/3] Checking PaddleOCR Models..."

OCR_MARKER="$PADDLE_PDX_CACHE_HOME/official_models/.ready"

if [ ! -f "$OCR_MARKER" ]; then
  echo "-> PaddleOCR models not found. Downloading to: $PADDLE_PDX_CACHE_HOME"
  echo "   (This runs once. Models are cached for all future restarts.)"
  PADDLE_PDX_CACHE_HOME="$PADDLE_PDX_CACHE_HOME" \
    venv/bin/python3 download_models.py
  # Write a marker file so we skip download on subsequent starts
  mkdir -p "$(dirname "$OCR_MARKER")"
  touch "$OCR_MARKER"
  echo "-> OCR models downloaded and verified."
else
  echo "-> OCR models verified (cached at: $PADDLE_PDX_CACHE_HOME)"
fi

# ── 3. Backend Startup ───────────────────────────────────────────────────────
echo ""
echo "-> Launching Flask Backend on http://localhost:8000 ..."
PYTHONPATH="$BACKEND_DIR" \
PADDLE_PDX_CACHE_HOME="$PADDLE_PDX_CACHE_HOME" \
  ./venv/bin/python3 app.py &
BACKEND_PID=$!

# ── 4. Frontend Provisioning & Startup ──────────────────────────────────────
echo ""
echo "[3/3] Checking Frontend Environment..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "-> node_modules not found. Installing frontend dependencies..."
  npm install
else
  echo "-> Frontend node_modules verified."
fi

echo "-> Launching React (Vite) Frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on Exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "========================================================="
echo "  All Systems Running Successfully on Localhost!"
echo "  Frontend Application: http://localhost:5173"
echo "  Backend REST API:     http://localhost:8000"
echo "  Mode Password:        admin123"
echo "========================================================="
echo "Press [CTRL+C] to gracefully stop both servers."
echo ""

wait
