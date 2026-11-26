-- ============================================================================
-- CREATE 2026 LEAVE ENTITLEMENTS
-- Copy from 2024 or create fresh for all active users
-- ============================================================================

-- Step 1: Check current state
SELECT 
  '=== CURRENT ENTITLEMENTS BY YEAR ===' as info;

SELECT 
  year,
  COUNT(*) as total_entitlements,
  COUNT(DISTINCT userId) as employees
FROM leave_entitlements
GROUP BY year
ORDER BY year DESC;

-- Step 2: Create 2026 entitlements for all active users
-- This will create entitlements based on leave types' default days
INSERT INTO leave_entitlements (
  id,
  userId,
  leaveTypeId,
  year,
  allocatedDays,
  usedDays,
  carryForwardDays,
  adjustmentDays,
  createdById,
  createdAt,
  updatedAt
)
SELECT 
  UUID() as id,
  u.id as userId,
  lt.id as leaveTypeId,
  2026 as year,
  lt.defaultDaysPerYear as allocatedDays,
  0 as usedDays,
  0 as carryForwardDays,
  0 as adjustmentDays,
  (SELECT id FROM users WHERE email = 'samwumi91@gmail.com' LIMIT 1) as createdById,
  NOW() as createdAt,
  NOW() as updatedAt
FROM users u
CROSS JOIN leave_types lt
WHERE u.status = 'ACTIVE'
  AND lt.isActive = 1
  AND NOT EXISTS (
    SELECT 1 
    FROM leave_entitlements le 
    WHERE le.userId = u.id 
      AND le.leaveTypeId = lt.id 
      AND le.year = 2026
  );

-- Step 3: Verify 2026 entitlements were created
SELECT 
  '=== 2026 ENTITLEMENTS CREATED ===' as info;

SELECT 
  COUNT(*) as total_entitlements,
  COUNT(DISTINCT userId) as total_employees,
  COUNT(DISTINCT leaveTypeId) as total_leave_types
FROM leave_entitlements
WHERE year = 2026;

-- Step 4: Show sample of 2026 entitlements
SELECT 
  '=== SAMPLE 2026 ENTITLEMENTS ===' as info;

SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as employee,
  lt.name as leave_type,
  le.allocatedDays,
  le.usedDays,
  le.carryForwardDays,
  le.adjustmentDays
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
ORDER BY u.firstName, u.lastName, lt.name
LIMIT 20;

-- Step 5: Carry forward unused days from 2025 (if applicable)
-- Only for leave types that allow carry forward
UPDATE leave_entitlements le2026
JOIN leave_entitlements le2025 ON le2026.userId = le2025.userId 
  AND le2026.leaveTypeId = le2025.leaveTypeId
  AND le2025.year = 2025
JOIN leave_types lt ON le2026.leaveTypeId = lt.id
SET le2026.carryForwardDays = LEAST(
  le2025.allocatedDays + COALESCE(le2025.carryForwardDays, 0) + COALESCE(le2025.adjustmentDays, 0) - le2025.usedDays,
  COALESCE(lt.maxCarryForwardDays, 999)
),
le2026.updatedAt = NOW()
WHERE le2026.year = 2026
  AND lt.carryForwardAllowed = 1
  AND (le2025.allocatedDays + COALESCE(le2025.carryForwardDays, 0) + COALESCE(le2025.adjustmentDays, 0) - le2025.usedDays) > 0;

-- Step 6: Final summary
SELECT 
  '=== FINAL SUMMARY ===' as info;

SELECT 
  year,
  COUNT(*) as entitlements,
  COUNT(DISTINCT userId) as employees,
  SUM(allocatedDays) as total_allocated,
  SUM(usedDays) as total_used,
  SUM(carryForwardDays) as total_carried_forward
FROM leave_entitlements
WHERE year IN (2024, 2025, 2026)
GROUP BY year
ORDER BY year DESC;
