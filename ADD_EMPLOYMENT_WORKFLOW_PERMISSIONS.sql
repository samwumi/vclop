-- Add Employment Workflow Permissions
-- Run this on Hostinger database after deployment

-- ============================================================================
-- STEP 1: Create Permissions
-- ============================================================================

INSERT INTO `permissions` (`id`, `code`, `name`, `description`, `category`, `module`, `action`, `isSystem`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
  (UUID(), 'employees:submit', 'Submit Employment Data', 'Submit own employment data for HR review', 'HR', 'employees', 'submit', 0, 1, 100, NOW(), NOW()),
  (UUID(), 'employees:review', 'Review Employment Submissions', 'View and review pending employment submissions', 'HR', 'employees', 'review', 0, 1, 101, NOW(), NOW()),
  (UUID(), 'employees:approve', 'Approve Employment', 'Approve employment submissions', 'HR', 'employees', 'approve', 0, 1, 102, NOW(), NOW()),
  (UUID(), 'employees:reject', 'Reject Employment', 'Reject employment submissions', 'HR', 'employees', 'reject', 0, 1, 103, NOW(), NOW()),
  (UUID(), 'employees:grant_edit', 'Grant Edit Rights', 'Grant/revoke edit rights on approved employment data', 'HR', 'employees', 'grant_edit', 0, 1, 104, NOW(), NOW());

-- Verify permissions were created
SELECT '=== PERMISSIONS CREATED ===' as status;
SELECT * FROM permissions WHERE code LIKE 'employees:%' ORDER BY sortOrder;

-- ============================================================================
-- STEP 2: Grant ALL Permissions to Admin Role (Full Control)
-- ============================================================================

-- Admin gets ALL employment workflow permissions
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.code IN (
    'employees:submit',
    'employees:review', 
    'employees:approve', 
    'employees:reject', 
    'employees:grant_edit'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
  );

SELECT '=== ADMIN PERMISSIONS GRANTED ===' as status;

-- ============================================================================
-- STEP 3: Grant Permissions to HR Roles (Admin can adjust later)
-- ============================================================================

-- HR Manager gets all workflow permissions
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'hr_manager'
  AND p.code IN (
    'employees:submit',
    'employees:review', 
    'employees:approve', 
    'employees:reject', 
    'employees:grant_edit'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
  );

-- HR Officer gets review and operational permissions
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'hr_officer'
  AND p.code IN (
    'employees:submit',
    'employees:review', 
    'employees:approve', 
    'employees:reject', 
    'employees:grant_edit'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
  );

SELECT '=== HR ROLE PERMISSIONS GRANTED ===' as status;

-- ============================================================================
-- STEP 4: Grant Submit Permission to All Staff (Everyone can submit their own data)
-- ============================================================================

-- All roles get the submit permission (to fill their own employment data)
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'employees:submit'
  AND r.isActive = 1
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.roleId = r.id AND rp2.permissionId = p.id
  );

SELECT '=== ALL ROLES CAN SUBMIT ===' as status;

-- ============================================================================
-- STEP 5: Verify All Assignments
-- ============================================================================

SELECT '=== FINAL PERMISSION ASSIGNMENTS ===' as status;
SELECT 
  r.code as role_code,
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name,
  CASE 
    WHEN r.code = 'admin' THEN '🔑 FULL ACCESS'
    WHEN r.code IN ('hr_manager', 'hr_officer') THEN '👔 HR ACCESS'
    ELSE '👤 SELF-SERVICE'
  END as access_level
FROM role_permissions rp
JOIN roles r ON r.id = rp.roleId
JOIN permissions p ON p.id = rp.permissionId
WHERE p.code LIKE 'employees:%'
ORDER BY 
  CASE r.code 
    WHEN 'admin' THEN 1 
    WHEN 'hr_manager' THEN 2 
    WHEN 'hr_officer' THEN 3 
    ELSE 4 
  END,
  p.sortOrder;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 
-- ADMIN ROLE:
-- - Has ALL permissions (submit, review, approve, reject, grant_edit)
-- - Can manage and delegate permissions to other roles via the admin UI
-- - Full control over the employment workflow module
--
-- HR MANAGER & HR OFFICER:
-- - Have operational permissions (review, approve, reject, grant_edit)
-- - Can manage employee submissions and workflow
-- - Admin can revoke/adjust these permissions as needed
--
-- ALL OTHER ROLES:
-- - Have employees:submit permission only
-- - Can fill their own employment data, guarantors, and next of kin
-- - Can submit for HR review
-- - Cannot review or approve others' data
--
-- TO ADJUST PERMISSIONS:
-- Admin can use the Roles & Permissions UI to grant/revoke access
-- ============================================================================
