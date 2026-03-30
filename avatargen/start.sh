#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  AvatarGen — Start Script
#  Launches backend + frontend in parallel
# ═══════════════════════════════════════════════════════════════════

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "${CYAN}Starting AvatarGen...${NC}"
echo ""

# Kill any existing processes on our ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Backend
echo -e "${GREEN}▶ Starting backend on :8000${NC}"
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 2

# Frontend
echo -e "${GREEN}▶ Starting frontend on :5173${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  AvatarGen is running!                       ║"
echo "║  → http://localhost:5173                     ║"
echo "║  → API: http://localhost:8000/docs           ║"
echo "║  Press Ctrl+C to stop both servers           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM

wait
