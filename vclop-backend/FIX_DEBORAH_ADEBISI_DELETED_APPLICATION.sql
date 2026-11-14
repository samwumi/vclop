-- ============================================
-- FIX: Deborah Adebisi Deleted Application Issue
-- ============================================
-- Problem: Application was soft-deleted but still blocking new applications
-- Solution: Permanently delete or properly mark as deleted

-- Step 1: Find Deborah Adebisi's customer record
SELECT 
    c.id,
    c.customerNumber,
    c.firstName,
    c.lastName,
    c.phone,
    c.status
FROM Customer c
WHERE (c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
   OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%');

-- Step 2: Find ALL loan applications for Deborah (including soft-deleted)
SELECT 
    la.id,
    la.applicationNumber,
    la.customerId,
    la.amount,
    la.status,
    la.createdAt,
    la.deletedAt,
    CASE 
        WHEN la.deletedAt IS NOT NULL THEN '🗑️ SOFT DELETED'
        ELSE '✅ ACTIVE'
    END as recordStatus,
    c.firstName,
    c.lastName
FROM LoanApplication la
JOIN Customer c ON c.id = la.customerId
WHERE (c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
   OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%')
ORDER BY la.createdAt DESC;

-- Step 3: Check for workflow instances (might be blocking)
SELECT 
    wi.id as workflowId,
    wi.entityType,
    wi.entityId,
    wi.currentStageCode,
    wi.status,
    wi.createdAt,
    la.applicationNumber,
    la.deletedAt as applicationDeletedAt
FROM WorkflowInstance wi
JOIN LoanApplication la ON la.id = wi.entityId
JOIN Customer c ON c.id = la.customerId
WHERE wi.entityType = 'LOAN_APPLICATION'
  AND ((c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
   OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%'))
ORDER BY wi.createdAt DESC;

-- ============================================
-- FIX OPTION 1: Permanently Delete (Recommended if truly deleted)
-- ============================================
-- This will completely remove the application from the database
-- Run this if the application should no longer exist

-- First, delete workflow instances
DELETE FROM WorkflowInstance 
WHERE entityType = 'LOAN_APPLICATION'
  AND entityId IN (
    SELECT la.id 
    FROM LoanApplication la
    JOIN Customer c ON c.id = la.customerId
    WHERE la.deletedAt IS NOT NULL
      AND ((c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
       OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%'))
  );

-- Then, permanently delete the application
DELETE FROM LoanApplication 
WHERE deletedAt IS NOT NULL
  AND customerId IN (
    SELECT id FROM Customer 
    WHERE (firstName LIKE '%Deborah%' AND lastName LIKE '%Adebisi%')
       OR (firstName LIKE '%Adebisi%' AND lastName LIKE '%Deborah%')
  );

-- ============================================
-- FIX OPTION 2: Ensure Soft Delete is Proper
-- ============================================
-- This ensures deletedAt is set and status doesn't block new applications

UPDATE LoanApplication 
SET 
    deletedAt = COALESCE(deletedAt, NOW()),
    status = 'CANCELLED',
    updatedAt = NOW()
WHERE id IN (
    SELECT la.id 
    FROM LoanApplication la
    JOIN Customer c ON c.id = la.customerId
    WHERE la.deletedAt IS NOT NULL
      AND ((c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
       OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%'))
);

-- ============================================
-- FIX OPTION 3: Mark Workflow as Cancelled
-- ============================================
-- If workflow is still active, cancel it

UPDATE WorkflowInstance
SET 
    status = 'CANCELLED',
    updatedAt = NOW()
WHERE entityType = 'LOAN_APPLICATION'
  AND entityId IN (
    SELECT la.id 
    FROM LoanApplication la
    JOIN Customer c ON c.id = la.customerId
    WHERE la.deletedAt IS NOT NULL
      AND ((c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
       OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%'))
  );

-- ============================================
-- VERIFY: Check for Active Applications After Fix
-- ============================================
SELECT 
    c.customerNumber,
    c.firstName,
    c.lastName,
    COUNT(CASE WHEN la.deletedAt IS NULL AND la.status IN ('SUBMITTED', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED') THEN 1 END) as activeApplications,
    COUNT(CASE WHEN la.deletedAt IS NOT NULL THEN 1 END) as deletedApplications,
    COUNT(*) as totalApplications
FROM Customer c
LEFT JOIN LoanApplication la ON la.customerId = c.id
WHERE (c.firstName LIKE '%Deborah%' AND c.lastName LIKE '%Adebisi%')
   OR (c.firstName LIKE '%Adebisi%' AND c.lastName LIKE '%Deborah%')
GROUP BY c.id, c.customerNumber, c.firstName, c.lastName;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Run Step 1, 2, 3 to diagnose the issue
-- 2. Choose ONE fix option:
--    - Option 1: If application was deleted and should be gone completely
--    - Option 2: If you want to keep soft-deleted records
--    - Option 3: If workflow is preventing new applications
-- 3. Run VERIFY query to confirm fix
-- 4. Try creating new application for Deborah
--
-- Expected Result After Fix:
-- - activeApplications: 0
-- - deletedApplications: 1 (or 0 if permanently deleted)
-- - Deborah can now apply for a new loan

-- ============================================
-- PREVENTIVE CHECK: Find Other Customers with Similar Issue
-- ============================================
SELECT 
    c.customerNumber,
    c.firstName,
    c.lastName,
    COUNT(CASE WHEN la.deletedAt IS NOT NULL AND la.status IN ('SUBMITTED', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED') THEN 1 END) as problematicDeletes,
    COUNT(CASE WHEN la.deletedAt IS NULL AND la.status IN ('SUBMITTED', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED') THEN 1 END) as activeApplications
FROM Customer c
LEFT JOIN LoanApplication la ON la.customerId = c.id
GROUP BY c.id, c.customerNumber, c.firstName, c.lastName
HAVING problematicDeletes > 0
ORDER BY problematicDeletes DESC;
