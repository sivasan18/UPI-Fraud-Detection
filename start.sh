#!/usr/bin/env bash
# ==============================================================================
# UPI Fraud Detection and Risk Assessment System
# One-Click Localhost Launcher (B.Tech Final Year Academic Project)
# Self-Bootstrapping: Auto-provisions venv & dependencies if missing
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "========================================================="
echo "  Starting UPI Fraud Detection & Risk Assessment System"
echo "  Undergraduate B.Tech Final-Year Project"
echo "========================================================="

# ── 1. Backend Provisioning & Startup ───────────────────────────────────────
echo ""
echo "[1/2] Checking Backend Environment..."
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

echo "-> Launching Flask Backend on http://localhost:8000 ..."
PYTHONPATH="$BACKEND_DIR" ./venv/bin/python3 app.py &
BACKEND_PID=$!

# ── 2. Frontend Provisioning & Startup ──────────────────────────────────────
echo ""
echo "[2/2] Checking Frontend Environment..."
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

# ── 3. Cleanup on Exit ──────────────────────────────────────────────────────
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
