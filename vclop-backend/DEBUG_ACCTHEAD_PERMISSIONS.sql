-- DEBUG: Check accthead's permissions
-- Run this to see what permissions accthead actually has

-- 1. Find the accthead user
SELECT 
  u.id,
  u.username,
  u.email,
  u.status,
  u."branchId",
  r.name as role_name,
  r.code as role_code
FROM "User" u
LEFT JOIN "UserRole" ur ON ur."userId" = u.id
LEFT JOIN "Role" r ON r.id = ur."roleId"
WHERE u.username = 'accthead' OR u.email LIKE '%accthead%'
ORDER BY u.username;

-- 2. Check role-based permissions for ACCOUNTING_HEAD role
SELECT 
  r.name as role_name,
  r.code as role_code,
  p.code as permission_code,
  p.name as permission_name,
  p."isActive" as permission_active
FROM "Role" r
JOIN "RolePermission" rp ON rp."roleId" = r.id
JOIN "Permission" p ON p.id = rp."permissionId"
WHERE r.code = 'ACCOUNTING_HEAD'
ORDER BY p.code;

-- 3. Check direct user permissions for accthead
SELECT 
  u.username,
  p.code as permission_code,
  p.name as permission_name,
  up.granted,
  up."expiresAt"
FROM "User" u
JOIN "UserPermission" up ON up."userId" = u.id
JOIN "Permission" p ON p.id = up."permissionId"
WHERE u.username = 'accthead' OR u.email LIKE '%accthead%'
ORDER BY p.code;

-- 4. Check if customers:read and loan_applications:read permissions exist
SELECT 
  id,
  code,
  name,
  "isActive"
FROM "Permission"
WHERE code IN ('customers:read', 'loan_applications:read', 'dashboard:read')
ORDER BY code;
