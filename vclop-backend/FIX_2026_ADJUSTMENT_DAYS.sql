-- ============================================================================
-- FIX 2026 ADJUSTMENT DAYS
-- Reset adjustment days to 0 for 2026 entitlements
-- ============================================================================

-- Check current state
SELECT 
  '=== CURRENT ADJUSTMENT DAYS ===' as info;

SELECT 
  MIN(adjustmentDays) as min_adjustment,
  MAX(adjustmentDays) as max_adjustment,
  AVG(adjustmentDays) as avg_adjustment,
  COUNT(DISTINCT adjustmentDays) as unique_values
FROM leave_entitlements
WHERE year = 2026;

-- Reset all adjustment days to 0 for 2026
UPDATE leave_entitlements
SET adjustmentDays = 0,
    updatedAt = NOW()
WHERE year = 2026
  AND adjustmentDays != 0;

-- Verify fix
SELECT 
  '=== AFTER FIX ===' as info;

SELECT 
  MIN(adjustmentDays) as min_adjustment,
  MAX(adjustmentDays) as max_adjustment,
  SUM(adjustmentDays) as total_adjustments,
  COUNT(*) as total_records
FROM leave_entitlements
WHERE year = 2026;
