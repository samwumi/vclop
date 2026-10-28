-- Check repayment transactions for loan LN-000050
-- Total paid shows 5,520,000 but loan is only 230,000

SELECT 
  'Loan Details' as section,
  l.loanNumber,
  l.principal,
  l.totalRepayable,
  l.status,
  l.disbursedAt,
  l.completedAt
FROM loans l
WHERE l.loanNumber = 'LN-000050';

SELECT 
  'Repayment Transactions' as section,
  rt.id,
  rt.receiptNumber,
  rt.amount,
  rt.method,
  rt.reference,
  rt.notes,
  rt.createdAt,
  u.firstName,
  u.lastName
FROM repayment_transactions rt
LEFT JOIN users u ON u.id = rt.recordedById
WHERE rt.loanId = (SELECT id FROM loans WHERE loanNumber = 'LN-000050')
ORDER BY rt.createdAt DESC;

SELECT 
  'Total Payments' as section,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount_paid,
  MIN(amount) as min_payment,
  MAX(amount) as max_payment,
  AVG(amount) as avg_payment
FROM repayment_transactions rt
WHERE rt.loanId = (SELECT id FROM loans WHERE loanNumber = 'LN-000050');

SELECT 
  'Installments Status' as section,
  ri.installmentNumber,
  ri.principalDue,
  ri.interestDue,
  ri.totalDue,
  ri.amountPaid,
  ri.status,
  ri.dueDate,
  ri.paidAt
FROM repayment_installments ri
WHERE ri.loanId = (SELECT id FROM loans WHERE loanNumber = 'LN-000050')
ORDER BY ri.installmentNumber;

-- Check if there are duplicate payments
SELECT 
  'Potential Duplicate Payments' as section,
  rt.receiptNumber,
  rt.amount,
  rt.reference,
  rt.createdAt,
  COUNT(*) as duplicate_count
FROM repayment_transactions rt
WHERE rt.loanId = (SELECT id FROM loans WHERE loanNumber = 'LN-000050')
GROUP BY rt.receiptNumber, rt.amount, rt.reference, rt.createdAt
HAVING COUNT(*) > 1;
