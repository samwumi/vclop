-- FIX: Change loan status from invalid "DISBURSED" to "ACTIVE"
-- Problem: Loans have status "DISBURSED" which doesn't exist in LoanStatus enum
-- This prevents repayment recording and status updates to COMPLETED
-- Solution: Change all DISBURSED loans to ACTIVE (unless already completed/defaulted)

-- Step 1: Check current loan statuses
SELECT 
  l.loanNumber,
  l.status as current_loan_status,
  la.status as application_status,
  l.principal,
  l.totalRepayable,
  COALESCE(SUM(rt.amount), 0) as total_paid,
  (l.totalRepayable - COALESCE(SUM(rt.amount), 0)) as balance_remaining,
  COUNT(CASE WHEN ri.status != 'PAID' THEN 1 END) as unpaid_installments
FROM loans l
LEFT JOIN loan_applications la ON la.id = l.loanApplicationId
LEFT JOIN repayment_transactions rt ON rt.loanId = l.id
LEFT JOIN repayment_installments ri ON ri.loanId = l.id
WHERE l.status = 'DISBURSED'  -- Invalid status
GROUP BY l.id
ORDER BY l.createdAt DESC;

-- Step 2: Fix loans with DISBURSED status
-- Set to ACTIVE if they have unpaid installments
-- Set to COMPLETED if all installments are paid
UPDATE loans l
SET 
  l.status = CASE
    WHEN (
      SELECT COUNT(*)
      FROM repayment_installments ri
      WHERE ri.loanId = l.id AND ri.status != 'PAID'
    ) = 0 THEN 'COMPLETED'
    ELSE 'ACTIVE'
  END,
  l.completedAt = CASE
    WHEN (
      SELECT COUNT(*)
      FROM repayment_installments ri
      WHERE ri.loanId = l.id AND ri.status != 'PAID'
    ) = 0 THEN NOW()
    ELSE l.completedAt
  END
WHERE l.status = 'DISBURSED';

-- Step 3: Verify the fix
SELECT 
  l.loanNumber,
  l.status as loan_status,
  la.status as application_status,
  l.principal,
  l.totalRepayable,
  COALESCE(SUM(rt.amount), 0) as total_paid,
  COUNT(CASE WHEN ri.status != 'PAID' THEN 1 END) as unpaid_installments,
  l.completedAt
FROM loans l
LEFT JOIN loan_applications la ON la.id = l.loanApplicationId
LEFT JOIN repayment_transactions rt ON rt.loanId = l.id
LEFT JOIN repayment_installments ri ON ri.loanId = l.id
WHERE l.loanNumber IN (
  SELECT loanNumber FROM loans WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
)
GROUP BY l.id;
