-- Diagnose duplicate VA and Manual transaction display issue

-- 1. Check VirtualAccountTransactions table
SELECT 
  'VA Transactions' as source,
  id,
  providerReference as reference,
  amount,
  status,
  repaymentTransactionId,
  receivedAt as transaction_date
FROM virtual_account_transactions
WHERE receivedAt >= CURDATE() - INTERVAL 1 DAY
ORDER BY receivedAt DESC
LIMIT 20;

-- 2. Check RepaymentTransactions table
SELECT 
  'Repayment Transactions' as source,
  id,
  reference,
  amount,
  method,
  createdAt as transaction_date,
  loanId
FROM repayment_transactions
WHERE createdAt >= CURDATE() - INTERVAL 1 DAY
ORDER BY createdAt DESC
LIMIT 20;

-- 3. Find linked records (VA transaction linked to Repayment transaction)
SELECT 
  vat.id as va_id,
  vat.providerReference as va_reference,
  vat.amount as va_amount,
  vat.status as va_status,
  vat.repaymentTransactionId,
  rt.id as repayment_id,
  rt.reference as repayment_reference,
  rt.amount as repayment_amount,
  rt.method as repayment_method,
  vat.receivedAt,
  rt.createdAt
FROM virtual_account_transactions vat
INNER JOIN repayment_transactions rt ON vat.repaymentTransactionId = rt.id
WHERE vat.receivedAt >= CURDATE() - INTERVAL 1 DAY
ORDER BY vat.receivedAt DESC;

-- 4. Check if same amount/date appears twice (once as VA, once as Manual)
SELECT 
  amount,
  DATE(transaction_date) as date,
  COUNT(*) as count,
  GROUP_CONCAT(source) as sources,
  GROUP_CONCAT(reference) as references
FROM (
  SELECT 
    'VA' as source,
    amount,
    receivedAt as transaction_date,
    providerReference as reference
  FROM virtual_account_transactions
  WHERE receivedAt >= CURDATE() - INTERVAL 1 DAY
  
  UNION ALL
  
  SELECT 
    'Manual' as source,
    amount,
    createdAt as transaction_date,
    reference
  FROM repayment_transactions
  WHERE createdAt >= CURDATE() - INTERVAL 1 DAY
) combined
GROUP BY amount, DATE(transaction_date)
HAVING count > 1
ORDER BY transaction_date DESC;
