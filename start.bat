@echo off
setlocal enabledelayedexpansion

echo =================================================================
echo    INKLOOM AI -- ENTERPRISE BRAND GOVERNANCE PLATFORM
echo    Multi-Modal Compliance, LangGraph Multi-Agent, and Web Studio
echo =================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check Docker infrastructure
where docker >nul 2>nul
if %ERRORLEVEL% equ 0 (
    docker info >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo [1/3] Docker is active. Starting PostgreSQL and ChromaDB containers...
        docker compose up -d
        echo       PostgreSQL and ChromaDB containers initialized.
    ) else (
        echo [1/3] Docker is installed but daemon is not running.
        echo       Starting with embedded in-memory database and vector store.
    )
) else (
    echo [1/3] Docker not detected. Running with embedded in-memory database and vector store.
)

:: 3. Build serverless backend bundle
echo [2/3] Building backend serverless artifacts...
call npm run build:server >nul 2>nul
echo       Backend bundle ready.

:: 4. Start all services
echo [3/3] Starting Backend API (port 4000) and Web Studio (port 3000)...
echo.
echo   Web Studio:   http://localhost:3000
echo   Backend API:  http://localhost:4000/api
echo.
echo Press Ctrl+C to terminate services.
echo =================================================================
echo.

start "" "http://localhost:3000"
node scripts\start-all.mjs

endlocal
