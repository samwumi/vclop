-- Replace 'YOUR_EMAIL@example.com' with the email of the user you're logged in as
-- This will show all permissions this specific user has

SET @user_email = 'YOUR_EMAIL@example.com';  -- CHANGE THIS!

SELECT 
  u.email,
  u.firstName,
  u.lastName,
  r.name as role_name,
  p.code as permission_code
FROM `users` u
INNER JOIN `user_roles` ur ON ur.userId = u.id
INNER JOIN `roles` r ON r.id = ur.roleId
INNER JOIN `role_permissions` rp ON rp.roleId = r.id
INNER JOIN `permissions` p ON p.id = rp.permissionId
WHERE u.email = @user_email
  AND (ur.expiresAt IS NULL OR ur.expiresAt > NOW())
  AND r.isActive = 1
  AND p.isActive = 1
ORDER BY p.code;

-- Check specifically for users:read
SELECT 
  u.email,
  'users:read' as looking_for,
  COUNT(p.id) as has_permission
FROM `users` u
INNER JOIN `user_roles` ur ON ur.userId = u.id
INNER JOIN `roles` r ON r.id = ur.roleId
INNER JOIN `role_permissions` rp ON rp.roleId = r.id
INNER JOIN `permissions` p ON p.id = rp.permissionId
WHERE u.email = @user_email
  AND p.code = 'users:read'
  AND (ur.expiresAt IS NULL OR ur.expiresAt > NOW())
  AND r.isActive = 1
  AND p.isActive = 1;
