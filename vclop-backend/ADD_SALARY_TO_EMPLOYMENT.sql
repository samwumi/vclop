-- Add salary to samwumi91@gmail.com's employment record
-- This is required for staff loan application

UPDATE employment_periods 
SET salary = 100000  -- Set your actual monthly salary here
WHERE userId = (SELECT id FROM users WHERE email = 'samwumi91@gmail.com')
  AND isCurrent = 1;

-- Verify the update
SELECT 
    ep.id,
    u.email,
    ep.isCurrent,
    ep.terminationDate,
    ep.salary,
    ep.jobTitle,
    ep.hireDate
FROM employment_periods ep
INNER JOIN users u ON ep.userId = u.id
WHERE u.email = 'samwumi91@gmail.com';
