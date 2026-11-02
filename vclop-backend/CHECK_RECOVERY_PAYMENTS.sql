-- Check all recovery payments
SELECT 
  rp.id,
  rp.account_id,
  ra.account_number,
  ra.customer_name,
  rp.amount,
  rp.payment_date,
  rp.payment_method,
  rp.status,
  rp.recorded_at,
  rp.recorded_by_id,
  u.first_name as recorded_by_first,
  u.last_name as recorded_by_last
FROM recovery_payments rp
JOIN recovery_accounts ra ON rp.account_id = ra.id
LEFT JOIN users u ON rp.recorded_by_id = u.id
ORDER BY rp.recorded_at DESC
LIMIT 20;

-- Check payment statuses
SELECT status, COUNT(*) as count
FROM recovery_payments
GROUP BY status;

-- Check if there are any pending payments
SELECT 
  rp.*,
  ra.account_number,
  ra.customer_name
FROM recovery_payments rp
JOIN recovery_accounts ra ON rp.account_id = ra.id
WHERE rp.status = 'PENDING_VERIFICATION'
ORDER BY rp.recorded_at DESC;
