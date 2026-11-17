-- QUICK CHECK: Staff Loan Eligibility for samwumi@gmail.com
-- Run this single query to see all the requirements

SELECT 
    u.email,
    u.status as user_status,
    ep.id as employment_id,
    ep.isCurrent,
    ep.terminationDate,
    ep.salary,
    CASE 
        WHEN u.status != 'ACTIVE' THEN '❌ User not ACTIVE'
        WHEN ep.id IS NULL THEN '❌ No employment record found'
        WHEN ep.isCurrent = false THEN '❌ Employment not marked as current'
        WHEN ep.terminationDate IS NOT NULL THEN '❌ Employment has termination date'
        ELSE '✅ ELIGIBLE'
    END as eligibility_status,
    CASE 
        WHEN ep.id IS NULL THEN 'Create employment record from MyEmploymentPage'
        WHEN ep.isCurrent = false THEN 'Run: UPDATE employment_periods SET isCurrent = true WHERE id = ''' || ep.id || ''';'
        WHEN ep.terminationDate IS NOT NULL THEN 'Run: UPDATE employment_periods SET terminationDate = NULL WHERE id = ''' || ep.id || ''';'
        ELSE 'All good! Refresh staff loan page.'
    END as fix_instructions
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId
WHERE u.email = 'samwumi@gmail.com'
ORDER BY ep.createdAt DESC
LIMIT 1;
