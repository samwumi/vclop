-- Check loan status when LO can't add guarantors

SELECT 
  la.applicationNumber,
  la.status,
  la.submittedAt,
  COUNT(g.id) as guarantor_count,
  u.email as loan_officer,
  r.name as officer_role,
  CASE 
    WHEN la.status = 'DRAFT' THEN '✅ LO should be able to add guarantors'
    WHEN la.status != 'DRAFT' AND COUNT(g.id) = 0 THEN '⚠️ Submitted but no guarantors - only CO can add'
    ELSE '✅ Has guarantors already'
  END as analysis
FROM loan_applications la
LEFT JOIN guarantors g ON g.loanApplicationId = la.id
LEFT JOIN users u ON u.id = la.createdById
LEFT JOIN user_roles ur ON ur.userId = u.id
LEFT JOIN roles r ON r.id = ur.roleId
WHERE la.deletedAt IS NULL
GROUP BY la.id, la.applicationNumber, la.status, la.submittedAt, u.email, r.name
ORDER BY la.createdAt DESC
LIMIT 10;

-- Check a specific loan that LO can't add guarantors to
-- Replace 'LA-XXXXX' with the actual loan number
SELECT 
  'Debug specific loan' as info,
  la.applicationNumber,
  la.status,
  la.submittedAt,
  COUNT(g.id) as guarantor_count
FROM loan_applications la
LEFT JOIN guarantors g ON g.loanApplicationId = la.id
WHERE la.applicationNumber = 'LA-000035'  -- Change this
GROUP BY la.id, la.applicationNumber, la.status, la.submittedAt;
