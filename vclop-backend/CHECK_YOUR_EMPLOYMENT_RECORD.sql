-- CHECK YOUR EMPLOYMENT RECORD
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- 1. Find your employment record
SELECT 
  ep.id,
  ep.userId,
  CONCAT(u.firstName, ' ', u.lastName) AS your_name,
  u.email,
  ep.jobTitle,
  ep.isCurrent,
  ep.submissionStatus,
  ep.isEditable,
  d.name AS department,
  b.name AS branch,
  ep.hireDate,
  ep.createdAt
FROM employment_periods ep
JOIN users u ON u.id = ep.userId
LEFT JOIN departments d ON d.id = ep.departmentId
LEFT JOIN branches b ON b.id = ep.branchId
WHERE u.email = 'YOUR_EMAIL_HERE'
ORDER BY ep.createdAt DESC;

-- 2. Check if isCurrent is false (0 in MySQL means false)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No employment record found'
    WHEN COUNT(*) > 0 AND SUM(CASE WHEN ep.isCurrent = 1 THEN 1 ELSE 0 END) = 0 THEN '⚠️ Record exists but isCurrent is FALSE - THIS IS THE PROBLEM'
    WHEN COUNT(*) > 0 AND SUM(CASE WHEN ep.isCurrent = 1 THEN 1 ELSE 0 END) > 0 THEN '✅ Record exists and isCurrent is TRUE - should work'
    ELSE 'Unknown status'
  END AS diagnosis,
  COUNT(*) AS total_records,
  SUM(CASE WHEN ep.isCurrent = 1 THEN 1 ELSE 0 END) AS current_records,
  SUM(CASE WHEN ep.isCurrent = 0 THEN 1 ELSE 0 END) AS not_current_records
FROM employment_periods ep
JOIN users u ON u.id = ep.userId
WHERE u.email = 'YOUR_EMAIL_HERE';

-- 3. Fix if isCurrent is false (0)
-- UNCOMMENT THESE LINES TO FIX:
-- UPDATE employment_periods ep
-- JOIN users u ON u.id = ep.userId
-- SET ep.isCurrent = 1
-- WHERE u.email = 'YOUR_EMAIL_HERE'
--   AND ep.isCurrent = 0;
-- 
-- SELECT '✅ FIXED! Refresh your browser and check My Employment page' AS result;
