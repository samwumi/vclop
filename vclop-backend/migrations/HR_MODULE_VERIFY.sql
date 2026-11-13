-- ================================================================================
-- HR & EMPLOYEE SELF-SERVICE MODULE - VERIFICATION QUERIES
-- ================================================================================
-- Version: 1.0
-- Date: 2026-10-28
-- Purpose: Comprehensive verification of HR module installation
-- ================================================================================

SET NAMES utf8mb4;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. TABLE EXISTENCE VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ TABLE EXISTENCE CHECK ═══' AS section;

SELECT 
    CASE 
        WHEN COUNT(*) = 16 THEN '✓ ALL 16 HR TABLES EXIST'
        ELSE CONCAT('✗ MISSING TABLES: ', 16 - COUNT(*), ' tables missing')
    END AS status,
    COUNT(*) AS tables_found,
    16 AS tables_expected
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

-- List all HR tables with row counts
SELECT '═══ HR TABLES OVERVIEW ═══' AS section;

SELECT 
    TABLE_NAME,
    TABLE_ROWS AS estimated_rows,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS size_mb,
    ENGINE,
    TABLE_COLLATION,
    CREATE_TIME
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
ORDER BY TABLE_NAME;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. FOREIGN KEY CONSTRAINTS VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ FOREIGN KEY CONSTRAINTS ═══' AS section;

SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Count foreign keys per table
SELECT '═══ FK COUNT PER TABLE ═══' AS section;

SELECT 
    TABLE_NAME,
    COUNT(*) AS fk_count
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
AND REFERENCED_TABLE_NAME IS NOT NULL
GROUP BY TABLE_NAME
ORDER BY fk_count DESC, TABLE_NAME;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. INDEX VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ INDEXES (NON-PRIMARY) ═══' AS section;

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
    NON_UNIQUE,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
AND INDEX_NAME != 'PRIMARY'
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;

-- Index count summary
SELECT '═══ INDEX COUNT SUMMARY ═══' AS section;

SELECT 
    TABLE_NAME,
    COUNT(DISTINCT INDEX_NAME) - 1 AS non_primary_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
GROUP BY TABLE_NAME
HAVING non_primary_indexes > 0
ORDER BY non_primary_indexes DESC, TABLE_NAME;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. ENUM VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ ENUM COLUMNS ═══' AS section;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'employment_periods', 'salary_history',
    'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals',
    'branch_workweeks', 'public_holidays',
    'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals',
    'resource_ownerships', 'resource_delegations',
    'offboarding_cases', 'approval_policies'
)
AND DATA_TYPE = 'enum'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. SEED DATA VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ SEED DATA CHECK ═══' AS section;

-- Leave types
SELECT 
    'Leave Types' AS data_type,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) >= 5 THEN '✓ GOOD' ELSE '✗ INSUFFICIENT' END AS status
FROM leave_types
WHERE isActive = TRUE

UNION ALL

-- Branch workweeks
SELECT 
    'Branch Workweeks',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✓ GOOD' ELSE '✗ MISSING' END
FROM branch_workweeks

UNION ALL

-- Public holidays
SELECT 
    'Public Holidays',
    COUNT(*),
    CASE WHEN COUNT(*) >= 10 THEN '✓ GOOD' ELSE '✗ INSUFFICIENT' END
FROM public_holidays

UNION ALL

-- Approval policies
SELECT 
    'Approval Policies',
    COUNT(*),
    CASE WHEN COUNT(*) >= 1 THEN '✓ GOOD' ELSE '✗ MISSING' END
FROM approval_policies
WHERE isActive = TRUE;

-- Detailed leave types
SELECT '═══ LEAVE TYPES DETAIL ═══' AS section;

SELECT 
    code,
    name,
    isPaid,
    requiresApproval,
    canCarryForward,
    maxCarryForwardDays,
    countWeekendsAsLeave,
    countHolidaysAsLeave,
    isActive
FROM leave_types
ORDER BY sortOrder;

-- Approval policies detail
SELECT '═══ APPROVAL POLICIES DETAIL ═══' AS section;

SELECT 
    entityType,
    policyName,
    version,
    effectiveFrom,
    effectiveTo,
    isActive,
    JSON_LENGTH(levels, '$.levels') AS approval_levels_count
FROM approval_policies
ORDER BY entityType, version DESC;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. PERMISSIONS VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ HR PERMISSIONS CHECK ═══' AS section;

SELECT 
    'HR Permissions' AS permission_category,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) >= 30 THEN '✓ COMPLETE' ELSE '✗ INCOMPLETE' END AS status
FROM permissions
WHERE name LIKE 'employment:%' 
   OR name LIKE 'leaves:%'
   OR name LIKE 'leave_entitlements:%'
   OR name LIKE 'staff_loans:%'
   OR name LIKE 'staff_loan_payments:%'
   OR name LIKE 'resources:%'
   OR name LIKE 'offboarding:%'
   OR name LIKE 'approval_policies:%';

-- HR permissions detail
SELECT '═══ HR PERMISSIONS DETAIL ═══' AS section;

SELECT 
    SUBSTRING_INDEX(name, ':', 1) AS module,
    COUNT(*) AS permission_count
FROM permissions
WHERE name LIKE 'employment:%' 
   OR name LIKE 'leaves:%'
   OR name LIKE 'leave_entitlements:%'
   OR name LIKE 'staff_loans:%'
   OR name LIKE 'staff_loan_payments:%'
   OR name LIKE 'resources:%'
   OR name LIKE 'offboarding:%'
   OR name LIKE 'approval_policies:%'
GROUP BY module
ORDER BY module;

-- ════════════════════════════════════════════════════════════════════════════
-- 7. DATA INTEGRITY CHECKS
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ DATA INTEGRITY CHECKS ═══' AS section;

-- Check for orphaned records (if any data exists)
SELECT 
    'Orphaned Leave Applications' AS check_name,
    COUNT(*) AS count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM leave_applications la
LEFT JOIN users u ON la.userId = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Orphaned Staff Loans',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM staff_loans sl
LEFT JOIN users u ON sl.userId = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Orphaned Leave Entitlements',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END
FROM leave_entitlements le
LEFT JOIN users u ON le.userId = u.id
WHERE u.id IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 8. STORAGE & PERFORMANCE
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ STORAGE SUMMARY ═══' AS section;

SELECT 
    'Total HR Tables' AS metric,
    COUNT(*) AS value,
    'tables' AS unit
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

UNION ALL

SELECT 
    'Total Data Size',
    ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2),
    'MB'
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

UNION ALL

SELECT 
    'Total Index Size',
    ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2),
    'MB'
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

-- ════════════════════════════════════════════════════════════════════════════
-- 9. FINAL SUMMARY
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ VERIFICATION SUMMARY ═══' AS section;

SELECT 
    'HR Module Installation' AS component,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('employment_periods', 'salary_history', 'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals', 'branch_workweeks', 'public_holidays', 'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals', 'resource_ownerships', 'resource_delegations', 'offboarding_cases', 'approval_policies')) = 16 
        THEN '✓ COMPLETE'
        ELSE '✗ INCOMPLETE'
    END AS status

UNION ALL

SELECT 
    'Seed Data',
    CASE 
        WHEN (SELECT COUNT(*) FROM leave_types WHERE isActive = TRUE) >= 5 
         AND (SELECT COUNT(*) FROM approval_policies WHERE isActive = TRUE) >= 1
        THEN '✓ COMPLETE'
        ELSE '✗ INCOMPLETE'
    END

UNION ALL

SELECT 
    'HR Permissions',
    CASE 
        WHEN (SELECT COUNT(*) FROM permissions WHERE name LIKE 'employment:%' OR name LIKE 'leaves:%' OR name LIKE 'staff_loans:%' OR name LIKE 'resources:%' OR name LIKE 'offboarding:%') >= 30
        THEN '✓ COMPLETE'
        ELSE '✗ INCOMPLETE'
    END

UNION ALL

SELECT 
    'Foreign Keys',
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME IN ('employment_periods', 'salary_history', 'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals', 'branch_workweeks', 'public_holidays', 'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals', 'resource_ownerships', 'resource_delegations', 'offboarding_cases', 'approval_policies') AND REFERENCED_TABLE_NAME IS NOT NULL) > 40
        THEN '✓ COMPLETE'
        ELSE '✗ CHECK REQUIRED'
    END

UNION ALL

SELECT 
    'Indexes',
    CASE 
        WHEN (SELECT COUNT(DISTINCT CONCAT(TABLE_NAME, '.', INDEX_NAME)) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('employment_periods', 'salary_history', 'leave_types', 'leave_entitlements', 'leave_applications', 'leave_approvals', 'branch_workweeks', 'public_holidays', 'staff_loans', 'staff_loan_installments', 'staff_loan_payments', 'staff_loan_reversals', 'resource_ownerships', 'resource_delegations', 'offboarding_cases', 'approval_policies') AND INDEX_NAME != 'PRIMARY') > 30
        THEN '✓ COMPLETE'
        ELSE '✗ CHECK REQUIRED'
    END;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION COMPLETE
-- ════════════════════════════════════════════════════════════════════════════
-- Review all sections above
-- All checks should show ✓ status
-- If any checks show ✗, investigate and resolve before proceeding
-- ════════════════════════════════════════════════════════════════════════════
