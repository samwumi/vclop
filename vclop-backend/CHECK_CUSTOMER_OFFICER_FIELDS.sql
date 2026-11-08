-- Check which officer field is populated for customers
-- This helps us understand whether to use assignedOfficerId or createdById

SELECT 
    COUNT(*) as total_customers,
    COUNT(assignedOfficerId) as with_assignedOfficerId,
    COUNT(createdById) as with_createdById,
    COUNT(CASE WHEN assignedOfficerId IS NOT NULL AND createdById IS NOT NULL THEN 1 END) as both_populated,
    COUNT(CASE WHEN assignedOfficerId IS NULL AND createdById IS NULL THEN 1 END) as neither_populated
FROM customers
WHERE deletedAt IS NULL;

-- Sample of actual data
SELECT 
    id,
    customerNumber,
    CONCAT(firstName, ' ', lastName) as customerName,
    assignedOfficerId,
    createdById,
    createdAt
FROM customers
WHERE deletedAt IS NULL
ORDER BY createdAt DESC
LIMIT 10;

-- Check if assignedOfficerId matches createdById
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN assignedOfficerId = createdById THEN 1 END) as matching,
    COUNT(CASE WHEN assignedOfficerId != createdById THEN 1 END) as different,
    COUNT(CASE WHEN assignedOfficerId IS NULL AND createdById IS NOT NULL THEN 1 END) as only_createdById,
    COUNT(CASE WHEN assignedOfficerId IS NOT NULL AND createdById IS NULL THEN 1 END) as only_assignedOfficerId
FROM customers
WHERE deletedAt IS NULL;
