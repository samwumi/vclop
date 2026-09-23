-- ============================================================================
-- Fix ACCOUNTING_REVIEW Stage - Remove Permission Requirement
-- IC can now approve to this stage, then admin disburses from here
-- Run this on production database
-- ============================================================================

-- Step 1: Find the ACCOUNTING_REVIEW stage
SET @accounting_review_stage_id = (
  SELECT id FROM workflow_stages 
  WHERE code = 'ACCOUNTING_REVIEW' 
  LIMIT 1
);

-- Step 2: Remove the permission requirement from ACCOUNTING_REVIEW stage
UPDATE workflow_stages 
SET requiredPermission = NULL,
    name = 'Awaiting Disbursement'
WHERE id = @accounting_review_stage_id;

-- Step 3: Verify the change
SELECT 
  code,
  name,
  requiredPermission,
  departmentCode,
  sortOrder
FROM workflow_stages
WHERE code IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW')
ORDER BY sortOrder;

-- Expected result:
-- COMPLIANCE_REVIEW        → requires 'loan_applications:compliance_review'
-- INTERNAL_CONTROL_REVIEW  → requires 'loan_applications:internal_control_approve'
-- ACCOUNTING_REVIEW        → requires NULL (no permission needed to reach this stage)

SELECT '✅ ACCOUNTING_REVIEW stage fixed - IC can now approve to this stage' AS status;
SELECT '✅ Loans will await disbursement from authorized users' AS status;
