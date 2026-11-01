<#
.SYNOPSIS
  Inkloom AI — Unified Services Startup Script (PowerShell)
  Launches Database (PostgreSQL & ChromaDB), Backend API, and Next.js Web Studio.
#>

$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   INKLOOM AI — ENTERPRISE BRAND GOVERNANCE PLATFORM             " -ForegroundColor White
Write-Host "   Multi-Modal Compliance, LangGraph Multi-Agent, & Web Studio   " -ForegroundColor DarkCyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js installation
try {
    $nodeVersion = node --version
    Write-Host "[1/4] Node.js environment detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is required but was not found in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. Check & start Docker infrastructure if available
$hasDocker = $false
try {
    $dockerVer = docker compose version 2>$null
    if ($dockerVer) {
        $hasDocker = $true
    }
} catch {
    $hasDocker = $false
}

if ($hasDocker) {
    try {
        docker info 2>&1 | Out-Null
        Write-Host "[2/4] Docker is running. Starting PostgreSQL & ChromaDB containers..." -ForegroundColor Green
        docker compose up -d
        Write-Host "      PostgreSQL (5432) and ChromaDB (8000) are ready." -ForegroundColor Green
    } catch {
        Write-Host "[2/4] Docker Desktop is installed but daemon is not running." -ForegroundColor Yellow
        Write-Host "      Starting with embedded in-memory database and vector store fallbacks." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "[2/4] Docker Compose not found. Running with embedded in-memory database & vector store." -ForegroundColor DarkYellow
}

# 3. Build serverless backend bundle for unified Option A runtime
Write-Host "[3/4] Building backend serverless artifacts..." -ForegroundColor Green
npm run build:server | Out-Null
Write-Host "      Backend artifacts bundled successfully." -ForegroundColor Green

# 4. Launch Services
Write-Host "[4/4] Launching Inkloom AI Backend API (port 4000) and Web Studio (port 3000)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  > Web Studio:      http://localhost:3000" -ForegroundColor White
Write-Host "  > Backend API:     http://localhost:4000/api" -ForegroundColor White
Write-Host "  > Health Check:    http://localhost:4000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to terminate all services." -ForegroundColor DarkGray
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Optional browser launch
Start-Process "http://localhost:3000" -ErrorAction SilentlyContinue

# Execute the start-all orchestrator
node "$rootDir/scripts/start-all.mjs"
