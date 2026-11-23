-- ============================================================================
-- ACTIVATE HR MANAGER ROLE
-- ============================================================================
-- This script checks and activates the HR Manager role so it appears in the UI
-- ============================================================================

-- Step 1: Check the current status
SELECT 
    id,
    code,
    name,
    isActive,
    isSystem,
    description
FROM roles 
WHERE code = 'HR_MANAGER';

-- Step 2: Activate the role
UPDATE roles 
SET isActive = 1
WHERE code = 'HR_MANAGER';

-- Step 3: Verify it's now active
SELECT 
    id,
    code,
    name,
    isActive,
    isSystem,
    description
FROM roles 
WHERE code = 'HR_MANAGER';

-- Step 4: Check what permissions are assigned
SELECT 
    r.name AS role_name,
    p.code AS permission_code,
    p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE r.code = 'HR_MANAGER'
ORDER BY p.code;

-- ============================================================================
-- If the role has no permissions, run this to assign them:
-- ============================================================================

-- Get the role ID
SET @hrRoleId = (SELECT id FROM roles WHERE code = 'HR_MANAGER' LIMIT 1);

-- Assign all HR permissions
INSERT IGNORE INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT 
    UUID(),
    @hrRoleId,
    p.id,
    NOW()
FROM permissions p
WHERE p.code IN (
    'dashboard:read',
    'users:read',
    'leaves:read',
    'leaves:manage',
    'leaves:approve',
    'employment:read',
    'employment:update',
    'offboarding:read',
    'offboarding:update',
    'staff_loans:read',
    'staff_loans:approve',
    'resources:read',
    'resources:update',
    'reports:read'
);

-- Verify permissions were assigned
SELECT COUNT(*) AS permission_count
FROM role_permissions
WHERE roleId = @hrRoleId;

SELECT '✅ HR Manager role is now active and has permissions assigned!' AS status;
