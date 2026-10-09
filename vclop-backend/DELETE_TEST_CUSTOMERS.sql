-- ============================================================================
-- DELETE TEST CUSTOMERS - Permanently remove test data from database
-- ============================================================================
-- WARNING: This is PERMANENT and cannot be undone!
-- These customers and ALL their related data will be deleted:
-- - Customer records
-- - Loan applications
-- - Guarantors
-- - Collateral
-- - Documents
-- - Field visits
-- - Virtual accounts
-- - Repayments
-- - All related records
-- ============================================================================

-- First, verify which customers will be deleted
SELECT 
  'Customers to be PERMANENTLY DELETED' as warning,
  customerNumber,
  CONCAT(firstName, ' ', lastName) as name,
  phone,
  email,
  status,
  createdAt
FROM customers
WHERE customerNumber IN (
  'VC-000020',
  'VC-000011',
  'VC-000010',
  'VC-000008',
  'VC-000007',
  'VC-000006',
  'VC-000004',
  'VC-000001'
)
ORDER BY customerNumber;

-- Check related data that will be deleted
SELECT 
  'Impact Analysis' as info,
  (SELECT COUNT(*) FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')) as customers_to_delete,
  (SELECT COUNT(*) FROM loan_applications WHERE customerId IN (SELECT id FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001'))) as loan_applications,
  (SELECT COUNT(*) FROM customer_documents WHERE customerId IN (SELECT id FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001'))) as documents,
  (SELECT COUNT(*) FROM guarantors WHERE loanApplicationId IN (SELECT id FROM loan_applications WHERE customerId IN (SELECT id FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')))) as guarantors,
  (SELECT COUNT(*) FROM field_visits WHERE loanApplicationId IN (SELECT id FROM loan_applications WHERE customerId IN (SELECT id FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')))) as field_visits;

-- ============================================================================
-- STEP 1: Delete related records first (due to foreign key constraints)
-- ============================================================================

-- Delete repayment transactions first (references loans)
DELETE FROM repayment_transactions
WHERE loanId IN (
  SELECT l.id FROM loans l
  JOIN loan_applications la ON la.id = l.loanApplicationId
  WHERE la.customerId IN (
    SELECT id FROM customers 
    WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
  )
);

-- Delete virtual accounts
DELETE FROM virtual_accounts
WHERE customerId IN (
  SELECT id FROM customers 
  WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
);

-- Delete loans
DELETE FROM loans
WHERE loanApplicationId IN (
  SELECT id FROM loan_applications
  WHERE customerId IN (
    SELECT id FROM customers 
    WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
  )
);

-- Delete guarantors
DELETE FROM guarantors
WHERE loanApplicationId IN (
  SELECT id FROM loan_applications
  WHERE customerId IN (
    SELECT id FROM customers 
    WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
  )
);

-- Delete collateral
DELETE FROM collaterals
WHERE loanApplicationId IN (
  SELECT id FROM loan_applications
  WHERE customerId IN (
    SELECT id FROM customers 
    WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
  )
);

-- Delete field visits
DELETE FROM field_visits
WHERE loanApplicationId IN (
  SELECT id FROM loan_applications
  WHERE customerId IN (
    SELECT id FROM customers 
    WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
  )
);

-- Delete workflow instances for loan applications
DELETE FROM workflow_instances
WHERE entityId IN (
  SELECT id FROM loan_applications
  WHERE customerId IN (
    SELECT id FROM customers 
    WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
  )
) AND entityType = 'LOAN_APPLICATION';

-- Delete loan applications
DELETE FROM loan_applications
WHERE customerId IN (
  SELECT id FROM customers 
  WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
);

-- Delete customer documents
DELETE FROM customer_documents
WHERE customerId IN (
  SELECT id FROM customers 
  WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')
);

-- Note: customer_dynamic_form_data table doesn't exist yet - skip
-- DELETE FROM customer_dynamic_form_data WHERE customerId IN (...);

-- ============================================================================
-- STEP 2: Delete the customer records
-- ============================================================================

DELETE FROM customers
WHERE customerNumber IN (
  'VC-000020',
  'VC-000011',
  'VC-000010',
  'VC-000008',
  'VC-000007',
  'VC-000006',
  'VC-000004',
  'VC-000001'
);

-- ============================================================================
-- STEP 3: Verify deletion
-- ============================================================================

SELECT 
  'Deletion Complete - Verification' as status,
  (SELECT COUNT(*) FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')) as remaining_customers,
  CASE 
    WHEN (SELECT COUNT(*) FROM customers WHERE customerNumber IN ('VC-000020','VC-000011','VC-000010','VC-000008','VC-000007','VC-000006','VC-000004','VC-000001')) = 0 
    THEN '✅ All test customers successfully deleted'
    ELSE '❌ Some customers still remain - check for errors'
  END as result;

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. This deletion is PERMANENT and cannot be undone
-- 2. All related data (loans, documents, etc.) will also be deleted
-- 3. Physical document files in uploads/ folder will remain (manual cleanup needed)
-- 4. Audit logs may still reference these deleted customers
-- 5. Run the verification query first to see what will be deleted
-- 6. Consider backing up the database before running this script
-- ============================================================================
