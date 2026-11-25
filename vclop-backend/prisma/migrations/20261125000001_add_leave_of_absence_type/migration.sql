-- Add Leave of Absence leave type
INSERT INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  maxConsecutiveDays,
  requiresApproval,
  requiresDocumentation,
  isPaid,
  isActive,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Leave of Absence',
  'LOA',
  'Extended leave for personal, medical, or other approved reasons beyond regular leave types',
  0,
  365,
  1,
  1,
  0,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Create entitlements for all active users
INSERT INTO leave_entitlements (
  id, 
  userId, 
  leaveTypeId, 
  year, 
  allocatedDays, 
  carryForwardDays, 
  adjustmentDays, 
  usedDays,
  createdAt, 
  updatedAt, 
  createdById
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
