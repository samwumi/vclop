-- Check Leave Entitlements and Balances
-- Run this to diagnose why users have 0 leave balance

-- 1. Check if user has any leave entitlements
SELECT 
    u.id,
    u.username,
    u.email,
    u.firstName,
    u.lastName,
    COUNT(le.id) as entitlement_count
FROM users u
LEFT JOIN leave_entitlements le ON u.id = le.userId AND le.deletedAt IS NULL
WHERE u.deletedAt IS NULL
GROUP BY u.id, u.username, u.email, u.firstName, u.lastName
ORDER BY entitlement_count ASC, u.username;

-- 2. Check all leave types available
SELECT 
    id,
    code,
    name,
    defaultDaysPerYear,
    carryForwardAllowed,
    isActive
FROM leave_types
WHERE deletedAt IS NULL
ORDER BY name;

-- 3. Check specific user's entitlements (replace with actual user email)
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    lt.code,
    le.year,
    le.allocatedDays,
    le.usedDays,
    le.pendingDays,
    (le.allocatedDays - le.usedDays - le.pendingDays) as available_days,
    le.carryForwardDays,
    le.effectiveFrom,
    le.effectiveTo,
    le.createdAt
FROM users u
LEFT JOIN leave_entitlements le ON u.id = le.userId AND le.deletedAt IS NULL
LEFT JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE u.deletedAt IS NULL
ORDER BY u.username, le.year DESC, lt.name;

-- 4. Check users with NO entitlements (need to set up)
SELECT 
    u.id,
    u.username,
    u.email,
    u.firstName,
    u.lastName,
    u.branchId,
    b.name as branch_name,
    u.status
FROM users u
LEFT JOIN branches b ON u.branchId = b.id
LEFT JOIN leave_entitlements le ON u.id = le.userId AND le.deletedAt IS NULL
WHERE u.deletedAt IS NULL
  AND le.id IS NULL
ORDER BY u.username;

-- 5. Check leave applications to see who's trying to apply
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
