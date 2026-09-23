-- ============================================================================
-- Add documents:read permission to ACCOUNTING_HEAD role
-- Fixes 401 error when viewing customer documents
-- Run this on production database
-- ============================================================================

-- Step 1: Find the ACCOUNTING_HEAD role ID
SET @accounting_head_role_id = (SELECT id FROM roles WHERE code = 'ACCOUNTING_HEAD' LIMIT 1);

-- Step 2: Find the documents:read permission ID
SET @documents_read_perm_id = (SELECT id FROM permissions WHERE code = 'documents:read' LIMIT 1);

-- Step 3: Add the permission to the role (if not already exists)
INSERT IGNORE INTO role_permissions (roleId, permissionId) 
VALUES (@accounting_head_role_id, @documents_read_perm_id);

-- Step 4: Verify the change
SELECT 
  r.code AS role_code,
  r.name AS role_name,
  p.code AS permission_code,
  p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE r.code = 'ACCOUNTING_HEAD'
AND p.code = 'documents:read';

SELECT '✅ documents:read permission added to ACCOUNTING_HEAD role' AS status;
SELECT '✅ Accounting Head can now view customer documents' AS status;
