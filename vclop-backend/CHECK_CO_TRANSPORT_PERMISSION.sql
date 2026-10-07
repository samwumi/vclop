-- Check if Compliance Officers have transport creation permission
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.name LIKE '%Compliance%'
  AND p.code IN ('customers:kyc', 'transport:create', 'transport:approve')
ORDER BY r.name, p.code;

-- Check all transport-related permissions
SELECT code, name, description
FROM permissions
WHERE code LIKE '%transport%'
ORDER BY code;
