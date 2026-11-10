-- Check what roles a specific user has
-- Replace with the actual email you're testing with

SET @user_email = 'YOUR_EMAIL@example.com';  -- CHANGE THIS!

-- Show user's assigned roles
SELECT 
  u.id as user_id,
  u.email,
  u.firstName,
  u.lastName,
  r.id as role_id,
  r.name as role_name,
  r.code as role_code,
  ur.expiresAt
FROM `users` u
LEFT JOIN `user_roles` ur ON ur.userId = u.id
LEFT JOIN `roles` r ON r.id = ur.roleId
WHERE u.email = @user_email;

-- If user has no roles, this will help identify them
SELECT 
  id,
  email,
  firstName,
  lastName,
  status,
  branchId
FROM `users`
WHERE email = @user_email;
