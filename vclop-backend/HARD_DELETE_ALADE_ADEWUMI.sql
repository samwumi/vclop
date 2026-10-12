-- ============================================================================
-- HARD DELETE: Alade Adewumi / Adewumi Alade (both customers)
-- ============================================================================

-- Customer 1: Adewumi Alade (VC-000057) - ACTIVE_BORROWER
SET @customer1_id = 'aa8474ad-ca0a-4bb6-8d55-35d8803a57b3';
SET @app1_id = '8f01079d-86a4-49dd-b18f-431c457e7d0a'; -- LA-000045
SET @loan1_id = '9639b4b8-95fb-4bbf-a275-0c58869c5610'; -- LN-000020
SET @va1_id = 'dfa86cb5-5d6c-4d76-9a07-18e3d489c904'; -- PENDING VA

-- Customer 2: Adewumi  Alade (VC-000038) - ELIGIBLE
SET @customer2_id = 'bae4d441-b961-4c8e-b80f-c676d5671c3b';
SET @app2_id = '1615f19b-38ee-4ac2-bb21-c1a002c54a84'; -- LA-000036 (REJECTED)

-- ============================================================================
-- DELETE CUSTOMER 1: Adewumi Alade (VC-000057)
-- ============================================================================

-- Delete virtual account transactions
DELETE FROM virtual_account_transactions WHERE virtualAccountId = @va1_id;
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' VA transaction(s)') as result;

-- Delete virtual account
DELETE FROM virtual_accounts WHERE id = @va1_id;
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' virtual account(s)') as result;

-- Delete loan
DELETE FROM loans WHERE id = @loan1_id;
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' loan(s)') as result;

-- Delete guarantors
DELETE FROM guarantors WHERE loanApplicationId = @app1_id;
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' guarantor(s)') as result;

-- Delete collaterals
DELETE FROM collaterals WHERE loanApplicationId = @app1_id;
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' collateral(s)') as result;

-- Delete workflow instances
DELETE FROM workflow_instances WHERE entityId = @app1_id AND entityType = 'LOAN_APPLICATION';
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' workflow(s)') as result;

-- Delete loan application
DELETE FROM loan_applications WHERE id = @app1_id;
SELECT CONCAT('Customer 1: Deleted ', ROW_COUNT(), ' application(s)') as result;

-- ============================================================================
-- DELETE CUSTOMER 2: Adewumi  Alade (VC-000038)
-- ============================================================================

-- Delete guarantors
DELETE FROM guarantors WHERE loanApplicationId = @app2_id;
SELECT CONCAT('Customer 2: Deleted ', ROW_COUNT(), ' guarantor(s)') as result;

-- Delete collaterals
DELETE FROM collaterals WHERE loanApplicationId = @app2_id;
SELECT CONCAT('Customer 2: Deleted ', ROW_COUNT(), ' collateral(s)') as result;

-- Delete workflow instances
DELETE FROM workflow_instances WHERE entityId = @app2_id AND entityType = 'LOAN_APPLICATION';
SELECT CONCAT('Customer 2: Deleted ', ROW_COUNT(), ' workflow(s)') as result;

-- Delete loan application
DELETE FROM loan_applications WHERE id = @app2_id;
SELECT CONCAT('Customer 2: Deleted ', ROW_COUNT(), ' application(s)') as result;

-- ============================================================================
-- DELETE BOTH CUSTOMERS
-- ============================================================================

-- Delete customer documents
DELETE FROM customer_documents WHERE customerId IN (@customer1_id, @customer2_id);
SELECT CONCAT('Deleted ', ROW_COUNT(), ' customer document(s)') as result;

-- Delete all loan applications (including any we might have missed)
DELETE FROM loan_applications WHERE customerId IN (@customer1_id, @customer2_id);
SELECT CONCAT('Deleted ', ROW_COUNT(), ' total application(s)') as result;

-- Delete both customers
DELETE FROM customers WHERE id IN (@customer1_id, @customer2_id);
SELECT CONCAT('Deleted ', ROW_COUNT(), ' customer(s)') as result;

SELECT 'Both Alade Adewumi customers permanently deleted from database' as final_result;
