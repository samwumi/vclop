# Employment Workflow - Deployment Checklist

## Status: Ready for Deployment ✅

### Git Status
- ✅ All commits pushed to GitHub main branch
- ✅ Latest commit: `9c14bd69` (docs: Complete employment workflow documentation)
- ✅ Previous commits:
  - `e622eb14` - HR review workflow to EmployeeDetailsPage
  - `c3cb15c0` - Complete employment workflow frontend UI
  - `08018555` - Comprehensive workflow implementation status
  - `bf7eb318` - Employment submission workflow backend & services

### Pre-Deployment Steps

#### 1. Database Migration ✅ (Already Done)
```bash
cd vclop-backend
npm run workflow-migration
```

**Status:** Migration already executed on production database
**Verification:** Check if columns exist:
```sql
SHOW COLUMNS FROM employment_periods LIKE '%submission%';
SHOW COLUMNS FROM employee_guarantors LIKE '%submission%';
SHOW COLUMNS FROM employee_next_of_kin LIKE '%submission%';
```

#### 2. Permissions Setup ⚠️ (Needs to be run)
**File:** `ADD_EMPLOYMENT_WORKFLOW_PERMISSIONS.sql`

**SQL to execute on Hostinger database:**
```sql
-- Run the ADD_EMPLOYMENT_WORKFLOW_PERMISSIONS.sql file
```

**Permissions to be added:**
1. `employment:submit` - Submit own employment for review
2. `employees:review` - Review employee submissions
3. `employees:approve` - Approve submissions
4. `employees:reject` - Reject submissions
5. `employees:grant-edit` - Grant edit rights

**Role assignments:**
- All roles get `employment:submit`
- HR Manager gets all review permissions
- HR Officer gets all review permissions

### Deployment Steps

#### 1. Code Deployment
- ✅ Code pushed to GitHub
- ⏳ Waiting for Hostinger build to complete
- ⏳ Build will deploy commit `9c14bd69`

#### 2. Post-Deployment Verification

**a) Check Build Success:**
```bash
# Verify the build completed successfully on Hostinger
# Check logs for any errors
```

**b) Database Verification:**
```sql
-- Check if workflow columns exist
SELECT 
  submission_status, 
  submitted_at, 
  is_editable 
FROM employment_periods 
LIMIT 5;

-- Verify permissions were added
SELECT * FROM permissions 
WHERE action LIKE 'employment:%' 
   OR action LIKE 'employees:%';
```

**c) Backend API Testing:**
Test these endpoints:
- `POST /hr/employees/:id/submit` - Submit for review
- `GET /hr/employees/pending-submissions` - Get pending list
- `POST /hr/employees/:id/approve` - Approve submission
- `POST /hr/employees/:id/reject` - Reject submission
- `POST /hr/employees/:id/request-revision` - Request revision
- `POST /hr/employees/:id/grant-edit` - Grant edit rights
- `POST /hr/employees/:id/revoke-edit` - Revoke edit rights
- `GET /hr/employees/:id/can-edit` - Check edit permission

**d) Frontend UI Testing:**

**Employee Flow:**
1. Navigate to `/hr/my-employment`
2. Fill employment details
3. Add at least 1 guarantor
4. Add at least 1 next of kin
5. Click "Submit for Review"
6. Verify data becomes read-only
7. Check status badge shows "SUBMITTED"

**HR Flow:**
1. Navigate to `/hr/dashboard`
2. Verify "Pending Submissions" card appears
3. Click to view `/hr/pending-submissions`
4. Verify table shows submitted employees
5. Click "Review" on an employee
6. Verify review section appears
7. Test Approve button
8. Test Reject button (with notes)
9. Test Request Revision button (with notes)
10. Test Edit Rights toggle

### Post-Deployment SQL to Run

**Run this immediately after deployment:**
```sql
-- Execute the permissions SQL
SOURCE ADD_EMPLOYMENT_WORKFLOW_PERMISSIONS.sql;

-- OR manually copy/paste the SQL from the file
```

### Rollback Plan (If Needed)

If deployment fails:

**1. Database Rollback:**
```sql
-- Remove workflow columns (CAUTION: will lose workflow data)
ALTER TABLE employment_periods 
  DROP COLUMN submission_status,
  DROP COLUMN submitted_at,
  DROP COLUMN reviewed_at,
  DROP COLUMN reviewed_by_id,
  DROP COLUMN review_notes,
  DROP COLUMN is_editable;

ALTER TABLE employee_guarantors
  DROP COLUMN submission_status,
  DROP COLUMN is_editable;

ALTER TABLE employee_next_of_kin
  DROP COLUMN submission_status,
  DROP COLUMN is_editable;

-- Remove permissions
DELETE FROM role_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions 
  WHERE action LIKE 'employment:%' 
     OR action LIKE 'employees:%'
);

DELETE FROM permissions 
WHERE action LIKE 'employment:%' 
   OR action LIKE 'employees:%';
```

**2. Code Rollback:**
```bash
# Revert to previous commit
git revert HEAD~3..HEAD
git push origin main
```

### Known Issues / Notes

1. **Build Status:** Waiting for Hostinger to pick up latest commit
2. **Migration:** Already executed, no need to re-run
3. **Permissions:** Need to be added via SQL after deployment
4. **Testing:** Full end-to-end testing required after deployment

### Success Criteria

- ✅ Build completes without errors
- ✅ All 8 API endpoints respond correctly
- ✅ Employee can submit employment data
- ✅ HR can review and approve/reject
- ✅ Data locks/unlocks correctly
- ✅ Status badges display properly
- ✅ Edit rights toggle works
- ✅ Review notes save and display

### Contact / Support

If issues arise:
1. Check Hostinger build logs
2. Check backend error logs
3. Check browser console for frontend errors
4. Verify database schema changes
5. Verify permissions were added

---

## Quick Reference

**Latest Commit:** `9c14bd69`
**Branch:** main
**Database Migration:** ✅ Complete
**Permissions SQL:** ⚠️ Needs execution
**Build Status:** ⏳ In progress

**Files Changed:**
- Backend: 4 files (schema, service, controller, migration)
- Frontend: 7 files (services, components, pages, routing)
- Documentation: 3 files
- SQL: 1 file

**Total Commits:** 5
**Lines Changed:** ~2000+ lines added

---

**Last Updated:** $(date)
**Deployment Target:** Hostinger Production
**Status:** Awaiting build completion
