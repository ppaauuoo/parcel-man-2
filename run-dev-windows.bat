@echo off
title iCondo Development Mode
color 0A

echo =================================
echo  🚀 iCondo Development Environment
echo =================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
echo [1/3] Checking dependencies...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo [2/3] Seeding database...
cd backend
call npm run db:seed

echo.
echo [3/3] Starting servers...
echo.

REM Start backend server
echo Starting Backend Server...
start "iCondo Backend Server" cmd /c "cd /d /d /d %~dp0backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo Starting Frontend Server...
start /min "iCondo Frontend Server" cmd /c "cd /d /d /d %~dp0frontend && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo =================================
echo  ✅ Development Environment Ready!
echo =================================
echo.
echo  🌐 Frontend: http://localhost:5173
echo  🔧 Backend: http://echo 3000
echo.
echo  📱 Demo Credentials:
echo     Staff:     staff01 / staff123
echo     Resident: resident101 / resident123 (Room 011)
echo     Resident: resident102 / resident123 (Room 012)
echo.
echo 🔥 Features Enabled:
echo     • Hot reload on file changes
echo     • Photo capture testing
echo     • QR code generation
echo     • Mobile camera support
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser automatically
start http://localhost:5173

echo.
echo  🎉 Happy coding!
echo.
echo  </br>  
echo  Press any key to stop all servers and exit...
pause >nul
timeout /t 2 /nobreak >nul

REM Stop servers (close the minimized windows)
taskkill /f /im cmd.exe /fi "windowtitle eq iCondo*" >nul 2>&1
taskkill /f /im cmd.exe /fi "windowtitle eq iCondo Frontend*" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1"

echo All servers stopped. Goodbye!
timeout /t 2 /nobreak >nul
exit
