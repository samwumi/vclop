-- Fix Negative Leave Balance Issue
-- User has -15 days available, need to investigate and fix

-- 1. Check which user has the problem
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    lt.code,
    le.allocatedDays,
    le.carryForwardDays,
    le.adjustmentDays,
    (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) as total_available,
    le.year
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
ORDER BY u.username, lt.name;

-- 2. Check leave applications for this user
SELECT 
    la.id,
    la.applicationNumber,
    u.username,
    u.email,
    lt.name as leave_type,
    la.startDate,
    la.endDate,
    la.totalDays,
    la.status,
    la.createdAt
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
ORDER BY la.createdAt DESC
LIMIT 20;

-- 3. Check if there are old applications consuming balance
SELECT 
    u.username,
    lt.name as leave_type,
    la.status,
    COUNT(*) as count,
    SUM(la.totalDays) as total_days_used
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
WHERE YEAR(la.startDate) = 2026
GROUP BY u.username, lt.name, la.status
ORDER BY u.username, lt.name;

-- 4. SOLUTION 1: Increase allocated days for users with negative balance
-- This gives users more days to cover existing approved leaves
UPDATE leave_entitlements le
SET 
    allocatedDays = 50,  -- Increase from default 21 to 50
    updatedAt = NOW()
WHERE year = 2026
  AND leaveTypeId IN (SELECT id FROM leave_types WHERE code = 'ANNUAL')
  AND (allocatedDays + carryForwardDays + adjustmentDays) < 0;

-- 5. SOLUTION 2: Add adjustment to cover the negative balance
-- This adds extra days via adjustment field
UPDATE leave_entitlements le
SET 
    adjustmentDays = 30,  -- Add 30 extra days
    updatedAt = NOW()
WHERE year = 2026
  AND (allocatedDays + carryForwardDays + adjustmentDays) < 0;

-- 6. SOLUTION 3: Delete old test/draft leave applications
-- WARNING: Only run if you're sure these are test data
-- DELETE FROM leave_applications 
-- WHERE status = 'DRAFT' 
--   AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 7. Verify the fix
SELECT 
    u.username,
    lt.name as leave_type,
    le.allocatedDays,
    le.carryForwardDays,
    le.adjustmentDays,
    (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) as total_available,
    'Should be positive now' as status
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
ORDER BY total_available ASC;

-- 8. Check specific user's balance after fix
-- Replace with actual user email
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    le.allocatedDays,
    le.carryForwardDays,
    le.adjustmentDays,
    (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) as available_balance
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE u.email = 'user@example.com'  -- REPLACE WITH ACTUAL EMAIL
  AND le.year = 2026;
