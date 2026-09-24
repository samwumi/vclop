-- ============================================================================
-- COMPLETE FIX: Remove ACCOUNTING_REVIEW + Clean up broken instances
-- ============================================================================

-- Step 1: Find the workflow definition ID
SET @workflow_id = (SELECT id FROM workflow_definitions WHERE code = 'LOAN_APPROVAL' LIMIT 1);

-- Step 2: Find the ACCOUNTING_REVIEW stage ID
SET @accounting_review_stage_id = (
  SELECT id FROM workflow_stages 
  WHERE workflowDefinitionId = @workflow_id
  AND code = 'ACCOUNTING_REVIEW' 
  LIMIT 1
);

-- Step 3: Delete workflow instances stuck on ACCOUNTING_REVIEW stage
DELETE FROM workflow_instances
WHERE currentStageCode = 'ACCOUNTING_REVIEW' 
  AND workflowDefinitionId = @workflow_id;

-- Step 4: Delete transitions involving ACCOUNTING_REVIEW stage
DELETE FROM workflow_transitions 
WHERE fromStageId = @accounting_review_stage_id 
OR toStageId = @accounting_review_stage_id;

-- Step 5: Delete the ACCOUNTING_REVIEW stage
DELETE FROM workflow_stages 
WHERE id = @accounting_review_stage_id;

-- Step 6: Find INTERNAL_CONTROL_REVIEW and APPROVED stage IDs
SET @ic_stage_id = (
  SELECT id FROM workflow_stages 
  WHERE workflowDefinitionId = @workflow_id
  AND code = 'INTERNAL_CONTROL_REVIEW' 
  LIMIT 1
);

SET @approved_stage_id = (
  SELECT id FROM workflow_stages 
  WHERE workflowDefinitionId = @workflow_id
  AND code = 'APPROVED' 
  LIMIT 1
);

-- Step 7: Create direct transition from IC to APPROVED
INSERT IGNORE INTO workflow_transitions (fromStageId, toStageId, action, requiresReason)
VALUES (@ic_stage_id, @approved_stage_id, 'APPROVE', false);

-- Step 8: Update sort order for remaining stages
UPDATE workflow_stages 
SET sortOrder = 3 
WHERE workflowDefinitionId = @workflow_id 
AND code = 'APPROVED';

UPDATE workflow_stages 
SET sortOrder = 4 
WHERE workflowDefinitionId = @workflow_id 
AND code = 'REJECTED';

-- Step 9: Verify the fix
SELECT '=== WORKFLOW STAGES ===' AS '---';
SELECT 
  code,
  name,
  sortOrder,
  requiredPermission,
  isTerminal
FROM workflow_stages
WHERE workflowDefinitionId = @workflow_id
ORDER BY sortOrder;

SELECT '=== WORKFLOW TRANSITIONS ===' AS '---';
SELECT 
  ws1.code AS from_stage,
  ws2.code AS to_stage,
  wt.action
FROM workflow_transitions wt
JOIN workflow_stages ws1 ON wt.fromStageId = ws1.id
JOIN workflow_stages ws2 ON wt.toStageId = ws2.id
WHERE ws1.workflowDefinitionId = @workflow_id
ORDER BY ws1.sortOrder;

SELECT '✅ ACCOUNTING_REVIEW stage removed' AS status;
SELECT '✅ Broken workflow instances cleaned up' AS status;
SELECT '✅ IC now approves directly to APPROVED' AS status;
