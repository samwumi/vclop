# SMTP Configuration Helper Script
# This script helps you quickly configure email settings

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   VCLOP Email Configuration Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    
    if (Test-Path ".env.example") {
        Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created!" -ForegroundColor Green
    } else {
        Write-Host "Creating new .env file..." -ForegroundColor Yellow
        New-Item -Path ".env" -ItemType File
        Write-Host "✅ .env file created!" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "Choose your email provider:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Mailtrap (Easiest - Testing only)" -ForegroundColor White
Write-Host "     → Safe testing, no real emails sent" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Gmail (Real emails)" -ForegroundColor White
Write-Host "     → Requires App Password setup" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. SendGrid (Production)" -ForegroundColor White
Write-Host "     → Best for production use" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Custom SMTP" -ForegroundColor White
Write-Host "     → Manual configuration" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 MAILTRAP CONFIGURATION" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://mailtrap.io" -ForegroundColor White
        Write-Host "2. Sign up for free" -ForegroundColor White
        Write-Host "3. Go to Email Testing → Inboxes" -ForegroundColor White
        Write-Host "4. Copy your SMTP credentials" -ForegroundColor White
        Write-Host ""
        
        $username = Read-Host "Enter Mailtrap Username"
        $password = Read-Host "Enter Mailtrap Password" -AsSecureString
        $passwordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        # Update .env file
        $content = Get-Content $envFile -Raw
        $content = $content -replace "MAIL_HOST=.*", "MAIL_HOST=sandbox.smtp.mailtrap.io"
        $content = $content -replace "MAIL_PORT=.*", "MAIL_PORT=2525"
        $content = $content -replace "MAIL_SECURE=.*", "MAIL_SECURE=false"
        $content = $content -replace "MAIL_USER=.*", "MAIL_USER=$username"
        $content = $content -replace "MAIL_PASSWORD=.*", "MAIL_PASSWORD=$passwordText"
        $content = $content -replace "MAIL_FROM_NAME=.*", "MAIL_FROM_NAME=VCLOP"
        $content = $content -replace "MAIL_FROM_EMAIL=.*", "MAIL_FROM_EMAIL=noreply@vclop.local"
        
        Set-Content -Path $envFile -Value $content
        
        Write-Host ""
        Write-Host "✅ Mailtrap configured successfully!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "🔧 GMAIL CONFIGURATION" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: You need a Gmail App Password!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://myaccount.google.com/security" -ForegroundColor White
        Write-Host "2. Enable 2-Step Verification" -ForegroundColor White
        Write-Host "3. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor White
        Write-Host "4. Create an App Password for 'Mail'" -ForegroundColor White
        Write-Host "5. Copy the 16-character password" -ForegroundColor White
        Write-Host ""
        
        $email = Read-Host "Enter your Gmail address"
        $password = Read-Host "Enter App Password (16 characters)" -AsSecureString
        $passwordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        # Update .env file
        $content = Get-Content $envFile -Raw
        $content = $content -replace "MAIL_HOST=.*", "MAIL_HOST=smtp.gmail.com"
        $content = $content -replace "MAIL_PORT=.*", "MAIL_PORT=587"
        $content = $content -replace "MAIL_SECURE=.*", "MAIL_SECURE=false"
        $content = $content -replace "MAIL_USER=.*", "MAIL_USER=$email"
        $content = $content -replace "MAIL_PASSWORD=.*", "MAIL_PASSWORD=$passwordText"
        $content = $content -replace "MAIL_FROM_NAME=.*", "MAIL_FROM_NAME=VCLOP"
        $content = $content -replace "MAIL_FROM_EMAIL=.*", "MAIL_FROM_EMAIL=$email"
        
        Set-Content -Path $envFile -Value $content
        
        Write-Host ""
        Write-Host "✅ Gmail configured successfully!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "🔧 SENDGRID CONFIGURATION" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Follow these steps:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://sendgrid.com" -ForegroundColor White
        Write-Host "2. Sign up (free: 100 emails/day)" -ForegroundColor White
        Write-Host "3. Settings → API Keys → Create API Key" -ForegroundColor White
        Write-Host "4. Copy the API key (starts with SG.)" -ForegroundColor White
        Write-Host ""
        
        $apiKey = Read-Host "Enter SendGrid API Key" -AsSecureString
        $apiKeyText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey))
        $fromEmail = Read-Host "Enter sender email (e.g., noreply@yourdomain.com)"
        
        # Update .env file
        $content = Get-Content $envFile -Raw
        $content = $content -replace "MAIL_HOST=.*", "MAIL_HOST=smtp.sendgrid.net"
        $content = $content -replace "MAIL_PORT=.*", "MAIL_PORT=587"
        $content = $content -replace "MAIL_SECURE=.*", "MAIL_SECURE=false"
        $content = $content -replace "MAIL_USER=.*", "MAIL_USER=apikey"
        $content = $content -replace "MAIL_PASSWORD=.*", "MAIL_PASSWORD=$apiKeyText"
        $content = $content -replace "MAIL_FROM_NAME=.*", "MAIL_FROM_NAME=VCLOP"
        $content = $content -replace "MAIL_FROM_EMAIL=.*", "MAIL_FROM_EMAIL=$fromEmail"
        
        Set-Content -Path $envFile -Value $content
        
        Write-Host ""
        Write-Host "✅ SendGrid configured successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Remember to verify your sender email in SendGrid!" -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host ""
        Write-Host "🔧 CUSTOM SMTP CONFIGURATION" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        
        $host = Read-Host "Enter SMTP Host (e.g., smtp.hostinger.com)"
        $port = Read-Host "Enter SMTP Port (usually 587 or 465)"
        $secure = Read-Host "Use SSL/TLS? (true/false)" 
        $user = Read-Host "Enter SMTP Username"
        $password = Read-Host "Enter SMTP Password" -AsSecureString
        $passwordText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        $fromEmail = Read-Host "Enter sender email"
        
        # Update .env file
        $content = Get-Content $envFile -Raw
        $content = $content -replace "MAIL_HOST=.*", "MAIL_HOST=$host"
        $content = $content -replace "MAIL_PORT=.*", "MAIL_PORT=$port"
        $content = $content -replace "MAIL_SECURE=.*", "MAIL_SECURE=$secure"
        $content = $content -replace "MAIL_USER=.*", "MAIL_USER=$user"
        $content = $content -replace "MAIL_PASSWORD=.*", "MAIL_PASSWORD=$passwordText"
        $content = $content -replace "MAIL_FROM_NAME=.*", "MAIL_FROM_NAME=VCLOP"
        $content = $content -replace "MAIL_FROM_EMAIL=.*", "MAIL_FROM_EMAIL=$fromEmail"
        
        Set-Content -Path $envFile -Value $content
        
        Write-Host ""
        Write-Host "✅ Custom SMTP configured successfully!" -ForegroundColor Green
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Email configuration saved to .env file" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your backend server" -ForegroundColor White
Write-Host "  2. Test forgot password flow" -ForegroundColor White
Write-Host "  3. Check email delivery" -ForegroundColor White
Write-Host ""
Write-Host "To restart backend:" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "To test email:" -ForegroundColor Yellow
Write-Host "  See CONFIGURE_SMTP_NOW.md for test commands" -ForegroundColor White
Write-Host ""
Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host ""
