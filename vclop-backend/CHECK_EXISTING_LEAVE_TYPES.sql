-- Check existing leave types
SELECT 
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  requiresApproval,
  isActive,
  sortOrder
FROM leave_types
ORDER BY sortOrder, name;
