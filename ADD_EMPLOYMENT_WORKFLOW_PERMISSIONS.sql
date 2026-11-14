-- Add Employment Workflow Permissions
-- Run this on Hostinger database

-- Insert new permissions
INSERT INTO `permissions` (`id`, `code`, `name`, `description`, `category`, `module`, `action`, `isSystem`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
  (UUID(), 'employees:submit', 'Submit Employment Data', 'Submit employment data for HR review', 'HR', 'employees', 'submit', 0, 1, 100, NOW(), NOW()),
  (UUID(), 'employees:review', 'Review Employment Submissions', 'Review pending employment submissions', 'HR', 'employees', 'review', 0, 1, 101, NOW(), NOW()),
  (UUID(), 'employees:approve', 'Approve Employment', 'Approve employment submissions', 'HR', 'employees', 'approve', 0, 1, 102, NOW(), NOW()),
  (UUID(), 'employees:reject', 'Reject Employment', 'Reject employment submissions', 'HR', 'employees', 'reject', 0, 1, 103, NOW(), NOW()),
  (UUID(), 'employees:grant_edit', 'Grant Edit Rights', 'Grant edit rights to approved employment', 'HR', 'employees', 'grant_edit', 0, 1, 104, NOW(), NOW());

-- Verify permissions were created
SELECT * FROM permissions WHERE code LIKE 'employees:%' ORDER BY sortOrder;

-- Assign submission permission to all staff (default role)
-- Note: Replace 'staff' with your actual default role code
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  (SELECT id FROM roles WHERE code = 'staff' LIMIT 1),
  id
FROM permissions 
WHERE code = 'employees:submit';

-- Assign review/approve/reject/grant_edit permissions to HR role
-- Note: Replace 'hr_staff' with your actual HR role code
INSERT INTO role_permissions (roleId, permissionId)
SELECT 
  (SELECT id FROM roles WHERE code = 'hr_staff' LIMIT 1),
  id
FROM permissions 
WHERE code IN ('employees:review', 'employees:approve', 'employees:reject', 'employees:grant_edit');

-- Verify role assignments
SELECT 
  r.code as role_code,
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM role_permissions rp
JOIN roles r ON r.id = rp.roleId
JOIN permissions p ON p.id = rp.permissionId
WHERE p.code LIKE 'employees:%'
ORDER BY r.code, p.sortOrder;
