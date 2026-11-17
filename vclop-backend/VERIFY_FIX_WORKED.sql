-- After running the fix, verify it worked
SELECT 
    u.email,
    u.status,
    ep.id,
    ep.isCurrent,
    ep.terminationDate,
    ep.salary,
    CASE 
        WHEN ep.id IS NULL THEN '❌ NO EMPLOYMENT RECORD'
        WHEN ep.isCurrent != 1 THEN '❌ isCurrent is not 1'
        WHEN ep.terminationDate IS NOT NULL THEN '❌ Has termination date'
        ELSE '✅ SHOULD WORK NOW'
    END as status
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = 1
WHERE u.email = 'samwumi@gmail.com';
