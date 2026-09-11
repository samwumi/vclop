# ====================================================================
# VCLOP Backend Restart Script
# ====================================================================
# This script stops the running backend, rebuilds, and starts it again
# ====================================================================

Write-Host "`n🔄 VCLOP Backend Restart Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Stop existing Node processes
Write-Host "📛 Step 1: Stopping existing Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node process(es) running" -ForegroundColor Gray
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   ✅ All Node processes stopped`n" -ForegroundColor Green
} else {
    Write-Host "   ℹ No Node processes running`n" -ForegroundColor Gray
}

# Step 2: Build the application
Write-Host "🔨 Step 2: Building application..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "   ✅ Build completed successfully`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Build failed: $_" -ForegroundColor Red
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Step 3: Start the server
Write-Host "🚀 Step 3: Starting backend server..." -ForegroundColor Yellow
Write-Host "   Backend starting in development mode..." -ForegroundColor Gray
Write-Host "   URL: http://localhost:3000`n" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server`n" -ForegroundColor Gray
Write-Host "================================`n" -ForegroundColor Cyan

# Start the server
npm run start:dev
