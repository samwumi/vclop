-- ============================================================================
-- Fix loans stuck in old workflow states
-- ============================================================================

-- Step 1: Move loans from ACCOUNTING_REVIEW to INTERNAL_CONTROL_REVIEW
-- (Since ACCOUNTING_REVIEW stage no longer exists)
UPDATE loan_applications
SET status = 'INTERNAL_CONTROL_REVIEW'
WHERE status = 'ACCOUNTING_REVIEW';

-- Step 2: Create new workflow instances for loans currently in workflow
-- Get the workflow definition ID
SET @workflow_id = (SELECT id FROM workflow_definitions WHERE code = 'loan-application-production' LIMIT 1);

-- For loans in COMPLIANCE_REVIEW
INSERT INTO workflow_instances (id, workflowDefinitionId, entityType, entityId, currentStageCode, status, startedAt, createdAt, updatedAt)
SELECT 
  UUID(),
  @workflow_id,
  'loan_application',
  la.id,
  'COMPLIANCE_REVIEW',
  'PENDING',
  COALESCE(la.submittedAt, la.createdAt),
  NOW(),
  NOW()
FROM loan_applications la
WHERE la.status = 'COMPLIANCE_REVIEW'
  AND NOT EXISTS (
    SELECT 1 FROM workflow_instances wi 
    WHERE wi.entityId = la.id AND wi.entityType = 'loan_application'
  );

-- For loans in INTERNAL_CONTROL_REVIEW
INSERT INTO workflow_instances (id, workflowDefinitionId, entityType, entityId, currentStageCode, status, startedAt, createdAt, updatedAt)
SELECT 
  UUID(),
  @workflow_id,
  'loan_application',
  la.id,
  'INTERNAL_CONTROL_REVIEW',
  'PENDING',
  COALESCE(la.submittedAt, la.createdAt),
  NOW(),
  NOW()
FROM loan_applications la
WHERE la.status = 'INTERNAL_CONTROL_REVIEW'
  AND NOT EXISTS (
    SELECT 1 FROM workflow_instances wi 
    WHERE wi.entityId = la.id AND wi.entityType = 'loan_application'
  );

-- Step 3: Verify the fix
SELECT '=== LOANS MOVED FROM ACCOUNTING_REVIEW ===' AS '---';
SELECT COUNT(*) as moved_count 
FROM loan_applications 
WHERE status = 'INTERNAL_CONTROL_REVIEW';

SELECT '=== NEW WORKFLOW INSTANCES CREATED ===' AS '---';
SELECT 
  wi.entityId as loan_id,
  la.applicationNumber,
  wi.currentStageCode,
  wi.status
FROM workflow_instances wi
JOIN loan_applications la ON la.id = wi.entityId
WHERE wi.entityType = 'loan_application'
  AND la.status IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW')
ORDER BY la.applicationNumber;

SELECT '✅ Loan workflow states fixed' AS status;
