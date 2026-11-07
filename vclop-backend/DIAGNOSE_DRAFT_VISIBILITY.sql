-- Diagnostic query to check DRAFT applications and their assignments
-- Run this on production database to see why LOs can't see DRAFTs

-- 1. List all DRAFT applications with assignment details
SELECT 
    la.id,
    la.applicationNumber,
    la.status,
    la.amount,
    la.createdAt,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) as customerName,
    c.branchId as customerBranchId,
    la.assignedToId,
    CONCAT(u.firstName, ' ', u.lastName) as assignedOfficer,
    u.email as assignedOfficerEmail,
    GROUP_CONCAT(r.name) as assignedOfficerRoles
FROM loan_applications la
JOIN customers c ON c.id = la.customerId
LEFT JOIN users u ON u.id = la.assignedToId
LEFT JOIN user_roles ur ON ur.userId = u.id
LEFT JOIN roles r ON r.id = ur.roleId
WHERE la.status = 'DRAFT'
  AND la.deletedAt IS NULL
GROUP BY la.id
ORDER BY la.createdAt DESC;

-- 2. Check if there are DRAFT applications with NULL assignedToId
SELECT 
    COUNT(*) as count_with_null_assignedToId,
    GROUP_CONCAT(applicationNumber) as application_numbers
FROM loan_applications
WHERE status = 'DRAFT'
  AND deletedAt IS NULL
  AND assignedToId IS NULL;

-- 3. List all loan officers and their permissions
SELECT 
    u.id,
    CONCAT(u.firstName, ' ', u.lastName) as name,
    u.email,
    u.isActive,
    GROUP_CONCAT(DISTINCT r.name) as roles,
    GROUP_CONCAT(DISTINCT p.code) as permissions
FROM users u
JOIN user_roles ur ON ur.userId = u.id
JOIN roles r ON r.id = ur.roleId
LEFT JOIN role_permissions rp ON rp.roleId = r.id
LEFT JOIN permissions p ON p.id = rp.permissionId
WHERE r.code = 'LOAN_OFFICER'
  AND u.isActive = 1
GROUP BY u.id;

-- 4. Count DRAFT applications per officer
SELECT 
    u.id as officerId,
    CONCAT(u.firstName, ' ', u.lastName) as officerName,
    u.email,
    COUNT(la.id) as draft_count,
    GROUP_CONCAT(la.applicationNumber ORDER BY la.createdAt DESC) as draft_applications
FROM users u
JOIN user_roles ur ON ur.userId = u.id
JOIN roles r ON r.id = ur.roleId
LEFT JOIN loan_applications la ON la.assignedToId = u.id AND la.status = 'DRAFT' AND la.deletedAt IS NULL
WHERE r.code = 'LOAN_OFFICER'
  AND u.isActive = 1
GROUP BY u.id;
