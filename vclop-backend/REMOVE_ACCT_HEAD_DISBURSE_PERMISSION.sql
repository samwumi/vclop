-- ============================================================================
-- Remove Disbursement Permission from Accounting Head Role
-- Only System Admin can disburse loans now
-- Run this on production database
-- ============================================================================

-- Step 1: Find the ACCOUNTING_HEAD role ID
SET @accounting_head_role_id = (SELECT id FROM roles WHERE code = 'ACCOUNTING_HEAD' LIMIT 1);

-- Step 2: Find the disbursement permission IDs
SET @disburse_perm_id = (SELECT id FROM permissions WHERE code = 'loan_applications:disburse' LIMIT 1);
SET @disburse_head_perm_id = (SELECT id FROM permissions WHERE code = 'loan_applications:disburse_head' LIMIT 1);

-- Step 3: Remove the permissions from ACCOUNTING_HEAD role
DELETE FROM role_permissions 
WHERE roleId = @accounting_head_role_id 
AND permissionId IN (@disburse_perm_id, @disburse_head_perm_id);

-- Step 4: Verify the change
SELECT 
  r.code AS role_code,
  r.name AS role_name,
  COUNT(rp.permissionId) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
WHERE r.code = 'ACCOUNTING_HEAD'
GROUP BY r.id, r.code, r.name;

-- Step 5: Verify SYSTEM_ADMIN still has disbursement permissions
SELECT 
  r.code AS role_code,
  r.name AS role_name,
  p.code AS permission_code,
  p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE r.code = 'SYSTEM_ADMIN'
AND p.code IN ('loan_applications:disburse', 'loan_applications:disburse_head')
ORDER BY p.code;

-- Expected result: SYSTEM_ADMIN should have both permissions
-- ACCOUNTING_HEAD should have 0 disbursement permissions

SELECT '✅ Disbursement permission removed from Accounting Head' AS status;
SELECT '✅ Only System Admin can disburse loans now' AS status;
