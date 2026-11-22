-- Quick Fix: Grant leave balance to all active users for 2026
-- Run this on production database to fix "Available: 0" error

-- First check current status
SELECT 
    u.username,
    u.email,
    COUNT(le.id) as entitlements_count
FROM users u
LEFT JOIN leave_entitlements le ON u.id = le.userId AND le.year = 2026 AND le.deletedAt IS NULL
WHERE u.deletedAt IS NULL AND u.status = 'ACTIVE'
GROUP BY u.id
HAVING entitlements_count = 0
ORDER BY u.username;

-- Now create entitlements for ALL active users
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

-- Verify results
SELECT 
    'SUCCESS: Entitlements created' as status,
    COUNT(*) as total_entitlements,
    COUNT(DISTINCT userId) as users_with_balance,
    COUNT(DISTINCT leaveTypeId) as leave_types
FROM leave_entitlements
WHERE year = 2026
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MINUTE);

-- Show what each user got
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    le.allocatedDays as days_available
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
  AND le.createdAt >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
ORDER BY u.username, lt.name;
