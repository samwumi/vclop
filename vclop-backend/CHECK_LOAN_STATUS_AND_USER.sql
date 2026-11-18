-- Check current loan status and who owns it
SELECT 
  sl.id,
  sl.loanNumber,
  sl.status,
  sl.requestedAmount,
  sl.userId as loan_owner_id,
  u.email as loan_owner_email,
  u.firstName,
  u.lastName,
  sl.createdAt,
  sl.submittedAt,
  sl.reviewedAt
FROM staff_loans sl
INNER JOIN users u ON sl.userId = u.id
WHERE u.email = 'samwumi91@gmail.com'
ORDER BY sl.createdAt DESC
LIMIT 1;

-- Check if you're logged in as the same user
-- Replace with your actual logged-in email to test
SELECT 
  id as current_user_id,
  email as current_user_email,
  firstName,
  lastName
FROM users 
WHERE email = 'samwumi91@gmail.com';

-- Check if you have staff_loans:approve permission
SELECT 
  u.email,
  u.firstName,
  u.lastName,
  r.name as role_name,
  p.resource,
  p.action,
  CONCAT(p.resource, ':', p.action) as permission
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
INNER JOIN roles r ON ur.roleId = r.id
INNER JOIN role_permissions rp ON r.id = rp.roleId
INNER JOIN permissions p ON rp.permissionId = p.id
WHERE u.email = 'samwumi91@gmail.com'
  AND p.resource = 'staff_loans'
  AND p.action = 'approve'
ORDER BY r.name, permission;
