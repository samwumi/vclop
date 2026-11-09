-- Add users:read permission to Accounting Officers so they can see officer dropdown
-- The backend filters users by branch, so accounting officers only see officers in their location
-- MySQL/MariaDB version

-- Add permission to Accounting Officer role
INSERT IGNORE INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  r.id as roleId,
  p.id as permissionId
FROM `Role` r
CROSS JOIN `Permission` p
WHERE r.name = 'Accounting Officer'
  AND p.code = 'users:read';

-- Add permission to Accounting Head role
INSERT IGNORE INTO `RolePermission` (`roleId`, `permissionId`)
SELECT 
  r.id as roleId,
  p.id as permissionId
FROM `Role` r
CROSS JOIN `Permission` p
WHERE r.name IN ('Accounting Head', 'Head of Accounting')
  AND p.code = 'users:read';

-- Verify the changes
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description
FROM `Role` r
INNER JOIN `RolePermission` rp ON rp.roleId = r.id
INNER JOIN `Permission` p ON p.id = rp.permissionId
WHERE r.name LIKE '%accounting%'
  AND p.code = 'users:read';
