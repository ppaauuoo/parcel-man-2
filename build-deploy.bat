@echo off
REM ============================================================
REM build-deploy.bat — iCondo Docker build + K3s deploy
REM
REM Usage:
REM   build-deploy.bat              — build, import to containerd, deploy
REM   build-deploy.bat push         — build, push to registry, deploy
REM   build-deploy.bat <registry>   — build, tag & push, deploy
REM   build-deploy.bat skipdeploy   — build only
REM
REM Prerequisites: docker, kubectl, k3s (or kubectl standalone)
REM ============================================================

setlocal enabledelayedexpansion

set REGISTRY=%1
set BUILD_ONLY=0
set DO_PUSH=0
set DO_IMPORT=0

REM API URL for frontend — default to relative path (nginx proxy)
if "%VITE_API_URL%"=="" set VITE_API_URL=/api

if "%REGISTRY%"=="skipdeploy" (
    set BUILD_ONLY=1
    set REGISTRY=
)

if "%REGISTRY%"=="push" (
    set DO_PUSH=1
    set REGISTRY=localhost
)

if "%REGISTRY%"=="" (
    set DO_IMPORT=1
)

echo ============================================
echo 🔨 iCondo — Build ^& Deploy
echo ============================================
echo.

REM ---- Step 1: Build backend ----
echo [1/4] 🏗️  Building backend image...
docker build -t icondo-backend:latest -f Dockerfile.backend .
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend build failed
    exit /b 1
)
echo ✅ Backend image built
echo.

REM ---- Step 2: Build frontend ----
echo [2/4] 🏗️  Building frontend image...
docker build --build-arg VITE_API_URL=%VITE_API_URL% -t icondo-frontend:latest -f Dockerfile.frontend .
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend image built
echo.

REM ---- Step 3a: Import into containerd (single-node, no registry) ----
if "%DO_IMPORT%"=="1" (
    echo [3/4] 📥 Importing images into K3s containerd...
    
    where /q k3s
    if !ERRORLEVEL! equ 0 (
        docker save icondo-backend:latest | k3s ctr images import -
        if !ERRORLEVEL! neq 0 (
            echo ⚠️  Backend import failed — pods may use ImagePullBackOff
            echo    Try: k3s ctr images import
        ) else (
            echo ✅ Backend imported to containerd
        )

        docker save icondo-frontend:latest | k3s ctr images import -
        if !ERRORLEVEL! neq 0 (
            echo ⚠️  Frontend import failed
        ) else (
            echo ✅ Frontend imported to containerd
        )
    ) else (
        echo ⚠️  k3s not found — assuming Docker runtime or external cluster
        echo    Setting imagePullPolicy: Never so K3s uses Docker images...
    )
    echo.
    goto deploy
)

REM ---- Step 3b: Push to registry ----
if "%DO_PUSH%"=="1" (
    echo [3/4] ☁️  Pushing images to %REGISTRY%...

    docker tag icondo-backend:latest %REGISTRY%/icondo-backend:latest
    docker push %REGISTRY%/icondo-backend:latest
    if !ERRORLEVEL! neq 0 (
        echo ❌ Backend push failed
        exit /b 1
    )

    docker tag icondo-frontend:latest %REGISTRY%/icondo-frontend:latest
    docker push %REGISTRY%/icondo-frontend:latest
    if !ERRORLEVEL! neq 0 (
        echo ❌ Frontend push failed
        exit /b 1
    )
    echo ✅ Images pushed to %REGISTRY%
    echo.
    goto deploy
)

REM ---- Step 3c: Push with custom registry ----
echo [3/4] ☁️  Pushing images to %REGISTRY%...

docker tag icondo-backend:latest %REGISTRY%/icondo-backend:latest
docker push %REGISTRY%/icondo-backend:latest
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend push failed
    exit /b 1
)

docker tag icondo-frontend:latest %REGISTRY%/icondo-frontend:latest
docker push %REGISTRY%/icondo-frontend:latest
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend push failed
    exit /b 1
)
echo ✅ Images pushed to %REGISTRY%
echo.

:deploy

REM ---- Step 4: Deploy to K3s ----
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
