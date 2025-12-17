#!/bin/bash

echo "Starting Python Quantum Engine in background..."
/usr/bin/python3 python-engine/main.py > python_engine.log 2>&1 &
PYTHON_PID=$!
echo "Python Quantum Engine started with PID: $PYTHON_PID. Log file: python_engine.log"

echo "Waiting a few seconds for Python engine to initialize..."
sleep 5

echo "Starting Next.js Frontend..."
npm start

echo "Frontend stopped. Attempting to stop Python Quantum Engine (PID: $PYTHON_PID)..."
kill $PYTHON_PID

echo "Done."
