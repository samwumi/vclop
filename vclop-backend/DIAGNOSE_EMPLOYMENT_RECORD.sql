-- DIAGNOSE WHY EMPLOYMENT RECORD NOT SHOWING
-- Run this to check if your employment record exists and is configured correctly

-- 1. Check all employment periods (last 10 created)
SELECT 
  ep.id,
  ep."userId",
  u."firstName" || ' ' || u."lastName" AS employee_name,
  u.email,
  ep."jobTitle",
  ep."isCurrent",
  ep."submissionStatus",
  ep."isEditable",
  ep."createdAt"
FROM "EmploymentPeriod" ep
JOIN "User" u ON u.id = ep."userId"
ORDER BY ep."createdAt" DESC
LIMIT 10;

-- 2. Check your specific employment record (replace YOUR_EMAIL with your actual email)
SELECT 
  ep.id,
  ep."userId",
  u."firstName" || ' ' || u."lastName" AS employee_name,
  u.email,
  ep."jobTitle",
  ep."isCurrent",
  ep."submissionStatus",
  ep."isEditable",
  ep."periodNumber",
  d.name AS department,
  b.name AS branch,
  ep."createdAt"
FROM "EmploymentPeriod" ep
JOIN "User" u ON u.id = ep."userId"
LEFT JOIN "Department" d ON d.id = ep."departmentId"
LEFT JOIN "Branch" b ON b.id = ep."branchId"
WHERE u.email = 'YOUR_EMAIL_HERE'  -- REPLACE THIS
ORDER BY ep."periodNumber" DESC;

-- 3. Count guarantors for your employment record
SELECT 
  ep.id AS employment_id,
  u.email,
  COUNT(eg.id) AS guarantor_count
FROM "EmploymentPeriod" ep
JOIN "User" u ON u.id = ep."userId"
LEFT JOIN "EmployeeGuarantor" eg ON eg."employmentPeriodId" = ep.id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- REPLACE THIS
GROUP BY ep.id, u.email;

-- 4. Count next of kin for your employment record
SELECT 
  ep.id AS employment_id,
  u.email,
  COUNT(nok.id) AS next_of_kin_count
FROM "EmploymentPeriod" ep
JOIN "User" u ON u.id = ep."userId"
LEFT JOIN "EmployeeNextOfKin" nok ON nok."employmentPeriodId" = ep.id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- REPLACE THIS
GROUP BY ep.id, u.email;

-- 5. Fix if record exists but isCurrent is false
-- UNCOMMENT THESE LINES AFTER CONFIRMING YOUR RECORD EXISTS:
-- UPDATE "EmploymentPeriod" ep
-- SET "isCurrent" = true
-- FROM "User" u
-- WHERE u.id = ep."userId" 
--   AND u.email = 'YOUR_EMAIL_HERE'  -- REPLACE THIS
--   AND ep."isCurrent" = false;
