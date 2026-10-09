-- Check ALL permissions that Loan Officers have
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name,
  p.description
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'LOAN_OFFICER'
ORDER BY p.code;

-- Check if any LO has permissions that grant "canViewAll" access
SELECT 
  'Permissions that grant canViewAll access' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('❌ YES - LO has ', COUNT(*), ' permission(s) that grant full access')
    ELSE '✅ NO - LO does not have canViewAll permissions'
  END as result,
  GROUP_CONCAT(p.code SEPARATOR ', ') as problematic_permissions
FROM roles r
JOIN role_permissions rp ON rp.roleId = r.id
JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'LOAN_OFFICER'
  AND p.code IN (
    'system:admin',
    'virtual_accounts:reconcile',
    'loan_applications:compliance_review',
    'loan_applications:internal_control_approve',
    'customers:manage'
  );
