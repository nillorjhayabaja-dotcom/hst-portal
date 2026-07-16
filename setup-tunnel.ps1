# Cloudflare Tunnel Setup Script for HST Portal Backend
# Run this script in PowerShell as Administrator
# This script sets up a Cloudflare Tunnel to expose ONLY the backend API
# Database, storage, and all other internal services remain private

param(
    [Parameter(Mandatory=$false)]
    [string]$TunnelName = "hst-portal-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiDomain = "hst-portal-api.rjabaja.workers.dev",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendPort = "3001"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   HST Portal - Cloudflare Tunnel Setup" -ForegroundColor Cyan
Write-Host "   Securely expose ONLY the backend API via Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Check/Install cloudflared ----
Write-Host "=== Step 1: Checking cloudflared Installation ===" -ForegroundColor Cyan
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflaredPath) {
    Write-Host "cloudflared not found. Installing..." -ForegroundColor Yellow
    
    # Create bin directory
    $binPath = "$env:USERPROFILE\bin"
    if (-not (Test-Path $binPath)) {
        New-Item -ItemType Directory -Force -Path $binPath | Out-Null
    }
    
    # Download cloudflared
    $cloudflaredUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    $cloudflaredExe = "$binPath\cloudflared.exe"
    
    Write-Host "Downloading cloudflared..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $cloudflaredUrl -OutFile $cloudflaredExe -UseBasicParsing
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$binPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$binPath", "User")
        $env:Path += ";$binPath"
    }
    
    Write-Host "cloudflared installed successfully!" -ForegroundColor Green
} else {
    Write-Host "cloudflared is already installed at: $($cloudflaredPath.Source)" -ForegroundColor Green
}

# ---- Step 2: Authenticate with Cloudflare ----
Write-Host ""
Write-Host "=== Step 2: Authenticate with Cloudflare ===" -ForegroundColor Cyan
Write-Host "A browser window will open. Please log in to your Cloudflare account and authorize cloudflared." -ForegroundColor Yellow
Write-Host ""

$authResult = cloudflared tunnel login 2>&1
$authResult | ForEach-Object { Write-Host $_ }

# ---- Step 3: Create Tunnel ----
Write-Host ""
Write-Host "=== Step 3: Creating Tunnel: $TunnelName ===" -ForegroundColor Cyan

# Check if tunnel already exists
$existingTunnel = cloudflared tunnel list 2>&1 | Select-String $TunnelName
$tunnelId = $null

if ($existingTunnel) {
    Write-Host "Tunnel '$TunnelName' already exists." -ForegroundColor Yellow
    # Extract existing tunnel ID
    $tunnelInfo = cloudflared tunnel info $TunnelName 2>&1
    $tunnelId = $tunnelInfo | Select-String -Pattern "Tunnel ID:\s*([a-f0-9-]+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "Using existing tunnel ID: $tunnelId" -ForegroundColor Green
} else {
    Write-Host "Creating new tunnel..." -ForegroundColor Yellow
    $tunnelOutput = cloudflared tunnel create $TunnelName 2>&1
    $tunnelOutput | ForEach-Object { Write-Host $_ }
    
    # Extract tunnel ID from output
    $tunnelId = $tunnelOutput | Select-String -Pattern "Created tunnel ([a-f0-9-]+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    
    if (-not $tunnelId) {
        Write-Host "Could not extract tunnel ID. Checking alternative format..." -ForegroundColor Yellow
        $tunnelId = $tunnelOutput | Select-String -Pattern "([a-f0-9-]{36})" | ForEach-Object { $_.Matches.Groups[1].Value }
    }
}

if (-not $tunnelId) {
    Write-Host "Could not extract tunnel ID. Please check the output above." -ForegroundColor Red
    exit 1
}

Write-Host "Tunnel ID: $tunnelId" -ForegroundColor Green

# ---- Step 4: Create Configuration File ----
Write-Host ""
Write-Host "=== Step 4: Creating Cloudflare Tunnel Configuration ===" -ForegroundColor Cyan

# Create .cloudflared directory if it doesn't exist
$cloudflaredConfigDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $cloudflaredConfigDir)) {
    New-Item -ItemType Directory -Force -Path $cloudflaredConfigDir | Out-Null
}

# Create config file - ONLY expose the API, NOT database or storage
$configContent = @"
# HST Portal - Cloudflare Tunnel Configuration
# 
# IMPORTANT: This tunnel exposes ONLY the Express API on localhost:${BackendPort}
# PostgreSQL (port 5432), storage directories, and other services are NEVER exposed
#
# Architecture:
#   Internet -> Cloudflare Edge -> Cloudflare Tunnel -> localhost:${BackendPort}
#
# Security:
#   - PostgreSQL is localhost only (port 5432)
#   - Storage is local filesystem only
#   - Only Express API is reachable via tunnel
#   - All ingress rules are explicitly defined

tunnel: ${TunnelName}
credentials-file: ${cloudflaredConfigDir//\$/\\\$}/${tunnelId}.json

# Ingress Rules - Define what services are exposed
ingress:
  # Main API endpoint - https://${ApiDomain}
  # Proxies /api/v1/* to localhost:${BackendPort}/api/v1/*
  - hostname: ${ApiDomain}
    service: http://localhost:${BackendPort}
    
  # Health check endpoint - used by Cloudflare monitoring
  # - hostname: ${ApiDomain}
  #   path: /health
  #   service: http://localhost:${BackendPort}
    
  # Catch-all: Return 404 for any undefined routes
  # This ensures no internal services are accidentally exposed
  - service: http_status:404
"@

$configPath = "$cloudflaredConfigDir\config.yml"
$configContent | Out-File -FilePath $configPath -Encoding UTF8 -Force

Write-Host "Configuration file created at: $configPath" -ForegroundColor Green

# ---- Step 5: Route DNS ----
Write-Host ""
Write-Host "=== Step 5: Configuring DNS Route ===" -ForegroundColor Cyan
Write-Host "Creating DNS route for $ApiDomain..." -ForegroundColor Yellow

$dnsOutput = cloudflared tunnel route dns $TunnelName $ApiDomain 2>&1
$dnsOutput | ForEach-Object { Write-Host $_ }

# ---- Step 6: Create Windows Service for Tunnel ----
Write-Host ""
Write-Host "=== Step 6: Installing Tunnel as Windows Service ===" -ForegroundColor Cyan
Write-Host "This ensures the tunnel starts automatically on system boot." -ForegroundColor Yellow

# Check if NSSM is available
$nssmAvailable = Get-Command nssm -ErrorAction SilentlyContinue

if ($nssmAvailable) {
    # Stop existing service if running
    nssm stop "HST Portal Tunnel" 2>$null
    nssm remove "HST Portal Tunnel" confirm 2>$null
    
    # Install as Windows service
    nssm install "HST Portal Tunnel" (Get-Command cloudflared).Source "tunnel run $TunnelName"
    nssm set "HST Portal Tunnel" Description "Cloudflare Tunnel for HST Enterprise Portal Backend API"
    nssm set "HST Portal Tunnel" Start SERVICE_AUTO_START
    nssm set "HST Portal Tunnel" AppDirectory $cloudflaredConfigDir
    nssm set "HST Portal Tunnel" AppStdout "$env:USERPROFILE\.cloudflared\tunnel-service.log"
    nssm set "HST Portal Tunnel" AppStderr "$env:USERPROFILE\.cloudflared\tunnel-service-error.log"
    nssm set "HST Portal Tunnel" AppRotateFiles 1
    nssm set "HST Portal Tunnel" AppRotateOnline 1
    nssm set "HST Portal Tunnel" AppRotateSeconds 86400
    nssm set "HST Portal Tunnel" AppRotateBytes 10485760
    
    nssm start "HST Portal Tunnel"
    Write-Host "Tunnel installed as Windows service and started!" -ForegroundColor Green
} else {
    Write-Host "NSSM not found. NSSM is recommended to run the tunnel as a Windows service." -ForegroundColor Yellow
    Write-Host "Install NSSM from: https://nssm.cc/download" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run the tunnel manually, use the command below, or use Task Scheduler." -ForegroundColor Yellow
}

# ---- Step 7: Verify Tunnel ----
Write-Host ""
Write-Host "=== Step 7: Verifying Tunnel Status ===" -ForegroundColor Cyan

$tunnelStatus = cloudflared tunnel info $TunnelName 2>&1
$tunnelStatus | ForEach-Object { Write-Host $_ }

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tunnel Name: $TunnelName" -ForegroundColor Cyan
Write-Host "Tunnel ID: $tunnelId" -ForegroundColor Cyan
Write-Host "API Domain: https://$ApiDomain" -ForegroundColor Cyan
Write-Host "Backend Port: $BackendPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Start your backend server:" -ForegroundColor Yellow
Write-Host "     cd backend && npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Verify tunnel is running:" -ForegroundColor Yellow
Write-Host "     cloudflared tunnel list" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test the API:" -ForegroundColor Yellow
Write-Host "     curl https://$ApiDomain/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Security Notes:" -ForegroundColor White
Write-Host "  - PostgreSQL is NOT exposed through this tunnel" -ForegroundColor Green
Write-Host "  - Storage directories are NOT exposed through this tunnel" -ForegroundColor Green
Write-Host "  - Only the Express API on port $BackendPort is accessible" -ForegroundColor Green
Write-Host "  - All traffic is encrypted via Cloudflare SSL" -ForegroundColor Green
Write-Host ""
Write-Host "To manage the tunnel:" -ForegroundColor White
Write-Host "  Start:   cloudflared tunnel run $TunnelName" -ForegroundColor Gray
Write-Host "  Stop:    cloudflared tunnel stop $TunnelName" -ForegroundColor Gray
Write-Host "  Delete:  cloudflared tunnel delete $TunnelName" -ForegroundColor Gray
Write-Host "  Logs:    cloudflared tunnel info $TunnelName" -ForegroundColor Gray
Write-Host ""