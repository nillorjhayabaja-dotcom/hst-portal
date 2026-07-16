# HST Portal - Storage Directory Structure Setup (Windows)
# Run this script to create the complete storage directory structure

param(
    [Parameter(Mandatory=$false)]
    [string]$StorageRoot = "D:\HST Portal"
)

Write-Host "=== HST Portal - Storage Directory Structure Setup ===" -ForegroundColor Cyan
Write-Host "Creating storage directories under: $StorageRoot"
Write-Host ""

# Define all storage folders
$folders = @(
    "Uploads",
    "GatePass",
    "Leave",
    "MRF",
    "PurchaseRequest",
    "Visitors",
    "Vehicles",
    "Assets",
    "EmployeeSignatures",
    "QR",
    "GeneratedPDF",
    "Reports",
    "Logs",
    "Backups\Database",
    "Backups\Storage",
    "Backups\Logs"
)

foreach ($folder in $folders) {
    $path = Join-Path -Path $StorageRoot -ChildPath $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Write-Host "  [CREATED] $path" -ForegroundColor Green
    } else {
        Write-Host "  [EXISTS]  $path" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Storage Structure Created ===" -ForegroundColor Green
Write-Host ""
Write-Host "Directory Structure:" -ForegroundColor Cyan
Write-Host "  $StorageRoot\" -ForegroundColor White
Write-Host "  ├── Uploads\" -ForegroundColor White
Write-Host "  ├── GatePass\" -ForegroundColor White
Write-Host "  ├── Leave\" -ForegroundColor White
Write-Host "  ├── MRF\" -ForegroundColor White
Write-Host "  ├── PurchaseRequest\" -ForegroundColor White
Write-Host "  ├── Visitors\" -ForegroundColor White
Write-Host "  ├── Vehicles\" -ForegroundColor White
Write-Host "  ├── Assets\" -ForegroundColor White
Write-Host "  ├── EmployeeSignatures\" -ForegroundColor White
Write-Host "  ├── QR\" -ForegroundColor White
Write-Host "  ├── GeneratedPDF\" -ForegroundColor White
Write-Host "  ├── Reports\" -ForegroundColor White
Write-Host "  ├── Logs\" -ForegroundColor White
Write-Host "  └── Backups\" -ForegroundColor White
Write-Host "      ├── Database\" -ForegroundColor White
Write-Host "      ├── Storage\" -ForegroundColor White
Write-Host "      └── Logs\" -ForegroundColor White
Write-Host ""

Write-Host "Next Step: Update backend/.env.production with the correct UPLOAD_PATH" -ForegroundColor Yellow
Write-Host "  UPLOAD_PATH=$StorageRoot\Uploads" -ForegroundColor Gray