-- ============================================================================
-- REMOVE leaves:approve PERMISSION FROM REGULAR STAFF
-- Only managers, supervisors, HR, and admins should approve leaves
-- Regular staff should only see their own leaves, not the approval page
-- ============================================================================

-- Step 1: Identify which roles currently have leaves:approve
SELECT 
  '=== CURRENT STATE: Roles with leaves:approve ===' as info;

SELECT 
  r.name as role_name,
  r.code as role_code,
  COUNT(DISTINCT ur.userId) as users_with_this_role
FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
JOIN roles r ON rp.roleId = r.id
LEFT JOIN user_roles ur ON r.id = ur.roleId
WHERE p.code = 'leaves:approve'
GROUP BY r.id, r.name, r.code
ORDER BY r.name;

-- Step 2: Remove leaves:approve from roles that shouldn't have it
-- Keep it only for: SUPER_ADMIN, ADMIN, HR_MANAGER, MANAGER, SUPERVISOR, TEAM_LEAD
SELECT 
  '=== REMOVING leaves:approve from unauthorized roles ===' as info;

DELETE rp
FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
JOIN roles r ON rp.roleId = r.id
WHERE p.code = 'leaves:approve'
  AND r.code NOT IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD');

-- Step 3: Grant leaves:approve to authorized roles if missing
SELECT 
  '=== ENSURING authorized roles have leaves:approve ===' as info;

INSERT IGNORE INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT 
  UUID(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'leaves:approve'
  AND r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.roleId = r.id AND rp.permissionId = p.id
  );

-- Step 4: Verify only authorized roles have leaves:approve
SELECT 
  '=== FINAL STATE: Roles with leaves:approve ===' as info;

SELECT 
  r.name as role_name,
  r.code as role_code,
  COUNT(DISTINCT ur.userId) as users_with_this_role
FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
JOIN roles r ON rp.roleId = r.id
LEFT JOIN user_roles ur ON r.id = ur.roleId
WHERE p.code = 'leaves:approve'
GROUP BY r.id, r.name, r.code
ORDER BY r.name;

-- Step 5: Check which active users now have leaves:approve permission
SELECT 
  '=== ACTIVE USERS WITH APPROVAL PERMISSION ===' as info;

SELECT 
  u.firstName,
  u.lastName,
  u.email,
  u.employeeId,
  GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') as roles,
  GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ', ') as role_codes
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'leaves:approve'
  AND u.status = 'ACTIVE'
GROUP BY u.id, u.firstName, u.lastName, u.email, u.employeeId
ORDER BY u.firstName, u.lastName;

-- Step 6: Verify regular staff DON'T have leaves:approve
SELECT 
  '=== SAMPLE REGULAR STAFF (should NOT have leaves:approve) ===' as info;

SELECT 
  u.firstName,
  u.lastName,
  u.email,
  u.employeeId,
  GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') as roles,
  GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as permissions
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id AND p.code LIKE 'leaves:%'
WHERE u.status = 'ACTIVE'
  AND r.code NOT IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD')
GROUP BY u.id, u.firstName, u.lastName, u.email, u.employeeId
LIMIT 10;
