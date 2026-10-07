-- ============================================================================
-- FIX: Create workflow instances for LA-000032 and LA-000033
-- These loans were created after the comprehensive fix and are missing workflows
-- ============================================================================

-- Get workflow definition ID
SET @workflow_id = (SELECT id FROM workflow_definitions WHERE code = 'loan-application-production' LIMIT 1);

-- Get stage IDs
SET @ic_stage_id = (SELECT id FROM workflow_stages WHERE code = 'INTERNAL_CONTROL_REVIEW' LIMIT 1);

-- Create workflow instance for LA-000032
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
WHERE la.applicationNumber = 'LA-000032'
AND NOT EXISTS (
    SELECT 1 FROM workflow_instances wi 
    WHERE wi.entityId = la.id 
    AND wi.entityType = 'loan_application'
);

-- Create task for LA-000032
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
JOIN loan_applications la ON la.id = wi.entityId
WHERE la.applicationNumber = 'LA-000032'
AND wi.entityType = 'loan_application'
AND NOT EXISTS (
    SELECT 1 FROM workflow_tasks wt 
    WHERE wt.workflowInstanceId = wi.id
);

-- Create workflow instance for LA-000033
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
WHERE la.applicationNumber = 'LA-000033'
AND NOT EXISTS (
    SELECT 1 FROM workflow_instances wi 
    WHERE wi.entityId = la.id 
    AND wi.entityType = 'loan_application'
);

-- Create task for LA-000033
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
JOIN loan_applications la ON la.id = wi.entityId
WHERE la.applicationNumber = 'LA-000033'
AND wi.entityType = 'loan_application'
AND NOT EXISTS (
    SELECT 1 FROM workflow_tasks wt 
    WHERE wt.workflowInstanceId = wi.id
);

-- Verify the fix
SELECT 
    la.applicationNumber,
    la.status,
    CASE WHEN wi.id IS NULL THEN '❌ STILL MISSING' ELSE '✅ FIXED' END as workflow_status,
    COUNT(wt.id) as task_count
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'loan_application'
LEFT JOIN workflow_tasks wt ON wt.workflowInstanceId = wi.id
WHERE la.applicationNumber IN ('LA-000032', 'LA-000033')
GROUP BY la.applicationNumber, la.status, wi.id;

SELECT '✅ Workflow instances created for LA-000032 and LA-000033' as status;
