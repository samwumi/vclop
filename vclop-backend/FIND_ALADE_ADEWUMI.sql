-- ============================================================================
-- FIND CUSTOMER: Alade Adewumi (or Adewumi Alade)
-- ============================================================================

-- Find the customer
SELECT 
  c.id as customer_id,
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as name,
  c.status,
  c.createdAt
FROM customers c
WHERE (c.lastName LIKE '%Alade%' OR c.firstName LIKE '%Alade%')
  AND (c.lastName LIKE '%Adewumi%' OR c.firstName LIKE '%Adewumi%')
  AND c.deletedAt IS NULL;

-- Find all loan applications for this customer
SELECT 
  la.id as application_id,
  la.applicationNumber,
  la.status as app_status,
  l.id as loan_id,
  l.loanNumber,
  l.status as loan_status,
  va.id as virtual_account_id,
  va.accountNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  c.id as customer_id
FROM loan_applications la
JOIN customers c ON c.id = la.customerId
LEFT JOIN loans l ON l.loanApplicationId = la.id
LEFT JOIN virtual_accounts va ON va.loanId = l.id
WHERE (c.lastName LIKE '%Alade%' OR c.firstName LIKE '%Alade%')
  AND (c.lastName LIKE '%Adewumi%' OR c.firstName LIKE '%Adewumi%')
  AND la.deletedAt IS NULL
ORDER BY la.createdAt DESC;
