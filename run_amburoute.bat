@echo off
TITLE AmbuRoute AI Platform Launcher
echo ===================================================
echo   Starting AmbuRoute Emergency Response Platform
echo ===================================================

echo [1/2] Launching FastAPI Backend Server on http://127.0.0.1:8000 ...
start "AmbuRoute Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Frontend Dev Server on http://127.0.0.1:5173 ...
start "AmbuRoute Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   AmbuRoute is starting!
echo   Frontend: http://127.0.0.1:5173
echo   Backend API: http://127.0.0.1:8000/docs
echo ===================================================
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5173
