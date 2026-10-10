-- ============================================================================
-- FIX: Create missing workflows for loan applications
-- ============================================================================
-- This script creates workflow instances for applications that are stuck
-- without workflows (created before the fix was deployed)
-- ============================================================================

-- First, let's get the workflow definition ID
SET @workflowDefId = (SELECT id FROM workflow_definitions WHERE code = 'loan-application-production' AND entityType = 'LOAN_APPLICATION' LIMIT 1);

-- Get the COMPLIANCE_REVIEW stage ID
SET @complianceStageId = (SELECT id FROM workflow_stages WHERE workflowDefinitionId = @workflowDefId AND code = 'COMPLIANCE_REVIEW' LIMIT 1);

-- Show what we're about to fix
SELECT 
  CONCAT('Will create workflows for ', COUNT(*), ' applications') as action,
  GROUP_CONCAT(applicationNumber SEPARATOR ', ') as affected_applications
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.deletedAt IS NULL
  AND wi.id IS NULL
  AND la.status IN ('COMPLIANCE_REVIEW', 'DRAFT');

-- ============================================================================
-- OPTION 1: Reset to DRAFT (Safest - requires LO to resubmit properly)
-- ============================================================================
-- Uncomment this block to reset all broken applications to DRAFT

/*
UPDATE loan_applications 
SET status = 'DRAFT'
WHERE deletedAt IS NULL
  AND id IN (
    SELECT la.id FROM loan_applications la
    LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LOAN_APPLICATION'
    WHERE la.deletedAt IS NULL
      AND wi.id IS NULL
      AND la.status IN ('COMPLIANCE_REVIEW', 'REJECTED')
  );

SELECT 'Applications reset to DRAFT - Loan Officers can now resubmit properly' as result;
*/

-- ============================================================================
-- OPTION 2: Manually create workflows (Advanced - use carefully)
-- ============================================================================
-- This creates workflow instances for applications in COMPLIANCE_REVIEW
-- WARNING: This is a data fix and should only be run once!

-- For COMPLIANCE_REVIEW applications, create workflows manually
INSERT INTO workflow_instances (
  id,
  workflowDefinitionId,
  entityType,
  entityId,
  currentStageCode,
  status,
  startedById,
  startedAt,
  createdAt,
  updatedAt
)
SELECT 
  UUID() as id,
  @workflowDefId,
  'LOAN_APPLICATION',
  la.id,
  'COMPLIANCE_REVIEW',
  'IN_PROGRESS',
  la.assignedToId,
  la.createdAt,
  NOW(),
  NOW()
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.deletedAt IS NULL
  AND wi.id IS NULL
  AND la.status = 'COMPLIANCE_REVIEW';

-- Create workflow tasks for each workflow instance we just created
INSERT INTO workflow_tasks (
  id,
  workflowInstanceId,
  stageId,
  assignedToId,
  status,
  assignedAt,
  createdAt,
  updatedAt
)
SELECT 
  UUID() as id,
  wi.id as workflowInstanceId,
  @complianceStageId,
  la.assignedToId,
  'PENDING',
  NOW(),
  NOW(),
  NOW()
FROM loan_applications la
JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.deletedAt IS NULL
  AND la.status = 'COMPLIANCE_REVIEW'
  AND NOT EXISTS (
    SELECT 1 FROM workflow_tasks wt WHERE wt.workflowInstanceId = wi.id
  );

-- Verify the fix
SELECT 
  'Workflows created!' as result,
  COUNT(*) as fixed_count
FROM loan_applications la
JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.status = 'COMPLIANCE_REVIEW';

-- Show current status
SELECT 
  la.applicationNumber,
  la.status,
  CASE WHEN wi.id IS NULL THEN '❌ NO WORKFLOW' ELSE '✅ Has Workflow' END as workflow_status,
  wi.currentStageCode
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.deletedAt IS NULL
  AND la.status IN ('COMPLIANCE_REVIEW', 'DRAFT')
ORDER BY la.createdAt DESC;
