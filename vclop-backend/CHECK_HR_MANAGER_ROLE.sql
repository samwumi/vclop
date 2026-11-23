-- Check if HR_MANAGER role already exists
SELECT * FROM roles WHERE code = 'HR_MANAGER';

-- Check all existing roles
SELECT code, name, isActive FROM roles ORDER BY name;
