# Cloudflare Tunnel Setup Script for HST Portal Backend
# Run this script in PowerShell as Administrator

Write-Host "=== Cloudflare Tunnel Setup for HST Portal Backend ===" -ForegroundColor Cyan
Write-Host ""

# Check if cloudflared is installed
Write-Host "Checking cloudflared installation..." -ForegroundColor Yellow
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
    Invoke-WebRequest -Uri $cloudflaredUrl -OutFile $cloudflaredExe
    
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

Write-Host ""
Write-Host "=== Step 1: Authenticate with Cloudflare ===" -ForegroundColor Cyan
Write-Host "A browser window will open. Please log in to your Cloudflare account and authorize cloudflared." -ForegroundColor Yellow
Write-Host ""

# Login to Cloudflare
cloudflared tunnel login

Write-Host ""
Write-Host "=== Step 2: Create Tunnel ===" -ForegroundColor Cyan
$tunnelName = "hst-portal-backend"
Write-Host "Creating tunnel: $tunnelName" -ForegroundColor Yellow

# Create tunnel and capture the output
$tunnelOutput = cloudflared tunnel create $tunnelName 2>&1
$tunnelOutput | ForEach-Object { Write-Host $_ }

# Extract tunnel ID from output
$tunnelId = $tunnelOutput | Select-String -Pattern "Created tunnel ([a-f0-9-]+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if (-not $tunnelId) {
    Write-Host "Could not extract tunnel ID. Please check the output above." -ForegroundColor Red
    exit 1
}

Write-Host "Tunnel created with ID: $tunnelId" -ForegroundColor Green

Write-Host ""
Write-Host "=== Step 3: Create Configuration File ===" -ForegroundColor Cyan

# Create .cloudflared directory if it doesn't exist
$cloudflaredConfigDir = "$env:USERPROFILE\.cloudflared"
if (-not (Test-Path $cloudflaredConfigDir)) {
    New-Item -ItemType Directory -Force -Path $cloudflaredConfigDir | Out-Null
}

# Create config file
$configContent = @"
tunnel: $tunnelId
credentials-file: $env:USERPROFILE\.cloudflared\$tunnelId.json

ingress:
  - hostname: hst-portal-api.rjabaja.workers.dev
    service: http://localhost:3001
  - service: http_status:404
"@

$configPath = "$cloudflaredConfigDir\config.yml"
$configContent | Out-File -FilePath $configPath -Encoding UTF8

Write-Host "Configuration file created at: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "=== Step 4: Route DNS ===" -ForegroundColor Cyan
Write-Host "Creating DNS route for hst-portal-api.rjabaja.workers.dev..." -ForegroundColor Yellow

cloudflared tunnel route dns $tunnelName hst-portal-api.rjabaja.workers.dev

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start your backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. In a new terminal, run the tunnel:" -ForegroundColor White
Write-Host "   cloudflared tunnel run $tunnelName" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Your backend will be accessible at:" -ForegroundColor White
Write-Host "   https://hst-portal-api.rjabaja.workers.dev" -ForegroundColor Green
Write-Host ""
Write-Host "4. Update backend/.env CORS settings:" -ForegroundColor White
Write-Host "   CORS_ORIGIN=https://hst-portal.rjabaja.workers.dev" -ForegroundColor Yellow
Write-Host "   FRONTEND_URL=https://hst-portal.rjabaja.workers.dev" -ForegroundColor Yellow
Write-Host ""
