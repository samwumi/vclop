-- Tables already exist, skip creation

-- Insert default approval policy
INSERT IGNORE INTO `approval_policies` (
  `id`,
  `entityType`,
  `version`,
  `levels`,
  `effectiveFrom`,
  `effectiveTo`,
  `createdById`,
  `notes`
) 
SELECT 
  UUID(),
  'LEAVE_APPLICATION',
  1,
  JSON_OBJECT(
    'levels', JSON_ARRAY(
      JSON_OBJECT(
        'level', 1,
        'name', 'Manager Approval',
        'selectionCriteria', JSON_OBJECT('type', 'SUPERVISOR'),
        'escalationHours', 48
      )
    )
  ),
  '2026-01-01',
  NULL,
  (SELECT id FROM users WHERE email = 'samwumi91@gmail.com' LIMIT 1),
  'All leave applications require supervisor approval'
WHERE NOT EXISTS (SELECT 1 FROM approval_policies WHERE entityType = 'LEAVE_APPLICATION');

-- Insert Leave of Absence type if not exists
INSERT IGNORE INTO `leave_types` (
  `id`,
  `name`,
  `code`,
  `description`,
  `defaultDaysPerYear`,
  `carryForwardAllowed`,
  `maxCarryForwardDays`,
  `requiresApproval`,
  `minNoticeDays`,
  `maxConsecutiveDays`,
  `allowHalfDay`,
  `prorateForMidYearJoiners`,
  `countWeekendsAsLeave`,
  `countHolidaysAsLeave`,
  `isActive`,
  `sortOrder`,
  `createdAt`
) VALUES (
  UUID(),
  'Leave of Absence',
  'LOA',
  'Extended leave for personal, medical, or other approved reasons beyond regular leave types',
  0,
  0,
  NULL,
  1,
  7,
  365,
  0,
  0,
  1,
  1,
  1,
  5,
  NOW()
);

-- Create entitlements for Leave of Absence for all active users
INSERT IGNORE INTO `leave_entitlements` (
  `id`, 
  `userId`, 
  `leaveTypeId`, 
  `year`, 
  `allocatedDays`, 
  `carryForwardDays`, 
  `adjustmentDays`, 
  `usedDays`,
  `createdAt`, 
  `updatedAt`, 
  `createdById`
)
SELECT 
  UUID(), 
  u.id, 
  lt.id, 
  2026, 
  0,
  0, 
  0, 
  0,
  NOW(), 
  NOW(), 
  u.id
FROM users u 
CROSS JOIN leave_types lt
WHERE u.deletedAt IS NULL 
  AND u.status = 'ACTIVE' 
  AND lt.code = 'LOA'
  AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements le 
    WHERE le.userId = u.id 
      AND le.leaveTypeId = lt.id 
      AND le.year = 2026
  );

-- Grant leave permissions to all staff roles
INSERT IGNORE INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`)
SELECT DISTINCT 
  UUID(), 
  ur.roleId, 
  p.id, 
  NOW()
FROM user_roles ur
CROSS JOIN permissions p
WHERE p.code IN ('leaves:read', 'leaves:create', 'leaves:update', 'leaves:delete', 'leaves:approve')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.roleId = ur.roleId AND rp.permissionId = p.id
  );
