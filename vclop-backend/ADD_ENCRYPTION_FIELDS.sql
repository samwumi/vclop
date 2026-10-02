-- ============================================================================
-- Add encrypted fields for BVN and NIN (NDPA 2023 Compliance)
-- ============================================================================

-- Add encrypted columns to customers table
ALTER TABLE customers 
ADD COLUMN bvn_encrypted TEXT AFTER bvn,
ADD COLUMN nin_encrypted TEXT AFTER nin,
ADD COLUMN encryption_key_version INT DEFAULT 1 AFTER nin_encrypted;

-- Add index for faster lookups (optional, for hashed searches)
-- We'll keep the plain BVN/NIN for now during migration period
-- Once all data is migrated, we can drop the plain columns

-- Add comment for documentation
ALTER TABLE customers 
MODIFY COLUMN bvn_encrypted TEXT COMMENT 'Encrypted BVN (format: encrypted$iv$authTag)',
MODIFY COLUMN nin_encrypted TEXT COMMENT 'Encrypted NIN (format: encrypted$iv$authTag)',
MODIFY COLUMN encryption_key_version INT DEFAULT 1 COMMENT 'Encryption key version for rotation';

SELECT '✅ Encryption fields added to customers table' AS status;
