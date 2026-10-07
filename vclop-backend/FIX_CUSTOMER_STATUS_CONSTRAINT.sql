-- ============================================================================
-- FIX: Add Database Constraint to Prevent Empty Customer Status
-- This ensures customer status is always a valid enum value
-- ============================================================================

-- Step 1: Fix any existing invalid status values
UPDATE customers 
SET status = 'REGISTERED' 
WHERE status = '' 
   OR status IS NULL 
   OR status NOT IN ('REGISTERED', 'KYC_VERIFIED', 'ELIGIBLE', 'BLACKLISTED', 'DORMANT', 'INACTIVE');

-- Step 2: Verify all customers now have valid status
SELECT 
    'Checking customer status values' as check_type,
    COUNT(*) as total_customers,
    SUM(CASE WHEN status IN ('REGISTERED', 'KYC_VERIFIED', 'ELIGIBLE', 'BLACKLISTED', 'DORMANT', 'INACTIVE') THEN 1 ELSE 0 END) as valid_status,
    SUM(CASE WHEN status NOT IN ('REGISTERED', 'KYC_VERIFIED', 'ELIGIBLE', 'BLACKLISTED', 'DORMANT', 'INACTIVE') OR status = '' OR status IS NULL THEN 1 ELSE 0 END) as invalid_status
FROM customers;

-- Step 3: Add CHECK constraint to enforce valid enum values
-- Note: MySQL 8.0.16+ supports CHECK constraints
ALTER TABLE customers 
ADD CONSTRAINT chk_customer_status 
CHECK (status IN ('REGISTERED', 'KYC_VERIFIED', 'ELIGIBLE', 'BLACKLISTED', 'DORMANT', 'INACTIVE'));

-- Step 4: Verify constraint was added
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

SELECT '✅ Customer status constraint added' AS status;

-- ============================================================================
-- TESTING: Try to insert invalid status (should fail)
-- ============================================================================
-- Uncomment to test (this should fail with constraint violation):
-- INSERT INTO customers (id, customerNumber, status, firstName, lastName, phone) 
-- VALUES (UUID(), 'TEST-001', '', 'Test', 'User', '1234567890');
-- Expected error: "Check constraint 'chk_customer_status' is violated."
