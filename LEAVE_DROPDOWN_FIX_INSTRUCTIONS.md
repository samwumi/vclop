# Leave Type Dropdown - Fix Instructions

## Problem
The leave type dropdown was empty because:
1. ❌ Backend endpoint `/hr/leaves/types` was missing
2. ❌ No leave types existed in the database

## ✅ Solution Applied

### 1. Backend Endpoint Added
- **Endpoint**: `GET /api/v1/hr/leaves/types`
- **Controller**: `leaves.controller.ts` - Added `getLeaveTypes()` method
- **Service**: `leaves.service.ts` - Added method to fetch active leave types
- **Returns**: All active leave types sorted by sortOrder

### 2. Frontend Updated
- **Service**: `leaves.service.ts`
- **Changed from**: `/hr/leave-types` (non-existent)
- **Changed to**: `/api/v1/hr/leaves/types` (new endpoint)

### 3. Database Script Ready
- **File**: `ADD_LEAVE_TYPES_NOW.sql`
- **Contains**: All 7 leave categories with proper configuration

## 🎯 How to Fix the Dropdown

### Step 1: Wait for Deployment
The code changes are now deployed. The backend endpoint is live.

### Step 2: Add Leave Types to Database

**Option A: Using phpMyAdmin**
1. Open phpMyAdmin
2. Select your database
3. Click "SQL" tab
4. Copy and paste the content of `ADD_LEAVE_TYPES_NOW.sql`
5. Click "Go" to execute

**Option B: Using Command Line**
```bash
mysql -u your_username -p your_database < vclop-backend/ADD_LEAVE_TYPES_NOW.sql
```

**Option C: Using Database Client** (DBeaver, MySQL Workbench, etc.)
1. Open the database client
2. Connect to your database
3. Open `ADD_LEAVE_TYPES_NOW.sql`
4. Execute the script

### Step 3: Verify
After running the SQL:

1. Check database:
```sql
SELECT name, code, defaultDaysPerYear, isActive 
FROM leave_types 
WHERE isActive = 1 
ORDER BY sortOrder;
```

You should see 7 leave types:
- Annual Leave (ANNUAL) - 21 days
- Sick Leave (SICK) - 12 days
- Compassionate Leave (COMPASSIONATE) - 5 days
- Education/Study Leave (EDUCATION) - 10 days
- Maternity Leave (MATERNITY) - 90 days
- Paternity Leave (PATERNITY) - 14 days
- Unpaid Leave (UNPAID) - 30 days

2. Refresh the leave application page
3. The dropdown should now show all 7 options

## 📋 SQL Script Preview

The script uses `ON DUPLICATE KEY UPDATE` to prevent errors if you run it multiple times:

```sql
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, requiresApproval, minNoticeDays,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Annual Leave', 'ANNUAL',
  'Regular annual vacation leave',
  21, 1, 1, 7, 1, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;
```

## 🔍 Troubleshooting

### Dropdown Still Empty?

1. **Check deployment status**
   - Ensure latest build is deployed
   - Check browser console for API errors

2. **Verify endpoint works**
   ```
   GET https://your-domain.com/api/v1/hr/leaves/types
   ```
   Should return JSON array of leave types

3. **Check database**
   ```sql
   SELECT COUNT(*) FROM leave_types WHERE isActive = 1;
   ```
   Should return 7 (after running SQL script)

4. **Clear cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache
   - Restart backend if needed

### API Returns Empty Array?

- Run `SELECT * FROM leave_types;` to verify data exists
- Check `isActive = 1` on all records
- Verify database connection in backend

### Permission Errors?

- Ensure you have `leaves:read` permission
- Check JWT token is valid
- Verify authentication headers

## ✅ Success Indicators

Once fixed, you should see:

1. **Dropdown populated** with 7 leave types
2. **Description appears** below dropdown when type is selected
3. **Balance displays** after selecting leave type
4. **No console errors** in browser developer tools

## 📞 Support

If issues persist:
1. Check backend logs for errors
2. Check browser console for API call failures
3. Verify SQL script executed successfully (check row count)
4. Ensure deployment completed without errors

---

**Status**: Code deployed ✅ | SQL script ready ✅ | Action required: Run SQL script
