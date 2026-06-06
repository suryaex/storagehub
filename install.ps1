# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — one-shot installer for Windows (Docker + Nginx, LAN-ready)
# Usage (PowerShell):
#   .\install.ps1            # build + start everything (auto LAN config)
#   .\install.ps1 -Rebuild   # force rebuild images
#   .\install.ps1 -Down      # stop the stack
#   .\install.ps1 -Reset     # stop and DELETE all data (volumes)
# ─────────────────────────────────────────────────────────────────────────────
[CmdletBinding()]
param([switch]$Rebuild, [switch]$Down, [switch]$Reset, [switch]$NoBuild)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Info($m){ Write-Host "▸ $m" -ForegroundColor Blue }
function Ok($m)  { Write-Host "✓ $m" -ForegroundColor Green }
function Warn($m){ Write-Host "! $m" -ForegroundColor Yellow }
function Fail($m){ Write-Host "✗ $m" -ForegroundColor Red; exit 1 }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail "Docker is not installed. Get Docker Desktop: https://docs.docker.com/get-docker/"
}
try { docker info *> $null } catch { Fail "Docker daemon is not running. Start Docker Desktop and retry." }

$Compose = "docker compose"
try { docker compose version *> $null } catch {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) { $Compose = "docker-compose" } else { Fail "Docker Compose not found." }
}
function Invoke-Compose([string]$ArgString) { Invoke-Expression "$Compose $ArgString" }

if ($Down)  { Info "Stopping StorageHub…"; Invoke-Compose "down"; Ok "Stopped."; exit 0 }
if ($Reset) {
    Warn "This deletes ALL data (DB + uploaded files)!"
    if ((Read-Host "Type 'yes' to continue") -eq "yes") { Invoke-Compose "down -v"; Ok "Reset done." } else { Write-Host "Aborted." }
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
function Get-LanIp {
    try {
        $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } |
               Select-Object -First 1).IPv4Address.IPAddress
        if ($ip) { return $ip }
    } catch {}
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
               Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
               Select-Object -First 1).IPAddress
        if ($ip) { return $ip }
    } catch {}
    return "127.0.0.1"
}

$Ip = Get-LanIp
Ok "Detected LAN address: $Ip"

# ── 1. Environment file (LAN-aware) ──────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Info "Creating .env with generated secrets + LAN config…"
    Copy-Item ".env.example" ".env"
    $c = Get-Content ".env" -Raw
    $c = $c -replace '(?m)^SECRET_KEY=.*',          "SECRET_KEY=$(New-Secret 32)"
    $c = $c -replace '(?m)^MYSQL_PASSWORD=.*',      "MYSQL_PASSWORD=$(New-Secret 16)"
    $c = $c -replace '(?m)^MYSQL_ROOT_PASSWORD=.*', "MYSQL_ROOT_PASSWORD=$(New-Secret 16)"
    Ok ".env created (secrets generated)"
} else {
    Ok ".env already exists — keeping secrets, aligning URLs to LAN"
    $c = Get-Content ".env" -Raw
}
$c = $c -replace '(?m)^FRONTEND_URL=.*', "FRONTEND_URL=http://$Ip"
$c = $c -replace '(?m)^BACKEND_URL=.*',  "BACKEND_URL=http://$Ip"
$c = $c -replace '(?m)^CORS_ORIGINS=.*', "CORS_ORIGINS=http://localhost,http://$Ip"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot ".env"), $c, $utf8NoBom)
Ok "Bound to network address $Ip"

# ── 2. Build & start (frontend, backend, mysql, nginx reverse proxy) ─────────
if ($Rebuild) { Info "Rebuilding images (no cache)…"; Invoke-Compose "build --no-cache" }
$buildFlag = if ($NoBuild) { "" } else { "--build" }
Info "Building & starting containers (nginx reverse proxy on port 80)…"
Invoke-Compose "up -d $buildFlag"

# ── 3. Wait for backend health ───────────────────────────────────────────────
Info "Waiting for backend to become healthy…"
$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    try { Invoke-RestMethod -Uri "http://localhost/api/v1/health" -TimeoutSec 3 *> $null; $healthy = $true; break }
    catch { Start-Sleep -Seconds 3; Write-Host "." -NoNewline }
}
Write-Host ""
if ($healthy) { Ok "Backend is healthy" } else { Warn "Backend not healthy yet — run: $Compose logs -f backend" }

# ── 4. Done ──────────────────────────────────────────────────────────────────
Write-Host ""
Ok "StorageHub is up (Nginx reverse proxy active)!"
Write-Host ""
Write-Host "  On this machine  ->  http://localhost"                 -ForegroundColor Green
Write-Host "  On the network   ->  http://$Ip        (phone/other PCs)" -ForegroundColor Green
Write-Host "  API docs         ->  http://$Ip/docs"                  -ForegroundColor Green
Write-Host ""
Write-Host "  First login: 'Continue (Local Dev)' — the first account becomes admin."
Write-Host "  If other devices can't reach it, allow TCP port 80 in Windows Firewall:"
Write-Host "    New-NetFirewallRule -DisplayName 'StorageHub' -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow"
Write-Host "  Logs: $Compose logs -f   |   Stop: .\install.ps1 -Down"
Write-Host ""
