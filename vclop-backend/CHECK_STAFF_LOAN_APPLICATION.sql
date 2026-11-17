-- Check if loan was created for samwumi91@gmail.com
SELECT 
    sl.id,
    sl.loanNumber,
    sl.status,
    sl.requestedAmount,
    sl.principalAmount,
    sl.tenureMonths,
    sl.monthlyInstallment,
    sl.purpose,
    sl.justification,
    sl.createdAt,
    u.email,
    u.firstName,
    u.lastName
FROM staff_loans sl
INNER JOIN users u ON sl.userId = u.id
WHERE u.email = 'samwumi91@gmail.com'
ORDER BY sl.createdAt DESC
LIMIT 5;

-- Check total count
SELECT COUNT(*) as total_loans 
FROM staff_loans sl
INNER JOIN users u ON sl.userId = u.id
WHERE u.email = 'samwumi91@gmail.com';
