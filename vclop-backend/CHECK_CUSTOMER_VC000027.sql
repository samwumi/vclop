-- Check customer data for VC-000027
SELECT 
    customerNumber,
    firstName,
    lastName,
    businessName,
    email,
    phone
FROM customers
WHERE customerNumber = 'VC-000027';
