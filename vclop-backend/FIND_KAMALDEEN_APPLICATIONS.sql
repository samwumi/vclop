-- Find all applications that should belong to Kamaldeen Olumide
-- Kamaldeen's user ID: 29f0a70a-7408-4930-bbdb-a4cf03765bfe

-- Check ALL applications in the system (including DRAFT)
SELECT 
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
ORDER BY la.createdAt DESC
LIMIT 20;

-- Show applications assigned to Kamaldeen
SELECT 
    la.applicationNumber,
    la.status,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    la.createdAt
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
WHERE la.assignedToId = '29f0a70a-7408-4930-bbdb-a4cf03765bfe'
  AND la.deletedAt IS NULL
ORDER BY la.createdAt DESC;

-- Check if Kamaldeen has the Loan Officer role
SELECT 
    u.username,
    r.name AS role_name,
    GROUP_CONCAT(p.code SEPARATOR ', ') AS permissions
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE u.id = '29f0a70a-7408-4930-bbdb-a4cf03765bfe'
GROUP BY u.username, r.name;
