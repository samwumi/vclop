-- ============================================================================
-- Fix workflow instance for LA-000030
-- ============================================================================

-- Get the workflow definition ID
SET @workflow_id = (SELECT id FROM workflow_definitions WHERE code = 'loan-application-production' LIMIT 1);

-- Create workflow instance for LA-000030 (currently in COMPLIANCE_REVIEW)
INSERT INTO workflow_instances (
  id, 
  workflowDefinitionId, 
  entityType, 
  entityId, 
  currentStageCode, 
  status, 
  startedAt, 
  createdAt, 
  updatedAt
)
SELECT 
  '2793db3f-509d-488f-acf5-2c2dc5a6ed6c' as id,
  @workflow_id,
  'loan_application' as entityType,
  la.id as entityId,
  'COMPLIANCE_REVIEW' as currentStageCode,
  'PENDING' as status,
  COALESCE(la.submittedAt, la.createdAt) as startedAt,
  NOW() as createdAt,
  NOW() as updatedAt
FROM loan_applications la
WHERE la.applicationNumber = 'LA-000030'
ON DUPLICATE KEY UPDATE
  currentStageCode = 'COMPLIANCE_REVIEW',
  status = 'PENDING',
  updatedAt = NOW();

SELECT '✅ Workflow instance created for LA-000030' AS status;
