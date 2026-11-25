-- ============================================================================
-- DIAGNOSE LEAVE APPROVAL WORKFLOW
-- ============================================================================

-- Step 1: Check recent leave applications
SELECT 
  la.id,
  la.applicationNumber,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  u.email,
  lt.name as leave_type,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.status,
  la.submittedAt,
  la.createdAt
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
ORDER BY la.createdAt DESC
LIMIT 10;

-- Step 2: Check if approval records exist for pending applications
SELECT 
  lap.id,
  lap.leaveApplicationId,
  la.applicationNumber,
  CONCAT(approver.firstName, ' ', approver.lastName) as approver_name,
  approver.email as approver_email,
  lap.approvalLevel,
  lap.status,
  lap.decision,
  lap.decidedAt,
  lap.requestedAt,
  lap.policyVersionId
FROM leave_approvals lap
JOIN leave_applications la ON lap.leaveApplicationId = la.id
JOIN users approver ON lap.approverId = approver.id
WHERE la.status = 'PENDING_APPROVAL'
ORDER BY lap.requestedAt DESC
LIMIT 20;

-- Step 3: Check if approval policies exist
SELECT 
  ap.id,
  ap.resourceType,
  ap.level,
  ap.approverRole,
  ap.isActive,
  ap.createdAt
FROM approval_policies ap
WHERE ap.resourceType = 'leave_application'
  AND ap.isActive = 1
ORDER BY ap.level;

-- Step 4: Check which roles have leaves:approve permission
SELECT 
  r.name as role_name,
  r.code as role_code,
  COUNT(DISTINCT ur.userId) as users_with_role
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
LEFT JOIN user_roles ur ON r.id = ur.roleId
WHERE p.code = 'leaves:approve'
GROUP BY r.id, r.name, r.code
ORDER BY r.name;

-- Step 5: Check all leave-related permissions
SELECT 
  p.code,
  p.name,
  COUNT(DISTINCT rp.roleId) as roles_count,
  GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') as role_names
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permissionId
LEFT JOIN roles r ON rp.roleId = r.id
WHERE p.code LIKE 'leaves:%'
GROUP BY p.id, p.code, p.name
ORDER BY p.code;
