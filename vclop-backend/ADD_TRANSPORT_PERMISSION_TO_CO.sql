-- ============================================================================
-- ADD: Transport creation permission to Compliance Officer role
-- COs need customers:kyc permission to create transport requests
-- ============================================================================

-- Find the Compliance Officer role ID and customers:kyc permission ID
SET @co_role_id = (SELECT id FROM roles WHERE name = 'Compliance Officer' LIMIT 1);
SET @kyc_permission_id = (SELECT id FROM permissions WHERE code = 'customers:kyc' LIMIT 1);

-- Check if permission already exists
SELECT 
  'Before Adding' as status,
  r.name as role_name,
  p.code as permission_code
FROM roles r
LEFT JOIN role_permissions rp ON rp.roleId = r.id AND rp.permissionId = @kyc_permission_id
LEFT JOIN permissions p ON p.id = @kyc_permission_id
WHERE r.id = @co_role_id;

-- Add the permission if it doesn't exist
INSERT INTO role_permissions (roleId, permissionId)
SELECT @co_role_id, @kyc_permission_id
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE roleId = @co_role_id AND permissionId = @kyc_permission_id
);

-- Verify the permission was added
SELECT 
  'After Adding' as status,
  r.name as role_name,
  p.code as permission_code,
  CASE 
    WHEN rp.permissionId IS NOT NULL THEN '✅ Permission Added'
    ELSE '❌ Permission Missing'
  END as result
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.id = @co_role_id AND p.id = @kyc_permission_id;

-- Show all KYC-related permissions for Compliance Officer
SELECT 
  'All CO Permissions' as info,
  p.code,
  p.name
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.name = 'Compliance Officer'
  AND p.code LIKE '%kyc%'
ORDER BY p.code;
