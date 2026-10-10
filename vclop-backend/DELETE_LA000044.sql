-- ============================================================================
-- DELETE APPLICATION LA-000044 (Adewumi Alade - PENDING Virtual Account)
-- ============================================================================

SET @app_id = '3816bf2a-936d-4cb1-9ec0-2761b60e31b4';
SET @loan_id = '8fbdf2e7-94d9-49ec-bc8c-f15b376fd10c';

-- Delete guarantors
DELETE FROM guarantors WHERE loanApplicationId = @app_id;

-- Delete collaterals  
DELETE FROM collaterals WHERE loanApplicationId = @app_id;

-- Delete workflow instances
DELETE FROM workflow_instances WHERE entityId = @app_id AND entityType = 'LOAN_APPLICATION';

-- Delete virtual account (PENDING one)
DELETE FROM virtual_accounts WHERE loanId = @loan_id;

-- Delete loan
DELETE FROM loans WHERE id = @loan_id;

-- Soft delete the application
UPDATE loan_applications 
SET deletedAt = NOW() 
WHERE id = @app_id;

SELECT 'Application LA-000044 deleted successfully' as result;
