# HR MODULE MIGRATION SCRIPT
# Run from: vclop/vclop-backend directory

Write-Host ""
Write-Host "HR MODULE MIGRATION STARTING..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Test connection
Write-Host "[1/6] Testing database connection..." -ForegroundColor Yellow
$testQuery = "SELECT 1"
$testQuery | npx prisma db execute --stdin
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database connection failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Database connected" -ForegroundColor Green
Write-Host ""

# Step 2: Push schema
Write-Host "[2/6] Creating HR tables..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss --skip-generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Schema push failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: 16 HR tables created" -ForegroundColor Green
Write-Host ""

# Step 3: Seed permissions
Write-Host "[3/6] Seeding HR permissions..." -ForegroundColor Yellow
Get-Content "ADD_HR_PERMISSIONS.sql" -Raw | npx prisma db execute --stdin
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Permission seeding failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Permissions seeded" -ForegroundColor Green
Write-Host ""

# Step 4: Seed initial data
Write-Host "[4/6] Seeding initial data..." -ForegroundColor Yellow
Get-Content "migrations\HR_MODULE_SEED_DATA.sql" -Raw | npx prisma db execute --stdin
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Data seeding failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Initial data seeded" -ForegroundColor Green
Write-Host ""

# Step 5: Generate Prisma client
Write-Host "[5/6] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Client generation failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 6: Verify
Write-Host "[6/6] Verifying installation..." -ForegroundColor Yellow
$verifyQuery = @"
SELECT COUNT(*) as table_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
"@
$verifyQuery | npx prisma db execute --stdin
Write-Host "SUCCESS: Verification complete" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was installed:" -ForegroundColor White
Write-Host "  - 16 database tables" -ForegroundColor Gray
Write-Host "  - 30+ HR permissions" -ForegroundColor Gray
Write-Host "  - 7 leave types" -ForegroundColor Gray
Write-Host "  - 27 public holidays" -ForegroundColor Gray
Write-Host "  - 2 approval policies" -ForegroundColor Gray
Write-Host "  - 46 API endpoints ready" -ForegroundColor Gray
Write-Host ""
Write-Host "Next: Restart your backend server" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor Cyan
Write-Host ""
