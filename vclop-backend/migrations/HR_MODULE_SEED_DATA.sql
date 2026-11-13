-- ================================================================================
-- HR & EMPLOYEE SELF-SERVICE MODULE - INITIAL DATA SEEDING
-- ================================================================================
-- Version: 1.0
-- Date: 2026-10-28
-- Purpose: Seed essential initial data for HR module
-- ================================================================================
-- Run this AFTER executing HR_MODULE_MIGRATION.sql
-- Run this AFTER executing ADD_HR_PERMISSIONS.sql
-- ================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ════════════════════════════════════════════════════════════════════════════
-- 1. LEAVE TYPES
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO `leave_types` (
    `id`, `name`, `code`, `description`,
    `isPaid`, `requiresDocumentation`,
    `countWeekendsAsLeave`, `countHolidaysAsLeave`,
    `canCarryForward`, `maxCarryForwardDays`,
    `requiresApproval`, `isActive`, `sortOrder`,
    `createdAt`, `updatedAt`
)
VALUES
-- Annual Leave
(
    UUID(), 'Annual Leave', 'ANNUAL',
    'Paid annual leave for rest and recreation',
    TRUE, FALSE,
    FALSE, FALSE,
    TRUE, 5.0,
    TRUE, TRUE, 1,
    NOW(), NOW()
),
-- Sick Leave
(
    UUID(), 'Sick Leave', 'SICK',
    'Leave for illness or medical appointments',
    TRUE, TRUE,
    TRUE, TRUE,
    FALSE, 0,
    TRUE, TRUE, 2,
    NOW(), NOW()
),
-- Emergency Leave
(
    UUID(), 'Emergency Leave', 'EMERGENCY',
    'Urgent unforeseeable circumstances',
    TRUE, FALSE,
    FALSE, FALSE,
    FALSE, 0,
    TRUE, TRUE, 3,
    NOW(), NOW()
),
-- Maternity Leave
(
    UUID(), 'Maternity Leave', 'MATERNITY',
    'Statutory maternity leave',
    TRUE, TRUE,
    TRUE, TRUE,
    FALSE, 0,
    TRUE, TRUE, 4,
    NOW(), NOW()
),
-- Paternity Leave
(
    UUID(), 'Paternity Leave', 'PATERNITY',
    'Statutory paternity leave',
    TRUE, TRUE,
    TRUE, TRUE,
    FALSE, 0,
    TRUE, TRUE, 5,
    NOW(), NOW()
),
-- Bereavement Leave
(
    UUID(), 'Bereavement Leave', 'BEREAVEMENT',
    'Leave for death of immediate family member',
    TRUE, TRUE,
    TRUE, TRUE,
    FALSE, 0,
    TRUE, TRUE, 6,
    NOW(), NOW()
),
-- Unpaid Leave
(
    UUID(), 'Unpaid Leave', 'UNPAID',
    'Leave without pay',
    FALSE, FALSE,
    FALSE, FALSE,
    FALSE, 0,
    TRUE, TRUE, 7,
    NOW(), NOW()
)
ON DUPLICATE KEY UPDATE `updatedAt` = NOW();

-- ════════════════════════════════════════════════════════════════════════════
-- 2. DEFAULT BRANCH WORKWEEK (Monday-Friday)
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO `branch_workweeks` (
    `id`, `branchId`, `effectiveFrom`, `effectiveTo`,
    `isSundayWorkday`, `isMondayWorkday`, `isTuesdayWorkday`,
    `isWednesdayWorkday`, `isThursdayWorkday`, `isFridayWorkday`,
    `isSaturdayWorkday`, `notes`, `createdAt`
)
SELECT 
    UUID(),
    b.id,
    '2026-01-01',
    NULL,
    FALSE, TRUE, TRUE,
    TRUE, TRUE, TRUE,
    FALSE,
    'Default Monday-Friday workweek',
    NOW()
FROM `branches` b
WHERE NOT EXISTS (
    SELECT 1 FROM `branch_workweeks` bw WHERE bw.branchId = b.id
);

-- ════════════════════════════════════════════════════════════════════════════
-- 3. PUBLIC HOLIDAYS 2026-2027 (Philippines)
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO `public_holidays` (
    `id`, `name`, `date`, `isRecurring`, `branchId`, `notes`, `createdAt`
)
VALUES
-- 2026 Holidays
(UUID(), 'New Year''s Day', '2026-01-01', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Lunar New Year', '2026-01-29', TRUE, NULL, 'Special Non-Working Day', NOW()),
(UUID(), 'EDSA People Power Revolution', '2026-02-25', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Araw ng Kagitingan', '2026-04-09', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Maundy Thursday', '2026-04-02', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Good Friday', '2026-04-03', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Black Saturday', '2026-04-04', TRUE, NULL, 'Special Non-Working Day', NOW()),
(UUID(), 'Labor Day', '2026-05-01', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Independence Day', '2026-06-12', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Eid al-Adha', '2026-06-28', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Ninoy Aquino Day', '2026-08-21', TRUE, NULL, 'Special Non-Working Day', NOW()),
(UUID(), 'National Heroes Day', '2026-08-31', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'All Saints'' Day', '2026-11-01', TRUE, NULL, 'Special Non-Working Day', NOW()),
(UUID(), 'Bonifacio Day', '2026-11-30', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Feast of the Immaculate Conception', '2026-12-08', TRUE, NULL, 'Special Non-Working Day', NOW()),
(UUID(), 'Christmas Eve', '2026-12-24', TRUE, NULL, 'Special Non-Working Day', NOW()),
(UUID(), 'Christmas Day', '2026-12-25', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Rizal Day', '2026-12-30', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'New Year''s Eve', '2026-12-31', TRUE, NULL, 'Special Non-Working Day', NOW()),

-- 2027 Holidays (partial)
(UUID(), 'New Year''s Day', '2027-01-01', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'EDSA People Power Revolution', '2027-02-25', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Araw ng Kagitingan', '2027-04-09', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Labor Day', '2027-05-01', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Independence Day', '2027-06-12', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'National Heroes Day', '2027-08-30', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Bonifacio Day', '2027-11-30', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Christmas Day', '2027-12-25', TRUE, NULL, 'Regular Holiday', NOW()),
(UUID(), 'Rizal Day', '2027-12-30', TRUE, NULL, 'Regular Holiday', NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ════════════════════════════════════════════════════════════════════════════
-- 4. DEFAULT APPROVAL POLICY - LEAVE APPLICATIONS
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO `approval_policies` (
    `id`, `entityType`, `policyName`, `description`,
    `levels`, `version`, `effectiveFrom`, `effectiveTo`,
    `isActive`, `createdAt`, `updatedAt`, `createdById`
)
SELECT
    UUID(),
    'LEAVE_APPLICATION',
    'Standard Leave Approval Policy',
    'Default approval workflow for leave applications based on duration',
    JSON_OBJECT(
        'levels', JSON_ARRAY(
            JSON_OBJECT(
                'level', 1,
                'name', 'Supervisor Approval',
                'selectionCriteria', JSON_OBJECT('type', 'SUPERVISOR'),
                'escalationHours', 48,
                'conditions', NULL
            ),
            JSON_OBJECT(
                'level', 2,
                'name', 'Department Head Approval',
                'selectionCriteria', JSON_OBJECT('type', 'DEPARTMENT_HEAD'),
                'escalationHours', 24,
                'conditions', JSON_OBJECT('minDays', 5)
            ),
            JSON_OBJECT(
                'level', 3,
                'name', 'HR Manager Approval',
                'selectionCriteria', JSON_OBJECT('type', 'ROLE', 'requiredRole', 'HR Manager'),
                'escalationHours', 24,
                'conditions', JSON_OBJECT('minDays', 10)
            )
        )
    ),
    1,
    '2026-01-01',
    NULL,
    TRUE,
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM approval_policies 
    WHERE entityType = 'LEAVE_APPLICATION' 
    AND policyName = 'Standard Leave Approval Policy'
);

-- ════════════════════════════════════════════════════════════════════════════
-- 5. DEFAULT APPROVAL POLICY - STAFF LOANS
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO `approval_policies` (
    `id`, `entityType`, `policyName`, `description`,
    `levels`, `version`, `effectiveFrom`, `effectiveTo`,
    `isActive`, `createdAt`, `updatedAt`, `createdById`
)
SELECT
    UUID(),
    'STAFF_LOAN',
    'Standard Staff Loan Approval Policy',
    'Default approval workflow for staff loan applications based on amount',
    JSON_OBJECT(
        'levels', JSON_ARRAY(
            JSON_OBJECT(
                'level', 1,
                'name', 'Supervisor Approval',
                'selectionCriteria', JSON_OBJECT('type', 'SUPERVISOR'),
                'escalationHours', 72,
                'conditions', JSON_OBJECT('maxAmount', 50000)
            ),
            JSON_OBJECT(
                'level', 2,
                'name', 'HR Manager Approval',
                'selectionCriteria', JSON_OBJECT('type', 'ROLE', 'requiredRole', 'HR Manager'),
                'escalationHours', 48,
                'conditions', JSON_OBJECT('minAmount', 50001)
            ),
            JSON_OBJECT(
                'level', 3,
                'name', 'Finance Manager Approval',
                'selectionCriteria', JSON_OBJECT('type', 'ROLE', 'requiredRole', 'Accounting Head'),
                'escalationHours', 48,
                'conditions', JSON_OBJECT('minAmount', 50001)
            ),
            JSON_OBJECT(
                'level', 4,
                'name', 'COO Approval',
                'selectionCriteria', JSON_OBJECT('type', 'ROLE', 'requiredRole', 'COO'),
                'escalationHours', 24,
                'conditions', JSON_OBJECT('minAmount', 200000)
            )
        )
    ),
    1,
    '2026-01-01',
    NULL,
    TRUE,
    NOW(),
    NOW(),
    (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1)
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM approval_policies 
    WHERE entityType = 'STAFF_LOAN' 
    AND policyName = 'Standard Staff Loan Approval Policy'
);

-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════

SELECT 'Seed Data Summary:' AS info;

SELECT 'Leave Types' AS category, COUNT(*) AS count FROM leave_types
UNION ALL
SELECT 'Branch Workweeks', COUNT(*) FROM branch_workweeks
UNION ALL
SELECT 'Public Holidays', COUNT(*) FROM public_holidays
UNION ALL
SELECT 'Approval Policies', COUNT(*) FROM approval_policies;

-- Show leave types
SELECT 'Leave Types Created:' AS info;
SELECT code, name, isPaid, requiresApproval, canCarryForward, isActive
FROM leave_types
ORDER BY sortOrder;

-- Show holidays count by year
SELECT 'Public Holidays by Year:' AS info;
SELECT YEAR(date) AS year, COUNT(*) AS holiday_count
FROM public_holidays
GROUP BY YEAR(date)
ORDER BY year;

-- Show approval policies
SELECT 'Approval Policies Created:' AS info;
SELECT entityType, policyName, version, effectiveFrom, isActive
FROM approval_policies
ORDER BY entityType;

-- ================================================================================
-- SEED DATA COMPLETE
-- ================================================================================
-- Next Steps:
-- 1. Create leave entitlements for employees (per employee, per year)
-- 2. Test leave application workflow
-- 3. Test staff loan workflow
-- 4. Configure additional policies if needed
-- ================================================================================
