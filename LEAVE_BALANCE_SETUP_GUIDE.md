# Leave Balance Setup Guide

## Problem: "Insufficient leave balance. Available: 0, Requested: 6"

This error means users don't have leave entitlements set up in the database. After fixing the `req.user.id` bug, the leave application system now works correctly but requires leave entitlements to be configured.

## Solution: Set Up Leave Entitlements

### Option 1: Set Up for All Active Users (Recommended)

Run this on production database:

```bash
mysql -u root -p vclop_production < SETUP_LEAVE_ENTITLEMENTS.sql
```

This will:
- Create leave entitlements for 2026
- Grant each active user their default days per leave type
- Based on the `leave_types.defaultDaysPerYear` configuration

**Example defaults:**
- Annual Leave: 21 days
- Sick Leave: 10 days
- Compassionate Leave: 3 days
- Maternity Leave: 90 days
- Paternity Leave: 7 days
- Study Leave: 10 days
- Unpaid Leave: 30 days

### Option 2: Set Up for Specific User

If you need to quickly fix one user:

1. Open `GRANT_LEAVE_BALANCE_TO_USER.sql`
2. Replace `'user@example.com'` with actual email
3. Run Step 1 to find the user ID
4. Replace `@userId = 'USER_ID_HERE'` with actual user ID
5. Run the INSERT statements
6. Verify with Step 4

### Option 3: Check Current Status First

To diagnose the current situation:

```bash
mysql -u root -p vclop_production < CHECK_LEAVE_ENTITLEMENTS.sql
```

This shows:
- Users with 0 entitlements (need setup)
- Current entitlements per user
- Available leave types
- Recent leave applications

## What Got Fixed

### Critical Bug Fix (Commit: 1ff2606f)
**Problem:** `req.user.userId` was undefined, causing 500 errors  
**Solution:** Changed to `req.user.id || req.user.userId` in:
- `leaves.controller.ts` (8 instances)
- `resources.controller.ts` (7 instances)  
- `offboarding.controller.ts` (4 instances)

**Before:**
```typescript
const userId = req.user.userId;  // ❌ undefined
```

**After:**
```typescript
const userId = req.user.id || req.user.userId;  // ✅ works
```

## Deployment Steps

### 1. Backend Code (Already Done ✅)
```bash
cd /path/to/vclop
git pull origin main
cd vclop-backend
npm run build
pm2 restart vclop-backend
```

### 2. Database Setup (Do This Now)
```bash
# Check current status
mysql -u root -p vclop_production < CHECK_LEAVE_ENTITLEMENTS.sql

# Set up entitlements for all users
mysql -u root -p vclop_production < SETUP_LEAVE_ENTITLEMENTS.sql
```

## Verification

After setup, test leave application:

1. Login as any user
2. Go to HR → Leave Management → Apply for Leave
3. Select leave type (dropdown should show types with available balance)
4. Enter dates
5. Submit - should succeed if balance is sufficient

**Expected behavior:**
- ✅ Dropdown shows leave types with balance
- ✅ Form shows available days
- ✅ Submission succeeds
- ✅ Balance decreases correctly

## Leave Types Configuration

Leave types are defined in `leave_types` table:

```sql
SELECT code, name, defaultDaysPerYear, carryForwardAllowed 
FROM leave_types 
WHERE isActive = 1;
```

To modify defaults:
```sql
UPDATE leave_types 
SET defaultDaysPerYear = 25 
WHERE code = 'ANNUAL';
```

## Year Rollover

For new year (2027), run:
```sql
-- Update the year in SETUP_LEAVE_ENTITLEMENTS.sql to 2027
-- Then run it again to create 2027 entitlements
```

## Carry Forward Logic

If `carryForwardAllowed = 1`:
- Unused days can roll to next year
- Max carry forward defined per leave type
- Auto-calculated during year transition

## HR Dashboard

HR officers can:
- View all users' leave balances
- Manually adjust balances (with reason)
- View leave history and usage patterns
- Generate leave reports

**Permission required:** `leaves:manage` or `hr.leaves.manage`

## Troubleshooting

### User still has 0 balance after setup
```sql
-- Check if entitlements exist
SELECT * FROM leave_entitlements 
WHERE userId = 'user_id' 
  AND year = 2026 
  AND deletedAt IS NULL;
```

### Leave type not showing in dropdown
```sql
-- Check if leave type is active
SELECT * FROM leave_types 
WHERE id = 'leave_type_id';

-- Check if user has entitlement for this type
SELECT * FROM leave_entitlements 
WHERE userId = 'user_id' 
  AND leaveTypeId = 'leave_type_id' 
  AND year = 2026;
```

### Balance calculation seems wrong
```sql
-- Verify calculation
SELECT 
    allocatedDays,
    usedDays,
    pendingDays,
    (allocatedDays - usedDays - pendingDays) as should_be_available
FROM leave_entitlements
WHERE id = 'entitlement_id';
```

## Support

If issues persist:
1. Check application logs: `pm2 logs vclop-backend`
2. Check database connection
3. Verify user has correct permissions
4. Ensure employment record exists (required for leave applications)

## Related Files

- `CHECK_LEAVE_ENTITLEMENTS.sql` - Diagnosis queries
- `SETUP_LEAVE_ENTITLEMENTS.sql` - Bulk setup
- `GRANT_LEAVE_BALANCE_TO_USER.sql` - Single user setup
- `vclop-backend/src/modules/hr/leaves/` - Leave management code
