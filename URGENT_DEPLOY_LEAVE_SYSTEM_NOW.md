# 🚨 URGENT: Deploy Leave System NOW - Staff Are Waiting

**Status:** Code pushed to main (commit `4a8420fc`)  
**Deployment:** Will auto-deploy from GitHub push  
**Critical Action Required:** Run database migration immediately

---

## ⚠️ CRITICAL: Run This SQL First (Before Deployment Completes)

```sql
-- ============================================================
-- URGENT: Add reliever field to leave_applications
-- Run this on production database NOW
-- ============================================================

-- Step 1: Add the reliever column
ALTER TABLE `leave_applications` 
  ADD COLUMN `relieverId` VARCHAR(36) NULL 
  AFTER `emergencyPhone`;

-- Step 2: Add foreign key constraint
ALTER TABLE `leave_applications` 
  ADD CONSTRAINT `leave_applications_relieverId_fkey` 
  FOREIGN KEY (`relieverId`) REFERENCES `users`(`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Step 3: Add index for performance
CREATE INDEX `leave_applications_relieverId_idx` 
  ON `leave_applications`(`relieverId`);

-- ============================================================
-- Verification: Check migration was successful
-- ============================================================

-- Should return 1 row showing relieverId column
SHOW COLUMNS FROM leave_applications LIKE 'relieverId';

-- Should show the new foreign key
SHOW CREATE TABLE leave_applications;
```

---

## 📊 Pre-Deployment Checklist

Before staff can use the system, verify these prerequisites:

### 1. **Leave Entitlements Exist for 2026**
```sql
-- Check if users have entitlements for current year
SELECT 
  COUNT(DISTINCT userId) as users_with_entitlements,
  COUNT(*) as total_entitlements
FROM leave_entitlements 
WHERE year = 2026;

-- If count is 0, run the entitlement creation SQL from previous commits
```

If no entitlements exist, **STAFF CANNOT APPLY** - run this immediately:

```sql
-- Create entitlements for all active users for 2026
INSERT INTO leave_entitlements (id, userId, leaveTypeId, year, allocatedDays, carryForwardDays, adjustmentDays, usedDays, createdAt, updatedAt, createdById)
SELECT 
  UUID(), 
  u.id, 
  lt.id, 
  2026, 
  lt.defaultDaysPerYear, 
  0, 
  30, 
  0, 
  NOW(), 
  NOW(), 
  u.id
FROM users u 
CROSS JOIN leave_types lt
WHERE u.deletedAt IS NULL 
  AND u.status = 'ACTIVE' 
  AND lt.isActive = 1
  AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements le 
    WHERE le.userId = u.id 
      AND le.leaveTypeId = lt.id 
      AND le.year = 2026
  );

-- Verify creation
SELECT COUNT(*) as new_entitlements FROM leave_entitlements WHERE year = 2026;
```

### 2. **HR Manager Role Active**
```sql
-- Check HR_MANAGER role status
SELECT id, name, code, isActive FROM roles WHERE code = 'HR_MANAGER';

-- If isActive = 0, activate it:
UPDATE roles SET isActive = 1 WHERE code = 'HR_MANAGER';
```

### 3. **HR Permissions Assigned**
```sql
-- Check HR_MANAGER has leave permissions
SELECT 
  r.code as role_code,
  COUNT(rp.permissionId) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.roleId
WHERE r.code = 'HR_MANAGER'
GROUP BY r.code;

-- If count is low, assign permissions:
SET @hrRoleId = (SELECT id FROM roles WHERE code = 'HR_MANAGER');

INSERT IGNORE INTO role_permissions (id, roleId, permissionId, createdAt)
SELECT UUID(), @hrRoleId, p.id, NOW()
FROM permissions p 
WHERE p.code IN (
  'leaves:read',
  'leaves:manage', 
  'leaves:approve',
  'users:read'
);
```

### 4. **Users Have Department Assignment**
```sql
-- Check how many users lack department (won't see reliever dropdown)
SELECT 
  COUNT(*) as users_without_department,
  (SELECT COUNT(*) FROM users WHERE deletedAt IS NULL AND status = 'ACTIVE') as total_active_users
FROM users 
WHERE deletedAt IS NULL 
  AND status = 'ACTIVE' 
  AND departmentId IS NULL;

-- If users lack departments, they won't be able to select relievers
-- Assign departments to critical staff first
```

---

## 🚀 Deployment Timeline

### **What Happens Automatically:**
1. ✅ Code pushed to GitHub (commit `4a8420fc`) - **DONE**
2. 🔄 Render/hosting detects push and starts build - **IN PROGRESS**
3. 🔄 Build runs: Prisma generate → Frontend build → Backend build
4. 🔄 Deployment goes live - **~3-5 minutes from push**

### **What You Must Do Manually:**
1. ⚠️ **RUN THE MIGRATION SQL** (above) - **DO THIS NOW**
2. ⚠️ Verify entitlements exist for 2026
3. ⚠️ Verify HR_MANAGER role is active
4. ⚠️ Assign HR permissions if missing

---

## 📱 Staff Communication Template

Once deployed, send this to staff:

---

**Subject: Leave Application System Now Available** 

The new leave management system is now live! You can apply for leave immediately.

**How to Apply:**
1. Log in to the portal
2. Navigate to HR → Leaves → Apply for Leave
3. Select your leave type and dates
4. **NEW:** Select a colleague from your department as your reliever
5. Enter your reason and submit

**What's New:**
- ✅ Select a reliever (covering colleague) when applying
- ✅ See your leave balance on the dashboard
- ✅ Real-time updates when leave is approved
- ✅ Automatic balance deduction

**Your Dashboard:**
- Shows remaining leave days for each leave type
- Updates automatically after HR approval

**Need Help?**
Contact HR if you have questions about your leave balance or the application process.

---

---

## 🧪 Quick Smoke Test (After Deployment)

### Test as Staff:
1. **Login** as regular staff user
2. **Dashboard** - Check if leave balance widget appears
3. **Apply Leave:**
   - Go to `/hr/leaves/apply`
   - Select leave type
   - Verify balance shows (Total, Used, Remaining, Pending)
   - Select dates
   - **Check reliever dropdown** - should show department colleagues
   - Enter reason
   - Submit
4. **My Applications** - Verify new application appears with PENDING_APPROVAL status
5. **Dashboard** - Check balance now shows "pending" days

### Test as HR:
1. **Login** as HR Manager
2. **HR Dashboard** - Go to `/hr`
3. **Leave Management** - Click "Manage" button
4. **Pending Applications** - Verify staff application appears
5. **Approve Leave:**
   - Click on application
   - Review details (should show reliever name)
   - Click "Approve"
6. **Verify:**
   - Application status changes to APPROVED
   - Run SQL to check `usedDays` incremented:
   ```sql
   SELECT userId, leaveTypeId, year, usedDays 
   FROM leave_entitlements 
   WHERE userId = 'STAFF_USER_ID' AND year = 2026;
   ```

### Test Balance Update:
1. **Staff logs in again**
2. **Dashboard** - Balance should show:
   - Used days increased
   - Remaining days decreased
   - Pending days = 0

---

## 🔥 If Something Breaks

### **Issue: "Cannot select reliever" / Dropdown empty**
**Cause:** User has no department assigned  
**Fix:**
```sql
-- Check user's department
SELECT id, firstName, lastName, departmentId FROM users WHERE email = 'staff@email.com';

-- Assign department
UPDATE users SET departmentId = 'DEPT_ID' WHERE id = 'USER_ID';
```

### **Issue: "Insufficient leave balance. Available: 0"**
**Cause:** No entitlements exist for 2026  
**Fix:** Run entitlement creation SQL (see section 1 above)

### **Issue: "Leave balance not showing on dashboard"**
**Cause:** No entitlements or API error  
**Check:**
```sql
SELECT * FROM leave_entitlements WHERE userId = 'USER_ID' AND year = 2026;
```

### **Issue: "Cannot approve - permission denied"**
**Cause:** HR user lacks permissions  
**Fix:** Assign leave permissions to HR_MANAGER role (see section 3 above)

### **Issue: "Days not deducting after approval"**
**Cause:** Database migration not run  
**Fix:** Run the migration SQL at the top of this document

---

## 📞 Support Contacts

**Deployment Issues:**
- Check Render dashboard for build logs
- Look for errors in backend startup

**Database Issues:**
- Verify migration SQL ran successfully
- Check foreign key constraints
- Ensure entitlements exist

**Frontend Issues:**
- Clear browser cache (Ctrl+Shift+R)
- Check console for JavaScript errors
- Verify API endpoints responding

---

## ✅ Post-Deployment Verification Queries

Run these after deployment to confirm everything works:

```sql
-- 1. Verify migration
SHOW COLUMNS FROM leave_applications LIKE 'relieverId';

-- 2. Count active entitlements for 2026
SELECT 
  lt.name as leave_type,
  COUNT(le.id) as users_with_entitlement
FROM leave_types lt
LEFT JOIN leave_entitlements le ON lt.id = le.leaveTypeId AND le.year = 2026
WHERE lt.isActive = 1
GROUP BY lt.id, lt.name;

-- 3. Check for applications with relievers
SELECT 
  la.applicationNumber,
  CONCAT(u.firstName, ' ', u.lastName) as applicant,
  CONCAT(r.firstName, ' ', r.lastName) as reliever,
  la.status,
  la.createdAt
FROM leave_applications la
LEFT JOIN users u ON la.userId = u.id
LEFT JOIN users r ON la.relieverId = r.id
ORDER BY la.createdAt DESC
LIMIT 10;

-- 4. Verify auto-deduction working (after first approval)
SELECT 
  CONCAT(u.firstName, ' ', u.lastName) as staff_name,
  lt.name as leave_type,
  le.allocatedDays + le.adjustmentDays + le.carryForwardDays as total,
  le.usedDays,
  le.allocatedDays + le.adjustmentDays + le.carryForwardDays - le.usedDays as remaining
FROM leave_entitlements le
JOIN users u ON le.userId = u.id
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE le.year = 2026
  AND le.usedDays > 0
ORDER BY u.lastName, u.firstName, lt.name;
```

---

## 🎯 Success Criteria

The system is ready for staff when:
- ✅ Migration SQL executed successfully
- ✅ Entitlements exist for all active staff (2026)
- ✅ HR_MANAGER role is active with permissions
- ✅ Deployment completed without errors
- ✅ Staff can see leave balance on dashboard
- ✅ Staff can select reliever from dropdown
- ✅ HR can approve leave
- ✅ Balance auto-deducts after approval
- ✅ Dashboard updates in real-time

---

**Current Status:** Code pushed. Run migration SQL immediately, verify prerequisites, then staff can start applying as soon as deployment completes (3-5 minutes).

**TIMELINE:** Staff can apply for leave in ~5-10 minutes if you run the SQL now. ⏱️
