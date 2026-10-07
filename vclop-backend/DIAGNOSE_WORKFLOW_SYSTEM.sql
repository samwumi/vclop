-- ============================================================================
-- DIAGNOSE: Why aren't workflows being created automatically?
-- ============================================================================

-- 1. Check if workflow definition exists and is active
SELECT 
  'Workflow Definition' as check_type,
  id,
  code,
  entityType,
  isActive,
  CASE WHEN isActive = 1 THEN '✅ Active' ELSE '❌ INACTIVE' END as status
FROM workflow_definitions 
WHERE code = 'loan-application-production' AND entityType = 'LOAN_APPLICATION';

-- 2. Check if workflow has an initial stage
SELECT 
  'Initial Stage' as check_type,
  ws.id,
  ws.code,
  ws.name,
  ws.isInitial,
  ws.requiredPermission,
  CASE WHEN ws.isInitial = 1 THEN '✅ Is Initial' ELSE '❌ NOT INITIAL' END as status
FROM workflow_stages ws
JOIN workflow_definitions wd ON wd.id = ws.workflowDefinitionId
WHERE wd.code = 'loan-application-production' 
  AND wd.entityType = 'LOAN_APPLICATION'
ORDER BY ws.createdAt;

-- 3. Check recent loan applications and their workflow status
SELECT 
  'Recent Loans' as check_type,
  la.applicationNumber,
  la.status,
  la.submittedAt,
  CASE WHEN wi.id IS NULL THEN '❌ NO WORKFLOW' ELSE '✅ Has Workflow' END as workflow_status,
  wi.currentStageCode,
  COUNT(wt.id) as task_count
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id 
  AND wi.entityType = 'LOAN_APPLICATION'
LEFT JOIN workflow_tasks wt ON wt.workflowInstanceId = wi.id
WHERE la.deletedAt IS NULL
  AND la.submittedAt IS NOT NULL
GROUP BY la.applicationNumber, la.status, la.submittedAt, wi.id, wi.currentStageCode
ORDER BY la.submittedAt DESC
LIMIT 10;

-- 4. Find all loans missing workflows (should be ZERO)
SELECT 
  'Missing Workflows' as check_type,
  la.applicationNumber,
  la.status,
  la.submittedAt,
  la.submittedById
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id 
  AND wi.entityType = 'LOAN_APPLICATION'
WHERE la.status IN ('SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED', 'DISBURSED')
  AND la.deletedAt IS NULL
  AND la.submittedAt IS NOT NULL
  AND wi.id IS NULL
ORDER BY la.submittedAt DESC;

-- 5. Check if entityType is case-sensitive issue
SELECT DISTINCT
  'Entity Type Check' as check_type,
  wi.entityType,
  COUNT(*) as count
FROM workflow_instances wi
GROUP BY wi.entityType;
