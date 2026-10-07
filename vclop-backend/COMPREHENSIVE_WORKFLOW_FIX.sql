-- ============================================================================
-- COMPREHENSIVE WORKFLOW FIX - Ensure all loans have proper workflow instances
-- ============================================================================

-- Step 1: Find all loans in workflow stages without workflow instances
SELECT 
  '=== LOANS MISSING WORKFLOW INSTANCES ===' AS '---';

SELECT 
  la.id,
  la.applicationNumber,
  la.status,
  la.submittedAt,
  CASE WHEN wi.id IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END as workflow_status
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'loan_application'
WHERE la.status IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED', 'REJECTED')
  AND la.deletedAt IS NULL
ORDER BY la.submittedAt DESC;

-- Step 2: Get workflow definition ID
SET @workflow_id = (SELECT id FROM workflow_definitions WHERE code = 'loan-application-production' LIMIT 1);

-- Step 3: Create workflow instances for ALL loans in workflow stages that don't have one
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
  UUID() as id,
  @workflow_id,
  'loan_application' as entityType,
  la.id as entityId,
  -- Map loan status to workflow stage
  CASE 
    WHEN la.status = 'COMPLIANCE_REVIEW' THEN 'COMPLIANCE_REVIEW'
    WHEN la.status = 'INTERNAL_CONTROL_REVIEW' THEN 'INTERNAL_CONTROL_REVIEW'
    WHEN la.status = 'APPROVED' THEN 'APPROVED'
    WHEN la.status = 'REJECTED' THEN 'REJECTED'
  END as currentStageCode,
  CASE 
    WHEN la.status IN ('APPROVED', 'REJECTED') THEN 'COMPLETED'
    ELSE 'PENDING'
  END as status,
  COALESCE(la.submittedAt, la.createdAt) as startedAt,
  NOW() as createdAt,
  NOW() as updatedAt
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'loan_application'
WHERE la.status IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED', 'REJECTED')
  AND la.deletedAt IS NULL
  AND wi.id IS NULL; -- Only create if missing

-- Step 4: Update existing workflow instances to match loan status (fix mismatches)
UPDATE workflow_instances wi
JOIN loan_applications la ON la.id = wi.entityId AND wi.entityType = 'loan_application'
SET 
  wi.currentStageCode = CASE 
    WHEN la.status = 'COMPLIANCE_REVIEW' THEN 'COMPLIANCE_REVIEW'
    WHEN la.status = 'INTERNAL_CONTROL_REVIEW' THEN 'INTERNAL_CONTROL_REVIEW'
    WHEN la.status = 'APPROVED' THEN 'APPROVED'
    WHEN la.status = 'REJECTED' THEN 'REJECTED'
  END,
  wi.status = CASE 
    WHEN la.status IN ('APPROVED', 'REJECTED') THEN 'COMPLETED'
    ELSE 'PENDING'
  END,
  wi.updatedAt = NOW()
WHERE la.status IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED', 'REJECTED')
  AND la.deletedAt IS NULL
  AND (
    wi.currentStageCode != CASE 
      WHEN la.status = 'COMPLIANCE_REVIEW' THEN 'COMPLIANCE_REVIEW'
      WHEN la.status = 'INTERNAL_CONTROL_REVIEW' THEN 'INTERNAL_CONTROL_REVIEW'
      WHEN la.status = 'APPROVED' THEN 'APPROVED'
      WHEN la.status = 'REJECTED' THEN 'REJECTED'
    END
  );

-- Step 5: Create workflow tasks for pending workflow instances (if missing)
-- Get stage IDs
SET @compliance_stage_id = (SELECT id FROM workflow_stages WHERE code = 'COMPLIANCE_REVIEW' LIMIT 1);
SET @ic_stage_id = (SELECT id FROM workflow_stages WHERE code = 'INTERNAL_CONTROL_REVIEW' LIMIT 1);

-- Create tasks for COMPLIANCE_REVIEW stage
INSERT INTO workflow_tasks (
  id, 
  workflowInstanceId, 
  stageId, 
  status, 
  createdAt, 
  updatedAt
)
SELECT 
  UUID(),
  wi.id,
  @compliance_stage_id,
  'PENDING',
  NOW(),
  NOW()
FROM workflow_instances wi
LEFT JOIN workflow_tasks wt ON wt.workflowInstanceId = wi.id
WHERE wi.currentStageCode = 'COMPLIANCE_REVIEW'
  AND wi.status = 'PENDING'
  AND wi.entityType = 'loan_application'
  AND wt.id IS NULL; -- Only if no task exists

-- Create tasks for INTERNAL_CONTROL_REVIEW stage
INSERT INTO workflow_tasks (
  id, 
  workflowInstanceId, 
  stageId, 
  status, 
  createdAt, 
  updatedAt
)
SELECT 
  UUID(),
  wi.id,
  @ic_stage_id,
  'PENDING',
  NOW(),
  NOW()
FROM workflow_instances wi
LEFT JOIN workflow_tasks wt ON wt.workflowInstanceId = wi.id
WHERE wi.currentStageCode = 'INTERNAL_CONTROL_REVIEW'
  AND wi.status = 'PENDING'
  AND wi.entityType = 'loan_application'
  AND wt.id IS NULL; -- Only if no task exists

-- Step 6: Verify the fix
SELECT 
  '=== VERIFICATION: ALL LOANS NOW HAVE WORKFLOW INSTANCES ===' AS '---';

SELECT 
  la.applicationNumber,
  la.status as loan_status,
  wi.currentStageCode as workflow_stage,
  wi.status as workflow_status,
  COUNT(wt.id) as task_count,
  CASE 
    WHEN wi.id IS NULL THEN '❌ NO WORKFLOW'
    WHEN la.status != wi.currentStageCode THEN '⚠️ MISMATCH'
    WHEN COUNT(wt.id) = 0 AND wi.status = 'PENDING' THEN '⚠️ NO TASK'
    ELSE '✅ OK'
  END as health_status
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'loan_application'
LEFT JOIN workflow_tasks wt ON wt.workflowInstanceId = wi.id AND wt.status IN ('PENDING', 'IN_PROGRESS')
WHERE la.status IN ('COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED', 'REJECTED')
  AND la.deletedAt IS NULL
GROUP BY la.id, la.applicationNumber, la.status, wi.currentStageCode, wi.status, wi.id
ORDER BY la.submittedAt DESC;

SELECT '✅ COMPREHENSIVE WORKFLOW FIX COMPLETE' AS status;
