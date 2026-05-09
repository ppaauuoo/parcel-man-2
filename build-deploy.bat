@echo off
REM ============================================================
REM build-deploy.bat — iCondo Docker build + push to Docker Hub
REM
REM Usage:
REM   build-deploy.bat              — build, push to ppaaul/*, deploy
REM   build-deploy.bat skipdeploy   — build & push only
REM
REM Prerequisites: docker, kubectl
REM ============================================================

setlocal enabledelayedexpansion

set BUILD_ONLY=0
set DOCKER_USER=ppaaul

if "%1"=="skipdeploy" set BUILD_ONLY=1

REM API URL for frontend — default to relative path (nginx proxy)
if "%VITE_API_URL%"=="" set VITE_API_URL=/api

echo ============================================
echo 🔨 iCondo — Build ^& Deploy
echo ============================================
echo.

REM ---- Step 1: Build backend ----
echo [1/4] 🏗️  Building backend image...
docker build -t %DOCKER_USER%/icondo-backend:latest -f Dockerfile.backend .
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend build failed
    exit /b 1
)
echo ✅ Backend image built
echo.

REM ---- Step 2: Build frontend ----
echo [2/4] 🏗️  Building frontend image...
docker build --build-arg VITE_API_URL=%VITE_API_URL% -t %DOCKER_USER%/icondo-frontend:latest -f Dockerfile.frontend .
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend image built
echo.

REM ---- Step 3: Push to Docker Hub ----
echo [3/4] ☁️  Pushing images to Docker Hub (%DOCKER_USER%/*)...

docker push %DOCKER_USER%/icondo-backend:latest
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend push failed — did you run 'docker login'?
    exit /b 1
)

docker push %DOCKER_USER%/icondo-frontend:latest
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend push failed
    exit /b 1
)
echo ✅ Images pushed to Docker Hub
echo.

REM ---- Step 4: Deploy ----
if "%BUILD_ONLY%"=="1" (
    echo [4/4] ⏭️  Skipping deploy (build-only mode)
    echo.
    echo ✅ Build complete. Deploy manually:
    echo    kubectl apply -k k8s/
    exit /b 0
)

echo [4/4] 🚀 Deploying to K3s...
kubectl apply -k k8s/
if %ERRORLEVEL% neq 0 (
    echo ❌ Deploy failed
    exit /b 1
)

echo.
echo ✅ Done! Pods starting up...
echo.
echo To check status:
echo   kubectl get pods -n icondo -w
echo.
echo To see logs:
echo   kubectl logs -n icondo -l app=icondo,tier=backend
echo   kubectl logs -n icondo -l app=icondo,tier=frontend
