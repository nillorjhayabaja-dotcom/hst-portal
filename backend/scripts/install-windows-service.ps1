# HST Portal Backend - Windows Service Installation Script
# Run this script as Administrator in PowerShell
# This script installs the backend as a Windows service using NSSM

param(
    [Parameter(Mandatory=$false)]
    [string]$BackendPath = "C:\HST Portal\Backend",
    
    [Parameter(Mandatory=$false)]
    [string]$NodePath = (Get-Command node).Source
)

Write-Host "=== HST Portal Backend - Windows Service Installation ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
if (-not (Test-Path $NodePath)) {
    Write-Host "Node.js not found at: $NodePath" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if NSSM is installed
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssmPath) {
    Write-Host "NSSM not found. Installing NSSM..." -ForegroundColor Yellow
    
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $nssmZip = "$env:TEMP\nssm.zip"
    $nssmExtract = "$env:TEMP\nssm"
    
    Write-Host "Downloading NSSM..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip
    
    Expand-Archive -Path $nssmZip -DestinationPath $nssmExtract -Force
    
    # Find the correct architecture
    if ([Environment]::Is64BitOperatingSystem) {
        $nssmExe = "$nssmExtract\nssm-2.24\win64\nssm.exe"
    } else {
        $nssmExe = "$nssmExtract\nssm-2.24\win32\nssm.exe"
    }
    
    # Copy to Windows System32 for PATH access
    Copy-Item -Path $nssmExe -Destination "$env:SystemRoot\System32\nssm.exe" -Force
    Write-Host "NSSM installed successfully!" -ForegroundColor Green
}

# Verify backend path
if (-not (Test-Path "$BackendPath\package.json")) {
    Write-Host "Warning: Backend path '$BackendPath' does not contain package.json" -ForegroundColor Yellow
    Write-Host "The service will be created, but you need to ensure the backend files are in place." -ForegroundColor Yellow
}

# Build the backend first
Write-Host "Building backend..." -ForegroundColor Yellow
Push-Location $BackendPath
try {
    npm install
    npm run build
    Write-Host "Backend built successfully!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Build failed. The service will be created pointing to the existing build." -ForegroundColor Yellow
} finally {
    Pop-Location
}

# Stop existing service if running
Write-Host "Stopping existing service if running..." -ForegroundColor Yellow
nssm stop "HST Portal API" 2>$null
nssm remove "HST Portal API" confirm 2>$null

# Install the service
Write-Host "Installing HST Portal API service..." -ForegroundColor Cyan

# Application parameters
$appParams = "$BackendPath\dist\src\interfaces\http\server.js"

nssm install "HST Portal API" $NodePath $appParams
nssm set "HST Portal API" AppDirectory $BackendPath
nssm set "HST Portal API" Description "HST Enterprise Portal Backend API Server"
nssm set "HST Portal API" Start SERVICE_AUTO_START
nssm set "HST Portal API" AppStdout "$BackendPath\logs\service-out.log"
nssm set "HST Portal API" AppStderr "$BackendPath\logs\service-error.log"
nssm set "HST Portal API" AppRotateFiles 1
nssm set "HST Portal API" AppRotateOnline 1
nssm set "HST Portal API" AppRotateSeconds 86400
nssm set "HST Portal API" AppRotateBytes 10485760
nssm set "HST Portal API" AppEnvironmentExtra NODE_ENV=production PORT=3001

# Set environment variables from .env.production
$envContent = Get-Content "$BackendPath\.env.production" -ErrorAction SilentlyContinue
if ($envContent) {
    foreach ($line in $envContent) {
        if ($line -match '^([^#=]+)=["\']?(.*?)["\']?$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($key -and $value) {
                # Skip DATABASE_URL as it's loaded from .env by dotenv
                Write-Host "  Setting $key..." -ForegroundColor Gray
            }
        }
    }
}

# Start the service
Write-Host "Starting the service..." -ForegroundColor Yellow
nssm start "HST Portal API"

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Service Name: HST Portal API" -ForegroundColor Cyan
Write-Host "Node Path: $NodePath" -ForegroundColor Cyan
Write-Host "App Path: $BackendPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor White
Write-Host "  Start:   nssm start 'HST Portal API'" -ForegroundColor Yellow
Write-Host "  Stop:    nssm stop 'HST Portal API'" -ForegroundColor Yellow
Write-Host "  Restart: nssm restart 'HST Portal API'" -ForegroundColor Yellow
Write-Host "  Status:  nssm status 'HST Portal API'" -ForegroundColor Yellow
Write-Host "  Remove:  nssm remove 'HST Portal API' confirm" -ForegroundColor Yellow
Write-Host ""
Write-Host "Service automatically starts on system boot." -ForegroundColor Green