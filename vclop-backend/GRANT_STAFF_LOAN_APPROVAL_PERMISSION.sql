-- Grant staff_loans:approve permission to samwumi91@gmail.com

-- Step 1: Find the permission ID
SELECT @permission_id := id FROM permissions 
WHERE resource = 'staff_loans' AND action = 'approve';

-- Step 2: Find user's role(s)
SELECT 
  r.id as role_id,
  r.name as role_name,
  u.email
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
INNER JOIN roles r ON ur.roleId = r.id
WHERE u.email = 'samwumi91@gmail.com';

-- Step 3: Add permission to the user's primary role (usually first one)
-- Replace 'YOUR_ROLE_ID' with actual role_id from Step 2
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  ur.roleId,
  (SELECT id FROM permissions WHERE resource = 'staff_loans' AND action = 'approve')
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
WHERE u.email = 'samwumi91@gmail.com'
LIMIT 1
ON DUPLICATE KEY UPDATE roleId = roleId; -- Prevents duplicate error

-- Verify the permission was added
SELECT 
  u.email,
  r.name as role_name,
  CONCAT(p.resource, ':', p.action) as permission
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
INNER JOIN roles r ON ur.roleId = r.id
INNER JOIN role_permissions rp ON r.id = rp.roleId
INNER JOIN permissions p ON rp.permissionId = p.id
WHERE u.email = 'samwumi91@gmail.com'
  AND p.resource = 'staff_loans'
ORDER BY permission;
