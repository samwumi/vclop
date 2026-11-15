-- Check what HR permissions exist in the database
-- This will show you which permissions are missing

-- ============================================================================
-- Employment Workflow Permissions (should be 8)
-- ============================================================================
SELECT '=== EMPLOYMENT PERMISSIONS ===' as category;
SELECT code, name FROM permissions 
WHERE code LIKE 'employees:%' 
ORDER BY code;

-- Expected:
-- employees:read
-- employees:create  
-- employees:update
-- employees:submit
-- employees:review
-- employees:approve
-- employees:reject
-- employees:grant_edit

-- ============================================================================
-- Staff Loans Permissions
-- ============================================================================
SELECT '=== STAFF LOANS PERMISSIONS ===' as category;
SELECT code, name FROM permissions 
WHERE code LIKE 'STAFF_LOANS:%' OR code LIKE 'staff_loans:%'
ORDER BY code;

-- Expected:
-- staff_loans:read, staff_loans:create, staff_loans:approve, staff_loans:disburse

-- ============================================================================
-- Leaves Permissions
-- ============================================================================
SELECT '=== LEAVES PERMISSIONS ===' as category;
SELECT code, name FROM permissions 
WHERE code LIKE 'leaves:%'
ORDER BY code;

-- Expected:
-- leaves:read, leaves:create, leaves:approve, leaves:reject

-- ============================================================================
-- Offboarding Permissions
-- ============================================================================
SELECT '=== OFFBOARDING PERMISSIONS ===' as category;
SELECT code, name FROM permissions 
WHERE code LIKE 'offboarding:%'
ORDER BY code;

-- Expected:
-- offboarding:read, offboarding:initiate, offboarding:it_clear, 
-- offboarding:finance_clear, offboarding:asset_clear, offboarding:hr_clear

-- ============================================================================
-- Resources Permissions
-- ============================================================================
SELECT '=== RESOURCES PERMISSIONS ===' as category;
SELECT code, name FROM permissions 
WHERE code LIKE 'resources:%'
ORDER BY code;

-- Expected:
-- resources:read, resources:assign, resources:delegate, resources:accept

-- ============================================================================
-- Roles Management Permissions (for assigning permissions)
-- ============================================================================
SELECT '=== ROLES MANAGEMENT PERMISSIONS ===' as category;
SELECT code, name FROM permissions 
WHERE code IN ('roles:read', 'roles:create', 'roles:update', 'permissions:read')
ORDER BY code;

-- Expected:
-- roles:read, roles:create, roles:update, permissions:read

-- ============================================================================
-- Check Admin's Permissions
-- ============================================================================
SELECT '=== ADMIN ROLE PERMISSIONS ===' as category;
SELECT 
  p.code,
  p.name
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'admin'
  AND (
    p.code LIKE 'employees:%' 
    OR p.code LIKE 'staff_loans:%' 
    OR p.code LIKE 'STAFF_LOANS:%'
    OR p.code LIKE 'leaves:%'
    OR p.code LIKE 'offboarding:%'
    OR p.code LIKE 'resources:%'
    OR p.code IN ('roles:read', 'roles:create', 'roles:update', 'permissions:read')
  )
ORDER BY p.code;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT '=== SUMMARY ===' as category;
SELECT 
  'Employment' as module,
  COUNT(*) as permission_count
FROM permissions 
WHERE code LIKE 'employees:%'
UNION ALL
SELECT 
  'Staff Loans',
  COUNT(*)
FROM permissions 
WHERE code LIKE 'staff_loans:%' OR code LIKE 'STAFF_LOANS:%'
UNION ALL
SELECT 
  'Leaves',
  COUNT(*)
FROM permissions 
WHERE code LIKE 'leaves:%'
UNION ALL
SELECT 
  'Offboarding',
  COUNT(*)
FROM permissions 
WHERE code LIKE 'offboarding:%'
UNION ALL
SELECT 
  'Resources',
  COUNT(*)
FROM permissions 
WHERE code LIKE 'resources:%'
UNION ALL
SELECT 
  'Roles Management',
  COUNT(*)
FROM permissions 
WHERE code IN ('roles:read', 'roles:create', 'roles:update', 'permissions:read');
