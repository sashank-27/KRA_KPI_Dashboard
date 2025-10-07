# Restart Backend Server Script

Write-Host "=== Restarting Backend Server ===" -ForegroundColor Cyan

# Find process on port 5000
$connections = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    $processId = $connections.OwningProcess
    Write-Host "Found existing server on port 5000 (PID: $processId)" -ForegroundColor Yellow
    Write-Host "Stopping process..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Process stopped." -ForegroundColor Green
} else {
    Write-Host "No existing server found on port 5000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
Set-Location $PSScriptRoot
node index.js
