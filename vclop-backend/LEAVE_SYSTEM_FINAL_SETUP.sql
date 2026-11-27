-- ============================================================================
-- LEAVE SYSTEM FINAL SETUP - RUN THIS ONCE IN phpMyAdmin
-- ============================================================================
-- This script does 3 things:
-- 1. Grants leaves:read and leaves:create to ALL staff (so everyone sees "My Leaves")
-- 2. Removes leaves:approve from non-managers (so only managers see "Leave Approvals")
-- 3. Verifies the setup is correct
-- ============================================================================

-- ============================================================================
-- PART 1: GRANT leaves:read AND leaves:create TO ALL STAFF
-- ============================================================================

-- Ensure leaves:read permission exists
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

-- Ensure leaves:create permission exists
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

-- Grant leaves:read to ALL roles
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

-- Grant leaves:create to ALL roles
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

-- ============================================================================
-- PART 2: REMOVE leaves:approve FROM NON-MANAGERS
-- ============================================================================

-- Find roles that should NOT have leaves:approve
-- (basically everyone except managers, supervisors, HR, and admins)
DELETE rp FROM RolePermission rp
INNER JOIN Role r ON rp.roleId = r.id
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:approve'
AND r.name NOT IN ('Admin', 'Manager', 'Supervisor', 'HR Manager', 'HR Officer');

-- ============================================================================
-- PART 3: VERIFICATION
-- ============================================================================

SELECT '=== ✅ PART 1: Roles with leaves:read (should be ALL roles) ===' AS info;
SELECT 
    r.name as role_name,
    COUNT(*) as has_permission
FROM Role r
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:read'
GROUP BY r.name
ORDER BY r.name;

SELECT '=== ✅ PART 2: Roles with leaves:create (should be ALL roles) ===' AS info;
SELECT 
    r.name as role_name,
    COUNT(*) as has_permission
FROM Role r
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:create'
GROUP BY r.name
ORDER BY r.name;

SELECT '=== ✅ PART 3: Roles with leaves:approve (ONLY managers/HR/admin) ===' AS info;
SELECT 
    r.name as role_name,
    COUNT(*) as has_permission
FROM Role r
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:approve'
GROUP BY r.name
ORDER BY r.name;

SELECT '=== ✅ PART 4: Total users who can see "My Leaves" ===' AS info;
SELECT COUNT(DISTINCT u.id) as total_users
FROM User u
INNER JOIN UserRole ur ON u.id = ur.userId
INNER JOIN Role r ON ur.roleId = r.id
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:read' 
AND u.deletedAt IS NULL;

SELECT '=== ✅ PART 5: Total users who can see "Leave Approvals" ===' AS info;
SELECT COUNT(DISTINCT u.id) as total_managers
FROM User u
INNER JOIN UserRole ur ON u.id = ur.userId
INNER JOIN Role r ON ur.roleId = r.id
INNER JOIN RolePermission rp ON r.id = rp.roleId
INNER JOIN Permission p ON rp.permissionId = p.id
WHERE p.name = 'leaves:approve' 
AND u.deletedAt IS NULL;

SELECT '=== ✅✅✅ SETUP COMPLETE! ✅✅✅ ===' AS success;
SELECT '=== All staff can now apply for leave via "My Leaves" ===' AS result1;
SELECT '=== Only managers/HR can approve via "Leave Approvals" ===' AS result2;
