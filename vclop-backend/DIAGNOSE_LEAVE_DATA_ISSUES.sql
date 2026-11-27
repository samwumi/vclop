-- ============================================================================
-- DIAGNOSE LEAVE DATA ISSUES
-- Find applications with missing or invalid data
-- ============================================================================

-- Check for leave applications without leaveType
SELECT 
    '=== Applications with NULL leaveTypeId ===' AS info;
SELECT 
    id,
    applicationNumber,
    userId,
    leaveTypeId,
    status,
    createdAt
FROM LeaveApplication
WHERE leaveTypeId IS NULL
OR leaveTypeId = '';

-- Check for leave applications with invalid leaveTypeId (doesn't exist in LeaveType)
SELECT 
    '=== Applications with invalid leaveTypeId ===' AS info;
SELECT 
    la.id,
    la.applicationNumber,
    la.leaveTypeId,
    la.status
FROM LeaveApplication la
LEFT JOIN LeaveType lt ON la.leaveTypeId = lt.id
WHERE la.leaveTypeId IS NOT NULL 
AND lt.id IS NULL;

-- Check for leave applications without userId
SELECT 
    '=== Applications with NULL userId ===' AS info;
SELECT 
    id,
    applicationNumber,
    leaveTypeId,
    userId,
    status
FROM LeaveApplication
WHERE userId IS NULL
OR userId = '';

-- Check for leave applications without status
SELECT 
    '=== Applications with NULL status ===' AS info;
SELECT 
    id,
    applicationNumber,
    userId,
    leaveTypeId,
    status
FROM LeaveApplication
WHERE status IS NULL
OR status = '';

-- Check for leave balances with missing leaveType
SELECT 
    '=== Balances with NULL leaveTypeId ===' AS info;
SELECT 
    id,
    employeeId,
    leaveTypeId,
    year
FROM LeaveBalance
WHERE leaveTypeId IS NULL
OR leaveTypeId = '';

-- Summary
SELECT 
    '=== SUMMARY ===' AS info;
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN leaveTypeId IS NULL THEN 1 END) as missing_leaveType,
    COUNT(CASE WHEN userId IS NULL THEN 1 END) as missing_user,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status
FROM LeaveApplication;
