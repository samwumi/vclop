-- =============================================================================
-- PRODUCTION DEPLOYMENT: Loan Product Document Requirements
-- =============================================================================
-- Purpose: Configure required documents for each loan product
-- This fixes the issue where officers can submit applications without documents
--
-- SAFETY: This script uses INSERT IGNORE, so it won't fail if requirements
--         already exist. Safe to run multiple times.
--
-- Date: September 9, 2026
-- =============================================================================

USE vclop;

-- Step 1: Verify loan products and document types exist
-- (This is just for verification - the INSERT statements will handle missing data gracefully)

SELECT '=== CURRENT LOAN PRODUCTS ===' AS info;
SELECT id, code, name FROM loan_products;

SELECT '=== CURRENT DOCUMENT TYPES ===' AS info;
SELECT id, code, name FROM document_types;

SELECT '=== EXISTING DOCUMENT REQUIREMENTS (BEFORE) ===' AS info;
SELECT COUNT(*) AS total_requirements FROM loan_product_document_requirements;

-- =============================================================================
-- Step 2: Insert Document Requirements for Quick Cash (30 Days)
-- =============================================================================

-- Quick Cash requires: NIN Slip, Passport Photo, Selfie

INSERT IGNORE INTO loan_product_document_requirements (id, loanProductId, documentTypeId, isRequired)
SELECT 
  UUID() AS id,
  lp.id AS loanProductId,
  dt.id AS documentTypeId,
  1 AS isRequired
FROM loan_products lp
CROSS JOIN document_types dt
WHERE lp.code = 'quick-cash-30'
  AND dt.code IN ('nin_slip', 'passport_photo', 'selfie');

SELECT '✔ Quick Cash document requirements configured' AS status;

-- =============================================================================
-- Step 3: Insert Document Requirements for Business Growth (90 Days)
-- =============================================================================

-- Business Growth requires: NIN Slip, CAC Certificate, Passport Photo, Utility Bill, Selfie

INSERT IGNORE INTO loan_product_document_requirements (id, loanProductId, documentTypeId, isRequired)
SELECT 
  UUID() AS id,
  lp.id AS loanProductId,
  dt.id AS documentTypeId,
  1 AS isRequired
FROM loan_products lp
CROSS JOIN document_types dt
WHERE lp.code = 'business-growth-90'
  AND dt.code IN ('nin_slip', 'cac_certificate', 'passport_photo', 'utility_bill', 'selfie');

SELECT '✔ Business Growth document requirements configured' AS status;

-- =============================================================================
-- Step 4: Verification - Check what was created
-- =============================================================================

SELECT '=== DOCUMENT REQUIREMENTS CONFIGURED (AFTER) ===' AS info;

SELECT 
  lp.name AS loan_product,
  dt.name AS document_type,
  dt.code AS document_code,
  lpdr.isRequired AS required,
  CASE WHEN lpdr.isRequired = 1 THEN '✅ REQUIRED' ELSE '⚪ Optional' END AS status
FROM loan_products lp
JOIN loan_product_document_requirements lpdr ON lp.id = lpdr.loanProductId
JOIN document_types dt ON lpdr.documentTypeId = dt.id
ORDER BY lp.name, lpdr.isRequired DESC, dt.name;

SELECT '=== SUMMARY ===' AS info;
SELECT 
  lp.name AS loan_product,
  COUNT(*) AS total_documents,
  SUM(CASE WHEN lpdr.isRequired = 1 THEN 1 ELSE 0 END) AS required_documents
FROM loan_products lp
LEFT JOIN loan_product_document_requirements lpdr ON lp.id = lpdr.loanProductId
GROUP BY lp.id, lp.name;

-- =============================================================================
-- Expected Results:
-- 
-- Quick Cash (30 Days):
--   - NIN Slip (REQUIRED)
--   - Passport Photograph (REQUIRED)
--   - Selfie (REQUIRED)
--   Total: 3 required documents
--
-- Business Growth Loan (90 Days):
--   - NIN Slip (REQUIRED)
--   - CAC Certificate (REQUIRED)
--   - Passport Photograph (REQUIRED)
--   - Utility Bill (REQUIRED)
--   - Selfie (REQUIRED)
--   Total: 5 required documents
--
-- =============================================================================

SELECT '✅ DEPLOYMENT COMPLETE - Document validation now enforced!' AS final_status;
