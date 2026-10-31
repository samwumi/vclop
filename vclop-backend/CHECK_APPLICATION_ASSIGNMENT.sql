-- Check the loan application that admin submitted
-- to see if assignedToId is set correctly to the LO who created it

SELECT 
    la.applicationNumber,
    la.status,
    la.assignedToId,
    assigned.username AS assignedTo_username,
    assigned.firstName AS assignedTo_firstName,
    assigned.lastName AS assignedTo_lastName,
    la.submittedById,
    submitted.username AS submittedBy_username,
    submitted.firstName AS submittedBy_firstName,
    submitted.lastName AS submittedBy_lastName,
    c.customerNumber,
    c.firstName AS customer_firstName,
    c.lastName AS customer_lastName
FROM loan_applications la
LEFT JOIN users assigned ON la.assignedToId = assigned.id
LEFT JOIN users submitted ON la.submittedById = submitted.id
LEFT JOIN customers c ON la.customerId = c.id
WHERE la.deletedAt IS NULL
ORDER BY la.createdAt DESC
LIMIT 10;

-- Check if the LO has the correct role and permissions
SELECT 
    u.id,
    u.username,
    u.firstName,
    u.lastName,
    r.name AS role_name,
    GROUP_CONCAT(p.code SEPARATOR ', ') AS permissions
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE u.username LIKE '%loan%' OR r.name LIKE '%loan%'
GROUP BY u.id, u.username, u.firstName, u.lastName, r.name;
