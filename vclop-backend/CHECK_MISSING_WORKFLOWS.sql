-- ============================================================================
-- CHECK: Which loan applications are missing workflow instances?
-- ============================================================================

-- 1. Check recent loan applications and their workflow status
SELECT 
  la.id,
  la.applicationNumber,
  la.status,
  la.submittedAt,
  la.createdAt,
  CASE WHEN wi.id IS NULL THEN '❌ NO WORKFLOW' ELSE '✅ Has Workflow' END as workflow_status,
  wi.id as workflow_instance_id,
  wi.currentStageCode
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id 
  AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.deletedAt IS NULL
ORDER BY la.createdAt DESC
LIMIT 20;

-- 2. Count applications by status that are missing workflows
SELECT 
  la.status,
  COUNT(*) as total_applications,
  SUM(CASE WHEN wi.id IS NULL THEN 1 ELSE 0 END) as missing_workflows,
  SUM(CASE WHEN wi.id IS NOT NULL THEN 1 ELSE 0 END) as has_workflows
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id 
  AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.deletedAt IS NULL
GROUP BY la.status
ORDER BY la.status;

-- 3. Check if workflow definition exists and is active
SELECT 
  'Workflow Definition Status' as check_type,
  id,
  code,
  entityType,
  isActive,
  (SELECT COUNT(*) FROM workflow_stages WHERE workflowDefinitionId = workflow_definitions.id) as stage_count
FROM workflow_definitions
WHERE entityType = 'LOAN_APPLICATION';

-- 4. Find the specific workflow instance being looked for
SELECT 
  'Searching for workflow 7bf1cab7-c5ca-4a6e-bab3-f728e3c8d8f7' as search_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM workflow_instances WHERE id = '7bf1cab7-c5ca-4a6e-bab3-f728e3c8d8f7') 
    THEN '✅ Workflow exists'
    ELSE '❌ Workflow NOT FOUND'
  END as result;

-- 5. If it exists, show details
SELECT 
  wi.*,
  la.applicationNumber,
  la.status as loan_status
FROM workflow_instances wi
LEFT JOIN loan_applications la ON la.id = wi.entityId
WHERE wi.id = '7bf1cab7-c5ca-4a6e-bab3-f728e3c8d8f7';
