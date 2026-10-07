-- Find which loan/application has this missing workflow instance
SELECT 
  la.applicationNumber,
  la.status as app_status,
  l.loanNumber,
  l.status as loan_status,
  wi.id as workflow_instance_id,
  wi.status as workflow_status
FROM loan_applications la
LEFT JOIN loans l ON l.loanApplicationId = la.id
LEFT JOIN workflow_instances wi ON wi.entityId = la.id AND wi.entityType = 'LoanApplication'
WHERE wi.id = '09457621-d010-4ea8-acb3-0c5480a1e9ed'
   OR la.id IN (
     SELECT entityId FROM workflow_instances WHERE id = '09457621-d010-4ea8-acb3-0c5480a1e9ed'
   );

-- If the above returns nothing, check if the workflow instance exists at all
SELECT 
  wi.id,
  wi.entityType,
  wi.entityId,
  wi.status,
  wi.createdAt,
  la.applicationNumber
FROM workflow_instances wi
LEFT JOIN loan_applications la ON la.id = wi.entityId AND wi.entityType = 'LoanApplication'
WHERE wi.id = '09457621-d010-4ea8-acb3-0c5480a1e9ed';

-- Check for loan applications without workflow instances
SELECT 
  la.id,
  la.applicationNumber,
  la.status,
  la.submittedAt,
  COUNT(wi.id) as workflow_count
FROM loan_applications la
LEFT JOIN workflow_instances wi ON wi.entityId = la.id 
  AND wi.entityType = 'LoanApplication' 
  AND wi.deletedAt IS NULL
WHERE la.status IN ('SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVED')
  AND la.deletedAt IS NULL
GROUP BY la.id, la.applicationNumber, la.status, la.submittedAt
HAVING COUNT(wi.id) = 0
ORDER BY la.submittedAt DESC;
