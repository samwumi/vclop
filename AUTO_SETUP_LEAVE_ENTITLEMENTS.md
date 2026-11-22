# Auto Setup Leave Entitlements

## Overview

The backend now automatically creates leave entitlements for all active users on startup if the environment variable `AUTO_SETUP_LEAVE_ENTITLEMENTS=true` is set.

## How It Works

1. On application startup (after migrations if enabled)
2. Checks if `AUTO_SETUP_LEAVE_ENTITLEMENTS=true` in environment
3. Finds all active users
4. Finds all active leave types
5. Creates missing entitlements for current year
6. Skips existing entitlements (safe to run multiple times)

## Configuration

Add to your `.env` file:

```env
AUTO_SETUP_LEAVE_ENTITLEMENTS=true
```

## What Gets Created

For each active user and each active leave type:
- **Year**: Current year (e.g., 2026)
- **Allocated Days**: Default from leave type (e.g., Annual: 21 days, Sick: 10 days)
- **Carry Forward**: 0 days
- **Adjustment**: 0 days

## Example Leave Types

Based on `leave_types` table:
- Annual Leave: 21 days
- Sick Leave: 10 days
- Compassionate Leave: 3 days
- Maternity Leave: 90 days
- Paternity Leave: 7 days
- Study Leave: 10 days
- Unpaid Leave: 30 days

## Logs

On startup, you'll see:
```
[bootstrap] Setting up leave entitlements...
[bootstrap] Leave entitlements setup complete: 42 created for 6 users
```

If entitlements already exist:
```
[bootstrap] Leave entitlements setup complete: 0 created for 6 users
```

## Safety

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Only creates missing entitlements
- **Automatic**: Runs on every startup when enabled
- **Fast**: Completes in <2 seconds for typical user counts

## Production Deployment

### Option 1: Enable on First Deploy (Recommended)

Set in your hosting platform environment variables:
```
AUTO_SETUP_LEAVE_ENTITLEMENTS=true
```

After first successful startup, you can set it to `false` to skip on subsequent restarts.

### Option 2: Run Setup Script Once

If you prefer manual control:
```bash
cd vclop-backend
npm run setup:leave-entitlements
```

Then keep `AUTO_SETUP_LEAVE_ENTITLEMENTS=false`.

## Troubleshooting

### No entitlements created

**Check logs for:**
- "Leave entitlements setup complete: 0 created"
- This means entitlements already exist

**Verify:**
```sql
SELECT COUNT(*) FROM leave_entitlements WHERE year = 2026;
```

### Users still have 0 balance

**Check if leave types exist:**
```sql
SELECT * FROM leave_types WHERE isActive = 1;
```

**Check if user is ACTIVE:**
```sql
SELECT status FROM users WHERE id = 'user_id';
```

### Error on startup

If you see errors:
1. Check database connection
2. Verify leave_types table has data
3. Check application logs for detailed error

## Disabling Auto-Setup

Set in `.env`:
```
AUTO_SETUP_LEAVE_ENTITLEMENTS=false
```

Or remove the variable entirely (defaults to false).

## Alternative: Manual SQL

If you prefer SQL over automatic setup:
```bash
mysql -u root -p vclop_db < vclop-backend/QUICK_FIX_LEAVE_BALANCE.sql
```

## Year Rollover

For new years (e.g., 2027):
- Automatic setup will create entitlements for the current year
- Previous years remain unchanged
- HR can manually adjust carry-forward amounts
