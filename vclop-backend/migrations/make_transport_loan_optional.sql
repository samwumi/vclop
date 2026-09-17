-- Make loanApplicationId optional in transport_requests
-- This allows compliance officers to create general transport requests

ALTER TABLE transport_requests 
MODIFY COLUMN loan_application_id VARCHAR(36) NULL;

-- Verify the change
SELECT 
  COLUMN_NAME, 
  IS_NULLABLE, 
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'transport_requests' 
  AND COLUMN_NAME = 'loan_application_id';
