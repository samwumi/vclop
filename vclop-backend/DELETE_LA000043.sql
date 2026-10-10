-- ============================================================================
-- DELETE APPLICATION LA-000043 (Adewumi Alade - PENDING Virtual Account)
-- ============================================================================

SET @app_id = '6ba37df2-7218-4121-97a2-66239d833e1b';
SET @loan_id = 'c188b1d9-91b1-42a1-9388-ed2db8215a13';

-- Verify before deletion
SELECT 
  'BEFORE DELETE - Review this data' as step,
  la.applicationNumber,
  la.status,
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  l.loanNumber,
  va.accountNumber as virtual_account
FROM loan_applications la
JOIN customers c ON c.id = la.customerId
LEFT JOIN loans l ON l.id = @loan_id
LEFT JOIN virtual_accounts va ON va.loanId = @loan_id
WHERE la.id = @app_id;

-- Delete guarantors
DELETE FROM guarantors WHERE loanApplicationId = @app_id;
SELECT ROW_COUNT() as guarantors_deleted;

-- Delete collaterals  
DELETE FROM collaterals WHERE loanApplicationId = @app_id;
SELECT ROW_COUNT() as collaterals_deleted;

-- Delete workflow instances
DELETE FROM workflow_instances WHERE entityId = @app_id AND entityType = 'LOAN_APPLICATION';
SELECT ROW_COUNT() as workflows_deleted;

-- Delete virtual account (PENDING one)
DELETE FROM virtual_accounts WHERE loanId = @loan_id;
SELECT ROW_COUNT() as virtual_accounts_deleted;

-- Delete loan
DELETE FROM loans WHERE id = @loan_id;
SELECT ROW_COUNT() as loans_deleted;

-- Soft delete the application
UPDATE loan_applications 
SET deletedAt = NOW() 
WHERE id = @app_id;
SELECT ROW_COUNT() as applications_deleted;

-- Verify deletion
SELECT 
  'AFTER DELETE - Verification' as step,
  COUNT(*) as remaining_count
FROM loan_applications
WHERE id = @app_id AND deletedAt IS NULL;

SELECT 'Application LA-000043 deleted successfully' as result;
