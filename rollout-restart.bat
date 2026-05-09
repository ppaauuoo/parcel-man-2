@echo off
REM ============================================================
REM rollout-restart.bat — kubectl rollout restart for iCondo
REM
REM Usage:
REM   rollout-restart.bat           — restart both deployments
REM   rollout-restart.bat backend   — restart backend only
REM   rollout-restart.bat frontend  — restart frontend only
REM   rollout-restart.bat status    — check rollout status only
REM ============================================================

setlocal enabledelayedexpansion

set NS=icondo
set BACKEND=icondo-backend
set FRONTEND=icondo-frontend

if "%1"=="status" goto status
if "%1"=="backend" goto restart_backend
if "%1"=="frontend" goto restart_frontend
goto restart_all

:restart_all
echo ============================================
echo 🔄 iCondo — Rollout Restart
echo ============================================
echo.
echo [1/2] Restarting %BACKEND%...
kubectl rollout restart deployment/%BACKEND% -n %NS%
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to restart %BACKEND%
    exit /b 1
)
echo ✅ %BACKEND% restarted
echo.
echo [2/2] Restarting %FRONTEND%...
kubectl rollout restart deployment/%FRONTEND% -n %NS%
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to restart %FRONTEND%
    exit /b 1
)
echo ✅ %FRONTEND% restarted
echo.
echo Waiting for rollouts to complete...
echo.
kubectl rollout status deployment/%BACKEND% -n %NS% --timeout=120s
if %ERRORLEVEL% neq 0 (
    echo ⚠️  %BACKEND% rollout did not complete within timeout
)
kubectl rollout status deployment/%FRONTEND% -n %NS% --timeout=120s
if %ERRORLEVEL% neq 0 (
    echo ⚠️  %FRONTEND% rollout did not complete within timeout
)
echo.
echo ✅ All deployments restarted!
kubectl get pods -n %NS% -o wide
exit /b 0

:restart_backend
echo 🔄 Restarting backend only...
kubectl rollout restart deployment/%BACKEND% -n %NS% || exit /b 1
echo.
kubectl rollout status deployment/%BACKEND% -n %NS% --timeout=120s
echo.
kubectl get pods -n %NS% -l app=icondo,tier=backend -o wide
exit /b 0

:restart_frontend
echo 🔄 Restarting frontend only...
kubectl rollout restart deployment/%FRONTEND% -n %NS% || exit /b 1
echo.
kubectl rollout status deployment/%FRONTEND% -n %NS% --timeout=120s
echo.
kubectl get pods -n %NS% -l app=icondo,tier=frontend -o wide
exit /b 0

:status
echo 📊 Rollout status for iCondo deployments:
echo.
kubectl rollout status deployment/%BACKEND% -n %NS% 2>&1
kubectl rollout status deployment/%FRONTEND% -n %NS% 2>&1
echo.
echo Active pods:
kubectl get pods -n %NS% -o wide
exit /b 0
