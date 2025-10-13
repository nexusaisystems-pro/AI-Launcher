@echo off
REM GameHub Launcher - Desktop Development Start Script

echo 🚀 Starting GameHub Launcher Desktop...

REM Check if backend is running
netstat -ano | findstr :5000 >nul
if %errorlevel% neq 0 (
    echo ⚠️  Backend not running. Starting backend server...
    start "GameHub Backend" cmd /c "npm run dev"
    echo    Backend started in new window
    
    echo    Waiting for backend...
    timeout /t 3 /nobreak >nul
) else (
    echo ✓  Backend already running on port 5000
)

REM Start Electron
echo 🖥️  Launching Electron...
set NODE_ENV=development
electron .

echo ✨ Desktop app closed
pause
