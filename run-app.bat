@echo off

REM --- Self-locate the script's directory ---
REM This makes the script runnable from anywhere on the system.
cd /d "%~dp0"

echo "--- Starting Quant Analysis Application ---"

REM --- Backend Setup ---
echo [1/4] Setting up backend...
cd api

REM Create a virtual environment if it doesn't exist
if not exist venv (
    echo "Creating Python virtual environment..."
    python -m venv venv
)

echo "Installing backend dependencies..."
call venv\Scripts\python.exe -m pip install -r requirements.txt

echo [2/4] Setting up frontend...
cd ..\\frontend

echo "Installing frontend dependencies..."
npm install

echo [3/4] Starting backend server (FastAPI)...
cd ..\api
REM Start the uvicorn server in a new, non-blocking window
start "Backend" cmd /c "venv\Scripts\python.exe -m uvicorn index:app --host 0.0.0.0 --port 8000"

cd ..\\frontend
echo [4/4] Starting frontend server (React)...
REM Start the React dev server in the current window
npm start

echo "--- Application has been shut down ---"
echo "You may need to manually close the backend server window."