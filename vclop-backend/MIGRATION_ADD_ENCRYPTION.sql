-- ============================================================================
-- Migration: Add Encryption Fields for BVN/NIN (NDPA 2023 Compliance)
-- Date: 2026-10-02
-- ============================================================================

-- Step 1: Add encrypted columns to customers table
ALTER TABLE customers 
ADD COLUMN bvnEncrypted TEXT COMMENT 'Encrypted BVN (format: encrypted$iv$authTag)' AFTER bvn,
ADD COLUMN ninEncrypted TEXT COMMENT 'Encrypted NIN (format: encrypted$iv$authTag)' AFTER nin,
ADD COLUMN encryptionKeyVersion INT DEFAULT 1 COMMENT 'Encryption key version for rotation' AFTER ninEncrypted;

-- Step 2: Verify columns were added
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'customers'
  AND COLUMN_NAME IN ('bvnEncrypted', 'ninEncrypted', 'encryptionKeyVersion');

SELECT '✅ Encryption fields added successfully' AS status;
