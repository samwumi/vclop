-- ============================================================================
-- GRANT leaves:read PERMISSION TO ALL STAFF
-- So everyone can see "My Leaves" page and apply for leave
-- ============================================================================
-- RUN THIS IN phpMyAdmin SQL TAB
-- ============================================================================

-- Step 1: Ensure leaves:read permission exists
INSERT IGNORE INTO Permission (id, name, description, resource, action, createdAt, updatedAt)
VALUES (
    UUID(),
    'leaves:read',
    'View own leave applications and balance',
    'leaves',
    'read',
    NOW(),
    NOW()
);

-- Step 2: Ensure leaves:create permission exists
INSERT IGNORE INTO Permission (id, name, description, resource, action, createdAt, updatedAt)
VALUES (
    UUID(),
    'leaves:create',
    'Apply for leave',
    'leaves',
    'create',
    NOW(),
    NOW()
);

-- Step 3: Grant leaves:read to ALL roles (Staff, Manager, HR, etc.)
INSERT IGNORE INTO RolePermission (roleId, permissionId)
SELECT 
    r.id as roleId,
    p.id as permissionId
FROM Role r
CROSS JOIN Permission p
WHERE p.name = 'leaves:read'
AND NOT EXISTS (
    SELECT 1 FROM RolePermission rp2
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
);

-- Step 4: Grant leaves:create to ALL roles
INSERT IGNORE INTO RolePermission (roleId, permissionId)
SELECT 
    r.id as roleId,
    p.id as permissionId
FROM Role r
CROSS JOIN Permission p
WHERE p.name = 'leaves:create'
AND NOT EXISTS (
    SELECT 1 FROM RolePermission rp2
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
);

-- Step 5: Verify the grants
SELECT 
    '=== All roles now have leaves:read and leaves:create ===' AS info;
    
SELECT 
    r.name as role_name,
    p.name as permission_name
FROM Role r
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name IN ('leaves:read', 'leaves:create')
ORDER BY r.name, p.name;

-- Step 6: Count affected users
SELECT 
    '=== Total users who can now see "My Leaves" ===' AS info;
    
SELECT COUNT(DISTINCT u.id) as total_users_with_access
FROM User u
INNER JOIN UserRole ur ON u.id = ur.userId
INNER JOIN Role r ON ur.roleId = r.id
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:read' 
AND u.deletedAt IS NULL;

SELECT 
    '=== ✅ DONE: Everyone can now see and use "My Leaves" ===' AS success;
