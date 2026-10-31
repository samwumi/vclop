-- Diagnose why LA-000153 (Selimot Yusuf) is not showing for Kamaldeen

-- Check the application details
SELECT 
    'LA-000153 Details' AS info,
    la.*
FROM loan_applications la
WHERE la.applicationNumber = 'LA-000153';

-- Compare with an application that DOES show for Kamaldeen
SELECT 
    'Working Application for Comparison' AS info,
    la.applicationNumber,
    la.status,
    la.assignedToId,
    la.submittedById,
    la.deletedAt,
    c.branchId,
    c.customerNumber
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
WHERE la.assignedToId = '29f0a70a-7408-4930-bbdb-a4cf03765bfe'
  AND la.applicationNumber != 'LA-000153'
  AND la.deletedAt IS NULL
LIMIT 1;

-- Check if the customer's branch is the issue
SELECT 
    'Customer Branch Check' AS info,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    c.branchId,
    b.name AS branch_name
FROM customers c
LEFT JOIN branches b ON c.branchId = b.id
WHERE c.firstName LIKE '%Selimot%' AND c.lastName LIKE '%yusuf%';

-- Check Kamaldeen's branch permissions
SELECT 
    'Kamaldeen Branch Permissions' AS info,
    ub.branchId,
    b.name AS branch_name,
    ub.canViewLoans
FROM user_branches ub
JOIN branches b ON ub.branchId = b.id
WHERE ub.userId = '29f0a70a-7408-4930-bbdb-a4cf03765bfe';

-- Check if there's a workflow issue
SELECT 
    'Workflow Status' AS info,
    wi.workflowId,
    w.name AS workflow_name,
    wi.status,
    wi.currentStage
FROM workflow_instances wi
JOIN workflows w ON wi.workflowId = w.id
WHERE wi.entityType = 'LOAN_APPLICATION'
  AND wi.entityId = (SELECT id FROM loan_applications WHERE applicationNumber = 'LA-000153');
