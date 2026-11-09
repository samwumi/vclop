-- Add users:read permission to Accounting Officers so they can see officer dropdown
-- The backend filters users by branch, so accounting officers only see officers in their location
-- MySQL/MariaDB version

-- Add permission to Accounting Officer role
INSERT IGNORE INTO `role_permissions` (`id`, `roleId`, `permissionId`)
SELECT 
  UUID() as id,
  r.id as roleId,
  p.id as permissionId
FROM `roles` r
CROSS JOIN `permissions` p
WHERE r.name = 'Accounting Officer'
  AND p.code = 'users:read';

-- Add permission to Accounting Head role
INSERT IGNORE INTO `role_permissions` (`id`, `roleId`, `permissionId`)
SELECT 
  UUID() as id,
  r.id as roleId,
  p.id as permissionId
FROM `roles` r
CROSS JOIN `permissions` p
WHERE r.name IN ('Accounting Head', 'Head of Accounting')
  AND p.code = 'users:read';

-- Verify the changes
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description
FROM `roles` r
INNER JOIN `role_permissions` rp ON rp.roleId = r.id
INNER JOIN `permissions` p ON p.id = rp.permissionId
WHERE r.name LIKE '%accounting%'
  AND p.code = 'users:read';
