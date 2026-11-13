-- ================================================================================
-- ADD HR MODULE PERMISSIONS
-- ================================================================================
-- Created: 2026-10-28
-- Purpose: Add permissions for HR & Employee Self-Service Module
-- Modules: Employment, Leaves, Staff Loans, Resources, Offboarding
-- ================================================================================

-- First, let's check if permissions exist
SELECT 'Current HR-related permissions' as info;
SELECT id, name, description FROM permissions WHERE name LIKE 'hr:%' OR name LIKE 'employment:%' OR name LIKE 'leaves:%' OR name LIKE 'staff_loans:%';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EMPLOYMENT PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (id, name, description, resource, action, conditions, createdAt, updatedAt)
VALUES
  (UUID(), 'employment:read', 'View employment history and details', 'employment', 'read', '{}', NOW(), NOW()),
  (UUID(), 'employment:create', 'Create employment periods (hire/rehire)', 'employment', 'create', '{}', NOW(), NOW()),
  (UUID(), 'employment:update', 'Update employment details (salary, transfers)', 'employment', 'update', '{}', NOW(), NOW()),
  (UUID(), 'employment:manage', 'Full employment management access', 'employment', 'manage', '{}', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. LEAVE PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (id, name, description, resource, action, conditions, createdAt, updatedAt)
VALUES
  (UUID(), 'leaves:read', 'View own leave applications and balances', 'leaves', 'read', '{}', NOW(), NOW()),
  (UUID(), 'leaves:create', 'Create and submit leave applications', 'leaves', 'create', '{}', NOW(), NOW()),
  (UUID(), 'leaves:approve', 'Approve or reject leave applications', 'leaves', 'approve', '{}', NOW(), NOW()),
  (UUID(), 'leaves:manage', 'Manage all leave applications and entitlements', 'leaves', 'manage', '{}', NOW(), NOW()),
  (UUID(), 'leave_entitlements:read', 'View leave entitlements', 'leave_entitlements', 'read', '{}', NOW(), NOW()),
  (UUID(), 'leave_entitlements:manage', 'Create and adjust leave entitlements', 'leave_entitlements', 'manage', '{}', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. STAFF LOAN PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (id, name, description, resource, action, conditions, createdAt, updatedAt)
VALUES
  (UUID(), 'staff_loans:read', 'View own staff loan applications and balances', 'staff_loans', 'read', '{}', NOW(), NOW()),
  (UUID(), 'staff_loans:create', 'Apply for staff loans', 'staff_loans', 'create', '{}', NOW(), NOW()),
  (UUID(), 'staff_loans:approve', 'Approve or reject staff loan applications', 'staff_loans', 'approve', '{}', NOW(), NOW()),
  (UUID(), 'staff_loans:disburse', 'Disburse approved staff loans', 'staff_loans', 'disburse', '{}', NOW(), NOW()),
  (UUID(), 'staff_loans:manage', 'Full staff loan management access', 'staff_loans', 'manage', '{}', NOW(), NOW()),
  (UUID(), 'staff_loan_payments:record', 'Record staff loan payments', 'staff_loan_payments', 'create', '{}', NOW(), NOW()),
  (UUID(), 'staff_loan_payments:reverse', 'Reverse staff loan payments', 'staff_loan_payments', 'reverse', '{}', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 4. RESOURCE & RESPONSIBILITY PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (id, name, description, resource, action, conditions, createdAt, updatedAt)
VALUES
  (UUID(), 'resources:read', 'View resource assignments and delegations', 'resources', 'read', '{}', NOW(), NOW()),
  (UUID(), 'resources:assign', 'Assign resources to employees', 'resources', 'create', '{}', NOW(), NOW()),
  (UUID(), 'resources:delegate', 'Create temporary resource delegations', 'resources', 'delegate', '{}', NOW(), NOW()),
  (UUID(), 'resources:accept', 'Accept or reject resource delegations', 'resources', 'accept', '{}', NOW(), NOW()),
  (UUID(), 'resources:manage', 'Full resource management access', 'resources', 'manage', '{}', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. OFFBOARDING PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (id, name, description, resource, action, conditions, createdAt, updatedAt)
VALUES
  (UUID(), 'offboarding:read', 'View offboarding cases', 'offboarding', 'read', '{}', NOW(), NOW()),
  (UUID(), 'offboarding:initiate', 'Initiate offboarding process', 'offboarding', 'create', '{}', NOW(), NOW()),
  (UUID(), 'offboarding:it_clear', 'Process IT clearance', 'offboarding', 'it_clear', '{}', NOW(), NOW()),
  (UUID(), 'offboarding:finance_clear', 'Process finance clearance', 'offboarding', 'finance_clear', '{}', NOW(), NOW()),
  (UUID(), 'offboarding:asset_clear', 'Process asset clearance', 'offboarding', 'asset_clear', '{}', NOW(), NOW()),
  (UUID(), 'offboarding:hr_clear', 'Process HR clearance', 'offboarding', 'hr_clear', '{}', NOW(), NOW()),
  (UUID(), 'offboarding:manage', 'Full offboarding management access', 'offboarding', 'manage', '{}', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 6. APPROVAL POLICY PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (id, name, description, resource, action, conditions, createdAt, updatedAt)
VALUES
  (UUID(), 'approval_policies:read', 'View approval policies', 'approval_policies', 'read', '{}', NOW(), NOW()),
  (UUID(), 'approval_policies:manage', 'Create and update approval policies', 'approval_policies', 'manage', '{}', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 7. ASSIGN PERMISSIONS TO ROLES
-- ────────────────────────────────────────────────────────────────────────────

-- First, get role IDs
SET @ceo_role_id = (SELECT id FROM roles WHERE code = 'CEO' LIMIT 1);
SET @coo_role_id = (SELECT id FROM roles WHERE code = 'COO' LIMIT 1);
SET @hr_manager_id = (SELECT id FROM roles WHERE code = 'HR_MANAGER' LIMIT 1);
SET @acct_head_id = (SELECT id FROM roles WHERE code = 'ACCOUNTING_HEAD' LIMIT 1);
SET @dept_head_id = (SELECT id FROM roles WHERE code = 'DEPARTMENT_HEAD' LIMIT 1);
SET @loan_officer_id = (SELECT id FROM roles WHERE code = 'LOAN_OFFICER' LIMIT 1);

-- CEO: Full access to everything
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt)
SELECT @ceo_role_id, id, NOW()
FROM permissions
WHERE name LIKE 'employment:%' 
   OR name LIKE 'leaves:%'
   OR name LIKE 'staff_loans:%'
   OR name LIKE 'resources:%'
   OR name LIKE 'offboarding:%'
   OR name LIKE 'approval_policies:%';

-- COO: Full operational access
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt)
SELECT @coo_role_id, id, NOW()
FROM permissions
WHERE name IN (
  'employment:read', 'employment:update', 'employment:manage',
  'leaves:read', 'leaves:approve', 'leaves:manage',
  'staff_loans:read', 'staff_loans:approve', 'staff_loans:manage',
  'resources:read', 'resources:manage',
  'offboarding:read', 'offboarding:manage',
  'approval_policies:read'
);

-- HR Manager: Full HR access
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt)
SELECT @hr_manager_id, id, NOW()
FROM permissions
WHERE name IN (
  'employment:read', 'employment:create', 'employment:update', 'employment:manage',
  'leaves:read', 'leaves:manage',
  'leave_entitlements:read', 'leave_entitlements:manage',
  'staff_loans:read', 'staff_loans:manage',
  'resources:read', 'resources:assign', 'resources:manage',
  'offboarding:read', 'offboarding:initiate', 'offboarding:hr_clear', 'offboarding:manage',
  'approval_policies:read', 'approval_policies:manage'
);

-- Accounting Head: Financial clearances and staff loan disbursement
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt)
SELECT @acct_head_id, id, NOW()
FROM permissions
WHERE name IN (
  'staff_loans:read', 'staff_loans:approve', 'staff_loans:disburse',
  'staff_loan_payments:record', 'staff_loan_payments:reverse',
  'offboarding:read', 'offboarding:finance_clear'
);

-- Department Head: Team leave approval
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt)
SELECT @dept_head_id, id, NOW()
FROM permissions
WHERE name IN (
  'leaves:read', 'leaves:approve',
  'staff_loans:read'
);

-- Loan Officer: Self-service (all employees have these)
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt)
SELECT @loan_officer_id, id, NOW()
FROM permissions
WHERE name IN (
  'employment:read',
  'leaves:read', 'leaves:create',
  'staff_loans:read', 'staff_loans:create',
  'resources:read', 'resources:accept'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. VERIFICATION
-- ────────────────────────────────────────────────────────────────────────────

SELECT 'HR Permissions Created' as status;
SELECT resource, COUNT(*) as permission_count
FROM permissions
WHERE resource IN ('employment', 'leaves', 'leave_entitlements', 'staff_loans', 'staff_loan_payments', 'resources', 'offboarding', 'approval_policies')
GROUP BY resource;

SELECT 'Permission Assignments by Role' as status;
SELECT r.name as role_name, COUNT(rp.permissionId) as hr_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE p.resource IN ('employment', 'leaves', 'leave_entitlements', 'staff_loans', 'staff_loan_payments', 'resources', 'offboarding', 'approval_policies')
GROUP BY r.id, r.name
ORDER BY hr_permissions_count DESC;

-- ================================================================================
-- NOTES:
-- ================================================================================
-- 1. All employees should have basic self-service permissions (leaves:read, leaves:create, etc.)
-- 2. Supervisors need leaves:approve to approve their team's leave
-- 3. IT staff need offboarding:it_clear permission
-- 4. Asset managers need offboarding:asset_clear permission
-- 5. Adjust role assignments based on your organizational structure
-- ================================================================================
