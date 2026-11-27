# Leave System - Quick Start Checklist ✅

## 🎯 ONE-TIME SETUP (Do This Now!)

### Step 1: Run SQL Script (5 minutes)
1. Open **phpMyAdmin**
2. Select your database
3. Click **SQL** tab
4. Open file: `vclop-backend/LEAVE_SYSTEM_FINAL_SETUP.sql`
5. Copy **ALL** content
6. Paste into phpMyAdmin
7. Click **Go** button
8. ✅ Verify you see success messages at the bottom

### Step 2: Refresh Application (1 minute)
1. Close all browser tabs
2. Open fresh tab
3. Navigate to your application
4. Log in again
5. ✅ Check sidebar - should see **"My Leaves"**

---

## 🧪 TESTING (Do This Next!)

### Test as Regular Staff:
1. Log in as a regular employee
2. Click **"My Leaves"** in sidebar
3. ✅ Should see your leave balance cards
4. Click **"Apply for Leave"** button
5. Fill the form and submit
6. ✅ Should see application in "My Applications" table

### Test as Manager:
1. Log in as a manager/supervisor
2. Check sidebar - should see both:
   - ✅ **"My Leaves"** (your own)
   - ✅ **"Leave Approvals"** (to approve others)
3. Click **"Leave Approvals"**
4. ✅ Should see pending applications
5. Click **Approve** or **Reject**
6. ✅ Application status should update

### Verify Auto-Deduction:
1. As staff, check leave balance before approval
2. As manager, approve the leave
3. As staff, refresh and check balance again
4. ✅ Used days should increase
5. ✅ Remaining days should decrease

---

## 📋 What to Expect

### All Staff Should See:
```
Sidebar → HR & Staff
  ├── HR Dashboard
  ├── My Employment
  ├── My Loans
  └── My Leaves ← Everyone sees this
```

### Only Managers/HR See:
```
Sidebar → HR & Staff
  ├── HR Dashboard
  ├── My Employment
  ├── My Loans
  ├── My Leaves
  └── Leave Approvals ← Only managers see this
```

---

## 🚨 If Something's Wrong

### Staff Can't See "My Leaves"
**Fix:** Run `LEAVE_SYSTEM_FINAL_SETUP.sql` again

### Manager Can't See "Leave Approvals"
**Check:** User must have manager/supervisor/HR role

### No Leave Balance Showing
**Check:** Already created - 352 entitlements for 44 employees exist

### Application Doesn't Submit
**Check:** Browser console (F12) for errors

### Approval Doesn't Work
**Check:** Backend logs for errors

---

## ✅ Success Checklist

- [ ] SQL script ran successfully
- [ ] All staff see "My Leaves" in sidebar
- [ ] Staff can apply for leave
- [ ] Managers see "Leave Approvals" in sidebar
- [ ] Managers can approve/reject leaves
- [ ] Days auto-deduct after approval
- [ ] HR Dashboard shows correct counts
- [ ] No errors in browser console
- [ ] No errors in backend logs

**When all boxes are checked, you're done!** 🎉

---

## 📞 Need Help?

**Files to check:**
- Complete guide: `LEAVE_SYSTEM_COMPLETE_GUIDE.md`
- Diagnostic SQL: `vclop-backend/CHECK_LEAVES_READ_PERMISSION.sql`
- Main SQL setup: `vclop-backend/LEAVE_SYSTEM_FINAL_SETUP.sql`

**Console logs to check:**
- Browser: Press F12, check Console tab
- Backend: Check terminal where backend is running

**Database to verify:**
- LeaveApplication table - should have records
- LeaveBalance table - should have 352 records
- Permission table - should have leaves:read and leaves:create
- RolePermission table - all roles should have leaves:read

---

**Last Updated:** 2026-11-27  
**Status:** System Ready ✅  
**Action Required:** Run SQL script then test!
