-- Assign Selimot Yusuf's loan application to Kamaldeen Olumide

-- Step 1: Find Selimot Yusuf's application
SELECT 
    la.id,
    la.applicationNumber,
    la.status,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    la.assignedToId,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS currently_assigned_to,
    la.createdAt
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
WHERE la.deletedAt IS NULL
  AND (c.firstName LIKE '%Selimot%' OR c.lastName LIKE '%Yusuf%'
    OR CONCAT(c.firstName, ' ', c.lastName) LIKE '%Selimot%Yusuf%')
ORDER BY la.createdAt DESC
LIMIT 5;

-- Step 2: Update the application to assign it to Kamaldeen
-- Kamaldeen's ID: 29f0a70a-7408-4930-bbdb-a4cf03765bfe
UPDATE loan_applications la
JOIN customers c ON la.customerId = c.id
SET la.assignedToId = '29f0a70a-7408-4930-bbdb-a4cf03765bfe'
WHERE la.deletedAt IS NULL
  AND (c.firstName LIKE '%Selimot%' OR c.lastName LIKE '%Yusuf%'
    OR CONCAT(c.firstName, ' ', c.lastName) LIKE '%Selimot%Yusuf%')
ORDER BY la.createdAt DESC
LIMIT 1;

-- Step 3: Verify the assignment
SELECT 
    la.applicationNumber,
    la.status,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS assigned_to,
    la.createdAt
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
WHERE la.deletedAt IS NULL
  AND (c.firstName LIKE '%Selimot%' OR c.lastName LIKE '%Yusuf%')
ORDER BY la.createdAt DESC
LIMIT 5;
