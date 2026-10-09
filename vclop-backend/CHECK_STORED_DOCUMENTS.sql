-- ============================================================================
-- CHECK STORED DOCUMENTS - See where documents are stored
-- ============================================================================

-- 1. Count total documents
SELECT 
  'Total Documents' as check_type,
  COUNT(*) as count
FROM customer_documents;

-- 2. Documents by status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(SUM(size) / 1024 / 1024, 2) as total_size_mb
FROM customer_documents
GROUP BY status
ORDER BY count DESC;

-- 3. Recent documents with file paths (last 10)
SELECT 
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  dt.name as document_type,
  cd.originalName,
  cd.fileKey,
  cd.fileUrl,
  ROUND(cd.size / 1024, 2) as size_kb,
  cd.status,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
LEFT JOIN document_types dt ON dt.id = cd.documentTypeId
ORDER BY cd.createdAt DESC
LIMIT 10;

-- 4. All file keys (to find files on disk)
SELECT 
  cd.id,
  c.customerNumber,
  cd.fileKey,
  cd.originalName,
  cd.status,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
ORDER BY cd.createdAt DESC;

-- 5. Find documents for a specific customer by customer number
-- EXAMPLE: Replace 'VC-000027' with actual customer number
SELECT 
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  dt.name as document_type,
  cd.fileKey,
  cd.fileUrl,
  cd.originalName,
  cd.mimeType,
  ROUND(cd.size / 1024, 2) as size_kb,
  cd.status,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
LEFT JOIN document_types dt ON dt.id = cd.documentTypeId
WHERE c.customerNumber = 'VC-000027'  -- Change this to your customer number
ORDER BY cd.createdAt DESC;

-- 6. Documents by file type
SELECT 
  cd.mimeType,
  COUNT(*) as count,
  ROUND(SUM(cd.size) / 1024 / 1024, 2) as total_size_mb
FROM customer_documents cd
GROUP BY cd.mimeType
ORDER BY count DESC;

-- 7. Check if files exist in expected locations
-- This shows the file paths you need to check on disk
SELECT 
  CONCAT('Check file: vclop-backend/uploads/', cd.fileKey) as file_path_to_check,
  cd.originalName,
  c.customerNumber
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
ORDER BY cd.createdAt DESC
LIMIT 20;

-- 8. Largest documents (check storage usage)
SELECT 
  c.customerNumber,
  cd.fileKey,
  cd.originalName,
  ROUND(cd.size / 1024 / 1024, 2) as size_mb,
  cd.mimeType,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
ORDER BY cd.size DESC
LIMIT 10;

-- 9. Field visits with photos (stored as base64 in database - BAD!)
SELECT 
  fv.id,
  fv.visitType,
  CASE 
    WHEN fv.photos IS NULL THEN 'No photos'
    WHEN LENGTH(fv.photos) < 100 THEN 'Empty'
    ELSE CONCAT(ROUND(LENGTH(fv.photos) / 1024, 2), ' KB base64 (❌ stored in DB)')
  END as photos_status,
  fv.findings,
  fv.createdAt
FROM field_visits fv
ORDER BY fv.createdAt DESC
LIMIT 10;

-- 10. Total database storage used by field visit photos (base64)
SELECT 
  'Field Visit Photos in Database' as storage_type,
  COUNT(*) as visits_with_photos,
  ROUND(SUM(LENGTH(COALESCE(photos, ''))) / 1024 / 1024, 2) as total_mb_in_database,
  '❌ SHOULD BE IN FILES, NOT DATABASE!' as recommendation
FROM field_visits
WHERE photos IS NOT NULL AND photos != '';
