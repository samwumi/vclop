-- ============================================================================
-- COMPLETE LEAVE SYSTEM DIAGNOSTIC
-- Check all data and find why nothing is showing
-- ============================================================================

-- Step 1: Check leave applications
SELECT '=== LEAVE APPLICATIONS ===' as info;

SELECT 
  la.applicationNumber,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  lt.name as leave_type,
  la.status,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.submittedAt,
  la.approvedAt
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
ORDER BY la.createdAt DESC
LIMIT 10;

-- Step 2: Check leave entitlements for 2026
SELECT '=== 2026 ENTITLEMENTS SAMPLE ===' as info;

SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as employee,
  lt.name as leave_type,
  le.year,
  le.allocatedDays,
  le.usedDays,
  le.carryForwardDays,
  le.adjustmentDays,
  (le.allocatedDays + le.carryForwardDays + le.adjustmentDays - le.usedDays) as remaining
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
  AND u.email = 'samwumi91@gmail.com'
ORDER BY lt.name;

-- Step 3: Check API endpoint data - what getMyApplications returns
SELECT '=== MY APPLICATIONS DATA (samwumi91@gmail.com) ===' as info;

SELECT 
  la.id,
  la.applicationNumber,
  la.status,
  lt.name as leaveTypeName,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.reason,
  la.submittedAt,
  la.approvedAt,
  la.createdAt
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
WHERE u.email = 'samwumi91@gmail.com'
ORDER BY la.createdAt DESC;

-- Step 4: Check leave balance calculation
SELECT '=== LEAVE BALANCE FOR samwumi91@gmail.com ===' as info;

SELECT 
  lt.name as leave_type,
  le.allocatedDays as entitled,
  le.carryForwardDays as carried_forward,
  le.adjustmentDays as adjustments,
  le.usedDays as used,
  (le.allocatedDays + le.carryForwardDays + le.adjustmentDays) as total_available,
  (SELECT COALESCE(SUM(la2.businessDaysRequested), 0)
   FROM leave_applications la2
   WHERE la2.userId = le.userId
     AND la2.leaveTypeId = le.leaveTypeId
     AND la2.status = 'PENDING_APPROVAL'
     AND YEAR(la2.startDate) = le.year) as pending,
  (le.allocatedDays + le.carryForwardDays + le.adjustmentDays - le.usedDays -
   (SELECT COALESCE(SUM(la2.businessDaysRequested), 0)
    FROM leave_applications la2
    WHERE la2.userId = le.userId
      AND la2.leaveTypeId = le.leaveTypeId
      AND la2.status = 'PENDING_APPROVAL'
      AND YEAR(la2.startDate) = le.year)) as remaining
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE u.email = 'samwumi91@gmail.com'
  AND le.year = 2026
ORDER BY lt.name;

-- Step 5: Check approval records
SELECT '=== PENDING APPROVALS ===' as info;

SELECT 
  la.applicationNumber,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  lt.name as leave_type,
  lap.status as approval_status,
  CONCAT(approver.firstName, ' ', approver.lastName) as approver,
  lap.requestedAt
FROM leave_approvals lap
JOIN leave_applications la ON lap.leaveApplicationId = la.id
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
JOIN users approver ON lap.approverId = approver.id
WHERE lap.status = 'PENDING'
ORDER BY lap.requestedAt DESC
LIMIT 10;

-- Step 6: Check counts by status
SELECT '=== APPLICATION COUNTS BY STATUS ===' as info;

SELECT 
  status,
  COUNT(*) as count,
  SUM(businessDaysRequested) as total_days
FROM leave_applications
GROUP BY status
ORDER BY status;

-- Step 7: Check who has permissions
SELECT '=== USERS WITH LEAVE PERMISSIONS ===' as info;

SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as user_name,
  u.email,
  GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ', ') as permissions
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN role_permissions rp ON ur.roleId = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE p.code LIKE 'leaves:%'
  AND u.status = 'ACTIVE'
GROUP BY u.id, u.firstName, u.lastName, u.email
ORDER BY u.firstName, u.lastName
LIMIT 20;
