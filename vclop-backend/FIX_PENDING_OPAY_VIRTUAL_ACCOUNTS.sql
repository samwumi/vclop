-- ============================================================================
-- FIX PENDING VIRTUAL ACCOUNTS FOR OPAY CUSTOMERS
-- ============================================================================
-- This script removes PENDING virtual accounts for customers with OPay bank accounts
-- so they can be recreated without sending OPay details to Paystack.
--
-- INSTRUCTIONS:
-- 1. Deploy the latest code changes first (OPay skip logic)
-- 2. Run this script to delete pending virtual accounts
-- 3. The system will auto-recreate them when the loan is disbursed
--
-- OR use the bulk sync endpoint: POST /api/v1/virtual-accounts/bulk-create-missing
-- ============================================================================

-- Step 1: Check which virtual accounts are PENDING for OPay customers
SELECT 
  va.id as virtual_account_id,
  va.accountNumber as pending_account,
  va.createdAt as created_at,
  l.loanNumber,
  la.applicationNumber,
  c.customerNumber,
  c.firstName,
  c.lastName,
  c.bankCode,
  CASE 
    WHEN c.bankCode = '999992' THEN '⚠️ OPay Customer'
    ELSE '✓ Regular Bank'
  END as bank_type
FROM virtual_accounts va
JOIN loans l ON l.id = va.loanId
LEFT JOIN loan_applications la ON la.id = l.loanApplicationId
JOIN customers c ON c.id = va.customerId
WHERE va.accountNumber LIKE 'PENDING-%'
  AND va.deletedAt IS NULL
ORDER BY va.createdAt DESC;

-- Step 2: DELETE pending virtual accounts for OPay customers only
-- (Uncomment the line below to execute after reviewing Step 1 results)

-- DELETE FROM virtual_accounts 
-- WHERE accountNumber LIKE 'PENDING-%' 
--   AND customerId IN (
--     SELECT id FROM customers WHERE bankCode = '999992'
--   )
--   AND deletedAt IS NULL;

-- Step 3: Verify deletion
-- SELECT COUNT(*) as deleted_count FROM virtual_accounts 
-- WHERE accountNumber LIKE 'PENDING-%' 
--   AND customerId IN (
--     SELECT id FROM customers WHERE bankCode = '999992'
--   );

-- ============================================================================
-- NEXT STEPS AFTER RUNNING THIS SCRIPT:
-- ============================================================================
-- Option A: Wait for disbursement - virtual accounts auto-create when loan is disbursed
-- Option B: Use bulk sync endpoint - POST /api/v1/virtual-accounts/bulk-create-missing
-- Option C: Create new application for the customer
-- ============================================================================
