-- Grant Admin the ability to manage roles and permissions
-- This allows admin to assign employment permissions to HR users

-- Check if admin has roles:read permission
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON p.id = rp.permissionId AND p.code IN ('roles:read', 'roles:create', 'roles:update', 'permissions:read')
WHERE r.code = 'admin'
ORDER BY p.code;

-- If admin doesn't have these permissions, grant them:

-- Grant roles management permissions to Admin
INSERT IGNORE INTO role_permissions (roleId, permissionId)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.code IN (
    'roles:read',
    'roles:create', 
    'roles:update',
    'permissions:read'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
  );

-- Verify admin now has roles management
SELECT '=== ADMIN ROLES PERMISSIONS ===' as status;
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'admin'
  AND p.code IN ('roles:read', 'roles:create', 'roles:update', 'permissions:read')
ORDER BY p.code;
