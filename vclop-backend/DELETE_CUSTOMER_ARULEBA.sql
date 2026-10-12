-- ============================================================================
-- DELETE CUSTOMER: Anuoluwapo Aruleba (VC-000014)
-- Includes 2 disbursed loans with PENDING virtual accounts
-- ============================================================================

SET @customer_id = '3fd81541-5bfa-40d8-8f3f-40aab27af306';

-- Application 1: LA-000016
SET @app1_id = '10ce13bf-3f8c-4577-ba04-bd79212204b0';
SET @loan1_id = '134a71c3-3924-4d54-abe8-3c78a9b21a34';
SET @va1_id = 'c9b7bc93-e2ee-45d2-a7ee-a8e255d37691';

-- Application 2: LA-000015
SET @app2_id = '7023bf7b-0606-47db-9f4d-8839dee5b6e2';
SET @loan2_id = '1f8f89d8-d723-43c5-a7b5-0efe6b85a443';
SET @va2_id = '08272131-8426-4db7-b47c-2728adf9bcd7';

-- Verify before deletion
SELECT 'BEFORE DELETE - Review this data' as step;
SELECT 
  la.applicationNumber,
  la.status as app_status,
  l.loanNumber,
  l.status as loan_status,
  va.accountNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name
FROM loan_applications la
JOIN customers c ON c.id = la.customerId
LEFT JOIN loans l ON l.loanApplicationId = la.id
LEFT JOIN virtual_accounts va ON va.loanId = l.id
WHERE c.id = @customer_id
  AND la.deletedAt IS NULL;

-- ============================================================================
-- DELETE LOAN APPLICATION 1: LA-000016
-- ============================================================================

-- Delete guarantors for LA-000016
DELETE FROM guarantors WHERE loanApplicationId = @app1_id;
SELECT CONCAT('LA-000016: Deleted ', ROW_COUNT(), ' guarantor(s)') as result;

-- Delete collaterals for LA-000016
DELETE FROM collaterals WHERE loanApplicationId = @app1_id;
SELECT CONCAT('LA-000016: Deleted ', ROW_COUNT(), ' collateral(s)') as result;

-- Delete workflow instances for LA-000016
DELETE FROM workflow_instances WHERE entityId = @app1_id AND entityType = 'LOAN_APPLICATION';
SELECT CONCAT('LA-000016: Deleted ', ROW_COUNT(), ' workflow(s)') as result;

-- Delete repayments for LN-000011
DELETE FROM repayments WHERE loanId = @loan1_id;
SELECT CONCAT('LN-000011: Deleted ', ROW_COUNT(), ' repayment(s)') as result;

-- Delete virtual account transactions for VA
DELETE FROM virtual_account_transactions WHERE virtualAccountId = @va1_id;
SELECT CONCAT('VA: Deleted ', ROW_COUNT(), ' transaction(s)') as result;

-- Delete virtual account for LN-000011
DELETE FROM virtual_accounts WHERE id = @va1_id;
SELECT CONCAT('LN-000011: Deleted ', ROW_COUNT(), ' virtual account(s)') as result;

-- Delete loan LN-000011
DELETE FROM loans WHERE id = @loan1_id;
SELECT CONCAT('Deleted ', ROW_COUNT(), ' loan(s)') as result;

-- Soft delete application LA-000016
UPDATE loan_applications SET deletedAt = NOW() WHERE id = @app1_id;
SELECT CONCAT('LA-000016: Soft deleted ', ROW_COUNT(), ' application(s)') as result;

-- ============================================================================
-- DELETE LOAN APPLICATION 2: LA-000015
-- ============================================================================

-- Delete guarantors for LA-000015
DELETE FROM guarantors WHERE loanApplicationId = @app2_id;
SELECT CONCAT('LA-000015: Deleted ', ROW_COUNT(), ' guarantor(s)') as result;

-- Delete collaterals for LA-000015
DELETE FROM collaterals WHERE loanApplicationId = @app2_id;
SELECT CONCAT('LA-000015: Deleted ', ROW_COUNT(), ' collateral(s)') as result;

-- Delete workflow instances for LA-000015
DELETE FROM workflow_instances WHERE entityId = @app2_id AND entityType = 'LOAN_APPLICATION';
SELECT CONCAT('LA-000015: Deleted ', ROW_COUNT(), ' workflow(s)') as result;

-- Delete repayments for LN-000010
DELETE FROM repayments WHERE loanId = @loan2_id;
SELECT CONCAT('LN-000010: Deleted ', ROW_COUNT(), ' repayment(s)') as result;

-- Delete virtual account transactions for VA
DELETE FROM virtual_account_transactions WHERE virtualAccountId = @va2_id;
SELECT CONCAT('VA: Deleted ', ROW_COUNT(), ' transaction(s)') as result;

-- Delete virtual account for LN-000010
DELETE FROM virtual_accounts WHERE id = @va2_id;
SELECT CONCAT('LN-000010: Deleted ', ROW_COUNT(), ' virtual account(s)') as result;

-- Delete loan LN-000010
DELETE FROM loans WHERE id = @loan2_id;
SELECT CONCAT('Deleted ', ROW_COUNT(), ' loan(s)') as result;

-- Soft delete application LA-000015
UPDATE loan_applications SET deletedAt = NOW() WHERE id = @app2_id;
SELECT CONCAT('LA-000015: Soft deleted ', ROW_COUNT(), ' application(s)') as result;

-- ============================================================================
-- DELETE CUSTOMER AND RELATED DATA
-- ============================================================================

-- Delete bank accounts
DELETE FROM bank_accounts WHERE customerId = @customer_id;
SELECT CONCAT('Deleted ', ROW_COUNT(), ' bank account(s)') as result;

-- Delete documents
DELETE FROM documents WHERE entityId = @customer_id AND entityType = 'CUSTOMER';
SELECT CONCAT('Deleted ', ROW_COUNT(), ' document(s)') as result;

-- Delete field visit records
DELETE FROM field_visits WHERE customerId = @customer_id;
SELECT CONCAT('Deleted ', ROW_COUNT(), ' field visit(s)') as result;

-- Soft delete the customer
UPDATE customers SET deletedAt = NOW() WHERE id = @customer_id;
SELECT CONCAT('Soft deleted ', ROW_COUNT(), ' customer(s)') as result;

-- ============================================================================
-- VERIFY DELETION
-- ============================================================================

SELECT 'AFTER DELETE - Verification' as step;

SELECT COUNT(*) as remaining_applications
FROM loan_applications 
WHERE customerId = @customer_id AND deletedAt IS NULL;

SELECT COUNT(*) as remaining_customer
FROM customers 
WHERE id = @customer_id AND deletedAt IS NULL;

SELECT 'Customer Anuoluwapo Aruleba and all related data deleted successfully' as final_result;
