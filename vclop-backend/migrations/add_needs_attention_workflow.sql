-- Add NEEDS_ATTENTION status and compliance feedback fields
-- Run this on production database

-- Step 1: Add new enum value to LoanApplicationStatus
ALTER TABLE loan_applications 
MODIFY COLUMN status ENUM(
  'DRAFT',
  'SUBMITTED', 
  'COMPLIANCE_REVIEW',
  'NEEDS_ATTENTION',
  'AWAITING_INFORMATION',
  'INTERNAL_CONTROL_REVIEW',
  'ACCOUNTING_REVIEW',
  'APPROVED',
  'REJECTED',
  'RETURNED',
  'ESCALATED',
  'DISBURSED',
  'CANCELLED'
) NOT NULL DEFAULT 'DRAFT';

-- Step 2: Add assignedToId to track loan officer
ALTER TABLE loan_applications 
ADD COLUMN assigned_to_id VARCHAR(36) NULL AFTER status;

-- Step 3: Add complianceFeedback for CO comments
ALTER TABLE loan_applications 
ADD COLUMN compliance_feedback TEXT NULL AFTER rejection_reason;

-- Step 4: Add index for assignedToId
CREATE INDEX idx_loan_applications_assigned_to_id ON loan_applications(assigned_to_id);

-- Step 5: Verify changes
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'loan_applications' 
  AND COLUMN_NAME IN ('status', 'assigned_to_id', 'compliance_feedback')
ORDER BY ORDINAL_POSITION;
