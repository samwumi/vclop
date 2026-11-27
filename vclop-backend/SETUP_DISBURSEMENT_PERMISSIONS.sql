-- ═══════════════════════════════════════════════════════════════════════════
-- PAYSTACK DISBURSEMENT SYSTEM - PERMISSION SETUP
-- ═══════════════════════════════════════════════════════════════════════════
-- This script creates permissions for the disbursement system and assigns them
-- to relevant roles (Accounting Officers, Accounting Head)
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Create disbursement permissions
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO permissions (id, name, code, description, category, isActive, createdAt, updatedAt) VALUES
('disbursement-view-001', 'View Disbursements', 'DISBURSEMENTS:VIEW', 'View all disbursement transactions and their status', 'DISBURSEMENT_MANAGEMENT', true, NOW(), NOW()),
('disbursement-retry-001', 'Retry Failed Disbursements', 'DISBURSEMENTS:RETRY', 'Manually retry failed disbursement transactions', 'DISBURSEMENT_MANAGEMENT', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  updatedAt = NOW();

-- Step 2: Assign permissions to Accounting Officer role
-- ───────────────────────────────────────────────────────────────────────────
-- Accounting Officers can view disbursements but not retry (view-only)
INSERT INTO role_permissions (roleId, permissionId, grantedAt)
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ACCOUNTING_OFFICER'
  AND p.code = 'DISBURSEMENTS:VIEW'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.roleId = r.id AND rp.permissionId = p.id
  );

-- Step 3: Assign full permissions to Accounting Head role
-- ───────────────────────────────────────────────────────────────────────────
-- Accounting Heads can view and retry failed disbursements
INSERT INTO role_permissions (roleId, permissionId, grantedAt)
SELECT 
  r.id,
  p.id,
  NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ACCOUNTING_HEAD'
  AND p.code IN ('DISBURSEMENTS:VIEW', 'DISBURSEMENTS:RETRY')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.roleId = r.id AND rp.permissionId = p.id
  );

-- Step 4: Verify permissions were created and assigned
-- ───────────────────────────────────────────────────────────────────────────
SELECT 
  'Disbursement Permissions Created' as status,
  COUNT(*) as count
FROM permissions 
WHERE code LIKE 'DISBURSEMENTS:%';

SELECT 
  r.name as role_name,
  r.code as role_code,
  COUNT(DISTINCT rp.permissionId) as permission_count,
  GROUP_CONCAT(p.code SEPARATOR ', ') as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
LEFT JOIN permissions p ON rp.permissionId = p.id
WHERE p.code LIKE 'DISBURSEMENTS:%'
GROUP BY r.id, r.name, r.code
ORDER BY r.name;

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. The disbursement system automatically initiates transfers when loans are disbursed
-- 2. Failed transfers can be retried from /accounting/disbursements page
-- 3. Webhooks from Paystack automatically update transfer status
-- 4. All disbursement activity is logged in disbursement_transactions table
-- ═══════════════════════════════════════════════════════════════════════════
