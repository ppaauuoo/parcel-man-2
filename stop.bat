@echo off
title Stop iCondo Servers

echo =================================
echo   Stopping iCondo Servers
echo =================================
echo.

echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Stopping command windows...
taskkill /f /im cmd.exe /fi "windowtitle eq *iCondo*" >nul 2>&1

echo Stopping backend processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo Stopping frontend processes on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":5173"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo =================================
echo   All servers stopped successfully!
echo =================================
echo.

timeout /t 2 /nobreak >nul
exit
