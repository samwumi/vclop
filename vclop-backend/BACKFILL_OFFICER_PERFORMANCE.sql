-- ═══════════════════════════════════════════════════════════════════════════
-- BACKFILL OFFICER PERFORMANCE METRICS
-- ═══════════════════════════════════════════════════════════════════════════
-- This script recalculates and populates officer_targets.disbursementAchieved
-- for all existing disbursed loans
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Show current state (before backfill)
SELECT 
    CONCAT(u.firstName, ' ', u.lastName) as officer_name,
    ot.targetMonth,
    ot.disbursementTarget,
    ot.disbursementAchieved as current_achieved,
    ot.customerTarget,
    ot.customerAchieved
FROM officer_targets ot
JOIN users u ON u.id = ot.userId
ORDER BY ot.targetMonth DESC, u.firstName;

-- Step 2: Calculate actual disbursements per officer per month
SELECT 
    l.disbursedById as officer_id,
    CONCAT(u.firstName, ' ', u.lastName) as officer_name,
    DATE_FORMAT(l.disbursedAt, '%Y-%m-01') as target_month,
    COUNT(*) as loan_count,
    SUM(l.principal) as total_disbursed
FROM loans l
JOIN users u ON u.id = l.disbursedById
WHERE l.disbursedById IS NOT NULL
GROUP BY l.disbursedById, DATE_FORMAT(l.disbursedAt, '%Y-%m-01'), u.firstName, u.lastName
ORDER BY target_month DESC, officer_name;

-- Step 3: Insert missing officer_targets records for months with disbursements but no target record
INSERT INTO officer_targets (id, userId, targetMonth, disbursementTarget, customerTarget, disbursementAchieved, customerAchieved, createdAt, updatedAt)
SELECT 
    UUID() as id,
    l.disbursedById as userId,
    DATE_FORMAT(l.disbursedAt, '%Y-%m-01') as targetMonth,
    0 as disbursementTarget,
    0 as customerTarget,
    SUM(l.principal) as disbursementAchieved,
    0 as customerAchieved,
    NOW() as createdAt,
    NOW() as updatedAt
FROM loans l
WHERE l.disbursedById IS NOT NULL
GROUP BY l.disbursedById, DATE_FORMAT(l.disbursedAt, '%Y-%m-01')
ON DUPLICATE KEY UPDATE
    disbursementAchieved = VALUES(disbursementAchieved),
    updatedAt = NOW();

-- Step 4: Show updated state (after backfill)
SELECT 
    CONCAT(u.firstName, ' ', u.lastName) as officer_name,
    ot.targetMonth,
    ot.disbursementTarget,
    ot.disbursementAchieved as updated_achieved,
    CASE 
        WHEN ot.disbursementTarget > 0 THEN ROUND((ot.disbursementAchieved / ot.disbursementTarget * 100), 2)
        ELSE 0
    END as achievement_percentage,
    ot.customerTarget,
    ot.customerAchieved
FROM officer_targets ot
JOIN users u ON u.id = ot.userId
ORDER BY ot.targetMonth DESC, u.firstName;

-- Step 5: Verify disbursements match
SELECT 
    'Verification' as check_type,
    CONCAT(u.firstName, ' ', u.lastName) as officer_name,
    DATE_FORMAT(l.disbursedAt, '%Y-%m-01') as month,
    COUNT(*) as actual_loans,
    SUM(l.principal) as actual_disbursed,
    ot.disbursementAchieved as recorded_achieved,
    CASE 
        WHEN SUM(l.principal) = ot.disbursementAchieved THEN '✓ Match'
        ELSE '✗ Mismatch'
    END as status
FROM loans l
JOIN users u ON u.id = l.disbursedById
LEFT JOIN officer_targets ot ON ot.userId = l.disbursedById 
    AND ot.targetMonth = DATE_FORMAT(l.disbursedAt, '%Y-%m-01')
WHERE l.disbursedById IS NOT NULL
GROUP BY l.disbursedById, DATE_FORMAT(l.disbursedAt, '%Y-%m-01'), u.firstName, u.lastName, ot.disbursementAchieved
ORDER BY month DESC, officer_name;
