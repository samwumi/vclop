-- ============================================================================
-- DELETE APPLICATION FOR ALADE ADEWUMI
-- ============================================================================
-- This script deletes the loan application for customer "Alade adewumi"
-- ============================================================================

-- Step 1: Find the application
SELECT 
  la.id as application_id,
  la.applicationNumber,
  la.status,
  c.customerNumber,
  c.firstName,
  c.lastName,
  l.id as loan_id,
  l.loanNumber,
  va.id as virtual_account_id,
  va.accountNumber
FROM loan_applications la
JOIN customers c ON c.id = la.customerId
LEFT JOIN loans l ON l.loanApplicationId = la.id
LEFT JOIN virtual_accounts va ON va.loanId = l.id
WHERE (c.firstName LIKE '%Alade%' OR c.lastName LIKE '%Alade%')
  AND (c.firstName LIKE '%adewumi%' OR c.lastName LIKE '%adewumi%')
  AND la.deletedAt IS NULL
ORDER BY la.createdAt DESC;

-- Step 2: Delete related data (uncomment to execute after reviewing Step 1)
-- Replace 'APPLICATION_ID_HERE' with the actual ID from Step 1

/*
SET @app_id = 'APPLICATION_ID_HERE';

-- Delete guarantors
DELETE FROM guarantors WHERE loanApplicationId = @app_id;

-- Delete collaterals  
DELETE FROM collaterals WHERE loanApplicationId = @app_id;

-- Delete workflow instances
DELETE FROM workflow_instances WHERE entityId = @app_id AND entityType = 'LOAN_APPLICATION';

-- Delete virtual accounts (including PENDING ones)
DELETE FROM virtual_accounts 
WHERE loanId IN (SELECT id FROM loans WHERE loanApplicationId = @app_id);

-- Delete loan
DELETE FROM loans WHERE loanApplicationId = @app_id;

-- Soft delete the application
UPDATE loan_applications 
SET deletedAt = NOW() 
WHERE id = @app_id;

SELECT 'Application deleted successfully' as result;
*/
