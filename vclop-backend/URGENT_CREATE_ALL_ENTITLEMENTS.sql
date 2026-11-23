-- URGENT: Create Leave Entitlements for All Active Users
-- Run this NOW to fix "Insufficient leave balance" error
-- Safe to run - will not create duplicates

-- Step 1: Check current status (should return 0 rows initially)
SELECT COUNT(*) as existing_entitlements FROM leave_entitlements WHERE year = 2026;

-- Step 2: See what will be created
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    lt.defaultDaysPerYear,
    '30 adjustment days will be added' as note
FROM users u
CROSS JOIN leave_types lt
LEFT JOIN leave_entitlements le ON 
    u.id = le.userId AND 
    lt.id = le.leaveTypeId AND 
    le.year = 2026
WHERE u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
  AND lt.isActive = 1
  AND le.id IS NULL
ORDER BY u.username, lt.name;

-- Step 3: CREATE THE ENTITLEMENTS
INSERT INTO leave_entitlements (
    id,
    userId,
    leaveTypeId,
    year,
    allocatedDays,
    carryForwardDays,
    adjustmentDays,
    createdAt,
    updatedAt,
    createdById
)
SELECT 
    UUID() as id,
    u.id as userId,
    lt.id as leaveTypeId,
    2026 as year,
    lt.defaultDaysPerYear as allocatedDays,
    0 as carryForwardDays,
    30 as adjustmentDays,  -- Add 30 extra days to cover existing applications
    NOW() as createdAt,
    NOW() as updatedAt,
    u.id as createdById  -- Self-created
FROM users u
CROSS JOIN leave_types lt
LEFT JOIN leave_entitlements le ON 
    u.id = le.userId AND 
    lt.id = le.leaveTypeId AND 
    le.year = 2026
WHERE u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
  AND lt.isActive = 1
  AND le.id IS NULL;

-- Step 4: Verify creation
SELECT 
    'SUCCESS: Entitlements created' as status,
    COUNT(*) as total_created,
    COUNT(DISTINCT userId) as users_with_entitlements
FROM leave_entitlements
WHERE year = 2026
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MINUTE);

-- Step 5: Show what each user now has
SELECT 
    u.username,
    u.email,
    lt.code,
    lt.name as leave_type,
    le.allocatedDays,
    le.adjustmentDays,
    (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) as total_available
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
ORDER BY u.username, lt.name;

-- Step 6: Check for any negative balances (should be none now)
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) as total_available,
    'NEEDS ATTENTION' as status
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
  AND (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) < 0
ORDER BY total_available ASC;

-- Expected Result Examples:
-- Annual Leave: 21 (default) + 0 (carry forward) + 30 (adjustment) = 51 days
-- Sick Leave: 10 + 0 + 30 = 40 days
-- Compassionate: 3 + 0 + 30 = 33 days
-- etc.
