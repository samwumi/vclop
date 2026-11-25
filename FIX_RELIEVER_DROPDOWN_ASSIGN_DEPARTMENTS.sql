-- ============================================================
-- FIX: Reliever Dropdown Empty - Assign Departments to Users
-- ============================================================
-- The reliever dropdown is empty because users don't have departments.
-- This SQL assigns all users to their appropriate departments.

-- Step 1: Check which users have NO department
SELECT 
  id,
  CONCAT(firstName, ' ', lastName) as name,
  email,
  jobTitle,
  branchId,
  departmentId
FROM users
WHERE deletedAt IS NULL 
  AND status = 'ACTIVE'
  AND departmentId IS NULL
ORDER BY lastName, firstName;

-- Step 2: See all available departments
SELECT 
  id,
  name,
  code,
  description
FROM departments
WHERE deletedAt IS NULL
ORDER BY name;

-- Step 3: Assign users to departments based on their role/job
-- MODIFY THE DEPARTMENT IDs BELOW TO MATCH YOUR ACTUAL DEPARTMENT IDs

-- Example assignments (UPDATE WITH YOUR ACTUAL DEPARTMENT IDs):

-- Assign all Loan Officers to Credit/Lending department
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE code = 'CREDIT' LIMIT 1)
WHERE jobTitle LIKE '%Loan Officer%'
  AND departmentId IS NULL
  AND deletedAt IS NULL;

-- Assign accounting staff to Finance department
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE code = 'FINANCE' OR name LIKE '%Finance%' OR name LIKE '%Accounting%' LIMIT 1)
WHERE (jobTitle LIKE '%Account%' OR jobTitle LIKE '%Finance%')
  AND departmentId IS NULL
  AND deletedAt IS NULL;

-- Assign HR staff to HR department
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE code = 'HR' OR name LIKE '%Human%' OR name LIKE '%HR%' LIMIT 1)
WHERE jobTitle LIKE '%HR%'
  AND departmentId IS NULL
  AND deletedAt IS NULL;

-- Assign compliance staff to Compliance department
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE code = 'COMPLIANCE' OR name LIKE '%Compliance%' LIMIT 1)
WHERE jobTitle LIKE '%Compliance%'
  AND departmentId IS NULL
  AND deletedAt IS NULL;

-- Assign operations staff to Operations department
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE code = 'OPS' OR name LIKE '%Operation%' LIMIT 1)
WHERE jobTitle LIKE '%Operation%'
  AND departmentId IS NULL
  AND deletedAt IS NULL;

-- Assign IT staff to IT/Technology department
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE code = 'IT' OR name LIKE '%Technology%' OR name LIKE '%IT%' LIMIT 1)
WHERE (jobTitle LIKE '%IT%' OR jobTitle LIKE '%Tech%' OR jobTitle LIKE '%Developer%')
  AND departmentId IS NULL
  AND deletedAt IS NULL;

-- Step 4: Assign remaining users to a default department (e.g., General/Admin)
-- If you have a "General" or "Administration" department:
UPDATE users 
SET departmentId = (SELECT id FROM departments WHERE name LIKE '%General%' OR name LIKE '%Admin%' LIMIT 1)
WHERE departmentId IS NULL
  AND deletedAt IS NULL
  AND status = 'ACTIVE';

-- Step 5: Verify all users now have departments
SELECT 
  COUNT(*) as users_without_department
FROM users
WHERE deletedAt IS NULL 
  AND status = 'ACTIVE'
  AND departmentId IS NULL;
-- Should return 0

-- Step 6: Check department distribution
SELECT 
  d.name as department,
  COUNT(u.id) as user_count
FROM departments d
LEFT JOIN users u ON d.id = u.departmentId 
  AND u.deletedAt IS NULL 
  AND u.status = 'ACTIVE'
WHERE d.deletedAt IS NULL
GROUP BY d.id, d.name
ORDER BY user_count DESC, d.name;
