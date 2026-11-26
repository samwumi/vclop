-- ============================================================================
-- COMPLETE FIX FOR LEAVE APPROVAL SYSTEM
-- Run this entire file to make everything work
-- ============================================================================

-- Step 1: Verify approval policy exists
SELECT 
  id,
  entityType,
  version,
  effectiveFrom,
  effectiveTo
FROM approval_policies
WHERE entityType = 'LEAVE_APPLICATION';

-- Step 2: Reset the two test leaves to PENDING status
UPDATE leave_applications 
SET status = 'PENDING_APPROVAL',
    approvedAt = NULL,
    approvedById = NULL,
    approvalNotes = NULL
WHERE applicationNumber IN ('LA2026000009', 'LA2026000007');

-- Step 3: Update approval records to PENDING
UPDATE leave_approvals
SET status = 'PENDING',
    decision = NULL,
    decidedAt = NULL,
    comments = NULL
WHERE leaveApplicationId IN (
  SELECT id FROM leave_applications 
  WHERE applicationNumber IN ('LA2026000009', 'LA2026000007')
);

-- Step 4: Verify pending approvals exist
SELECT 
  la.applicationNumber,
  la.status as app_status,
  lap.status as approval_status,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  lt.name as leave_type,
  CONCAT(approver.firstName, ' ', approver.lastName) as approver_name,
  approver.email as approver_email
FROM leave_applications la
JOIN leave_approvals lap ON la.id = lap.leaveApplicationId
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
JOIN users approver ON lap.approverId = approver.id
WHERE lap.status = 'PENDING'
ORDER BY la.createdAt DESC;

-- Step 5: Grant leaves:approve permission to ALL admin users
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

-- Step 6: Verify YOUR user has the permission (replace email with yours)
SELECT 
  u.id,
  u.email,
  u.firstName,
  u.lastName,
  r.name as role_name,
  p.code as permission_code
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE u.email = 'samwumi91@gmail.com'
  AND p.code IN ('leaves:read', 'leaves:approve')
ORDER BY p.code;

-- Step 7: Final verification - show all data needed for the page
SELECT 
  'PENDING APPROVALS' as section,
  COUNT(*) as count
FROM leave_approvals
WHERE status = 'PENDING'

UNION ALL

SELECT 
  'PENDING APPLICATIONS' as section,
  COUNT(*) as count
FROM leave_applications
WHERE status = 'PENDING_APPROVAL'

UNION ALL

SELECT 
  'USERS WITH APPROVE PERMISSION' as section,
  COUNT(DISTINCT u.id) as count
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'leaves:approve'
  AND u.status = 'ACTIVE';

-- Step 8: Show the exact data the API will return
SELECT 
  lap.id as approval_id,
  lap.status as approval_status,
  la.id as application_id,
  la.applicationNumber,
  la.status as app_status,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  u.email as applicant_email,
  lt.name as leave_type,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.reason,
  CONCAT(approver.firstName, ' ', approver.lastName) as approver,
  approver.email as approver_email,
  lap.requestedAt
FROM leave_approvals lap
JOIN leave_applications la ON lap.leaveApplicationId = la.id
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
JOIN users approver ON lap.approverId = approver.id
WHERE lap.status = 'PENDING'
ORDER BY lap.requestedAt ASC;
