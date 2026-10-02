-- Check for customers with invalid status values
SELECT id, customerNumber, status, firstName, lastName
FROM customers
WHERE status = '' OR status IS NULL
LIMIT 20;

-- Check all unique status values
SELECT DISTINCT status, COUNT(*) as count
FROM customers
GROUP BY status;

-- Fix any empty status values by setting to REGISTERED
UPDATE customers
SET status = 'REGISTERED'
WHERE status = '' OR status IS NULL;
