@echo off
title iCondo Parcel Management System - Advanced Runner

:menu
cls
echo =================================
echo   iCondo Parcel Management System
echo =================================
echo.
echo Select an option:
echo.
echo   [1] Start Both Servers (Recommended)
echo   [2] Start Backend Only
echo   [3] Start Frontend Only
echo   [4] Database Operations
echo   [5] Install Dependencies
echo   [6] View System Status
echo   [7] Exit
echo.
set /p choice=Enter your choice (1-7): 

if "%choice%"=="1" goto start_both
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto database_ops
if "%choice%"=="5" goto install_deps
if "%choice%"=="6" goto status
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
pause
goto menu

:start_both
cls
echo =================================
echo Starting Both Servers
echo =================================
echo.

echo [1/2] Starting Backend Server...
cd /d "%~dp0backend"
start "iCondo Backend Server" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Server...
cd /d "%~dp0frontend"
start "iCondo Frontend Server" cmd /k "npm run dev"

goto success

:start_backend
cls
echo =================================
echo Starting Backend Server Only
echo =================================
echo.

cd /d "%~dp0backend"
start "iCondo Backend Server" cmd /k "npm run dev"

echo Backend server started at http://localhost:3000
pause
goto menu

:start_frontend
cls
echo =================================
echo Starting Frontend Server Only
echo =================================
echo.

cd /d "%~dp0frontend"
start "iCondo Frontend Server" cmd /k "npm run dev"

echo Frontend server started at http://localhost:5173
pause
goto menu

:database_ops
cls
echo =================================
echo Database Operations
echo =================================
echo.
echo   [1] Seed Database
echo   [2] Reset Database
echo   [3] Back to Main Menu
echo.
set /p db_choice=Enter your choice (1-3): 

if "%db_choice%"=="1" goto seed_db
if "%db_choice%"=="2" goto reset_db
if "%db_choice%"=="3" goto menu
echo Invalid choice.
pause
goto database_ops

:seed_db
echo.
echo Seeding database...
cd /d "%~dp0backend"
call npm run db:seed
if %errorlevel% equ 0 (
    echo Database seeded successfully!
) else (
    echo Error: Database seeding failed!
)
pause
goto database_ops

:reset_db
echo.
echo WARNING: This will delete all data and reset the database.
echo Are you sure you want to continue? (Y/N)
set /p confirm=
if /i "%confirm%" neq "Y" goto database_ops

echo.
echo Resetting database...
cd /d "%~dp0backend"
del icondo.db 2>nul
call npm run db:seed
if %errorlevel% equ 0 (
    echo Database reset successfully!
) else (
    echo Error: Database reset failed!
)
pause
goto database_ops

:install_deps
cls
echo =================================
echo Installing Dependencies
echo =================================
echo.

echo [1/2] Installing Backend Dependencies...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo Error: Backend dependency installation failed!
    pause
    goto menu
)

echo.
echo [2/2] Installing Frontend Dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo Error: Frontend dependency installation failed!
    pause
    goto menu
)

echo.
echo All dependencies installed successfully!
pause
goto menu

:status
cls
echo =================================
echo System Status
echo =================================
echo.

echo Checking Backend...
cd /d "%~dp0backend"
if exist "node_modules\" (
    echo [✓] Backend dependencies installed
) else (
    echo [✗] Backend dependencies missing
)

if exist "icondo.db" (
    echo [✓] Database exists
) else (
    echo [✗] Database not found
)

echo.
echo Checking Frontend...
cd /d "%~dp0frontend"
if exist "node_modules\" (
    echo [✓] Frontend dependencies installed
) else (
    echo [✗] Frontend dependencies missing
)

echo.
echo Server Status:
netstat -an | find ":3000" >nul
if %errorlevel% equ 0 (
    echo [✓] Backend server running on port 3000
) else (
    echo [✗] Backend server not running
)

netstat -an | find ":5173" >nul
if %errorlevel% equ 0 (
    echo [✓] Frontend server running on port 5173
) else (
    echo [✗] Frontend server not running
)

echo.
pause
goto menu

:success
cls
echo =================================
echo   Servers Started Successfully!
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
echo Features Available:
echo   • Photo capture for parcel receipts
echo   • Evidence photo capture for delivery
echo   • Enhanced QR codes with download/share/print
echo   • Mobile-optimized camera interface
echo   • Complete parcel management workflow
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:exit
echo.
echo Thank you for using iCondo Parcel Management System!
echo.
pause
exit
