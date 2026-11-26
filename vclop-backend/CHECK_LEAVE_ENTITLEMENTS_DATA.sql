-- ============================================================================
-- CHECK LEAVE ENTITLEMENTS DATA
-- ============================================================================

-- Step 1: Check what years have entitlements
SELECT 
  '=== ENTITLEMENTS BY YEAR ===' as info;

SELECT 
  year,
  COUNT(*) as total_entitlements,
  COUNT(DISTINCT userId) as unique_employees,
  COUNT(DISTINCT leaveTypeId) as unique_leave_types
FROM leave_entitlements
GROUP BY year
ORDER BY year DESC;

-- Step 2: Check current year entitlements
SELECT 
  '=== CURRENT YEAR (2024) ENTITLEMENTS ===' as info;

SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as employee,
  lt.name as leave_type,
  le.year,
  le.entitledDays,
  le.usedDays,
  COALESCE(le.carriedForwardDays, 0) as carriedForward,
  COALESCE(le.adjustmentDays, 0) as adjustments,
  (le.entitledDays + COALESCE(le.carriedForwardDays, 0) + COALESCE(le.adjustmentDays, 0) - le.usedDays) as remaining
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2024
ORDER BY u.firstName, u.lastName, lt.name
LIMIT 20;

-- Step 3: Check if there are any entitlements at all
SELECT 
  '=== TOTAL ENTITLEMENTS COUNT ===' as info;

SELECT 
  COUNT(*) as total_entitlements,
  MIN(year) as earliest_year,
  MAX(year) as latest_year
FROM leave_entitlements;

-- Step 4: Check leave types
SELECT 
  '=== ACTIVE LEAVE TYPES ===' as info;

SELECT 
  id,
  name,
  code,
  defaultDaysPerYear,
  isActive
FROM leave_types
WHERE isActive = 1;

-- Step 5: Check if users have entitlements set up
SELECT 
  '=== USERS WITH/WITHOUT ENTITLEMENTS ===' as info;

SELECT 
  'Users with entitlements' as category,
  COUNT(DISTINCT le.userId) as count
FROM leave_entitlements le
WHERE le.year = YEAR(CURDATE())
UNION ALL
SELECT 
  'Total active users' as category,
  COUNT(*) as count
FROM users
WHERE status = 'ACTIVE';
