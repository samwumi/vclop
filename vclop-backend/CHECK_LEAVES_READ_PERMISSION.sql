-- ============================================================================
-- CHECK WHO HAS leaves:read PERMISSION
-- ============================================================================

SELECT 
    '=== USERS WITH leaves:read PERMISSION ===' AS info;

SELECT 
    u.id,
    u.email,
    u.firstName,
    u.lastName,
    COUNT(DISTINCT p.id) as permission_count
FROM User u
LEFT JOIN UserRole ur ON u.id = ur.userId
LEFT JOIN Role r ON ur.roleId = r.id
LEFT JOIN RolePermission rp ON r.id = rp.roleId
LEFT JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:read'
GROUP BY u.id, u.email, u.firstName, u.lastName
ORDER BY u.email;

SELECT 
    '=== TOTAL USERS ===' AS info;
SELECT COUNT(*) as total_users FROM User WHERE deletedAt IS NULL;

SELECT 
    '=== USERS WITHOUT leaves:read ===' AS info;
SELECT 
    u.id,
    u.email,
    u.firstName,
    u.lastName
FROM User u
WHERE u.deletedAt IS NULL
AND u.id NOT IN (
    SELECT DISTINCT u2.id
    FROM User u2
    LEFT JOIN UserRole ur ON u2.id = ur.userId
    LEFT JOIN Role r ON ur.roleId = r.id
    LEFT JOIN RolePermission rp ON r.id = rp.roleId
    LEFT JOIN Permission p ON rp.permissionId = p.id
    WHERE p.name = 'leaves:read'
)
ORDER BY u.email;

SELECT 
    '=== ROLES WITH leaves:read ===' AS info;
SELECT 
    r.id,
    r.name,
    r.description
FROM Role r
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:read'
ORDER BY r.name;
