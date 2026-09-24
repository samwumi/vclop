-- Clean up workflow instances pointing to deleted ACCOUNTING_REVIEW stage
-- This fixes the "Workflow instance not found" error for existing loans

-- 1. Check which loans have broken workflow instances
SELECT 
  la.applicationNumber,
  la.status,
  la.currentWorkflowInstanceId,
  wi.id as workflow_instance_id,
  wi.currentStageId,
  ws.name as stage_name
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.id = la.currentWorkflowInstanceId
LEFT JOIN workflow_stages ws ON ws.id = wi.currentStageId
WHERE la.currentWorkflowInstanceId IS NOT NULL 
  AND wi.id IS NULL;

-- 2. Clear the broken workflow instance references
-- (This allows the system to create new workflow instances with the updated stages)
UPDATE loan_applications
SET currentWorkflowInstanceId = NULL
WHERE currentWorkflowInstanceId IS NOT NULL
  AND currentWorkflowInstanceId NOT IN (SELECT id FROM workflow_instances);

-- 3. Verify the fix
SELECT 
  applicationNumber,
  status,
  currentWorkflowInstanceId
FROM loan_applications
WHERE currentWorkflowInstanceId IS NULL
  AND status IN ('PENDING', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED');
