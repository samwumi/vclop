-- ============================================================================
-- CLEANUP BROKEN DOCUMENTS - Remove database records with no files
-- ============================================================================
-- These documents were uploaded when the uploads/ folder didn't exist
-- The database records were created but files were never saved
-- Users see "File not found on server" error when trying to view them
-- ============================================================================

-- PREVIEW: See what will be deleted (all documents before today)
SELECT 
  'Documents to Clean Up' as action,
  COUNT(*) as total_broken_documents,
  GROUP_CONCAT(DISTINCT DATE(createdAt)) as upload_dates
FROM customer_documents
WHERE createdAt < '2026-10-08';

-- PREVIEW: See affected customers
SELECT 
  c.customerNumber,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  COUNT(cd.id) as broken_documents,
  GROUP_CONCAT(cd.originalName SEPARATOR ', ') as files
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
WHERE cd.createdAt < '2026-10-08'
GROUP BY c.id, c.customerNumber, c.firstName, c.lastName
ORDER BY c.customerNumber;

-- ============================================================================
-- OPTION A: DELETE ALL BROKEN RECORDS (Recommended)
-- ============================================================================
-- This completely removes the broken records
-- Users will need to re-upload their documents

-- Uncomment to execute:
-- DELETE FROM customer_documents WHERE createdAt < '2026-10-08';

-- Verify deletion:
-- SELECT COUNT(*) as remaining_documents FROM customer_documents;

-- ============================================================================
-- OPTION B: MARK AS REJECTED WITH EXPLANATION (Alternative)
-- ============================================================================
-- This keeps the records but marks them as needing re-upload
-- Users will see them in their document list with rejection reason

-- Uncomment to execute:
-- UPDATE customer_documents 
-- SET 
--   status = 'REJECTED',
--   rejectionReason = 'File not found on server. Please re-upload this document.',
--   verifiedById = NULL,
--   verifiedAt = NULL
-- WHERE createdAt < '2026-10-08';

-- Verify update:
-- SELECT status, rejectionReason, COUNT(*) 
-- FROM customer_documents 
-- GROUP BY status, rejectionReason;

-- ============================================================================
-- AFTER CLEANUP: Notify users
-- ============================================================================
-- Get list of customers who need to re-upload
SELECT DISTINCT
  c.customerNumber,
  c.email,
  c.phone,
  CONCAT(c.firstName, ' ', c.lastName) as customer_name,
  COUNT(cd.id) as documents_to_reupload
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
WHERE cd.createdAt < '2026-10-08'
GROUP BY c.id, c.customerNumber, c.email, c.phone, c.firstName, c.lastName
ORDER BY c.customerNumber;

-- ============================================================================
-- RECOMMENDATION
-- ============================================================================
-- Use OPTION A (DELETE) if you want a clean slate
-- Use OPTION B (MARK REJECTED) if you want users to see what's missing
--
-- After cleanup, announce to users:
-- "We've fixed a technical issue with document storage. 
--  Please re-upload any documents that were submitted before October 8, 2026."
-- ============================================================================
