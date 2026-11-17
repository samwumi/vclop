-- Check employment record for staff loan eligibility
-- Run this in your database

-- 1. Check your employment record
SELECT 
    u.id as user_id,
    u.email,
    u.firstName,
    u.lastName,
    ep.id as employment_id,
    ep.jobTitle,
    ep.salary,
    ep.hireDate,
    ep.isCurrent,
    ep.submissionStatus,
    ep.isEditable,
    d.name as department,
    b.name as branch
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = true
LEFT JOIN departments d ON ep.departmentId = d.id
LEFT JOIN branches b ON ep.branchId = b.id
WHERE u.email = 'samwumi@gmail.com'
ORDER BY ep.createdAt DESC
LIMIT 1;

-- 2. Check staff loan eligibility check in the backend
-- The staff loan service checks for:
-- a) Current employment record (isCurrent = true)
-- b) Submission status = 'APPROVED'
-- c) Has salary set

-- 3. If employment exists but not approved, check submission status
SELECT 
    ep.id,
    ep.submissionStatus,
    ep.submittedAt,
    ep.reviewedAt,
    ep.reviewedById,
    ep.reviewNotes
FROM employment_periods ep
JOIN users u ON ep.userId = u.id
WHERE u.email = 'samwumi@gmail.com' AND ep.isCurrent = true;

-- 4. Check guarantors (needed for submission)
SELECT 
    eg.id,
    eg.firstName,
    eg.lastName,
    eg.phone,
    eg.relationship
FROM employee_guarantors eg
JOIN employment_periods ep ON eg.employmentPeriodId = ep.id
JOIN users u ON ep.userId = u.id
WHERE u.email = 'samwumi@gmail.com' AND ep.isCurrent = true;

-- 5. Check next of kin (needed for submission)
SELECT 
    nok.id,
    nok.firstName,
    nok.lastName,
    nok.phone,
    nok.relationship,
    nok.isPrimary
FROM employee_next_of_kin nok
JOIN employment_periods ep ON nok.employmentPeriodId = ep.id
JOIN users u ON ep.userId = u.id
WHERE u.email = 'samwumi@gmail.com' AND ep.isCurrent = true;

-- SOLUTIONS BASED ON WHAT YOU FIND:

-- If employment exists but submissionStatus is 'DRAFT' or 'NEEDS_REVISION':
-- You need to submit it for review from the MyEmploymentPage

-- If submissionStatus is 'SUBMITTED' or 'UNDER_REVIEW':
-- You need HR to approve it

-- If submissionStatus is 'APPROVED' but staff loan still not working:
-- Run this to manually approve (as admin):
/*
UPDATE employment_periods 
SET submissionStatus = 'APPROVED',
    reviewedAt = NOW(),
    reviewedById = (SELECT id FROM users WHERE email = 'samwumi@gmail.com' LIMIT 1)
WHERE userId = (SELECT id FROM users WHERE email = 'samwumi@gmail.com')
  AND isCurrent = true;
*/

-- If no employment record exists at all:
-- Create one from MyEmploymentPage or have HR create it from EmployeeDetailsPage
