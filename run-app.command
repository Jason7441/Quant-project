#!/bin/bash

# --- Self-locate the script's directory ---
# This makes the script runnable from anywhere on the system.
cd "$(dirname "$0")"

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting Quant Analysis Application ---"

# --- Backend Setup ---
echo "[1/4] Setting up backend..."
cd api

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Install/update backend dependencies
echo "Installing backend dependencies from requirements.txt..."
venv/bin/python3 -m pip install -r requirements.txt

# --- Frontend Setup ---
echo "[2/4] Setting up frontend..."
cd ../frontend

# Install/update frontend dependencies
echo "Installing frontend dependencies from package.json..."
npm install

# --- Start Servers ---
echo "[3/4] Starting backend server (FastAPI)..."
cd ../api
# Start the uvicorn server in the background
venv/bin/python3 -m uvicorn index:app --host 0.0.0.0 --port 8000 &
# Save its process ID to kill it later
BACKEND_PID=$!
cd ../frontend

echo "[4/4] Starting frontend server (React)..."
# Start the React dev server in the foreground
npm start

# --- Cleanup ---
# When the user closes the React server (Ctrl+C), this part will run
echo "--- Shutting down ---"
echo "Stopping backend server..."
kill $BACKEND_PID
echo "Application has been shut down."