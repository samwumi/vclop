-- ═══════════════════════════════════════════════════════════════════════════
-- FIX ADMIN RECOVERY PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- First, let's check what your Admin role is actually called
SELECT id, name FROM roles ORDER BY name;

-- Find the correct Admin role name and assign all recovery permissions
-- Replace 'Admin' with the exact name shown above if different

SET @admin_role_id = (SELECT id FROM roles WHERE LOWER(name) LIKE '%admin%' LIMIT 1);

-- Show what we found
SELECT 
    @admin_role_id as admin_role_id,
    (SELECT name FROM roles WHERE id = @admin_role_id) as admin_role_name;

-- Assign all 23 recovery permissions to Admin
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT UUID(), @admin_role_id, id, NOW()
FROM `permissions`
WHERE code LIKE 'recovery:%'
AND @admin_role_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE roleId = @admin_role_id 
    AND permissionId = permissions.id
);

-- Verify
SELECT 
    r.name AS role_name,
    COUNT(rp.id) AS recovery_permissions_assigned
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE p.code LIKE 'recovery:%'
GROUP BY r.name
ORDER BY recovery_permissions_assigned DESC;
