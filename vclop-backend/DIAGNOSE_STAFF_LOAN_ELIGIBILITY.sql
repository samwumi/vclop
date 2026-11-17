-- DIAGNOSE: Why staff loan module is not picking up employment
-- Replace 'samwumi@gmail.com' with your email

-- Step 1: Check your user status
SELECT 
    'USER STATUS' as check_type,
    id,
    email,
    status,
    CASE 
        WHEN status = 'ACTIVE' THEN '✅ PASS'
        ELSE '❌ FAIL - User must be ACTIVE'
    END as result
FROM users 
WHERE email = 'samwumi@gmail.com';

-- Step 2: Check employment record
SELECT 
    'EMPLOYMENT RECORD' as check_type,
    ep.id,
    ep.userId,
    ep.isCurrent,
    ep.terminationDate,
    ep.salary,
    ep.submissionStatus,
    CASE 
        WHEN ep.id IS NULL THEN '❌ FAIL - No employment record found'
        WHEN ep.isCurrent = false THEN '❌ FAIL - isCurrent must be true'
        WHEN ep.terminationDate IS NOT NULL THEN '❌ FAIL - terminationDate must be NULL'
        ELSE '✅ PASS'
    END as result
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = true
WHERE u.email = 'samwumi@gmail.com';

-- Step 3: Check for active staff loans
SELECT 
    'ACTIVE LOANS CHECK' as check_type,
    COUNT(*) as active_loan_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No active loans'
        ELSE '❌ FAIL - Has active loans'
    END as result
FROM staff_loans sl
JOIN users u ON sl.userId = u.id
WHERE u.email = 'samwumi@gmail.com'
  AND sl.status IN ('ACTIVE', 'PENDING_APPROVAL', 'APPROVED');

-- Step 4: Check for overdue installments
SELECT 
    'OVERDUE CHECK' as check_type,
    COUNT(*) as overdue_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No overdue payments'
        ELSE '❌ FAIL - Has overdue payments'
    END as result
FROM staff_loan_installments sli
JOIN staff_loans sl ON sli.staffLoanId = sl.id
JOIN users u ON sl.userId = u.id
WHERE u.email = 'samwumi@gmail.com'
  AND sli.status = 'OVERDUE';

-- Step 5: Full eligibility summary
SELECT 
    u.email,
    u.status as user_status,
    ep.id as employment_id,
    ep.isCurrent,
    ep.terminationDate,
    ep.salary,
    ep.submissionStatus,
    (SELECT COUNT(*) FROM staff_loans WHERE userId = u.id AND status IN ('ACTIVE', 'PENDING_APPROVAL', 'APPROVED')) as active_loans,
    (SELECT COUNT(*) FROM staff_loan_installments sli 
     JOIN staff_loans sl ON sli.staffLoanId = sl.id 
     WHERE sl.userId = u.id AND sli.status = 'OVERDUE') as overdue_count,
    CASE 
        WHEN u.status != 'ACTIVE' THEN '❌ User not ACTIVE'
        WHEN ep.id IS NULL THEN '❌ No employment record'
        WHEN ep.isCurrent = false THEN '❌ Employment not current'
        WHEN ep.terminationDate IS NOT NULL THEN '❌ Employment terminated'
        WHEN (SELECT COUNT(*) FROM staff_loans WHERE userId = u.id AND status IN ('ACTIVE', 'PENDING_APPROVAL', 'APPROVED')) > 0 THEN '❌ Has active loans'
        WHEN (SELECT COUNT(*) FROM staff_loan_installments sli JOIN staff_loans sl ON sli.staffLoanId = sl.id WHERE sl.userId = u.id AND sli.status = 'OVERDUE') > 0 THEN '❌ Has overdue payments'
        ELSE '✅ ELIGIBLE FOR STAFF LOAN'
    END as eligibility_status
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = true
WHERE u.email = 'samwumi@gmail.com';

-- QUICK FIX: If everything looks good but still not working, ensure employment is current
-- RUN THIS IF NEEDED:
/*
UPDATE employment_periods 
SET isCurrent = true,
    terminationDate = NULL
WHERE userId = (SELECT id FROM users WHERE email = 'samwumi@gmail.com')
  AND id = (SELECT MAX(id) FROM employment_periods WHERE userId = (SELECT id FROM users WHERE email = 'samwumi@gmail.com'));
*/
