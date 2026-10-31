-- Assign the loan application to Kalmadeen Olumide (Loan Officer)
-- This fixes the issue where admin submitted on behalf of LO

-- Step 1: Find Kalmadeen Olumide's user ID
SELECT 
    id,
    username,
    firstName,
    lastName,
    email
FROM users
WHERE (firstName LIKE '%Kamaldeen%' OR firstName LIKE '%Olumide%' 
    OR lastName LIKE '%Kamaldeen%' OR lastName LIKE '%Olumide%')
  AND deletedAt IS NULL;

-- Step 2: Find the most recent application(s) that need to be reassigned
-- (applications where admin is assigned but should be assigned to LO)
SELECT 
    la.id,
    la.applicationNumber,
    la.status,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    la.assignedToId,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS currently_assigned_to,
    la.submittedById,
    CONCAT(submitted.firstName, ' ', submitted.lastName) AS submitted_by,
    la.createdAt
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
LEFT JOIN users submitted ON la.submittedById = submitted.id
WHERE la.deletedAt IS NULL
  AND la.status IN ('COMPLIANCE_REVIEW', 'AWAITING_INFORMATION', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED')
ORDER BY la.createdAt DESC
LIMIT 5;

-- Step 3: Update the application to assign it to Kalmadeen
-- First, get Kalmadeen's ID and the application ID in separate variables
SET @kalmadeen_id = (
    SELECT u.id 
    FROM users u
    WHERE (u.firstName LIKE '%Kalmadeen%' OR u.firstName LIKE '%Olumide%')
      AND u.deletedAt IS NULL
    LIMIT 1
);

-- Show what will be updated
SELECT @kalmadeen_id AS kalmadeen_user_id;

-- Get the most recent application submitted by admin
SET @app_to_update = (
    SELECT la2.id
    FROM loan_applications la2
    JOIN users submitted ON la2.submittedById = submitted.id
    JOIN user_roles ur ON submitted.id = ur.userId
    JOIN roles r ON ur.roleId = r.id
    WHERE la2.deletedAt IS NULL
      AND r.name = 'Admin'
      AND la2.status != 'DRAFT'
    ORDER BY la2.createdAt DESC
    LIMIT 1
);

-- Show which application will be updated
SELECT @app_to_update AS application_id_to_update;

-- Now do the update
UPDATE loan_applications 
SET assignedToId = @kalmadeen_id
WHERE id = @app_to_update
  AND deletedAt IS NULL;

-- Step 4: Verify the update
SELECT 
    'AFTER UPDATE' AS status,
    la.applicationNumber,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS assigned_to,
    la.status,
    la.createdAt
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
WHERE la.deletedAt IS NULL
  AND assigned.firstName LIKE '%Kamaldeen%'
ORDER BY la.createdAt DESC
LIMIT 5;
