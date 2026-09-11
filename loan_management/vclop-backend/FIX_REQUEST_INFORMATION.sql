-- =====================================================================
-- Fix REQUEST_INFORMATION workflow issue
-- =====================================================================
-- This adds REQUEST_INFORMATION as an allowed action in the workflow
-- so it bypasses workflow validation
-- =====================================================================

USE vclop;

-- Get the workflow definition ID
SET @workflowId = (SELECT id FROM workflow_definitions WHERE code = 'loan-application-production' LIMIT 1);

-- Get the COMPLIANCE_REVIEW stage ID
SET @complianceStageId = (SELECT id FROM workflow_stages WHERE workflowDefinitionId = @workflowId AND code = 'COMPLIANCE_REVIEW' LIMIT 1);

-- Add REQUEST_INFORMATION as an allowed action for COMPLIANCE_REVIEW stage
UPDATE workflow_stages 
SET allowedActions = JSON_ARRAY('APPROVE', 'REJECT', 'REQUEST_INFORMATION')
WHERE id = @complianceStageId;

-- Verify the change
SELECT 
    ws.code AS stage_code,
    ws.name AS stage_name,
    ws.allowedActions
FROM workflow_stages ws
WHERE ws.workflowDefinitionId = @workflowId
  AND ws.code = 'COMPLIANCE_REVIEW';

-- Expected output should show:
-- stage_code         | stage_name                       | allowedActions
-- COMPLIANCE_REVIEW  | Underwriter / Compliance Review  | ["APPROVE", "REJECT", "REQUEST_INFORMATION"]

SELECT '✅ REQUEST_INFORMATION added to allowed actions' AS status;
