# HST Portal - PostgreSQL Database Backup Script (Windows)
# Run this script via Windows Task Scheduler for automated daily backups

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupRoot = "D:\HST Portal\Backups",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "hst_portal",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresBin = "C:\Program Files\PostgreSQL\16\bin",
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30
)

# Create timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = "$BackupRoot\Database\$timestamp"
$logFile = "$BackupRoot\logs\backup-$timestamp.log"

# Create directories
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
New-Item -ItemType Directory -Force -Path "$BackupRoot\logs" | Out-Null

# Log function
function Write-Log {
    param([string]$Message)
    $logLine = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $logLine
    Add-Content -Path $logFile -Value $logLine
}

Write-Log "=== PostgreSQL Backup Started ==="
Write-Log "Database: $DatabaseName"
Write-Log "Backup Directory: $backupDir"

# Set environment for pg_dump
$env:PGPASSWORD = "Hst@20_26"
$env:PGUSER = "postgres"
$env:PGHOST = "localhost"
$env:PGPORT = "5432"

try {
    # Full database backup
    $backupFile = "$backupDir\$DatabaseName-full-$timestamp.sql"
    Write-Log "Creating full database backup..."
    
    $dumpArgs = @(
        "--host=localhost"
        "--port=5432"
        "--username=postgres"
        "--dbname=$DatabaseName"
        "--format=custom"
        "--verbose"
        "--file=$backupFile"
    )
    
    & "$PostgresBin\pg_dump.exe" $dumpArgs 2>&1 | ForEach-Object { Write-Log "pg_dump: $_" }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Full database backup completed: $backupFile"
        
        # Compress the backup
        Write-Log "Compressing backup..."
        Compress-Archive -Path $backupFile -DestinationPath "$backupDir\$DatabaseName-$timestamp.zip" -Force
        Remove-Item $backupFile
        Write-Log "Backup compressed: $backupDir\$DatabaseName-$timestamp.zip"
        
        # Get backup size
        $backupSize = (Get-Item "$backupDir\$DatabaseName-$timestamp.zip").Length / 1MB
        Write-Log "Backup size: $([math]::Round($backupSize, 2)) MB"
    } else {
        Write-Log "ERROR: pg_dump failed with exit code $LASTEXITCODE"
    }
    
    # Schema-only backup
    $schemaFile = "$backupDir\$DatabaseName-schema-$timestamp.sql"
    Write-Log "Creating schema-only backup..."
    
    $schemaArgs = @(
        "--host=localhost"
        "--port=5432"
        "--username=postgres"
        "--dbname=$DatabaseName"
        "--schema-only"
        "--file=$schemaFile"
    )
    
    & "$PostgresBin\pg_dump.exe" $schemaArgs 2>&1 | ForEach-Object { Write-Log "pg_dump (schema): $_" }
    Write-Log "Schema backup completed: $schemaFile"
    
} catch {
    Write-Log "ERROR: $_"
}

# Clean up old backups
Write-Log "Cleaning up backups older than $RetentionDays days..."
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
$oldBackups = Get-ChildItem -Path "$BackupRoot\Database" -Directory | Where-Object { $_.CreationTime -lt $cutoffDate }

foreach ($oldBackup in $oldBackups) {
    Write-Log "Removing old backup: $($oldBackup.FullName)"
    Remove-Item -Path $oldBackup.FullName -Recurse -Force
}

Write-Log "=== PostgreSQL Backup Completed ==="
Write-Host ""
Write-Host "Backup Summary:" -ForegroundColor Cyan
Write-Host "  Database: $DatabaseName" -ForegroundColor White
Write-Host "  Location: $backupDir" -ForegroundColor White
Write-Host "  Retention: $RetentionDays days" -ForegroundColor White
Write-Host "  Status: Complete" -ForegroundColor Green