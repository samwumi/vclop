-- ============================================================================
-- CREATE LEAVE APPROVAL POLICY
-- Staff leaves require manager/supervisor approval
-- ============================================================================

-- Step 1: Create approval policy
INSERT INTO approval_policies (
  id,
  entityType,
  version,
  levels,
  effectiveFrom,
  effectiveTo,
  createdAt,
  updatedAt,
  createdById
) VALUES (
  UUID(),
  'LEAVE_APPLICATION',
  1,
  JSON_OBJECT(
    'levels', JSON_ARRAY(
      JSON_OBJECT(
        'level', 1,
        'name', 'Manager Approval',
        'selectionCriteria', JSON_OBJECT(
          'type', 'SUPERVISOR'
        ),
        'escalationHours', 48
      )
    )
  ),
  '2026-01-01',
  NULL,
  NOW(),
  NOW(),
  (SELECT id FROM users WHERE email = 'samwumi91@gmail.com' LIMIT 1)
);

-- Step 2: Verify policy was created
SELECT 
  id,
  entityType,
  version,
  levels,
  effectiveFrom,
  effectiveTo,
  createdAt
FROM approval_policies
WHERE entityType = 'LEAVE_APPLICATION';

-- Step 3: Grant leaves:approve permission to managers/supervisors
-- Add permission if it doesn't exist
INSERT IGNORE INTO permissions (id, code, name, description, category, module, action, createdAt, updatedAt)
VALUES (
  UUID(),
  'leaves:approve',
  'Approve Leave Applications',
  'Can approve or reject staff leave applications',
  'WORKFLOW',
  'hr',
  'approve',
  NOW(),
  NOW()
);

-- Grant to all roles that should approve leaves
INSERT IGNORE INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT 
  UUID(),
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'leaves:approve'
  AND r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'SUPERVISOR', 'TEAM_LEAD')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.roleId = r.id AND rp.permissionId = p.id
  );

-- Step 4: Verify permissions were granted
SELECT 
  r.name as role_name,
  r.code as role_code,
  p.code as permission_code,
  COUNT(DISTINCT ur.userId) as users_count
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
LEFT JOIN user_roles ur ON r.id = ur.roleId
WHERE p.code = 'leaves:approve'
GROUP BY r.id, r.name, r.code, p.code
ORDER BY r.name;
