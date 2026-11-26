-- ============================================================================
-- DIAGNOSE APPROVED LEAVE - Why is nothing showing?
-- ============================================================================

-- Step 1: Check the leave application status
SELECT 
  '=== LEAVE APPLICATION DETAILS ===' as info;

SELECT 
  la.id,
  la.applicationNumber,
  la.status,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  lt.name as leave_type,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.submittedAt,
  la.approvedAt,
  la.approvedById,
  CONCAT(approver.firstName, ' ', approver.lastName) as approved_by
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
LEFT JOIN users approver ON la.approvedById = approver.id
ORDER BY la.createdAt DESC
LIMIT 10;

-- Step 2: Check the approval records
SELECT 
  '=== APPROVAL RECORDS ===' as info;

SELECT 
  lap.id,
  la.applicationNumber,
  lap.status as approval_status,
  lap.decision,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  CONCAT(approver.firstName, ' ', approver.lastName) as approver,
  lap.requestedAt,
  lap.decidedAt,
  lap.comments
FROM leave_approvals lap
JOIN leave_applications la ON lap.leaveApplicationId = la.id
JOIN users u ON la.userId = u.id
JOIN users approver ON lap.approverId = approver.id
ORDER BY lap.requestedAt DESC
LIMIT 10;

-- Step 3: Check leave balances - were days deducted?
SELECT 
  '=== LEAVE BALANCES (ENTITLEMENTS) ===' as info;

SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as employee,
  lt.name as leave_type,
  le.year,
  le.entitledDays,
  le.usedDays,
  (le.entitledDays + COALESCE(le.carriedForwardDays, 0) + COALESCE(le.adjustmentDays, 0) - le.usedDays) as remaining_days,
  le.updatedAt as last_updated
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = YEAR(CURDATE())
  AND le.usedDays > 0
ORDER BY le.updatedAt DESC
LIMIT 10;

-- Step 4: Check if there are any APPROVED leaves
SELECT 
  '=== COUNT OF LEAVES BY STATUS ===' as info;

SELECT 
  status,
  COUNT(*) as count
FROM leave_applications
GROUP BY status
ORDER BY status;

-- Step 5: Check specific user's leaves (replace with actual userId)
SELECT 
  '=== MY LEAVES (for samwumi91@gmail.com) ===' as info;

SELECT 
  la.applicationNumber,
  la.status,
  lt.name as leave_type,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.submittedAt,
  la.approvedAt
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
WHERE u.email = 'samwumi91@gmail.com'
ORDER BY la.createdAt DESC;

-- Step 6: Check API endpoint data format
SELECT 
  '=== DATA FOR MY-APPLICATIONS ENDPOINT ===' as info;

SELECT 
  la.id,
  la.applicationNumber,
  la.status,
  la.leaveTypeId,
  lt.name as leaveTypeName,
  la.startDate,
  la.endDate,
  la.businessDaysRequested,
  la.reason,
  la.submittedAt,
  la.approvedAt
FROM leave_applications la
JOIN users u ON la.userId = u.id
JOIN leave_types lt ON la.leaveTypeId = lt.id
WHERE u.email = 'samwumi91@gmail.com'
ORDER BY la.createdAt DESC;
