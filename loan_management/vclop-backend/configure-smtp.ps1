# ============================================================================
# SMTP Configuration Helper
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SMTP Configuration Helper" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Choose your email service:`n" -ForegroundColor Yellow
Write-Host "1. Mailtrap (Recommended for testing - FREE)" -ForegroundColor White
Write-Host "2. Gmail (For testing only)" -ForegroundColor White
Write-Host "3. SendGrid (Production)" -ForegroundColor White
Write-Host "4. AWS SES (Production)" -ForegroundColor White
Write-Host "5. Keep current settings" -ForegroundColor Gray

$choice = Read-Host "`nEnter choice (1-5)"

$envPath = ".env"
$envContent = Get-Content $envPath -Raw

switch ($choice) {
    "1" {
        Write-Host "`n📧 Mailtrap Setup" -ForegroundColor Cyan
        Write-Host "=================`n" -ForegroundColor Cyan
        Write-Host "1. Go to https://mailtrap.io and sign up (free tier available)" -ForegroundColor White
        Write-Host "2. Create a new inbox or use the default one" -ForegroundColor White
        Write-Host "3. Click 'SMTP Settings' in your inbox" -ForegroundColor White
        Write-Host "4. Copy the credentials and paste below`n" -ForegroundColor White
        
        $username = Read-Host "Enter Mailtrap Username"
        $password = Read-Host "Enter Mailtrap Password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        )
        
        $envContent = $envContent -replace 'MAIL_HOST=.*', 'MAIL_HOST=sandbox.smtp.mailtrap.io'
        $envContent = $envContent -replace 'MAIL_PORT=.*', 'MAIL_PORT=2525'
        $envContent = $envContent -replace 'MAIL_SECURE=.*', 'MAIL_SECURE=false'
        $envContent = $envContent -replace 'MAIL_USER=.*', "MAIL_USER=$username"
        $envContent = $envContent -replace 'MAIL_PASSWORD=.*', "MAIL_PASSWORD=$passwordPlain"
        $envContent = $envContent -replace 'MAIL_FROM_EMAIL=.*', 'MAIL_FROM_EMAIL=noreply@vclop.local'
        
        Set-Content $envPath $envContent
        Write-Host "`n✓ Mailtrap configured successfully!" -ForegroundColor Green
        Write-Host "  All test emails will be caught by Mailtrap" -ForegroundColor White
    }
    
    "2" {
        Write-Host "`n📧 Gmail Setup" -ForegroundColor Cyan
        Write-Host "=============`n" -ForegroundColor Cyan
        Write-Host "1. Enable 2-Factor Authentication on your Gmail account" -ForegroundColor White
        Write-Host "2. Go to https://myaccount.google.com/apppasswords" -ForegroundColor White
        Write-Host "3. Generate a new app password" -ForegroundColor White
        Write-Host "4. Copy the 16-character password (no spaces)`n" -ForegroundColor White
        
        $email = Read-Host "Enter your Gmail address"
        $appPassword = Read-Host "Enter App Password (16 characters)" -AsSecureString
        $appPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($appPassword)
        )
        
        $envContent = $envContent -replace 'MAIL_HOST=.*', 'MAIL_HOST=smtp.gmail.com'
        $envContent = $envContent -replace 'MAIL_PORT=.*', 'MAIL_PORT=587'
        $envContent = $envContent -replace 'MAIL_SECURE=.*', 'MAIL_SECURE=false'
        $envContent = $envContent -replace 'MAIL_USER=.*', "MAIL_USER=$email"
        $envContent = $envContent -replace 'MAIL_PASSWORD=.*', "MAIL_PASSWORD=$appPasswordPlain"
        $envContent = $envContent -replace 'MAIL_FROM_EMAIL=.*', "MAIL_FROM_EMAIL=$email"
        
        Set-Content $envPath $envContent
        Write-Host "`n✓ Gmail configured successfully!" -ForegroundColor Green
        Write-Host "⚠ Note: Gmail has a limit of 500 emails/day" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host "`n📧 SendGrid Setup" -ForegroundColor Cyan
        Write-Host "================`n" -ForegroundColor Cyan
        Write-Host "1. Sign up at https://sendgrid.com" -ForegroundColor White
        Write-Host "2. Create an API key with 'Mail Send' permission" -ForegroundColor White
        Write-Host "3. Verify your sender domain/email`n" -ForegroundColor White
        
        $apiKey = Read-Host "Enter SendGrid API Key" -AsSecureString
        $apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
        )
        $fromEmail = Read-Host "Enter FROM email address"
        
        $envContent = $envContent -replace 'MAIL_HOST=.*', 'MAIL_HOST=smtp.sendgrid.net'
        $envContent = $envContent -replace 'MAIL_PORT=.*', 'MAIL_PORT=587'
        $envContent = $envContent -replace 'MAIL_SECURE=.*', 'MAIL_SECURE=false'
        $envContent = $envContent -replace 'MAIL_USER=.*', 'MAIL_USER=apikey'
        $envContent = $envContent -replace 'MAIL_PASSWORD=.*', "MAIL_PASSWORD=$apiKeyPlain"
        $envContent = $envContent -replace 'MAIL_FROM_EMAIL=.*', "MAIL_FROM_EMAIL=$fromEmail"
        
        Set-Content $envPath $envContent
        Write-Host "`n✓ SendGrid configured successfully!" -ForegroundColor Green
    }
    
    "4" {
        Write-Host "`n📧 AWS SES Setup" -ForegroundColor Cyan
        Write-Host "===============`n" -ForegroundColor Cyan
        Write-Host "1. Set up AWS SES in your AWS account" -ForegroundColor White
        Write-Host "2. Verify your domain" -ForegroundColor White
        Write-Host "3. Create SMTP credentials in SES console`n" -ForegroundColor White
        
        $region = Read-Host "Enter AWS region (e.g., us-east-1)"
        $username = Read-Host "Enter SMTP Username"
        $password = Read-Host "Enter SMTP Password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        )
        $fromEmail = Read-Host "Enter FROM email address"
        
        $envContent = $envContent -replace 'MAIL_HOST=.*', "MAIL_HOST=email-smtp.$region.amazonaws.com"
        $envContent = $envContent -replace 'MAIL_PORT=.*', 'MAIL_PORT=587'
        $envContent = $envContent -replace 'MAIL_SECURE=.*', 'MAIL_SECURE=false'
        $envContent = $envContent -replace 'MAIL_USER=.*', "MAIL_USER=$username"
        $envContent = $envContent -replace 'MAIL_PASSWORD=.*', "MAIL_PASSWORD=$passwordPlain"
        $envContent = $envContent -replace 'MAIL_FROM_EMAIL=.*', "MAIL_FROM_EMAIL=$fromEmail"
        
        Set-Content $envPath $envContent
        Write-Host "`n✓ AWS SES configured successfully!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host "`nKeeping current SMTP settings..." -ForegroundColor Gray
    }
    
    default {
        Write-Host "`n✗ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

if ($choice -ne "5") {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Configuration Complete!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Your .env file has been updated." -ForegroundColor White
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Start the backend server: npm run start:dev" -ForegroundColor White
    Write-Host "2. Test email sending (see setup-email-auth.md)" -ForegroundColor White
    Write-Host "`n✓ Ready to send emails!`n" -ForegroundColor Green
}
