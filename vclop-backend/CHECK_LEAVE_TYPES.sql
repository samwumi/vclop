-- Check existing leave types
SELECT id, name, code, description, defaultDaysPerYear, isActive
FROM leave_types
ORDER BY sortOrder, name;

-- Check if we have compassionate and education leave types
SELECT * FROM leave_types 
WHERE code IN ('COMPASSIONATE', 'EDUCATION', 'ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY');
