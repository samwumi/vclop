-- Check staff loan permission codes
SELECT code, name, description, category, module, action
FROM permissions 
WHERE code LIKE 'staff_loans%' OR name LIKE '%staff loan%'
ORDER BY code;

-- Check what permission codes the user has
SELECT 
    r.name AS role_name,
    p.code AS permission_code,
    p.name AS permission_name
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
INNER JOIN roles r ON ur.roleId = r.id
INNER JOIN role_permissions rp ON r.id = rp.roleId
INNER JOIN permissions p ON rp.permissionId = p.id
WHERE u.email = 'samwumi91@gmail.com'
  AND (p.code LIKE 'staff_loans%' OR p.name LIKE '%staff loan%')
ORDER BY r.name, p.code;
