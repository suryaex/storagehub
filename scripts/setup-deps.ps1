# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — dependency installer & repair for Windows (bare-metal / dev)
#
# Installs ALL backend (Python) and frontend (Node) libraries, and can repair
# broken/corrupted installs.
#
# Usage (PowerShell):
#   .\scripts\setup-deps.ps1                 # install everything
#   .\scripts\setup-deps.ps1 -Repair         # force clean reinstall + fix broken
#   .\scripts\setup-deps.ps1 -BackendOnly
#   .\scripts\setup-deps.ps1 -FrontendOnly
# ─────────────────────────────────────────────────────────────────────────────
[CmdletBinding()]
param([switch]$Repair, [switch]$BackendOnly, [switch]$FrontendOnly)

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path $PSScriptRoot "..")

function Info($m){ Write-Host "▸ $m" -ForegroundColor Blue }
function Ok($m)  { Write-Host "✓ $m" -ForegroundColor Green }
function Warn($m){ Write-Host "! $m" -ForegroundColor Yellow }
function Fail($m){ Write-Host "✗ $m" -ForegroundColor Red; exit 1 }

function Ensure-Cmd($cmd, $wingetId, $hint) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) { return }
    Warn "$cmd not found"
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Info "Installing $cmd via winget…"
        winget install --silent --accept-package-agreements --accept-source-agreements -e --id $wingetId
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { Fail "$cmd still missing. $hint" }
}

function Setup-Backend {
    Info "Backend: Python dependencies"
    Ensure-Cmd "python" "Python.Python.3.11" "Install Python 3.11+ from https://python.org"
    Set-Location backend

    if ($Repair -and (Test-Path ".venv")) { Warn "Repair: removing old virtualenv"; Remove-Item -Recurse -Force ".venv" }
    if (-not (Test-Path ".venv")) { Info "Creating virtualenv"; python -m venv .venv }
    $py = ".\.venv\Scripts\python.exe"

    & $py -m pip install --upgrade pip setuptools wheel
    if ($Repair) {
        Info "Force-reinstalling all packages (no cache)"
        & $py -m pip install --force-reinstall --no-cache-dir -r requirements.txt
    } else {
        & $py -m pip install -r requirements.txt
    }

    Info "Verifying dependency tree (pip check)"
    & $py -m pip check
    if ($LASTEXITCODE -ne 0) {
        Warn "pip check found issues — repairing"
        & $py -m pip install --force-reinstall --no-cache-dir -r requirements.txt
        & $py -m pip check
    }
    Set-Location ..
    Ok "Backend ready (venv: backend\.venv)"
}

function Setup-Frontend {
    Info "Frontend: Node dependencies"
    Ensure-Cmd "node" "OpenJS.NodeJS.LTS" "Install Node 20+ from https://nodejs.org"
    Ensure-Cmd "npm"  "OpenJS.NodeJS.LTS" "npm ships with Node"
    Set-Location frontend

    if ($Repair) {
        Warn "Repair: clearing node_modules + lockfile + npm cache"
        if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
        if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
        try { npm cache verify } catch { npm cache clean --force }
    }

    if ((Test-Path "package-lock.json") -and (-not $Repair)) {
        npm ci; if ($LASTEXITCODE -ne 0) { npm install }
    } else {
        npm install
    }

    Info "Verifying install (npm ls)"
    npm ls --depth=0 *> $null
    if ($LASTEXITCODE -eq 0) { Ok "Frontend dependency tree OK" } else { Warn "npm peer/extraneous warnings (usually safe)" }
    Set-Location ..
    Ok "Frontend ready (frontend\node_modules)"
}

Write-Host ""
Write-Host "  StorageHub · dependency setup  (repair=$($Repair.IsPresent))"
Write-Host ""
if (-not $FrontendOnly) { Setup-Backend }
if (-not $BackendOnly)  { Setup-Frontend }
Write-Host ""
Ok "All dependencies installed."
Write-Host "  Run backend : cd backend; .\.venv\Scripts\activate; uvicorn app.main:app --host 0.0.0.0 --port 8000"
Write-Host "  Run frontend: cd frontend; npm run dev -- --host"
Write-Host ""
