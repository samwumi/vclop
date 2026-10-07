-- ============================================================================
-- QA TEST: Verify Customer Status Constraint
-- ============================================================================

-- Test 1: Check if constraint exists
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc 
    ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME 
    AND tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
WHERE tc.TABLE_SCHEMA = DATABASE()
  AND tc.TABLE_NAME = 'customers'
  AND tc.CONSTRAINT_TYPE = 'CHECK';

-- Expected: chk_customer_status constraint should exist

-- Test 2: Verify no customers have invalid status
SELECT 
    COUNT(*) as total_customers,
    SUM(CASE WHEN status IN ('REGISTERED', 'KYC_VERIFIED', 'ELIGIBLE', 'BLACKLISTED', 'DORMANT', 'INACTIVE') THEN 1 ELSE 0 END) as valid_status,
    SUM(CASE WHEN status NOT IN ('REGISTERED', 'KYC_VERIFIED', 'ELIGIBLE', 'BLACKLISTED', 'DORMANT', 'INACTIVE') OR status = '' OR status IS NULL THEN 1 ELSE 0 END) as invalid_status
FROM customers;

-- Expected: invalid_status = 0

-- Test 3: Try to insert invalid status (THIS SHOULD FAIL)
-- Uncomment to test:
-- INSERT INTO customers (id, customerNumber, status, firstName, lastName, phone, bvn, nin, dataProcessingConsent, creditBureauConsent) 
-- VALUES (UUID(), 'TEST-INVALID', 'INVALID_STATUS', 'Test', 'User', '99999999999', '12345678901', '12345678901', 1, 1);

-- Expected: Error "Check constraint 'chk_customer_status' is violated"

SELECT '✅ Test completed' as status;
