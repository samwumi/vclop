-- Fix loan applications where admin created/submitted on behalf of LO
-- This ensures LOs can see applications they should own

-- Step 1: Check current state
SELECT 
    'BEFORE FIX' AS status,
    la.applicationNumber,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS assigned_to,
    assigned_role.name AS assigned_role,
    CONCAT(submitted.firstName, ' ', submitted.lastName) AS submitted_by,
    submitted_role.name AS submitted_role
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
LEFT JOIN user_roles assigned_ur ON assigned.id = assigned_ur.userId
LEFT JOIN roles assigned_role ON assigned_ur.roleId = assigned_role.id
LEFT JOIN users submitted ON la.submittedById = submitted.id
LEFT JOIN user_roles submitted_ur ON submitted.id = submitted_ur.userId
LEFT JOIN roles submitted_role ON submitted_ur.roleId = submitted_role.id
WHERE la.deletedAt IS NULL
  AND la.status != 'DRAFT'
  AND submitted_role.name = 'Admin'
ORDER BY la.createdAt DESC
LIMIT 10;

-- Step 2: For applications where admin submitted but there's no LO assigned,
-- we need to manually assign to the correct LO
-- Replace 'LOAN_OFFICER_USER_ID' with the actual LO's user ID
-- Replace 'APPLICATION_ID' with the actual application ID

-- UPDATE loan_applications 
-- SET assignedToId = 'LOAN_OFFICER_USER_ID'
-- WHERE id = 'APPLICATION_ID'
--   AND deletedAt IS NULL;

-- To find the correct LO user ID, run:
SELECT 
    u.id AS user_id,
    u.username,
    CONCAT(u.firstName, ' ', u.lastName) AS full_name,
    r.name AS role_name
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
WHERE r.name LIKE '%Loan%Officer%'
  AND u.deletedAt IS NULL
ORDER BY u.firstName, u.lastName;
