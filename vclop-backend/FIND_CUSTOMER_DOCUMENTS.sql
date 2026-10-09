-- ============================================================================
-- FIND CUSTOMER DOCUMENTS - Map database records to actual files on disk
-- ============================================================================

-- Get the complete file path structure
SELECT 
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  dt.name as document_type,
  cd.fileKey as full_path,
  cd.originalName,
  cd.status,
  CONCAT('Customer ID: ', c.id) as customer_folder_name,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
LEFT JOIN document_types dt ON dt.id = cd.documentTypeId
ORDER BY cd.createdAt DESC;

-- Map customer IDs to their folder names
-- This helps you navigate: uploads/customers/{customerId}/documents/
SELECT 
  c.id as customer_id_folder_name,
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  COUNT(cd.id) as document_count,
  CONCAT('uploads/customers/', c.id, '/documents/') as folder_path
FROM customers c
LEFT JOIN customer_documents cd ON cd.customerId = c.id
WHERE cd.id IS NOT NULL
GROUP BY c.id, c.customerNumber, c.firstName, c.lastName
ORDER BY document_count DESC;

-- Show file locations for recent customers
SELECT 
  c.customerNumber,
  CONCAT(
    'Location: vclop-backend/uploads/customers/',
    c.id,
    '/documents/'
  ) as windows_file_path,
  COUNT(cd.id) as files_in_folder
FROM customers c
JOIN customer_documents cd ON cd.customerId = c.id
GROUP BY c.id, c.customerNumber
ORDER BY c.customerNumber DESC
LIMIT 20;
