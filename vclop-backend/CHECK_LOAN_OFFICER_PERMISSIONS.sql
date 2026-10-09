-- Check what permissions Loan Officers have

SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'LOAN_OFFICER'
  AND p.code LIKE 'loan_applications:%'
ORDER BY p.code;

-- Check if loan_applications:update exists for LO
SELECT 
  'Has loan_applications:update?' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'YES ✅' 
    ELSE 'NO ❌ - Need to add this permission'
  END as result
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'LOAN_OFFICER'
  AND p.code = 'loan_applications:update';

-- Get the permission ID if we need to add it
SELECT 
  'Permission to add' as info,
  id,
  code,
  name
FROM permissions
WHERE code = 'loan_applications:update';
