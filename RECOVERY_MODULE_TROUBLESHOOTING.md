# Recovery Module Troubleshooting Guide

## Issue: "Failed to load data" Error

You're seeing the Recovery module in navigation but getting "Failed to load data" error.

---

## ✅ Quick Diagnosis Steps

### 1. Check Backend is Running

**Open browser DevTools** (F12) and check the **Console** tab for the actual error message.

Common errors:
- `404 Not Found` → Backend route not registered
- `401 Unauthorized` → Not logged in or session expired
- `403 Forbidden` → Missing permissions
- `500 Internal Server Error` → Backend crash or database issue
- `ERR_CONNECTION_REFUSED` → Backend not running

### 2. Check Network Tab

1. Open **DevTools** → **Network** tab
2. Refresh the Recovery Accounts page
3. Look for the API call to `/api/v1/recovery/accounts`
4. Click on it to see the response

**Look for:**
- Status code (should be 200)
- Response body (error message)
- Request headers (auth token present?)

---

## 🔧 Common Fixes

### Fix 1: Backend Not Restarted

The backend needs to be restarted after database changes.

**Restart backend:**
```bash
# On your server
pm2 restart vclop-backend

# Or if using npm directly
cd vclop-backend
npm run start:prod
```

**Check if backend is running:**
```bash
pm2 status
# or
pm2 logs vclop-backend
```

### Fix 2: Database Enum Not Updated

If you see errors about "Value '' not found in enum", the database enum wasn't updated.

**Run this SQL in phpMyAdmin:**
```sql
-- Check current enum values
SHOW COLUMNS FROM permissions WHERE Field = 'category';

-- If RECOVERY is missing, run:
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

-- Update recovery permissions
UPDATE permissions
SET category = 'RECOVERY'
WHERE code LIKE 'recovery:%';
```

### Fix 3: Missing Permissions

Your user might not have the `recovery:accounts_read` permission.

**Check your permissions:**
```sql
-- Check your user's recovery permissions
SELECT 
    u.email,
    p.code,
    p.name
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE u.email = 'your-email@example.com'
AND p.code LIKE 'recovery:%'
ORDER BY p.code;
```

If no results, assign permissions via Roles page or SQL:
```sql
-- Get your role ID
SELECT id, name FROM roles WHERE name = 'System Administrator';

-- Assign all recovery permissions
INSERT INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), 'YOUR_ROLE_ID_HERE', id, NOW()
FROM permissions
WHERE code LIKE 'recovery:%'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE roleId = 'YOUR_ROLE_ID_HERE' AND permissionId = permissions.id
);
```

### Fix 4: Recovery Module Not Deployed

Make sure you pulled the latest code from GitHub.

**On your server:**
```bash
cd /path/to/vclop
git pull origin main
pm2 restart vclop-backend
```

**Check git status:**
```bash
git log --oneline -5
# Should show recent commits including "feat: Add Recovery module routes"
```

---

## 🔍 Detailed Diagnostics

### Check Backend Logs

```bash
# View logs
pm2 logs vclop-backend --lines 50

# Or if using systemd
journalctl -u vclop-backend -n 50 -f
```

**Look for errors like:**
- `TypeError: Cannot read property 'findMany'` → Prisma client not regenerated
- `PrismaClientKnownRequestError` → Database schema mismatch
- `Invalid enum value` → Category enum not updated

### Check Database Tables

```sql
-- Verify recovery tables exist
SHOW TABLES LIKE 'recovery_%';

-- Should show:
-- recovery_accounts
-- recovery_activities
-- recovery_documents
-- recovery_expenses
-- recovery_payments
-- repayment_promises

-- Check if tables are empty (expected on first run)
SELECT COUNT(*) FROM recovery_accounts;
```

### Test API Endpoint Directly

Use curl or Postman to test the API:

```bash
# Get your auth token from browser DevTools → Application → Local Storage
# Copy the 'accessToken' value

curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://your-domain.com/api/v1/recovery/accounts
```

Expected response:
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 25
  }
}
```

---

## 📝 Quick Checklist

Before asking for help, verify:

- [ ] Backend is running (`pm2 status` shows "online")
- [ ] Latest code deployed (`git log` shows recovery commits)
- [ ] Database tables created (run `SHOW TABLES LIKE 'recovery_%'`)
- [ ] RECOVERY enum added to permissions table
- [ ] Recovery permissions exist (`SELECT * FROM permissions WHERE code LIKE 'recovery:%'`)
- [ ] Your role has recovery permissions (check via Roles page or SQL)
- [ ] Browser console shows actual error message
- [ ] Network tab shows the failed API request

---

## 🆘 Still Not Working?

### Copy this diagnostic info:

1. **Backend logs:**
   ```bash
   pm2 logs vclop-backend --lines 20 --nostream
   ```

2. **Browser console error** (screenshot or copy full error)

3. **Network tab** (screenshot of failed API request)

4. **Database check:**
   ```sql
   SELECT COUNT(*) as table_count 
   FROM information_schema.tables 
   WHERE table_schema = DATABASE() 
   AND table_name LIKE 'recovery_%';
   ```

5. **Permission check:**
   ```sql
   SELECT COUNT(*) FROM permissions WHERE code LIKE 'recovery:%';
   ```

Share this information for faster troubleshooting!

---

## ✅ Success Indicators

Once everything is working, you should see:

- ✅ Recovery module in sidebar
- ✅ Empty list with "No recovery accounts found" message
- ✅ "New Account" button visible
- ✅ Filter dropdowns working
- ✅ No errors in browser console
- ✅ API calls returning 200 status

Then you can start importing recovery accounts!

---

**Most Common Issue:** Backend not restarted after database changes. Always restart after running SQL migrations!
