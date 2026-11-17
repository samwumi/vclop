-- This is EXACTLY what the backend code checks
-- Run this to see what the backend sees

SELECT 
    'What backend sees:' as info,
    u.id as user_id,
    u.status as user_status,
    ep.id as employment_id,
    ep.isCurrent,
    ep.terminationDate,
    ep.salary,
    -- What the eligibility check needs:
    CASE WHEN u.status = 'ACTIVE' THEN '✅' ELSE '❌' END as user_active,
    CASE WHEN ep.id IS NOT NULL THEN '✅' ELSE '❌' END as has_employment,
    CASE WHEN ep.isCurrent = 1 THEN '✅' ELSE '❌' END as is_current,
    CASE WHEN ep.terminationDate IS NULL THEN '✅' ELSE '❌' END as not_terminated
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = 1 AND ep.terminationDate IS NULL
WHERE u.email = 'samwumi91@gmail.com';
