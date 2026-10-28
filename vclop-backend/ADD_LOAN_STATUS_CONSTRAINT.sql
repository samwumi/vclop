-- Add database constraint to prevent invalid loan status values
-- This ensures only ACTIVE, COMPLETED, DEFAULTED, WRITTEN_OFF can be stored
-- Prevents DISBURSED or any other invalid value from being saved

-- Drop existing constraint if any
ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loan_status;

-- Add new constraint matching LoanStatus enum
ALTER TABLE loans 
ADD CONSTRAINT chk_loan_status 
CHECK (status IN ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF'));

-- Verify constraint was added
SELECT 
  CONSTRAINT_NAME,
  CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS tc
JOIN information_schema.CHECK_CONSTRAINTS cc 
  ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = 'loans' 
  AND tc.CONSTRAINT_TYPE = 'CHECK';
