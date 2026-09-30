-- Give accthead full view access by assigning customers:manage permission
-- This is the most direct solution

-- Find accthead user ID
SET @accthead_id = (SELECT id FROM users WHERE username = 'accthead' LIMIT 1);

-- Find customers:manage permission ID
SET @manage_perm_id = (SELECT id FROM permissions WHERE code = 'customers:manage' LIMIT 1);

-- Give accthead the customers:manage permission directly (not through role)
INSERT INTO user_permissions (userId, permissionId, granted, grantedById, expiresAt)
VALUES (@accthead_id, @manage_perm_id, 1, @accthead_id, NULL)
ON DUPLICATE KEY UPDATE granted = 1;

-- Verify
SELECT 
  u.username,
  p.code as permission_code,
  up.granted
FROM users u
JOIN user_permissions up ON up.userId = u.id
JOIN permissions p ON p.id = up.permissionId
WHERE u.username = 'accthead';

SELECT '✅ accthead now has customers:manage permission' AS status;
SELECT 'Have accthead LOG OUT and LOG BACK IN to refresh permissions' AS action_required;
