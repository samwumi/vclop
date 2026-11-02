-- Check if there are any defaulted loans
SELECT 
  l.id,
  l.loan_number,
  l.principal,
  l.status,
  l.disbursed_at,
  c.first_name,
  c.last_name,
  lp.name as loan_product_name
FROM loans l
JOIN customers c ON l.customer_id = c.id
JOIN loan_products lp ON l.loan_product_id = lp.id
WHERE l.status = 'DEFAULTED'
ORDER BY l.disbursed_at DESC
LIMIT 20;

-- Check all loan statuses
SELECT status, COUNT(*) as count
FROM loans
GROUP BY status
ORDER BY count DESC;
