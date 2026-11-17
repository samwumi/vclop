-- Find ALL employment records for samwumi@gmail.com (not just current ones)

SELECT 
    ep.id,
    ep.userId,
    ep.jobTitle,
    ep.salary,
    ep.hireDate,
    ep.isCurrent,
    ep.terminationDate,
    ep.submissionStatus,
    ep.isEditable,
    ep.createdAt,
    d.name as department,
    b.name as branch
FROM employment_periods ep
JOIN users u ON ep.userId = u.id
LEFT JOIN departments d ON ep.departmentId = d.id
LEFT JOIN branches b ON ep.branchId = b.id
WHERE u.email = 'samwumi@gmail.com'
ORDER BY ep.createdAt DESC;
