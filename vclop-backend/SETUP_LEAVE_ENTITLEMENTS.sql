-- Setup Leave Entitlements for All Active Users
-- This creates leave entitlements for 2026 based on leave types configuration

-- First, let's see what we're about to create
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    lt.code,
    lt.defaultDaysPerYear,
    'Will be created' as status
FROM users u
CROSS JOIN leave_types lt
LEFT JOIN leave_entitlements le ON 
    u.id = le.userId AND 
    lt.id = le.leaveTypeId AND 
    le.year = 2026 AND
    le.deletedAt IS NULL
WHERE u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
  AND lt.isActive = 1
  AND lt.deletedAt IS NULL
  AND le.id IS NULL
ORDER BY u.username, lt.name;

-- Now create the entitlements (run after reviewing above)
INSERT INTO leave_entitlements (
    id,
    userId,
    leaveTypeId,
    year,
    allocatedDays,
    usedDays,
    pendingDays,
    carryForwardDays,
    effectiveFrom,
    effectiveTo,
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
    0 as pendingDays,
    0 as carryForwardDays,
    '2026-01-01 00:00:00' as effectiveFrom,
    '2026-12-31 23:59:59' as effectiveTo,
    NOW() as createdAt,
    NOW() as updatedAt
FROM users u
CROSS JOIN leave_types lt
LEFT JOIN leave_entitlements le ON 
    u.id = le.userId AND 
    lt.id = le.leaveTypeId AND 
    le.year = 2026 AND
    le.deletedAt IS NULL
WHERE u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
  AND lt.isActive = 1
  AND lt.deletedAt IS NULL
  AND le.id IS NULL;

-- Verify what was created
SELECT 
    'Created entitlements' as action,
    COUNT(*) as count,
    COUNT(DISTINCT userId) as users_count,
    COUNT(DISTINCT leaveTypeId) as leave_types_count
FROM leave_entitlements
WHERE year = 2026
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MINUTE);

-- Show summary per user
SELECT 
    u.username,
    u.email,
    COUNT(le.id) as entitlements_count,
    GROUP_CONCAT(lt.code ORDER BY lt.name SEPARATOR ', ') as leave_types
FROM users u
LEFT JOIN leave_entitlements le ON u.id = le.userId AND le.year = 2026 AND le.deletedAt IS NULL
LEFT JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
GROUP BY u.id, u.username, u.email
ORDER BY u.username;
