#!/usr/bin/env bash
# ==============================================================================
# UPI Fraud Detection and Risk Assessment System
# One-Click Localhost Launcher (B.Tech Final Year Academic Project)
# ==============================================================================

echo "========================================================="
echo "  Starting UPI Fraud Detection System"
echo "  Undergraduate B.Tech Final-Year Project"
echo "========================================================="

# 1. Start Python Flask Backend in background
echo "-> Starting Flask Backend on http://localhost:8000 ..."
cd "$(dirname "$0")/backend"
if [ -f "./venv/bin/python3" ]; then
  ./venv/bin/python3 app.py &
else
  python3 app.py &
fi
BACKEND_PID=$!

# 2. Start Frontend React Vite Dev Server
echo "-> Starting React Frontend on http://localhost:5173 ..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

echo ""
echo "-> System running successfully on localhost!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   Mode Password: admin123"
echo ""
echo "Press [CTRL+C] to stop both servers."

wait
