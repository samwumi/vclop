-- ================================================================================
-- HR & EMPLOYEE SELF-SERVICE MODULE - ROLLBACK SCRIPT
-- ================================================================================
-- Version: 1.0
-- Date: 2026-10-28
-- Purpose: Safely remove all HR module tables and constraints
-- ================================================================================
-- WARNING: This will delete ALL HR module data
-- BACKUP YOUR DATABASE BEFORE RUNNING
-- Test in development environment first
-- ================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ════════════════════════════════════════════════════════════════════════════
-- CONFIRM ROLLBACK
-- ════════════════════════════════════════════════════════════════════════════

SELECT 'WARNING: This will DELETE ALL HR module data!' AS warning;
SELECT 'Press Ctrl+C to cancel within 5 seconds...' AS instruction;
-- DO SELECT SLEEP(5);  -- Uncomment if your DB supports SLEEP()

-- ════════════════════════════════════════════════════════════════════════════
-- BACKUP VERIFICATION (Recommended)
-- ════════════════════════════════════════════════════════════════════════════

SELECT 'Checking for HR data...' AS info;

SELECT 'Employment Periods:' AS table_name, COUNT(*) AS record_count FROM employment_periods
UNION ALL
SELECT 'Leave Applications:', COUNT(*) FROM leave_applications
UNION ALL
SELECT 'Staff Loans:', COUNT(*) FROM staff_loans
UNION ALL
SELECT 'Staff Loan Payments:', COUNT(*) FROM staff_loan_payments
UNION ALL
SELECT 'Resource Ownerships:', COUNT(*) FROM resource_ownerships
UNION ALL
SELECT 'Resource Delegations:', COUNT(*) FROM resource_delegations
UNION ALL
SELECT 'Offboarding Cases:', COUNT(*) FROM offboarding_cases;

-- ════════════════════════════════════════════════════════════════════════════
-- DROP TABLES (in reverse dependency order)
-- ════════════════════════════════════════════════════════════════════════════

-- 6. Approval Policies
DROP TABLE IF EXISTS `approval_policies`;

-- 5. Offboarding
DROP TABLE IF EXISTS `offboarding_cases`;

-- 4. Resource Management
DROP TABLE IF EXISTS `resource_delegations`;
DROP TABLE IF EXISTS `resource_ownerships`;

-- 3. Staff Loans
DROP TABLE IF EXISTS `staff_loan_reversals`;
DROP TABLE IF EXISTS `staff_loan_payments`;
DROP TABLE IF EXISTS `staff_loan_installments`;
DROP TABLE IF EXISTS `staff_loans`;

-- 2. Leave Management
DROP TABLE IF EXISTS `public_holidays`;
DROP TABLE IF EXISTS `branch_workweeks`;
DROP TABLE IF EXISTS `leave_approvals`;
DROP TABLE IF EXISTS `leave_applications`;
DROP TABLE IF EXISTS `leave_entitlements`;
DROP TABLE IF EXISTS `leave_types`;

-- 1. Employment
DROP TABLE IF EXISTS `salary_history`;
DROP TABLE IF EXISTS `employment_periods`;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT 'Rollback Complete - Remaining HR Tables:' AS info;

SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
);

-- Should return empty set if rollback successful

SET foreign_key_checks = 1;

-- ================================================================================
-- ROLLBACK COMPLETE
-- ================================================================================
-- All HR module tables have been dropped
-- Next Steps:
-- 1. Verify no HR tables remain (query above should show 0 rows)
-- 2. Remove HR permissions: DELETE FROM permissions WHERE name LIKE 'hr:%' OR ...
-- 3. Clean up any orphaned audit logs if needed
-- ================================================================================
