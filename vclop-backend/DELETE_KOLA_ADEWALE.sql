-- ============================================================================
-- DELETE CUSTOMER: Kola Adewale (VC-000009, phone: 07062209481)
-- ============================================================================

SET @customer_id = '150587fc-bbf8-4cef-86df-55953c9b1cf5';

-- Delete customer documents
DELETE FROM customer_documents WHERE customerId = @customer_id;
SELECT CONCAT('Deleted ', ROW_COUNT(), ' customer document(s)') as result;

-- Delete customer
DELETE FROM customers WHERE id = @customer_id;
SELECT CONCAT('Deleted ', ROW_COUNT(), ' customer(s)') as result;

SELECT 'Customer Kola Adewale (07062209481) permanently deleted' as final_result;
