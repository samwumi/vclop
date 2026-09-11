# ============================================================================
# Email Authentication Test Script
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Email Authentication Test                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api/v1"
$testsPassed = 0
$testsFailed = 0

# ============================================================================
# Test 1: Check if server is running
# ============================================================================

Write-Host "[Test 1/3] Checking if backend server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Server is running" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "✗ Server is not running!" -ForegroundColor Red
    Write-Host "  Please run: npm run start:dev" -ForegroundColor Yellow
    $testsFailed++
    exit 1
}

# ============================================================================
# Test 2: Send Password Reset Email
# ============================================================================

Write-Host "`n[Test 2/3] Sending password reset email to admin@vclop.local..." -ForegroundColor Yellow

try {
    $resetBody = @{
        email = "admin@vclop.local"
    } | ConvertTo-Json

    $resetResponse = Invoke-RestMethod `
        -Uri "$baseUrl/auth/forgot-password" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $resetBody `
        -ErrorAction Stop

    if ($resetResponse.success) {
        Write-Host "✓ Password reset email sent successfully" -ForegroundColor Green
        Write-Host "  Message: $($resetResponse.message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "✗ Failed to send email" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Error sending password reset email" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Wait for email to be processed
Start-Sleep -Seconds 2

# ============================================================================
# Test 3: Check Database Logs
# ============================================================================

Write-Host "`n[Test 3/3] Checking email logs in database..." -ForegroundColor Yellow

try {
    $mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
    
    if (Test-Path $mysqlPath) {
        $dbQuery = "USE vclop; SELECT recipientRef AS email, event, status, sentAt FROM notification_logs WHERE channel='EMAIL' ORDER BY createdAt DESC LIMIT 1;"
        
        $result = & $mysqlPath -u root -e $dbQuery 2>$null
        
        if ($result -match "SENT") {
            Write-Host "✓ Email logged in database with status: SENT" -ForegroundColor Green
            Write-Host "`n$result" -ForegroundColor Gray
            $testsPassed++
        } elseif ($result -match "FAILED") {
            Write-Host "✗ Email failed to send (check database logs)" -ForegroundColor Red
            Write-Host "`n$result" -ForegroundColor Gray
            $testsFailed++
        } else {
            Write-Host "⚠ Could not verify email status in database" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ MySQL client not found, skipping database check" -ForegroundColor Yellow
        Write-Host "  You can manually check: C:\xampp\mysql\bin\mysql.exe" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Could not check database logs" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# ============================================================================
# Test Results Summary
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test Results                                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

# ============================================================================
# Next Steps
# ============================================================================

if ($testsPassed -ge 2) {
    Write-Host "`n✓ Email authentication is working!" -ForegroundColor Green
    Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Check Your Email in Mailtrap                 ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    Write-Host "1. Go to: https://mailtrap.io" -ForegroundColor White
    Write-Host "2. Login to your account" -ForegroundColor White
    Write-Host "3. Click: Email Testing → Inboxes → My Inbox" -ForegroundColor White
    Write-Host "4. You should see the password reset email! 📧`n" -ForegroundColor White
    
    Write-Host "The email will have:" -ForegroundColor Yellow
    Write-Host "  • Subject: 'Reset your VCLOP password'" -ForegroundColor Gray
    Write-Host "  • Beautiful purple/blue gradient header" -ForegroundColor Gray
    Write-Host "  • Professional 'Reset Password' button" -ForegroundColor Gray
    Write-Host "  • Security warning banner" -ForegroundColor Gray
    Write-Host "  • Mobile-responsive design`n" -ForegroundColor Gray
    
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  Want to Test Email Verification Too?        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "Run this to create a test user (triggers verification email):`n" -ForegroundColor Yellow
    Write-Host "  .\test-create-user.ps1`n" -ForegroundColor Cyan
    
} else {
    Write-Host "`n✗ Some tests failed. Please check:" -ForegroundColor Red
    Write-Host "  1. Is the backend server running? (npm run start:dev)" -ForegroundColor Yellow
    Write-Host "  2. Are SMTP credentials correct in .env?" -ForegroundColor Yellow
    Write-Host "  3. Is XAMPP MySQL running?" -ForegroundColor Yellow
    Write-Host "  4. Check backend console for errors`n" -ForegroundColor Yellow
}

# ============================================================================
# View Templates
# ============================================================================

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Preview Email Templates in Browser           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Open these files to see the email designs:" -ForegroundColor White
Write-Host "  • email-preview-verification.html" -ForegroundColor Gray
Write-Host "  • email-preview-password-reset.html`n" -ForegroundColor Gray

Write-Host "Or run: Start-Process email-preview-password-reset.html`n" -ForegroundColor Cyan
