-- ═══════════════════════════════════════════════════════════════════════════
-- FIX EMPTY PERMISSION CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════
-- This fixes permissions that have empty or NULL category values
-- And updates recovery permissions to use RECOVERY category
-- ═══════════════════════════════════════════════════════════════════════════

-- First, let's see which permissions have empty or incorrect categories
SELECT id, code, name, category
FROM permissions
WHERE category = '' OR category IS NULL OR (code LIKE 'recovery:%' AND category != 'RECOVERY');

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Update recovery permissions to RECOVERY category
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE permissions
SET category = 'RECOVERY'
WHERE code LIKE 'recovery:%';

SELECT CONCAT('✅ Updated ', ROW_COUNT(), ' recovery permissions to RECOVERY category') AS result;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Update any other permissions with empty categories
-- ═══════════════════════════════════════════════════════════════════════════

-- Update system permissions
UPDATE permissions
SET category = 'SYSTEM_ADMINISTRATION'
WHERE (category = '' OR category IS NULL) AND code LIKE 'system:%';

-- Update user permissions
UPDATE permissions
SET category = 'USER_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'users:%';

-- Update role permissions
UPDATE permissions
SET category = 'ROLE_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'roles:%';

-- Update customer permissions
UPDATE permissions
SET category = 'CUSTOMER_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'customers:%';

-- Update loan permissions
UPDATE permissions
SET category = 'LOAN_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'loans:%';

-- Update document permissions
UPDATE permissions
SET category = 'DOCUMENT_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'documents:%';

-- Update dashboard permissions
UPDATE permissions
SET category = 'DASHBOARD_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'dashboard:%';

-- Update report permissions
UPDATE permissions
SET category = 'REPORT_MANAGEMENT'
WHERE (category = '' OR category IS NULL) AND code LIKE 'reports:%';

-- Catch-all: Update any remaining empty categories to SYSTEM_ADMINISTRATION
UPDATE permissions
SET category = 'SYSTEM_ADMINISTRATION'
WHERE category = '' OR category IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY: Check if all permissions now have valid categories
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    category,
    COUNT(*) as permission_count,
    GROUP_CONCAT(code SEPARATOR ', ') as sample_codes
FROM permissions
GROUP BY category
ORDER BY category;

-- Check if any empty categories remain
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All permissions have valid categories'
        ELSE CONCAT('⚠️ ', COUNT(*), ' permissions still have empty categories')
    END as status
FROM permissions
WHERE category = '' OR category IS NULL;

-- Show recovery permissions specifically
SELECT code, name, category
FROM permissions
WHERE code LIKE 'recovery:%'
ORDER BY sortOrder;
