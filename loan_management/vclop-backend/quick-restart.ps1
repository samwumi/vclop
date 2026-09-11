# ====================================================================
# Quick Restart (No Build)
# ====================================================================
# Use this when you haven't changed any code, just want to restart
# ====================================================================

Write-Host "`n⚡ Quick Restart (No Build)" -ForegroundColor Cyan
Write-Host "==========================`n" -ForegroundColor Cyan

# Stop Node processes
Write-Host "📛 Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
Write-Host "✅ Stopped`n" -ForegroundColor Green

# Start server
Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
Write-Host "URL: http://localhost:3000`n" -ForegroundColor Cyan
npm run start:dev
