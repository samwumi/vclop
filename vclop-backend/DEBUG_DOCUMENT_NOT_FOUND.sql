-- ============================================================================
-- DEBUG: Document Not Found Issue
-- Run this in phpMyAdmin to check document paths and file locations
-- ============================================================================

-- Step 1: Check what documents exist and their file paths
SELECT 
    cd.id,
    cd.customerId,
    c.customerNumber,
    c.firstName,
    c.lastName,
    dt.name as documentType,
    cd.fileKey,
    cd.fileUrl,
    cd.originalName,
    cd.mimeType,
    cd.status,
    cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
JOIN document_types dt ON dt.id = cd.documentTypeId
WHERE cd.deletedAt IS NULL
ORDER BY cd.createdAt DESC
LIMIT 20;

-- Step 2: Check if fileKey format is correct
-- Should look like: "customers/<customer-id>/documents/<file-name>.pdf"
SELECT 
    'Checking fileKey format' as check_type,
    COUNT(*) as total_documents,
    SUM(CASE WHEN fileKey LIKE 'customers/%/documents/%' THEN 1 ELSE 0 END) as correct_format,
    SUM(CASE WHEN fileKey NOT LIKE 'customers/%/documents/%' THEN 1 ELSE 0 END) as wrong_format
FROM customer_documents
WHERE deletedAt IS NULL;

-- Step 3: Check specific document details (replace with actual document ID)
-- Use this to debug a specific "file not found" error
-- SELECT * FROM customer_documents WHERE id = 'YOUR-DOCUMENT-ID-HERE';

-- Step 4: Check UPLOAD_DIR setting from environment
-- Note: This is just a note - actual UPLOAD_DIR is in .env file on server
SELECT 
    '✅ Next: Check .env file on server' as action,
    'Look for: UPLOAD_DIR=/path/to/uploads' as what_to_find,
    'Default: ./uploads (relative to app root)' as default_value;
