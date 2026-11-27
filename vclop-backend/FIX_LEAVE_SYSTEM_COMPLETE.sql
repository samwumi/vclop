-- ============================================================================
-- FIX LEAVE SYSTEM COMPLETELY
-- 1. Remove leaves:approve from non-managers
-- 2. Ensure data displays correctly
-- ============================================================================

-- Step 1: Remove leaves:approve from ALL roles first
DELETE rp
FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'leaves:approve';

-- Step 2: Grant leaves:approve ONLY to authorized roles
INSERT IGNORE INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT 
  UUID(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'leaves:approve'
  AND r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER');

-- Step 3: Verify - who has leaves:approve now?
SELECT 
  '=== USERS WITH leaves:approve PERMISSION ===' as info;

SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as user_name,
  u.email,
  GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') as roles
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'leaves:approve'
  AND u.status = 'ACTIVE'
GROUP BY u.id, u.firstName, u.lastName, u.email
ORDER BY u.firstName, u.lastName;

-- Step 4: Check if data will show correctly for samwumi91@gmail.com
SELECT 
  '=== WHAT SHOULD SHOW ON MY LEAVES PAGE ===' as info;

SELECT 
  la.applicationNumber,
  la.status,
  lt.name as leave_type,
  la.startDate,
  la.endDate,
  la.businessDaysRequested as days,
  la.submittedAt,
  CASE 
    WHEN la.status = 'DRAFT' THEN 'Draft - Not submitted'
    WHEN la.status = 'PENDING_APPROVAL' THEN 'Waiting for approval'
    WHEN la.status = 'APPROVED' THEN 'Approved'
    WHEN la.status = 'REJECTED' THEN 'Rejected'
    ELSE la.status
  END as display_status
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
WHERE u.email = 'samwumi91@gmail.com'
ORDER BY la.createdAt DESC;

-- Step 5: Check leave balance that should show on dashboard
SELECT 
  '=== LEAVE BALANCE FOR DASHBOARD ===' as info;

SELECT 
  lt.name as leave_type,
  le.allocatedDays as entitled,
  le.usedDays as used,
  (SELECT COALESCE(SUM(businessDaysRequested), 0)
   FROM leave_applications la2
   WHERE la2.userId = le.userId
     AND la2.leaveTypeId = le.leaveTypeId
     AND la2.status = 'PENDING_APPROVAL'
     AND YEAR(la2.startDate) = 2026) as pending,
  (le.allocatedDays + le.carryForwardDays + le.adjustmentDays - le.usedDays) as total_available,
  (le.allocatedDays + le.carryForwardDays + le.adjustmentDays - le.usedDays -
   (SELECT COALESCE(SUM(businessDaysRequested), 0)
    FROM leave_applications la2
    WHERE la2.userId = le.userId
      AND la2.leaveTypeId = le.leaveTypeId
      AND la2.status = 'PENDING_APPROVAL'
      AND YEAR(la2.startDate) = 2026)) as remaining
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE u.email = 'samwumi91@gmail.com'
  AND le.year = 2026
  AND le.allocatedDays > 0
ORDER BY lt.name;
