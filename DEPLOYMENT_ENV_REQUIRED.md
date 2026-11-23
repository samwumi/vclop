# ⚠️ REQUIRED: Set Environment Variable for Deployment

## Critical Environment Variable

Your hosting platform needs this environment variable set:

```
AUTO_SETUP_LEAVE_ENTITLEMENTS=true
```

## Where to Set It

### Hostinger / cPanel / Similar:
1. Go to your hosting control panel
2. Find "Environment Variables" or ".env Configuration"
3. Add: `AUTO_SETUP_LEAVE_ENTITLEMENTS` = `true`
4. Save and redeploy

### Render / Railway / Heroku:
1. Go to your app dashboard
2. Settings → Environment Variables
3. Add: `AUTO_SETUP_LEAVE_ENTITLEMENTS` = `true`
4. Save (auto-redeploys)

### Direct Server Access:
Edit `.env` file:
```bash
nano /path/to/vclop/vclop-backend/.env
```

Add line:
```
AUTO_SETUP_LEAVE_ENTITLEMENTS=true
```

Restart app:
```bash
pm2 restart vclop-backend
```

## What This Does

On next startup, the application will:
1. Check all active users
2. Check all leave types
3. Create missing leave entitlements for current year
4. Log how many were created

**Result:** Users will have leave balances and can apply for leave!

## Verification

After deployment, check logs for:
```
[bootstrap] Setting up leave entitlements...
[bootstrap] Leave entitlements setup complete: 42 created for 6 users
```

Then test leave application - should work without "Insufficient balance" error.

## After First Successful Run

You can optionally set to `false` to skip on future restarts:
```
AUTO_SETUP_LEAVE_ENTITLEMENTS=false
```

But it's safe to leave as `true` - it only creates missing entitlements.
