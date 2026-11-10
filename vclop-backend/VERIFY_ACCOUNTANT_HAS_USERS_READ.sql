-- Verify the Accountant role has users:read permission

SELECT 
  r.id as role_id,
  r.name as role_name,
  p.id as permission_id,
  p.code as permission_code,
  rp.id as role_permission_id,
  rp.createdAt
FROM `roles` r
LEFT JOIN `role_permissions` rp ON rp.roleId = r.id
LEFT JOIN `permissions` p ON p.id = rp.permissionId
WHERE r.name = 'Accountant'
  AND p.code = 'users:read';

-- If the above returns 0 rows, the permission wasn't added
-- Let's check if the role_permissions record exists at all

SELECT COUNT(*) as total_role_permissions
FROM `role_permissions` rp
INNER JOIN `roles` r ON r.id = rp.roleId
WHERE r.name = 'Accountant';

-- Check if the permission exists in the system
SELECT id, code, name, isActive
FROM `permissions`
WHERE code = 'users:read';
