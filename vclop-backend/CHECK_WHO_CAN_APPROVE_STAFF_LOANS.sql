-- Check which roles have staff_loans:approve permission
SELECT 
    r.name AS role_name,
    r.description AS role_description,
    p.code AS permission_code,
    p.name AS permission_name
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.roleId
INNER JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'staff_loans:approve'
ORDER BY r.name;

-- Check which users have roles that can approve staff loans
SELECT 
    u.email,
    u.firstName,
    u.lastName,
    r.name AS role_name
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
INNER JOIN roles r ON ur.roleId = r.id
INNER JOIN role_permissions rp ON r.id = rp.roleId
INNER JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'staff_loans:approve'
  AND u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
ORDER BY u.firstName, u.lastName;

-- Check if there's a specific "HR Manager" or similar role
SELECT id, name, description 
FROM roles 
WHERE name LIKE '%HR%' OR name LIKE '%Manager%' OR name LIKE '%Admin%'
ORDER BY name;
