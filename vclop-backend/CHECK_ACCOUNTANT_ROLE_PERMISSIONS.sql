-- Check all permissions for Accountant role
SELECT 
  r.name as role_name,
  p.code as permission_code
FROM `roles` r
INNER JOIN `role_permissions` rp ON rp.roleId = r.id
INNER JOIN `permissions` p ON p.id = rp.permissionId
WHERE r.name = 'Accountant'
ORDER BY p.code;

-- Check if Accountant has virtual_accounts:reconcile permission
SELECT 
  r.name as role_name,
  p.code as permission_code
FROM `roles` r
INNER JOIN `role_permissions` rp ON rp.roleId = r.id
INNER JOIN `permissions` p ON p.id = rp.permissionId
WHERE r.name = 'Accountant'
  AND p.code = 'virtual_accounts:reconcile';
