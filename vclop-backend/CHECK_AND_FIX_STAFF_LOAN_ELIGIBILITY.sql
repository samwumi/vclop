-- ============================================
-- CHECK AND FIX STAFF LOAN ELIGIBILITY
-- ============================================
-- This script checks eligibility and creates employment record if missing

-- Step 1: Check your current user status and employment
SELECT 
    u.id,
    u.email,
    u.firstName,
    u.lastName,
    u.status as userStatus,
    ep.id as employmentId,
    ep.hireDate,
    ep.isCurrent,
    ep.salary,
    ep.terminationDate,
    TIMESTAMPDIFF(MONTH, ep.hireDate, NOW()) as monthsEmployed,
    CASE 
        WHEN u.status != 'ACTIVE' THEN '❌ User account not ACTIVE'
        WHEN ep.id IS NULL THEN '❌ No employment record found'
        WHEN ep.isCurrent = 0 THEN '❌ Employment not marked as current'
        WHEN ep.terminationDate IS NOT NULL THEN '❌ Employment terminated'
        WHEN ep.salary IS NULL OR ep.salary = 0 THEN '❌ No valid salary set'
        WHEN ep.salary < 1000 THEN '❌ Salary below minimum (₦1,000)'
        WHEN TIMESTAMPDIFF(MONTH, ep.hireDate, NOW()) < 3 THEN '⚠️ Less than 3 months employed (policy not enforced yet)'
        ELSE '✅ ELIGIBLE'
    END as eligibilityStatus
FROM User u
LEFT JOIN EmploymentPeriod ep ON ep.userId = u.id AND ep.isCurrent = 1
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
ORDER BY u.createdAt DESC
LIMIT 1;

-- Step 2: Check for active loans that would block eligibility
SELECT 
    sl.id,
    sl.applicationNumber,
    sl.principalAmount,
    sl.status,
    sl.createdAt
FROM User u
JOIN StaffLoan sl ON sl.userId = u.id
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND sl.status IN ('ACTIVE', 'PENDING_APPROVAL', 'APPROVED')
ORDER BY sl.createdAt DESC;

-- Step 3: Check for overdue installments
SELECT 
    sli.id,
    sl.applicationNumber,
    sli.installmentNumber,
    sli.amount,
    sli.dueDate,
    sli.status
FROM User u
JOIN StaffLoan sl ON sl.userId = u.id
JOIN StaffLoanInstallment sli ON sli.staffLoanId = sl.id
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND sli.status = 'OVERDUE'
ORDER BY sli.dueDate DESC;

-- ============================================
-- FIX: Create Employment Record (if missing)
-- ============================================
-- Run this if you don't have an employment record

INSERT INTO EmploymentPeriod (
    id,
    userId,
    periodNumber,
    hireDate,
    isCurrent,
    jobTitle,
    departmentId,
    branchId,
    contractType,
    salary,
    salaryEffectiveDate,
    createdAt,
    updatedAt,
    createdById
)
SELECT 
    UUID(),
    u.id,
    1, -- First period
    DATE_SUB(NOW(), INTERVAL 6 MONTH), -- Hired 6 months ago (exceeds 3-month minimum)
    1, -- isCurrent = true
    'Staff Member', -- Default job title
    (SELECT id FROM Department LIMIT 1), -- Use first department
    (SELECT id FROM Branch LIMIT 1), -- Use first branch
    'PERMANENT', -- Contract type
    150000.00, -- Default monthly salary (₦150,000) - ADJUST AS NEEDED
    DATE_SUB(NOW(), INTERVAL 6 MONTH), -- Salary effective from hire date
    NOW(),
    NOW(),
    u.id -- Created by self
FROM User u
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND NOT EXISTS (
    SELECT 1 FROM EmploymentPeriod ep 
    WHERE ep.userId = u.id AND ep.isCurrent = 1
  )
LIMIT 1;

-- ============================================
-- FIX: Activate User Account (if inactive)
-- ============================================
UPDATE User 
SET status = 'ACTIVE',
    updatedAt = NOW()
WHERE email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND status != 'ACTIVE';

-- ============================================
-- FIX: Update Employment to Current (if exists but not current)
-- ============================================
UPDATE EmploymentPeriod ep
JOIN User u ON u.id = ep.userId
SET ep.isCurrent = 1,
    ep.terminationDate = NULL,
    ep.updatedAt = NOW()
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND ep.isCurrent = 0;

-- ============================================
-- FIX: Add Salary if Missing
-- ============================================
UPDATE EmploymentPeriod ep
JOIN User u ON u.id = ep.userId
SET ep.salary = 150000.00, -- Default ₦150,000 - ADJUST AS NEEDED
    ep.updatedAt = NOW()
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
  AND (ep.salary IS NULL OR ep.salary = 0);

-- ============================================
-- VERIFY: Check eligibility after fixes
-- ============================================
SELECT 
    u.id as userId,
    u.email,
    u.firstName,
    u.lastName,
    u.status as userStatus,
    ep.id as employmentId,
    ep.jobTitle,
    ep.hireDate,
    TIMESTAMPDIFF(MONTH, ep.hireDate, NOW()) as monthsEmployed,
    ep.salary,
    ep.isCurrent,
    CASE 
        WHEN u.status = 'ACTIVE' 
             AND ep.id IS NOT NULL 
             AND ep.isCurrent = 1 
             AND ep.terminationDate IS NULL 
             AND ep.salary >= 1000
             AND TIMESTAMPDIFF(MONTH, ep.hireDate, NOW()) >= 3
        THEN '✅ FULLY ELIGIBLE FOR STAFF LOAN'
        WHEN u.status = 'ACTIVE' 
             AND ep.id IS NOT NULL 
             AND ep.isCurrent = 1 
             AND ep.terminationDate IS NULL 
             AND ep.salary >= 1000
        THEN '⚠️ ELIGIBLE (3-month rule not enforced yet)'
        ELSE '❌ NOT ELIGIBLE'
    END as eligibilityStatus,
    -- Calculate max loan amount (25% of salary × 5 months)
    (ep.salary * 0.25 * 5) as maxLoanAmount,
    -- Max monthly deduction (25% of salary)
    (ep.salary * 0.25) as maxMonthlyDeduction
FROM User u
LEFT JOIN EmploymentPeriod ep ON ep.userId = u.id AND ep.isCurrent = 1
WHERE u.email = 'your-email@example.com' -- REPLACE WITH YOUR EMAIL
LIMIT 1;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Replace 'your-email@example.com' with your actual email address in ALL queries
-- 2. Run the CHECK queries first to see what's missing
-- 3. Run the appropriate FIX queries based on what's missing
-- 4. Run the VERIFY query at the end to confirm eligibility
-- 5. Adjust the salary amount (150000.00) to your actual monthly salary if needed
--
-- Eligibility Requirements:
-- - User status must be ACTIVE
-- - Must have employment record with isCurrent = 1
-- - terminationDate must be NULL
-- - Salary must be >= ₦1,000 (minimum loan amount)
-- - Employed for at least 3 months (policy defined but NOT enforced yet)
-- - No active/pending loans
-- - No overdue installments
--
-- How Requirements Are Measured:
-- 1. Employment Duration: TIMESTAMPDIFF(MONTH, hireDate, NOW()) >= 3
--    - Calculated from EmploymentPeriod.hireDate to current date
--    - Note: Backend does NOT currently check this, but it's in the config
--
-- 2. Valid Salary: EmploymentPeriod.salary >= 1000
--    - Must be at least ₦1,000 (MIN_LOAN_AMOUNT)
--    - Stored in salary field as DECIMAL(14,2)

