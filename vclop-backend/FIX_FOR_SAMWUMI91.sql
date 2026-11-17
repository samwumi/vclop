-- FIX for samwumi91@gmail.com

-- Step 1: Fix the employment record
UPDATE employment_periods 
SET isCurrent = 1, terminationDate = NULL 
WHERE userId = (SELECT id FROM users WHERE email = 'samwumi91@gmail.com') 
ORDER BY createdAt DESC 
LIMIT 1;

-- Step 2: Verify it worked
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
        ELSE '✅ FIXED - Refresh browser now!'
    END as status
FROM users u
LEFT JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = 1
WHERE u.email = 'samwumi91@gmail.com';
