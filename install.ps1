# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — one-shot installer for Windows (Docker Desktop)
# Usage (PowerShell):
#   .\install.ps1            # build + start everything
#   .\install.ps1 -Rebuild   # force rebuild images
#   .\install.ps1 -Down      # stop the stack
#   .\install.ps1 -Reset     # stop and DELETE all data (volumes)
# ─────────────────────────────────────────────────────────────────────────────
[CmdletBinding()]
param(
    [switch]$Rebuild,
    [switch]$Down,
    [switch]$Reset,
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Info($m) { Write-Host "▸ $m" -ForegroundColor Blue }
function Ok($m)   { Write-Host "✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "! $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "✗ $m" -ForegroundColor Red; exit 1 }

# ── Detect docker + compose ──────────────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail "Docker is not installed. Get Docker Desktop: https://docs.docker.com/get-docker/"
}
try { docker info *> $null } catch { Fail "Docker daemon is not running. Start Docker Desktop and retry." }

$Compose = "docker compose"
try { docker compose version *> $null } catch {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) { $Compose = "docker-compose" }
    else { Fail "Docker Compose not found." }
}

function Invoke-Compose([string]$ArgString) {
    Invoke-Expression "$Compose $ArgString"
}

# ── Subcommands ──────────────────────────────────────────────────────────────
if ($Down)  { Info "Stopping StorageHub…"; Invoke-Compose "down"; Ok "Stopped."; exit 0 }
if ($Reset) {
    Warn "This deletes ALL data (DB + uploaded files)!"
    $c = Read-Host "Type 'yes' to continue"
    if ($c -eq "yes") { Invoke-Compose "down -v"; Ok "Reset done." } else { Write-Host "Aborted." }
    exit 0
}

Write-Host ""
Write-Host "  ╭───────────────────────────────────────────╮"
Write-Host "  │   StorageHub · self-hosted file storage   │"
Write-Host "  ╰───────────────────────────────────────────╯"
Write-Host ""
Ok "Docker ready  ($Compose)"

function New-Secret([int]$Bytes = 24) {
    $b = New-Object 'System.Byte[]' $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return -join ($b | ForEach-Object { $_.ToString('x2') })
}

# ── 1. Environment file ──────────────────────────────────────────────────────
if (Test-Path ".env") {
    Ok ".env already exists — keeping your settings"
} else {
    Info "Creating .env with generated secrets…"
    Copy-Item ".env.example" ".env"
    $content = Get-Content ".env" -Raw
    $content = $content -replace '(?m)^SECRET_KEY=.*',         "SECRET_KEY=$(New-Secret 32)"
    $content = $content -replace '(?m)^MYSQL_PASSWORD=.*',     "MYSQL_PASSWORD=$(New-Secret 16)"
    $content = $content -replace '(?m)^MYSQL_ROOT_PASSWORD=.*',"MYSQL_ROOT_PASSWORD=$(New-Secret 16)"
    # Write UTF-8 WITHOUT BOM (PS 5.1's Set-Content -Encoding utf8 adds a BOM that breaks .env parsing)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot ".env"), $content, $utf8NoBom)
    Ok ".env created (SECRET_KEY + MySQL passwords auto-generated)"
}

# ── 2. Build & start ─────────────────────────────────────────────────────────
if ($Rebuild) { Info "Rebuilding images (no cache)…"; Invoke-Compose "build --no-cache" }
$buildFlag = if ($NoBuild) { "" } else { "--build" }

Info "Building & starting containers (first run downloads images, please wait)…"
Invoke-Compose "up -d $buildFlag"

# ── 3. Wait for backend health ───────────────────────────────────────────────
Info "Waiting for backend to become healthy…"
$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        Invoke-RestMethod -Uri "http://localhost/api/v1/health" -TimeoutSec 3 *> $null
        $healthy = $true; break
    } catch { Start-Sleep -Seconds 3; Write-Host "." -NoNewline }
}
Write-Host ""
if ($healthy) { Ok "Backend is healthy" } else { Warn "Backend not healthy yet — run: $Compose logs -f backend" }

# ── 4. Done ──────────────────────────────────────────────────────────────────
Write-Host ""
Ok "StorageHub is up!"
Write-Host ""
Write-Host "  App        ->  http://localhost"        -ForegroundColor Green
Write-Host "  API docs   ->  http://localhost/docs"   -ForegroundColor Green
Write-Host ""
Write-Host "  First login: click 'Continue (Local Dev)' — the first account becomes admin."
Write-Host "  Logs: $Compose logs -f   |   Stop: .\install.ps1 -Down"
Write-Host ""
