-- Check if loan officers have branches assigned
SELECT 
  u.id,
  u.email,
  u.firstName,
  u.lastName,
  u.branchId,
  b.name as branch_name,
  b.code as branch_code,
  r.name as role_name
FROM users u
JOIN user_roles ur ON ur.userId = u.id
JOIN roles r ON r.id = ur.roleId
LEFT JOIN branches b ON b.id = u.branchId
WHERE r.code = 'LOAN_OFFICER'
  AND u.deletedAt IS NULL
ORDER BY u.email;

-- Summary
SELECT 
  'Loan Officer Branch Assignment Summary' as info,
  COUNT(*) as total_loan_officers,
  SUM(CASE WHEN u.branchId IS NULL THEN 1 ELSE 0 END) as without_branch,
  SUM(CASE WHEN u.branchId IS NOT NULL THEN 1 ELSE 0 END) as with_branch,
  CASE 
    WHEN SUM(CASE WHEN u.branchId IS NULL THEN 1 ELSE 0 END) > 0 
    THEN '❌ Some LOs have no branch - they will see ALL customers'
    ELSE '✅ All LOs have branches assigned'
  END as result
FROM users u
JOIN user_roles ur ON ur.userId = u.id
JOIN roles r ON r.id = ur.roleId
WHERE r.code = 'LOAN_OFFICER'
  AND u.deletedAt IS NULL;
