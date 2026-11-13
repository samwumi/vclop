# HR Module - Deployment Guide

**Version:** 1.0  
**Date:** October 28, 2026  
**Database:** MariaDB 10.x / MySQL 8.x

---

## 📋 Pre-Deployment Checklist

### 1. Environment Requirements
- [ ] MariaDB 10.3+ or MySQL 8.0+
- [ ] Node.js 18+ with npm
- [ ] Sufficient database privileges (CREATE, ALTER, INDEX)
- [ ] ~50MB free database storage
- [ ] Backup tools available

### 2. Backup Current Database
```bash
# Full backup
mysqldump -h <host> -u <user> -p <database> > backup_before_hr_$(date +%Y%m%d).sql

# Or via phpMyAdmin: Export > Quick > SQL > Go
```

### 3. Environment Variables
Ensure `.env` has:
```env
DATABASE_URL="mysql://user:password@host:3306/database"
NODE_ENV="production"
```

---

## 🚀 Deployment Steps

### Step 1: Execute Migration (Choose One Method)

#### Method A: Via phpMyAdmin (Recommended for Hostinger)
1. Log in to phpMyAdmin
2. Select your database
3. Click "SQL" tab
4. Copy contents of `vclop/vclop-backend/migrations/HR_MODULE_MIGRATION.sql`
5. Paste into SQL window
6. Click "Go"
7. Review output for errors

#### Method B: Via MySQL Command Line
```bash
mysql -h <host> -u <user> -p <database> < vclop/vclop-backend/migrations/HR_MODULE_MIGRATION.sql
```

#### Method C: Via Prisma (if shadow DB available)
```bash
cd vclop/vclop-backend
npx prisma migrate deploy
```

### Step 2: Verify Migration
```bash
mysql -h <host> -u <user> -p <database> < vclop/vclop-backend/migrations/HR_MODULE_VERIFY.sql
```

**Expected Output:**
```
✓ ALL 16 HR TABLES EXIST
✓ COMPLETE - HR Module Installation
✓ COMPLETE - Seed Data
✓ COMPLETE - Foreign Keys
✓ COMPLETE - Indexes
```

If any checks show `✗`, **STOP** and investigate before proceeding.

### Step 3: Seed Permissions
```bash
mysql -h <host> -u <user> -p <database> < vclop/vclop-backend/ADD_HR_PERMISSIONS.sql
```

### Step 4: Seed Initial Data
```bash
mysql -h <host> -u <user> -p <database> < vclop/vclop-backend/migrations/HR_MODULE_SEED_DATA.sql
```

### Step 5: Generate Prisma Client
```bash
cd vclop/vclop-backend
npx prisma generate
```

### Step 6: Restart Application
```bash
# Development
npm run start:dev

# Production
pm2 restart vclop-backend
# OR
npm run start:prod
```

---

## ✅ Post-Deployment Verification

### 1. Check API Health
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### 2. Test HR Endpoints
```bash
# Get leave types
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/hr/leaves/my-balance/2026

# Check eligibility
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/hr/staff-loans/eligibility
```

### 3. Verify in Database
```sql
-- Check table counts
SELECT 
    'leave_types' AS table_name, COUNT(*) AS records FROM leave_types
UNION ALL
SELECT 'public_holidays', COUNT(*) FROM public_holidays
UNION ALL
SELECT 'approval_policies', COUNT(*) FROM approval_policies;

-- Should show:
-- leave_types: 7
-- public_holidays: ~27
-- approval_policies: 2
```

### 4. Check Logs
```bash
# Check for errors
tail -f logs/application.log | grep ERROR

# Check HR module initialization
grep "HrModule" logs/application.log
```

---

## 🔧 Initial Configuration

### 1. Create Leave Entitlements for Existing Employees

```sql
-- Annual leave: 20 days per employee for 2026
INSERT INTO leave_entitlements (id, userId, leaveTypeId, year, allocatedDays, carryForwardDays, adjustmentDays, createdAt, updatedAt)
SELECT 
    UUID(),
    u.id,
    (SELECT id FROM leave_types WHERE code = 'ANNUAL' LIMIT 1),
    2026,
    20.0,
    0.0,
    0.0,
    NOW(),
    NOW()
FROM users u
WHERE u.status = 'ACTIVE'
AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements le 
    WHERE le.userId = u.id 
    AND le.leaveTypeId = (SELECT id FROM leave_types WHERE code = 'ANNUAL' LIMIT 1)
    AND le.year = 2026
);

-- Sick leave: 10 days per employee for 2026
INSERT INTO leave_entitlements (id, userId, leaveTypeId, year, allocatedDays, carryForwardDays, adjustmentDays, createdAt, updatedAt)
SELECT 
    UUID(),
    u.id,
    (SELECT id FROM leave_types WHERE code = 'SICK' LIMIT 1),
    2026,
    10.0,
    0.0,
    0.0,
    NOW(),
    NOW()
FROM users u
WHERE u.status = 'ACTIVE'
AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements le 
    WHERE le.userId = u.id 
    AND le.leaveTypeId = (SELECT id FROM leave_types WHERE code = 'SICK' LIMIT 1)
    AND le.year = 2026
);
```

### 2. Create Employment Periods for Existing Employees

```sql
-- Create current employment period for active users without one
INSERT INTO employment_periods (
    id, userId, startDate, endDate, jobTitle, 
    departmentId, branchId, supervisorId, 
    isCurrentEmployment, hireType, createdAt, updatedAt
)
SELECT 
    UUID(),
    u.id,
    COALESCE(u.createdAt, '2020-01-01'),
    NULL,
    u.jobTitle,
    u.departmentId,
    u.branchId,
    u.supervisorId,
    TRUE,
    'NEW_HIRE',
    NOW(),
    NOW()
FROM users u
WHERE u.status = 'ACTIVE'
AND NOT EXISTS (
    SELECT 1 FROM employment_periods ep 
    WHERE ep.userId = u.id 
    AND ep.isCurrentEmployment = TRUE
);
```

### 3. Configure Branch-Specific Settings (if needed)

```sql
-- Example: Saturday workday for specific branch
UPDATE branch_workweeks
SET isSaturdayWorkday = TRUE
WHERE branchId = '<branch_id>';

-- Add branch-specific holiday
INSERT INTO public_holidays (id, name, date, isRecurring, branchId, notes, createdAt)
VALUES (
    UUID(),
    'Branch Anniversary',
    '2026-05-15',
    TRUE,
    '<branch_id>',
    'Branch-specific holiday',
    NOW()
);
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
- Monitor API response times for HR endpoints
- Check for failed leave/loan applications
- Review audit logs for HR actions

### Weekly Maintenance
- Review pending approvals (escalation needed?)
- Check for orphaned delegations
- Verify leave balance calculations

### Monthly Tasks
- Archive completed offboarding cases
- Review approval policies effectiveness
- Update public holidays for upcoming year

---

## 🐛 Troubleshooting

### Issue: Migration Fails with FK Error
**Cause:** Referenced tables (users, branches, etc.) don't exist  
**Solution:** Ensure main application schema exists first

### Issue: "Shadow database not available"
**Cause:** Hostinger doesn't support shadow databases  
**Solution:** Use manual migration method (phpMyAdmin or mysql command)

### Issue: Prisma generate fails
**Cause:** Schema changes not detected  
**Solution:**
```bash
npx prisma format
npx prisma validate
npx prisma generate --force
```

### Issue: Permissions not working
**Cause:** Permissions not assigned to roles  
**Solution:** Re-run `ADD_HR_PERMISSIONS.sql` verification section

### Issue: Leave balance shows incorrect
**Cause:** Entitlements not created or wrong year  
**Solution:** Check entitlements exist for user and correct year

---

## 🔄 Rollback Procedure

If issues occur after deployment:

### 1. Stop Application
```bash
pm2 stop vclop-backend
```

### 2. Execute Rollback Script
```bash
mysql -h <host> -u <user> -p <database> < vclop/vclop-backend/migrations/HR_MODULE_ROLLBACK.sql
```

### 3. Restore Database Backup
```bash
mysql -h <host> -u <user> -p <database> < backup_before_hr_20261028.sql
```

### 4. Restart Application
```bash
pm2 start vclop-backend
```

---

## 📈 Performance Optimization

### After Deployment

1. **Analyze Query Performance**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- After running for a day, review
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 20;
```

2. **Add Additional Indexes (if needed)**
```sql
-- Example: If leave balance queries are slow
CREATE INDEX idx_leave_apps_user_status_year 
ON leave_applications(userId, status, primaryEntitlementYear);
```

3. **Optimize Leave Balance Calculation**
- Consider caching balance results for 5 minutes
- Use Redis for frequently accessed balances

---

## 🎓 Training & Documentation

### For End Users
- Employee self-service guide (apply leave, view balance)
- Manager approval dashboard guide
- Staff loan application process

### For Administrators
- HR admin panel guide
- Creating leave entitlements
- Offboarding workflow
- Approval policy management

### For IT Support
- Troubleshooting guide
- Database maintenance procedures
- Backup and recovery procedures

---

## 📞 Support Escalation

### Level 1: Common Issues
- User can't apply for leave → Check entitlements exist
- Balance shows zero → Verify entitlements for current year
- Approval stuck → Check approver is active and not on leave

### Level 2: Technical Issues
- Migration failures → Review error logs, check FK constraints
- Performance issues → Analyze slow queries, check indexes
- Data inconsistencies → Run verification queries

### Level 3: Critical Issues
- Database corruption → Restore from backup
- Security breach → Revoke all tokens, investigate audit logs
- Data loss → Contact DBA for point-in-time recovery

---

## ✅ Deployment Completion Checklist

- [ ] Database migration executed successfully
- [ ] Verification queries pass (all ✓)
- [ ] Permissions seeded and assigned to roles
- [ ] Initial data seeded (leave types, holidays, policies)
- [ ] Leave entitlements created for employees
- [ ] Employment periods created for existing staff
- [ ] Prisma client regenerated
- [ ] Application restarted successfully
- [ ] API endpoints responding
- [ ] Test leave application created and approved
- [ ] Audit logs capturing HR actions
- [ ] Performance acceptable (<200ms per request)
- [ ] Backup verified and stored securely
- [ ] Rollback procedure documented and tested
- [ ] Team notified of new features
- [ ] User training scheduled
- [ ] Monitoring alerts configured

---

## 🎉 Success Criteria

Deployment is considered successful when:

1. ✅ All 16 HR tables exist with correct schema
2. ✅ All 30+ HR permissions assigned correctly
3. ✅ All 46 API endpoints responding
4. ✅ Employees can apply for leave successfully
5. ✅ Managers can approve leave applications
6. ✅ Staff can apply for loans
7. ✅ Finance can disburse loans and record payments
8. ✅ HR can initiate offboarding
9. ✅ All audit logs capturing actions
10. ✅ No errors in application logs

---

## 📚 Related Documentation

- `HR_MODULE_ARCHITECTURE_V3.md` - Complete technical specification
- `HR_PHASE2_BACKEND_COMPLETE.md` - Implementation summary
- `HR_MODULE_QUICK_START.md` - API testing guide
- `HR_LEAVES_MODULE_COMPLETE.md` - Detailed leaves documentation
- `ADD_HR_PERMISSIONS.sql` - Permission definitions

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Sign-off:** _______________

