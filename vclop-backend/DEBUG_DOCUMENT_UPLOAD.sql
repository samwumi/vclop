-- ============================================================================
-- DEBUG: Where did the uploaded documents go?
-- ============================================================================

-- Check when documents were uploaded
SELECT 
  'Document Upload Timeline' as check_type,
  DATE(createdAt) as upload_date,
  COUNT(*) as documents_uploaded,
  GROUP_CONCAT(c.customerNumber) as customers
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
GROUP BY DATE(createdAt)
ORDER BY upload_date DESC;

-- Check fileKey patterns
SELECT 
  'FileKey Pattern Analysis' as check_type,
  cd.fileKey,
  cd.fileUrl,
  cd.originalName,
  c.customerNumber,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
ORDER BY cd.createdAt DESC
LIMIT 20;

-- Check if fileKey is NULL or empty
SELECT 
  'Missing FileKey Check' as check_type,
  COUNT(*) as total_documents,
  SUM(CASE WHEN fileKey IS NULL THEN 1 ELSE 0 END) as null_filekey,
  SUM(CASE WHEN fileKey = '' THEN 1 ELSE 0 END) as empty_filekey,
  SUM(CASE WHEN fileKey IS NOT NULL AND fileKey != '' THEN 1 ELSE 0 END) as has_filekey
FROM customer_documents;

-- Get the full fileKey to check the path structure
SELECT 
  cd.fileKey as full_file_path,
  cd.fileUrl,
  c.customerNumber,
  cd.originalName,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
ORDER BY cd.createdAt DESC
LIMIT 10;
