-- Check what permissions Accounting Officers have
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description
FROM "Role" r
LEFT JOIN "RolePermission" rp ON rp."roleId" = r.id
LEFT JOIN "Permission" p ON p.id = rp."permissionId"
WHERE r.name ILIKE '%accounting%'
ORDER BY r.name, p.code;

-- Check if users:read exists
SELECT id, code, description 
FROM "Permission" 
WHERE code = 'users:read';
