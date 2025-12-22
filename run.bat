@echo off
echo =================================
echo   iCondo Parcel Management System
echo =================================
echo.
echo Starting both Frontend and Backend servers...
echo.

echo [1/2] Starting Backend Server...
cd /d "%~dp0backend"
start "iCondo Backend" cmd /k "npm run dev"

echo.
echo [2/2] Starting Frontend Server...
cd /d "%~dp0frontend"
start "iCondo Frontend" cmd /k "npm run dev"

echo.
echo =================================
echo   Servers Starting...
echo =================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Demo Credentials:
echo   Staff:     staff01 / staff123
echo   Resident:  resident101 / resident123 (Room 101)
echo   Resident:  resident102 / resident123 (Room 102)
echo.
echo Press any key to exit this window...
pause > nul
