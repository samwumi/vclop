-- ============================================================================
-- HARD DELETE CUSTOMER: Anuoluwapo Aruleba (completely remove from database)
-- ============================================================================

SET @customer_id = '3fd81541-5bfa-40d8-8f3f-40aab27af306';
SET @app1_id = '10ce13bf-3f8c-4577-ba04-bd79212204b0';
SET @loan1_id = '134a71c3-3924-4d54-abe8-3c78a9b21a34';
SET @va1_id = 'c9b7bc93-e2ee-45d2-a7ee-a8e255d37691';
SET @app2_id = '7023bf7b-0606-47db-9f4d-8839dee5b6e2';
SET @loan2_id = '1f8f89d8-d723-43c5-a7b5-0efe6b85a443';
SET @va2_id = '08272131-8426-4db7-b47c-2728adf9bcd7';

-- Delete in correct order to avoid foreign key constraints

-- Delete virtual account transactions
DELETE FROM virtual_account_transactions WHERE virtualAccountId IN (@va1_id, @va2_id);

-- Delete virtual accounts
DELETE FROM virtual_accounts WHERE id IN (@va1_id, @va2_id);

-- Delete loans
DELETE FROM loans WHERE id IN (@loan1_id, @loan2_id);

-- Delete guarantors
DELETE FROM guarantors WHERE loanApplicationId IN (@app1_id, @app2_id);

-- Delete collaterals
DELETE FROM collaterals WHERE loanApplicationId IN (@app1_id, @app2_id);

-- Delete workflow instances
DELETE FROM workflow_instances WHERE entityId IN (@app1_id, @app2_id) AND entityType = 'LOAN_APPLICATION';

-- HARD delete loan applications (not soft delete)
DELETE FROM loan_applications WHERE id IN (@app1_id, @app2_id);

-- HARD delete customer
DELETE FROM customers WHERE id = @customer_id;

SELECT 'Customer permanently deleted from database' as result;
