-- ═══════════════════════════════════════════════════════════════════════════
-- ADD RECOVERY TO PERMISSION CATEGORY ENUM
-- ═══════════════════════════════════════════════════════════════════════════
-- This adds 'RECOVERY' as a valid value to the category enum in permissions table
-- ═══════════════════════════════════════════════════════════════════════════

-- First, let's see the current enum definition
SHOW COLUMNS FROM permissions WHERE Field = 'category';

-- ═══════════════════════════════════════════════════════════════════════════
-- ALTER the enum to include RECOVERY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE permissions 
MODIFY COLUMN category ENUM(
    'USER_MANAGEMENT',
    'ROLE_MANAGEMENT',
    'PERMISSION_MANAGEMENT',
    'BRANCH_MANAGEMENT',
    'DEPARTMENT_MANAGEMENT',
    'SETTINGS_MANAGEMENT',
    'AUDIT_MANAGEMENT',
    'DASHBOARD_MANAGEMENT',
    'REPORT_MANAGEMENT',
    'NOTIFICATION_MANAGEMENT',
    'SYSTEM_ADMINISTRATION',
    'FORMS_MANAGEMENT',
    'CUSTOMER_MANAGEMENT',
    'DOCUMENT_MANAGEMENT',
    'LOAN_MANAGEMENT',
    'VIRTUAL_ACCOUNT_MANAGEMENT',
    'RECOVERY'
) NOT NULL DEFAULT 'SYSTEM_ADMINISTRATION';

-- ═══════════════════════════════════════════════════════════════════════════
-- Now update recovery permissions to RECOVERY category
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE permissions
SET category = 'RECOVERY'
WHERE code LIKE 'recovery:%';

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY: Check the enum was updated and permissions were set correctly
-- ═══════════════════════════════════════════════════════════════════════════

-- Show the updated enum definition
SHOW COLUMNS FROM permissions WHERE Field = 'category';

-- Show all recovery permissions with their categories
SELECT code, name, category
FROM permissions
WHERE code LIKE 'recovery:%'
ORDER BY sortOrder;

-- Count by category
SELECT category, COUNT(*) as count
FROM permissions
GROUP BY category
ORDER BY category;

-- Success message
SELECT '✅ RECOVERY category added to enum and all recovery permissions updated!' AS status;
