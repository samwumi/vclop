-- ═══════════════════════════════════════════════════════════════════════════
-- MANAGE RECOVERY PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- Use this script to assign or withdraw recovery permissions for any role
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: VIEW CURRENT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- See all recovery permissions by role
SELECT 
    r.name AS role_name,
    COUNT(rp.id) AS total_recovery_permissions,
    GROUP_CONCAT(p.code ORDER BY p.code SEPARATOR ', ') AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE p.code LIKE 'recovery:%'
GROUP BY r.name
ORDER BY total_recovery_permissions DESC;

-- See all available recovery permissions
SELECT code, name, description, category
FROM permissions
WHERE code LIKE 'recovery:%'
ORDER BY sortOrder;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: ASSIGN PERMISSIONS TO A ROLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Example 1: Assign ALL recovery permissions to Manager role
-- Uncomment and modify the role name:

/*
SET @role_id = (SELECT id FROM roles WHERE name = 'Manager' LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, id, NOW()
FROM permissions
WHERE code LIKE 'recovery:%'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE roleId = @role_id AND permissionId = permissions.id
);

SELECT CONCAT('Assigned ', ROW_COUNT(), ' permissions to Manager') AS result;
*/

-- Example 2: Assign SPECIFIC permissions to a role
-- Uncomment and modify:

/*
SET @role_id = (SELECT id FROM roles WHERE name = 'Manager' LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, p.id, NOW()
FROM permissions p
WHERE p.code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:activities_read'
    -- Add more permissions as needed
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE roleId = @role_id AND permissionId = p.id
);

SELECT CONCAT('Assigned ', ROW_COUNT(), ' permissions to Manager') AS result;
*/

-- Example 3: Assign read-only recovery permissions to Staff
-- Uncomment to use:

/*
SET @role_id = (SELECT id FROM roles WHERE name = 'Staff' LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, p.id, NOW()
FROM permissions p
WHERE p.code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:activities_read',
    'recovery:payments_read',
    'recovery:promises_read',
    'recovery:expenses_read',
    'recovery:documents_read',
    'recovery:reports_view'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE roleId = @role_id AND permissionId = p.id
);

SELECT CONCAT('Assigned read-only permissions to Staff') AS result;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: WITHDRAW/REMOVE PERMISSIONS FROM A ROLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Example 1: Remove ALL recovery permissions from a role
-- Uncomment and modify:

/*
SET @role_id = (SELECT id FROM roles WHERE name = 'Staff' LIMIT 1);

DELETE rp FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
WHERE rp.roleId = @role_id
AND p.code LIKE 'recovery:%';

SELECT CONCAT('Removed ', ROW_COUNT(), ' recovery permissions from Staff') AS result;
*/

-- Example 2: Remove SPECIFIC permissions from a role
-- Uncomment and modify:

/*
SET @role_id = (SELECT id FROM roles WHERE name = 'Loan Officer' LIMIT 1);

DELETE rp FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
WHERE rp.roleId = @role_id
AND p.code IN (
    'recovery:accounts_delete',
    'recovery:payments_verify'
    -- Add more permissions to remove
);

SELECT CONCAT('Removed ', ROW_COUNT(), ' permissions from Loan Officer') AS result;
*/

-- Example 3: Remove only DELETE permissions from a role
-- Uncomment and modify:

/*
SET @role_id = (SELECT id FROM roles WHERE name = 'Manager' LIMIT 1);

DELETE rp FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
WHERE rp.roleId = @role_id
AND p.code LIKE 'recovery:%delete%';

SELECT CONCAT('Removed delete permissions from Manager') AS result;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: QUICK PERMISSION TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════════

-- TEMPLATE A: Full Recovery Access (Admin-level)
-- Gives all 23 recovery permissions
/*
SET @role_name = 'Manager'; -- Change role name here
SET @role_id = (SELECT id FROM roles WHERE name = @role_name LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, id, NOW()
FROM permissions
WHERE code LIKE 'recovery:%'
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE roleId = @role_id AND permissionId = permissions.id);

SELECT CONCAT('✅ Assigned FULL recovery access to ', @role_name) AS result;
*/

-- TEMPLATE B: Recovery Officer Access
-- Can manage accounts, log activities, record payments, but cannot verify or delete
/*
SET @role_name = 'Collections Officer'; -- Change role name here
SET @role_id = (SELECT id FROM roles WHERE name = @role_name LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, p.id, NOW()
FROM permissions p
WHERE p.code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:accounts_update',
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
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE roleId = @role_id AND permissionId = p.id);

SELECT CONCAT('✅ Assigned Recovery Officer permissions to ', @role_name) AS result;
*/

-- TEMPLATE C: Management/Reporting Access
-- Can view everything and export reports, but cannot modify
/*
SET @role_name = 'Manager'; -- Change role name here
SET @role_id = (SELECT id FROM roles WHERE name = @role_name LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, p.id, NOW()
FROM permissions p
WHERE p.code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:accounts_all',
    'recovery:activities_read',
    'recovery:payments_read',
    'recovery:promises_read',
    'recovery:expenses_read',
    'recovery:documents_read',
    'recovery:reports_view',
    'recovery:reports_export'
)
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE roleId = @role_id AND permissionId = p.id);

SELECT CONCAT('✅ Assigned Management/Reporting permissions to ', @role_name) AS result;
*/

-- TEMPLATE D: Payment Verification Access (Accounting Head style)
/*
SET @role_name = 'Accountant'; -- Change role name here
SET @role_id = (SELECT id FROM roles WHERE name = @role_name LIMIT 1);

INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @role_id, p.id, NOW()
FROM permissions p
WHERE p.code IN (
    'recovery:dashboard_view',
    'recovery:accounts_read',
    'recovery:accounts_all',
    'recovery:payments_record',
    'recovery:payments_verify',
    'recovery:payments_read',
    'recovery:reports_view',
    'recovery:reports_export'
)
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE roleId = @role_id AND permissionId = p.id);

SELECT CONCAT('✅ Assigned Payment Verification permissions to ', @role_name) AS result;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- After making changes, run this to verify:
SELECT 
    r.name AS role_name,
    COUNT(rp.id) AS recovery_permissions_count,
    GROUP_CONCAT(p.name ORDER BY p.sortOrder SEPARATOR '\n') AS permission_names
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE p.code LIKE 'recovery:%'
GROUP BY r.name
ORDER BY recovery_permissions_count DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUICK REFERENCE: ALL RECOVERY PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════
/*
Dashboard:
  - recovery:dashboard_view

Accounts (8):
  - recovery:accounts_create
  - recovery:accounts_read
  - recovery:accounts_update
  - recovery:accounts_delete
  - recovery:accounts_import
  - recovery:accounts_assign
  - recovery:accounts_all

Activities (2):
  - recovery:activities_create
  - recovery:activities_read

Payments (3):
  - recovery:payments_record
  - recovery:payments_verify
  - recovery:payments_read

Promises (3):
  - recovery:promises_create
  - recovery:promises_read
  - recovery:promises_update

Expenses (2):
  - recovery:expenses_create
  - recovery:expenses_read

Documents (3):
  - recovery:documents_upload
  - recovery:documents_read
  - recovery:documents_delete

Reports (2):
  - recovery:reports_view
  - recovery:reports_export

TOTAL: 24 permissions
*/
