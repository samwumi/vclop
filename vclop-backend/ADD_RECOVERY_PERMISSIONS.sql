-- ═══════════════════════════════════════════════════════════════════════════
-- VCLOP RECOVERY MODULE - PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- This script adds all necessary permissions for the Recovery Management Module
-- Run this AFTER the ADD_RECOVERY_MODULE.sql migration
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert Recovery Module Permissions
INSERT INTO `permissions` (`id`, `code`, `name`, `description`, `module`, `action`, `category`, `isSystem`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
-- Dashboard
(UUID(), 'recovery:dashboard_view', 'View Recovery Dashboard', 'View overall recovery metrics and statistics', 'Recovery', 'view', 'READ', 1, 1, 1, NOW(), NOW()),

-- Recovery Accounts
(UUID(), 'recovery:accounts_create', 'Create Recovery Account', 'Create new recovery accounts (legacy or VCLOP)', 'Recovery', 'create', 'WRITE', 1, 1, 10, NOW(), NOW()),
(UUID(), 'recovery:accounts_read', 'View Recovery Accounts', 'View recovery account details and history', 'Recovery', 'read', 'READ', 1, 1, 11, NOW(), NOW()),
(UUID(), 'recovery:accounts_update', 'Update Recovery Account', 'Update recovery account information', 'Recovery', 'update', 'WRITE', 1, 1, 12, NOW(), NOW()),
(UUID(), 'recovery:accounts_delete', 'Delete Recovery Account', 'Delete recovery accounts', 'Recovery', 'delete', 'DELETE', 1, 1, 13, NOW(), NOW()),
(UUID(), 'recovery:accounts_import', 'Import Recovery Accounts', 'Bulk import accounts from Excel', 'Recovery', 'import', 'WRITE', 1, 1, 14, NOW(), NOW()),
(UUID(), 'recovery:accounts_assign', 'Assign Recovery Accounts', 'Assign accounts to recovery officers', 'Recovery', 'assign', 'WRITE', 1, 1, 15, NOW(), NOW()),
(UUID(), 'recovery:accounts_all', 'View All Recovery Accounts', 'View all recovery accounts (not just assigned ones)', 'Recovery', 'view_all', 'READ', 1, 1, 16, NOW(), NOW()),

-- Recovery Activities
(UUID(), 'recovery:activities_create', 'Log Recovery Activity', 'Record recovery activities (calls, visits, etc.)', 'Recovery', 'create', 'WRITE', 1, 1, 20, NOW(), NOW()),
(UUID(), 'recovery:activities_read', 'View Recovery Activities', 'View activity history and followups', 'Recovery', 'read', 'READ', 1, 1, 21, NOW(), NOW()),

-- Recovery Payments
(UUID(), 'recovery:payments_record', 'Record Recovery Payment', 'Record payments from customers', 'Recovery', 'create', 'WRITE', 1, 1, 30, NOW(), NOW()),
(UUID(), 'recovery:payments_verify', 'Verify Recovery Payment', 'Verify and approve recorded payments', 'Recovery', 'verify', 'APPROVAL', 1, 1, 31, NOW(), NOW()),
(UUID(), 'recovery:payments_read', 'View Recovery Payments', 'View payment history', 'Recovery', 'read', 'READ', 1, 1, 32, NOW(), NOW()),

-- Repayment Promises
(UUID(), 'recovery:promises_create', 'Create Repayment Promise', 'Record customer payment promises', 'Recovery', 'create', 'WRITE', 1, 1, 40, NOW(), NOW()),
(UUID(), 'recovery:promises_read', 'View Repayment Promises', 'View active and historical promises', 'Recovery', 'read', 'READ', 1, 1, 41, NOW(), NOW()),
(UUID(), 'recovery:promises_update', 'Update Promise Status', 'Mark promises as kept, broken, or cancelled', 'Recovery', 'update', 'WRITE', 1, 1, 42, NOW(), NOW()),

-- Recovery Expenses
(UUID(), 'recovery:expenses_create', 'Record Recovery Expense', 'Record recovery-related expenses', 'Recovery', 'create', 'WRITE', 1, 1, 50, NOW(), NOW()),
(UUID(), 'recovery:expenses_read', 'View Recovery Expenses', 'View expense records', 'Recovery', 'read', 'READ', 1, 1, 51, NOW(), NOW()),

-- Recovery Documents
(UUID(), 'recovery:documents_upload', 'Upload Recovery Document', 'Upload supporting documents', 'Recovery', 'upload', 'WRITE', 1, 1, 60, NOW(), NOW()),
(UUID(), 'recovery:documents_read', 'View Recovery Documents', 'View and download documents', 'Recovery', 'read', 'READ', 1, 1, 61, NOW(), NOW()),
(UUID(), 'recovery:documents_delete', 'Delete Recovery Document', 'Delete uploaded documents', 'Recovery', 'delete', 'DELETE', 1, 1, 62, NOW(), NOW()),

-- Recovery Reports
(UUID(), 'recovery:reports_view', 'View Recovery Reports', 'Access recovery analytics and reports', 'Recovery', 'read', 'READ', 1, 1, 70, NOW(), NOW()),
(UUID(), 'recovery:reports_export', 'Export Recovery Reports', 'Export recovery data to Excel/CSV', 'Recovery', 'export', 'READ', 1, 1, 71, NOW(), NOW());

-- ═══════════════════════════════════════════════════════════════════════════
-- ASSIGN PERMISSIONS TO ROLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Get role IDs (adjust role names if different in your system)
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1);
SET @md_role_id = (SELECT id FROM roles WHERE name = 'Managing Director' LIMIT 1);
SET @ops_manager_role_id = (SELECT id FROM roles WHERE name = 'Operations Manager' LIMIT 1);
SET @acct_head_role_id = (SELECT id FROM roles WHERE name = 'Accounting Head' LIMIT 1);
SET @loan_officer_role_id = (SELECT id FROM roles WHERE name = 'Loan Officer' LIMIT 1);

-- Admin: All recovery permissions
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT UUID(), @admin_role_id, id, NOW()
FROM `permissions`
WHERE code LIKE 'recovery:%'
AND @admin_role_id IS NOT NULL;

-- MD: Dashboard, reports, view all accounts
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT UUID(), @md_role_id, id, NOW()
FROM `permissions`
WHERE code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:accounts_all',
    'recovery:activities_read',
    'recovery:payments_read',
    'recovery:promises_read',
    'recovery:expenses_read',
    'recovery:reports_view',
    'recovery:reports_export'
)
AND @md_role_id IS NOT NULL;

-- Operations Manager: All except delete
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT UUID(), @ops_manager_role_id, id, NOW()
FROM `permissions`
WHERE code LIKE 'recovery:%'
AND code NOT LIKE '%delete%'
AND @ops_manager_role_id IS NOT NULL;

-- Accounting Head: Payment verification, reports, view accounts
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT UUID(), @acct_head_role_id, id, NOW()
FROM `permissions`
WHERE code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:accounts_all',
    'recovery:activities_read',
    'recovery:payments_record',
    'recovery:payments_verify',
    'recovery:payments_read',
    'recovery:promises_read',
    'recovery:expenses_read',
    'recovery:documents_read',
    'recovery:reports_view',
    'recovery:reports_export'
)
AND @acct_head_role_id IS NOT NULL;

-- Loan Officer (when assigned recovery accounts): Basic recovery operations
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT UUID(), @loan_officer_role_id, id, NOW()
FROM `permissions`
WHERE code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:activities_create',
    'recovery:activities_read',
    'recovery:payments_record',
    'recovery:payments_read',
    'recovery:promises_create',
    'recovery:promises_read',
    'recovery:promises_update',
    'recovery:expenses_create',
    'recovery:expenses_read',
    'recovery:documents_upload',
    'recovery:documents_read'
)
AND @loan_officer_role_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check all recovery permissions were created
SELECT 'Recovery permissions created successfully' AS status;

-- Count recovery permissions
SELECT COUNT(*) AS recovery_permissions_count
FROM permissions
WHERE code LIKE 'recovery:%';

-- Show all recovery permissions
SELECT code, name, category, module
FROM permissions
WHERE code LIKE 'recovery:%'
ORDER BY sortOrder;

-- Show permission assignments by role
SELECT 
    r.name AS role_name,
    COUNT(rp.id) AS recovery_permissions_assigned
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE p.code LIKE 'recovery:%'
GROUP BY r.name
ORDER BY recovery_permissions_assigned DESC;
