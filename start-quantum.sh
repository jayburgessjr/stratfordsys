#!/bin/bash

# Kill ports 3000 and 8000 to be safe
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo "🚀 Starting Quantum Wealth Engine..."

# Start Python Engine in background
echo "🐍 Launching Quantitative Microservice (Port 8000)..."
cd python-engine
pip install -r requirements.txt > /dev/null 2>&1 &
uvicorn main:app --reload --port 8000 &
PYTHON_PID=$!
cd ..

# Wait for Python to start
sleep 2

# Start Next.js Frontend
echo "⚛️ Launching Frontend Interface (Port 3000)..."
npm run dev

# Cleanup on exit
trap "kill $PYTHON_PID" EXIT
