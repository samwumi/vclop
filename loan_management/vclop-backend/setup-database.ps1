# ============================================================================
# VCLOP Email Authentication Setup Script
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VCLOP Email Authentication Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check if MariaDB/MySQL is running
Write-Host "[Step 1/5] Checking database service..." -ForegroundColor Yellow
$dbService = Get-Service -Name "MariaDB" -ErrorAction SilentlyContinue
if (-not $dbService) {
    $dbService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($dbService) {
    Write-Host "✓ Database service found: $($dbService.DisplayName)" -ForegroundColor Green
    if ($dbService.Status -ne "Running") {
        Write-Host "  Starting database service..." -ForegroundColor Yellow
        Start-Service $dbService.Name
        Start-Sleep -Seconds 3
    }
    Write-Host "✓ Database service is running" -ForegroundColor Green
} else {
    Write-Host "✗ No database service found!" -ForegroundColor Red
    Write-Host "  Please install MySQL/MariaDB or start XAMPP" -ForegroundColor Red
    exit 1
}

# Step 2: Test database connection
Write-Host "`n[Step 2/5] Testing database connection..." -ForegroundColor Yellow

# Try to find mysql executable
$mysqlPaths = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "mysql"
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $mysqlPath = $path
        break
    }
    if ($path -eq "mysql") {
        try {
            $null = Get-Command mysql -ErrorAction Stop
            $mysqlPath = "mysql"
            break
        } catch {}
    }
}

if (-not $mysqlPath) {
    Write-Host "✗ MySQL client not found!" -ForegroundColor Red
    Write-Host "  Skipping database check, but continuing setup..." -ForegroundColor Yellow
} else {
    Write-Host "✓ MySQL client found: $mysqlPath" -ForegroundColor Green
    
    # Test connection and create database if needed
    Write-Host "  Creating/verifying 'vclop' database..." -ForegroundColor Yellow
    $createDbCommand = "CREATE DATABASE IF NOT EXISTS vclop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    try {
        & $mysqlPath -u root -e $createDbCommand 2>$null
        Write-Host "✓ Database 'vclop' is ready" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not create database (might need password)" -ForegroundColor Yellow
        Write-Host "  Run manually: CREATE DATABASE vclop;" -ForegroundColor Yellow
    }
}

# Step 3: Generate Prisma Client
Write-Host "`n[Step 3/5] Generating Prisma Client..." -ForegroundColor Yellow
try {
    npm run prisma:generate 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma Client generated" -ForegroundColor Green
    } else {
        Write-Host "⚠ Prisma generate had issues, continuing anyway..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not generate Prisma Client" -ForegroundColor Yellow
}

# Step 4: Run migrations
Write-Host "`n[Step 4/5] Running database migrations..." -ForegroundColor Yellow
Write-Host "  This will create all tables..." -ForegroundColor Cyan

try {
    $migrateOutput = npm run prisma:migrate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migrations completed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠ Migration had issues. Output:" -ForegroundColor Yellow
        Write-Host $migrateOutput -ForegroundColor Gray
        
        Write-Host "`n  Trying alternative: prisma migrate deploy..." -ForegroundColor Yellow
        npx prisma migrate deploy
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Migrations completed via deploy" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "✗ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  You may need to run manually: npm run prisma:migrate" -ForegroundColor Yellow
}

# Step 5: Seed the database
Write-Host "`n[Step 5/5] Seeding database (including email templates)..." -ForegroundColor Yellow
Write-Host "  This will create:" -ForegroundColor Cyan
Write-Host "  • Email verification template" -ForegroundColor Cyan
Write-Host "  • Password reset template" -ForegroundColor Cyan
Write-Host "  • Admin user and permissions" -ForegroundColor Cyan
Write-Host "  • Sample data" -ForegroundColor Cyan

try {
    npm run prisma:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Database seeded successfully!" -ForegroundColor Green
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "EMAIL TEMPLATES INSTALLED! ✓" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Seeding failed" -ForegroundColor Red
    }
} catch {
    Write-Host "`n✗ Seeding error: $($_.Exception.Message)" -ForegroundColor Red
}

# Configuration reminder
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS: Configure SMTP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nEdit your .env file with real SMTP credentials:`n" -ForegroundColor Yellow

Write-Host "OPTION 1: Mailtrap (Recommended for Testing)" -ForegroundColor Cyan
Write-Host "  1. Sign up at https://mailtrap.io (free)" -ForegroundColor White
Write-Host "  2. Get credentials from SMTP Settings" -ForegroundColor White
Write-Host "  3. Update .env file:`n" -ForegroundColor White
Write-Host "     MAIL_HOST=sandbox.smtp.mailtrap.io" -ForegroundColor Gray
Write-Host "     MAIL_PORT=2525" -ForegroundColor Gray
Write-Host "     MAIL_USER=your_username_here" -ForegroundColor Gray
Write-Host "     MAIL_PASSWORD=your_password_here`n" -ForegroundColor Gray

Write-Host "OPTION 2: Gmail (Testing Only)" -ForegroundColor Cyan
Write-Host "  1. Enable 2FA on Gmail" -ForegroundColor White
Write-Host "  2. Generate App Password at:" -ForegroundColor White
Write-Host "     https://myaccount.google.com/apppasswords" -ForegroundColor White
Write-Host "  3. Update .env file:`n" -ForegroundColor White
Write-Host "     MAIL_HOST=smtp.gmail.com" -ForegroundColor Gray
Write-Host "     MAIL_PORT=587" -ForegroundColor Gray
Write-Host "     MAIL_USER=your-email@gmail.com" -ForegroundColor Gray
Write-Host "     MAIL_PASSWORD=your_16_char_app_password`n" -ForegroundColor Gray

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Then run: npm run start:dev" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✓ Setup script completed!" -ForegroundColor Green
Write-Host "  See setup-email-auth.md for testing guide`n" -ForegroundColor White
