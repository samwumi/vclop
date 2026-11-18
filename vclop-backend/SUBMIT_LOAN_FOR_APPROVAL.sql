-- Option 1: Submit the loan via SQL (simulates clicking "Submit for Approval")
UPDATE staff_loans 
SET 
  status = 'PENDING_APPROVAL',
  submittedAt = NOW()
WHERE loanNumber = 'SL2026000001'
  AND status = 'DRAFT';

-- Verify the change
SELECT 
  loanNumber,
  status,
  requestedAmount,
  submittedAt,
  createdAt
FROM staff_loans
WHERE loanNumber = 'SL2026000001';
