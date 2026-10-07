-- Check which loan products require guarantors/collateral
SELECT 
  code,
  name,
  CASE WHEN requiresGuarantor = 1 THEN '✅ Required' ELSE '❌ Not Required' END as guarantor_requirement,
  CASE WHEN requiresCollateral = 1 THEN '✅ Required' ELSE '❌ Not Required' END as collateral_requirement,
  isActive
FROM loan_products
ORDER BY isActive DESC, name;

-- Check recent loan applications and their guarantor count
SELECT 
  la.applicationNumber,
  lp.name as product_name,
  lp.requiresGuarantor,
  COUNT(g.id) as guarantor_count,
  la.status,
  CASE 
    WHEN lp.requiresGuarantor = 1 AND COUNT(g.id) = 0 THEN '❌ MISSING GUARANTOR'
    WHEN lp.requiresGuarantor = 0 THEN 'Not Required'
    ELSE '✅ Has Guarantor'
  END as validation_status
FROM loan_applications la
JOIN loan_products lp ON lp.id = la.loanProductId
LEFT JOIN guarantors g ON g.loanApplicationId = la.id
WHERE la.deletedAt IS NULL
  AND la.submittedAt IS NOT NULL
GROUP BY la.applicationNumber, lp.name, lp.requiresGuarantor, la.status
ORDER BY la.submittedAt DESC
LIMIT 15;
