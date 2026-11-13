-- ============================================================================
-- Staff Loan Module - Permissions Setup
-- ============================================================================
-- This script creates all necessary permissions for the Staff Loan module
-- and assigns them to appropriate roles.
--
-- Run this script to enable Staff Loan features in your application.
-- ============================================================================

-- ── 1. Create Staff Loan Permissions ────────────────────────────────────────

INSERT INTO `Permission` (`id`, `name`, `description`, `module`, `action`, `resource`, `createdAt`, `updatedAt`) VALUES
-- Employee permissions (all staff can use these)
(UUID(), 'STAFF_LOANS:VIEW_OWN', 'View own staff loan applications', 'HR', 'READ', 'STAFF_LOAN', NOW(), NOW()),
(UUID(), 'STAFF_LOANS:APPLY', 'Apply for staff loan', 'HR', 'CREATE', 'STAFF_LOAN', NOW(), NOW()),

-- Admin/HR permissions
(UUID(), 'STAFF_LOANS:VIEW_ALL', 'View all staff loan applications', 'HR', 'READ', 'STAFF_LOAN', NOW(), NOW()),
(UUID(), 'STAFF_LOANS:APPROVE', 'Approve staff loan applications', 'HR', 'UPDATE', 'STAFF_LOAN', NOW(), NOW()),
(UUID(), 'STAFF_LOANS:REJECT', 'Reject staff loan applications', 'HR', 'UPDATE', 'STAFF_LOAN', NOW(), NOW()),

-- Finance permissions
(UUID(), 'STAFF_LOANS:DISBURSE', 'Disburse approved staff loans', 'HR', 'UPDATE', 'STAFF_LOAN', NOW(), NOW()),
(UUID(), 'STAFF_LOANS:RECORD_PAYMENT', 'Record staff loan payments', 'HR', 'CREATE', 'STAFF_LOAN_PAYMENT', NOW(), NOW()),
(UUID(), 'STAFF_LOANS:REVERSE_PAYMENT', 'Reverse staff loan payments', 'HR', 'DELETE', 'STAFF_LOAN_PAYMENT', NOW(), NOW()),

-- Reports permissions
(UUID(), 'STAFF_LOANS:EXPORT', 'Export staff loan reports', 'HR', 'READ', 'STAFF_LOAN', NOW(), NOW());


-- ── 2. Grant Basic Access to ALL Employees ──────────────────────────────────
-- All authenticated users should be able to apply for loans

-- Option A: If you have a default "Employee" role, grant access to it
INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  r.id as roleId,
  p.id as permissionId
FROM `Role` r
CROSS JOIN `Permission` p
WHERE r.name IN ('Employee', 'Staff', 'User')  -- Adjust role names as needed
AND p.name IN ('STAFF_LOANS:VIEW_OWN', 'STAFF_LOANS:APPLY');

-- Option B: If all roles should have access, grant to all roles
-- Uncomment below if you want ALL roles to have employee access
/*
INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  r.id as roleId,
  p.id as permissionId
FROM `Role` r
CROSS JOIN `Permission` p
WHERE p.name IN ('STAFF_LOANS:VIEW_OWN', 'STAFF_LOANS:APPLY');
*/


-- ── 3. Grant Admin Access to HR Roles ───────────────────────────────────────

INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  r.id as roleId,
  p.id as permissionId
FROM `Role` r
CROSS JOIN `Permission` p
WHERE r.name IN ('HR Manager', 'Admin', 'System Administrator')  -- Adjust role names
AND p.name LIKE 'STAFF_LOANS:%';


-- ── 4. Grant Finance Permissions to Finance Roles ───────────────────────────

INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  r.id as roleId,
  p.id as permissionId
FROM `Role` r
CROSS JOIN `Permission` p
WHERE r.name IN ('Finance Officer', 'Accounting Officer', 'Admin')  -- Adjust role names
AND p.name IN (
  'STAFF_LOANS:VIEW_ALL',
  'STAFF_LOANS:DISBURSE',
  'STAFF_LOANS:RECORD_PAYMENT',
  'STAFF_LOANS:EXPORT'
);


-- ── 5. Verification Queries ──────────────────────────────────────────────────

-- Check if permissions were created
SELECT 
  name,
  description,
  module,
  action,
  resource
FROM `Permission`
WHERE name LIKE 'STAFF_LOANS:%'
ORDER BY name;

-- Check which roles have staff loan permissions
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.description
FROM `RolePermission` rp
JOIN `Role` r ON rp.roleId = r.id
JOIN `Permission` p ON rp.permissionId = p.id
WHERE p.name LIKE 'STAFF_LOANS:%'
ORDER BY r.name, p.name;

-- Count how many roles have each permission
SELECT 
  p.name as permission,
  COUNT(DISTINCT rp.roleId) as role_count
FROM `Permission` p
LEFT JOIN `RolePermission` rp ON p.id = rp.permissionId
WHERE p.name LIKE 'STAFF_LOANS:%'
GROUP BY p.id, p.name
ORDER BY p.name;


-- ============================================================================
-- MANUAL ADJUSTMENTS (If Needed)
-- ============================================================================

-- If you need to grant permissions to a specific role not covered above:
/*
INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  (SELECT id FROM `Role` WHERE name = 'YOUR_ROLE_NAME' LIMIT 1) as roleId,
  id as permissionId
FROM `Permission`
WHERE name IN (
  'STAFF_LOANS:VIEW_OWN',
  'STAFF_LOANS:APPLY',
  'STAFF_LOANS:VIEW_ALL',
  'STAFF_LOANS:APPROVE'
);
*/

-- If you need to revoke permissions from a role:
/*
DELETE FROM `RolePermission`
WHERE roleId = (SELECT id FROM `Role` WHERE name = 'ROLE_NAME' LIMIT 1)
AND permissionId IN (
  SELECT id FROM `Permission` WHERE name LIKE 'STAFF_LOANS:%'
);
*/


-- ============================================================================
-- TESTING
-- ============================================================================

-- Test if a specific user has access
/*
SELECT 
  u.username,
  u.email,
  r.name as role_name,
  p.name as permission
FROM `User` u
JOIN `UserRole` ur ON u.id = ur.userId
JOIN `Role` r ON ur.roleId = r.id
JOIN `RolePermission` rp ON r.id = rp.roleId
JOIN `Permission` p ON rp.permissionId = p.id
WHERE u.email = 'test@example.com'  -- Replace with actual email
AND p.name LIKE 'STAFF_LOANS:%';
*/


-- ============================================================================
-- CLEANUP (Only use if you need to remove all staff loan permissions)
-- ============================================================================
/*
-- WARNING: This will remove all staff loan permissions and their assignments!

-- Remove role-permission assignments
DELETE FROM `RolePermission`
WHERE permissionId IN (
  SELECT id FROM `Permission` WHERE name LIKE 'STAFF_LOANS:%'
);

-- Remove permissions
DELETE FROM `Permission` WHERE name LIKE 'STAFF_LOANS:%';
*/

-- ============================================================================
-- SCRIPT COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Verify permissions were created (see verification queries above)
-- 2. Test login as employee - you should see "My Loans" in the menu
-- 3. Test login as HR/Admin - you should see "Staff Loans" admin page
-- 4. Navigate to /hr/staff-loans/my-loans to test the feature

COMMIT;
