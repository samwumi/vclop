-- ============================================================================
-- COMPREHENSIVE FIX: Loan Status DISBURSED Issue
-- ============================================================================
-- Problem: Loans have invalid "DISBURSED" status which prevents status updates
-- Solution: Fix existing data + add constraint to prevent future issues
-- Run this script ONCE to permanently resolve the issue
-- ============================================================================

-- STEP 1: Check current loan statuses (diagnostic)
SELECT 
  '=== DIAGNOSTIC: Current Loan Statuses ===' as step;

SELECT 
  l.loanNumber,
  l.status as current_loan_status,
  la.status as application_status,
  l.principal,
  l.totalRepayable,
  (SELECT COALESCE(SUM(amount), 0) FROM repayment_transactions WHERE loanId = l.id) as total_paid,
  (l.totalRepayable - (SELECT COALESCE(SUM(amount), 0) FROM repayment_transactions WHERE loanId = l.id)) as balance_remaining,
  (SELECT COUNT(*) FROM repayment_installments WHERE loanId = l.id AND status != 'PAID') as unpaid_installments
FROM loans l
LEFT JOIN loan_applications la ON la.id = l.loanApplicationId
WHERE l.status NOT IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF')  -- Invalid statuses
ORDER BY l.createdAt DESC;

-- STEP 2: Fix loans with invalid DISBURSED status
SELECT 
  '=== STEP 2: Fixing Invalid Loan Statuses ===' as step;

UPDATE loans l
SET 
  l.status = CASE
    -- If all installments are paid, mark as COMPLETED
    WHEN (
      SELECT COUNT(*)
      FROM repayment_installments ri
      WHERE ri.loanId = l.id AND ri.status != 'PAID'
    ) = 0 THEN 'COMPLETED'
    -- Otherwise, mark as ACTIVE
    ELSE 'ACTIVE'
  END,
  l.completedAt = CASE
    -- Set completedAt timestamp for completed loans
    WHEN (
      SELECT COUNT(*)
      FROM repayment_installments ri
      WHERE ri.loanId = l.id AND ri.status != 'PAID'
    ) = 0 THEN NOW()
    ELSE l.completedAt
  END
WHERE l.status NOT IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF');

-- Show how many loans were updated
SELECT ROW_COUNT() as loans_updated;

-- STEP 3: Add database constraint to prevent future issues
SELECT 
  '=== STEP 3: Adding Database Constraint ===' as step;

-- Drop existing constraint if any
ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loan_status;

-- Add new constraint matching LoanStatus enum
ALTER TABLE loans 
ADD CONSTRAINT chk_loan_status 
CHECK (status IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF'));

-- STEP 4: Verify the fix worked
SELECT 
  '=== STEP 4: Verification ===' as step;

-- Show all loans and their current status
SELECT 
  l.loanNumber,
  l.status as loan_status,
  la.status as application_status,
  l.principal,
  l.totalRepayable,
  (SELECT COALESCE(SUM(amount), 0) FROM repayment_transactions WHERE loanId = l.id) as total_paid,
  (SELECT COUNT(*) FROM repayment_installments WHERE loanId = l.id AND status != 'PAID') as unpaid_installments,
  l.completedAt,
  CASE 
    WHEN l.status = 'COMPLETED' THEN 'Customer can apply for new loan ✓'
    WHEN l.status = 'ACTIVE' THEN 'Loan still active'
    ELSE 'Check status'
  END as note
FROM loans l
LEFT JOIN loan_applications la ON la.id = l.loanApplicationId
ORDER BY l.createdAt DESC
LIMIT 20;

-- Verify constraint was added
SELECT 
  tc.CONSTRAINT_NAME,
  cc.CHECK_CLAUSE,
  '✓ Constraint added - invalid statuses can no longer be saved' as status
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.CHECK_CONSTRAINTS cc 
  ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = 'loans' 
  AND tc.CONSTRAINT_TYPE = 'CHECK'
  AND tc.CONSTRAINT_NAME = 'chk_loan_status';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 1. Fixed all loans with invalid "DISBURSED" status:
--    - Set to COMPLETED if all installments paid
--    - Set to ACTIVE if still has outstanding balance
-- 2. Added database constraint to prevent invalid statuses in future
-- 3. This is a ONE-TIME fix - you won't need to run this again
-- ============================================================================
