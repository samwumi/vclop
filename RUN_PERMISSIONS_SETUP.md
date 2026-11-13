# 🚀 Quick Setup - Staff Loan Permissions

## Easy Method: Run Node.js Script

### Step 1: Set Database Password
Choose one option:

**Option A: Environment Variable (Temporary)**
```powershell
$env:DB_PASSWORD="your_database_password"
node vclop-backend/run-staff-loan-permissions.js
```

**Option B: Edit .env file (Permanent)**
1. Open `vclop-backend/.env`
2. Make sure `DB_PASSWORD` is set correctly
3. Run: `node vclop-backend/run-staff-loan-permissions.js`

**Option C: Pass inline (One command)**
```powershell
cd vclop-backend
$env:DB_PASSWORD="your_password"; node run-staff-loan-permissions.js
```

---

## What This Does

✅ Creates 9 Staff Loan permissions
✅ Assigns permissions to Employee roles (for applying)
✅ Assigns permissions to HR roles (for managing)
✅ Assigns permissions to Finance roles (for disbursing)
✅ Shows verification results
✅ Shows which roles have access

---

## Expected Output

```
🔌 Connecting to database...
✅ Connected to database
📖 Reading SQL file...
📝 Found XX SQL statements to execute

✅ Statement 1: Insert successful (1 rows)
✅ Statement 2: Insert successful (1 rows)
...

📊 SUMMARY
======================================================================
✅ Successful: 9
⚠️  Skipped: 0
======================================================================

🔍 Running Verification Queries...

📋 Staff Loan Permissions Created:
┌─────────┬──────────────────────────┬─────────────────────────┬────────┐
│ (index) │ name                     │ description             │ module │
├─────────┼──────────────────────────┼─────────────────────────┼────────┤
│ 0       │ STAFF_LOANS:APPLY        │ Apply for staff loan    │ HR     │
│ 1       │ STAFF_LOANS:APPROVE      │ Approve staff loans     │ HR     │
│ 2       │ STAFF_LOANS:VIEW_ALL     │ View all staff loans    │ HR     │
│ 3       │ STAFF_LOANS:VIEW_OWN     │ View own staff loans    │ HR     │
...
└─────────┴──────────────────────────┴─────────────────────────┴────────┘

👥 Permissions Assigned to Roles:
┌─────────┬──────────────┬──────────────────────────┐
│ (index) │ role_name    │ permission_name          │
├─────────┼──────────────┼──────────────────────────┤
│ 0       │ Employee     │ STAFF_LOANS:APPLY        │
│ 1       │ Employee     │ STAFF_LOANS:VIEW_OWN     │
│ 2       │ HR Manager   │ STAFF_LOANS:APPROVE      │
...
└─────────┴──────────────┴──────────────────────────┘

🎉 Done! Staff Loan permissions have been set up.
```

---

## Troubleshooting

### Error: "Cannot find module 'mysql2'"
**Fix:**
```powershell
cd vclop-backend
npm install
```

### Error: "Access denied"
**Fix:** Check your password in `.env` file:
```
DB_PASSWORD=your_actual_password
```

### Error: "Cannot connect to database"
**Fix:** 
1. Check internet connection
2. Verify database host: `srv1461.hstgr.io`
3. Check if port 3306 is accessible

---

## Alternative: Direct Database Access

If you prefer using a GUI tool:

### Using TablePlus / MySQL Workbench / DBeaver:
1. Connect to: `srv1461.hstgr.io:3306`
2. Database: `u215495167_vclop`
3. Open file: `vclop-backend/CREATE_STAFF_LOAN_PERMISSIONS.sql`
4. Execute all statements
5. Done! ✅

### Using phpMyAdmin (if available):
1. Login to your hosting control panel
2. Open phpMyAdmin
3. Select database: `u215495167_vclop`
4. Click "SQL" tab
5. Copy/paste content from `CREATE_STAFF_LOAN_PERMISSIONS.sql`
6. Click "Go"
7. Done! ✅

---

## After Running

Once permissions are created:

1. ✅ Restart frontend (if running):
   ```powershell
   cd vclop-frontend
   npm run dev
   ```

2. ✅ Login to your app

3. ✅ Look for "**My Loans**" in the sidebar under "HR & Staff"

4. ✅ Click it and you should see the Staff Loans page!

---

## Verify It Worked

**Quick Test Query:**
```sql
SELECT name FROM Permission WHERE name LIKE 'STAFF_LOANS:%';
```

**Expected:** 9 permissions listed

**Check your access:**
```sql
SELECT 
  u.email,
  p.name as permission
FROM User u
JOIN UserRole ur ON u.id = ur.userId
JOIN Role r ON ur.roleId = r.id
JOIN RolePermission rp ON r.id = rp.roleId
JOIN Permission p ON rp.permissionId = p.id
WHERE u.email = 'your-email@example.com'
AND p.name LIKE 'STAFF_LOANS:%';
```

---

## Need Help?

Check these files:
- `INTEGRATION_COMPLETE.md` - Full troubleshooting guide
- `ACTION_PLAN_FOR_YOU.md` - Step-by-step instructions
- `STAFF_LOAN_COMPLETE_SUMMARY.md` - Feature overview

---

**That's it! You're almost done!** 🎉
