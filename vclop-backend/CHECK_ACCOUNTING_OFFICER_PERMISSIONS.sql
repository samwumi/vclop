-- Check what permissions Accounting Officers have
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description
FROM `roles` r
LEFT JOIN `role_permissions` rp ON rp.roleId = r.id
LEFT JOIN `permissions` p ON p.id = rp.permissionId
WHERE r.name LIKE '%accounting%'
ORDER BY r.name, p.code;

-- Check if users:read exists
SELECT id, code, description 
FROM `permissions` 
WHERE code = 'users:read';

-- List all accounting-related roles
SELECT id, name, code, isActive
FROM `roles`
WHERE name LIKE '%account%' OR code LIKE '%account%';
