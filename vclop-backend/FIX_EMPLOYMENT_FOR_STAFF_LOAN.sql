-- FIX: Mark employment record as current so staff loan module can see it
-- This fixes the issue where employment exists but isCurrent = false

-- Step 1: First, set ALL other employment records to isCurrent = false (safety measure)
UPDATE employment_periods 
SET isCurrent = false
WHERE userId = (SELECT id FROM users WHERE email = 'samwumi@gmail.com');

-- Step 2: Now mark the most recent employment record as current
UPDATE employment_periods 
SET isCurrent = true,
    terminationDate = NULL
WHERE id = (
    SELECT id FROM (
        SELECT ep.id 
        FROM employment_periods ep
        JOIN users u ON ep.userId = u.id
        WHERE u.email = 'samwumi@gmail.com'
        ORDER BY ep.createdAt DESC 
        LIMIT 1
    ) AS latest
);

-- Step 3: Verify the fix worked
SELECT 
    'VERIFICATION' as status,
    u.email,
    ep.id as employment_id,
    ep.jobTitle,
    ep.salary,
    ep.isCurrent,
    ep.terminationDate,
    CASE 
        WHEN ep.isCurrent = true AND ep.terminationDate IS NULL THEN '✅ FIXED - Staff loan should work now!'
        ELSE '❌ Still has issues'
    END as result
FROM users u
JOIN employment_periods ep ON u.id = ep.userId AND ep.isCurrent = true
WHERE u.email = 'samwumi@gmail.com';
