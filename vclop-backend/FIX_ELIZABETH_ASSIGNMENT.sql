-- Reassign Elizabeth Yusuf back to Oyinkansola Afolayan
-- (She was accidentally reassigned to Kamaldeen)

-- Oyinkansola Afolayan's ID: 46896bc7-d6a5-46a8-bdd8-ea6de00a77ef

UPDATE loan_applications la
JOIN customers c ON la.customerId = c.id
SET la.assignedToId = '46896bc7-d6a5-46a8-bdd8-ea6de00a77ef'
WHERE la.applicationNumber = 'LA-000163'
  AND c.firstName LIKE '%Elizabeth%'
  AND la.deletedAt IS NULL;

-- Verify the fix
SELECT 
    la.applicationNumber,
    c.customerNumber,
    CONCAT(c.firstName, ' ', c.lastName) AS customer_name,
    CONCAT(assigned.firstName, ' ', assigned.lastName) AS assigned_to
FROM loan_applications la
JOIN customers c ON la.customerId = c.id
LEFT JOIN users assigned ON la.assignedToId = assigned.id
WHERE la.applicationNumber IN ('LA-000163', 'LA-000153')
  AND la.deletedAt IS NULL;
