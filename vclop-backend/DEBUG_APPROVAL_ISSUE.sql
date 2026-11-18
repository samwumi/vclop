-- Debug the 400 error when approving loan

-- 1. Check current loan status
SELECT 
  id,
  loanNumber,
  status,
  requestedAmount,
  tenureMonths,
  principalAmount,
  approvedAmount,
  userId,
  createdAt,
  submittedAt,
  reviewedAt
FROM staff_loans
WHERE loanNumber = 'SL2026000001';

-- 2. Check if loan is in correct status (should be PENDING_APPROVAL or DRAFT)
SELECT 
  'Loan Status Check' as test,
  CASE 
    WHEN status IN ('PENDING_APPROVAL', 'DRAFT') THEN '✅ Status OK for approval'
    ELSE '❌ Wrong status - must be PENDING_APPROVAL or DRAFT'
  END as result,
  status as current_status
FROM staff_loans
WHERE loanNumber = 'SL2026000001';

-- 3. Check user ID match (self-approval check)
SELECT 
  sl.userId as loan_owner_id,
  u.email as loan_owner_email,
  'You are approving your own loan - now allowed after fix' as note
FROM staff_loans sl
INNER JOIN users u ON sl.userId = u.id
WHERE sl.loanNumber = 'SL2026000001';

-- 4. Verify the loan owner has employment record (needed for calculations)
SELECT 
  u.email,
  e.isCurrent,
  e.salary,
  e.hireDate,
  e.jobTitle,
  CASE 
    WHEN e.id IS NULL THEN '❌ No employment record'
    WHEN e.isCurrent = 0 THEN '❌ Employment not active'
    ELSE '✅ Employment OK'
  END as employment_status
FROM staff_loans sl
INNER JOIN users u ON sl.userId = u.id
LEFT JOIN employment e ON u.id = e.userId AND e.isCurrent = 1
WHERE sl.loanNumber = 'SL2026000001';

-- 5. Check if there are any database constraints that might fail
SHOW CREATE TABLE staff_loans;
