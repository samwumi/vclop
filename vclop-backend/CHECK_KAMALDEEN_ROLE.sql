-- Check Kamaldeen's exact role name and verify the filtering logic

-- Step 1: Check Kamaldeen's role name
SELECT 
    u.id,
    u.username,
    u.firstName,
    u.lastName,
    r.id AS role_id,
    r.name AS role_name
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
WHERE u.id = '29f0a70a-7408-4930-bbdb-a4cf03765bfe';

-- Step 2: Check LA-000153 assignment details
SELECT 
    la.id,
    la.applicationNumber,
    la.status,
    la.assignedToId,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS assigned_to,
    la.submittedById,
    CONCAT(submitted.firstName, ' ', submitted.lastName) AS submitted_by,
    la.deletedAt,
    c.branchId
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
LEFT JOIN users submitted ON la.submittedById = submitted.id
WHERE la.applicationNumber = 'LA-000153';

-- Step 3: Check if Kamaldeen has branch permissions that might block this
SELECT 
    ub.userId,
    ub.branchId,
    b.name AS branch_name,
    ub.canViewLoans
FROM user_branches ub
JOIN branches b ON ub.branchId = b.id
WHERE ub.userId = '29f0a70a-7408-4930-bbdb-a4cf03765bfe';

-- Step 4: Get the customer's branch for LA-000153
SELECT 
    c.id,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    c.branchId,
    b.name AS branch_name
FROM customers c
LEFT JOIN branches b ON c.branchId = b.id
WHERE c.firstName LIKE '%Selimot%' AND c.lastName LIKE '%yusuf%';
