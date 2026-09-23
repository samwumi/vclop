# Disbursement Permission Change

## Summary
**Removed disbursement approval rights from Accounting Head role. Only System Admin can now approve loan disbursements.**

---

## What Changed

### Before:
- **Accounting Head** (`accthead@vclop.local`) could:
  - ✅ Approve loan disbursements
  - ✅ Pay transport allowances
  - ✅ View accounting reports

### After:
- **Accounting Head** can now only:
  - ✅ View loans (read-only)
  - ✅ Manage virtual accounts
  - ✅ View accounting reports
  - ❌ **Cannot disburse loans** (removed)
  - ❌ **Cannot pay transport** (removed)

- **System Admin** (you) retains:
  - ✅ All permissions including loan disbursement
  - ✅ Transport payment approval
  - ✅ Full system control

---

## Code Changes

### File: `vclop-backend/prisma/seed.ts`

**Removed permissions from ACCOUNTING_HEAD role:**
```typescript
// BEFORE:
permCodes: [
  'loan_applications:read', 
  'loan_applications:disburse',       // ❌ REMOVED
  'loan_applications:disburse_head',  // ❌ REMOVED
  ...
]

// AFTER:
permCodes: [
  'loan_applications:read',  // ✅ Read-only
  // No disbursement permissions
  ...
]
```

---

## Database Update Required

Run this SQL on your **production database** (Hostinger):

```sql
-- Find role and permission IDs
SET @accounting_head_role_id = (SELECT id FROM roles WHERE code = 'ACCOUNTING_HEAD' LIMIT 1);
SET @disburse_perm_id = (SELECT id FROM permissions WHERE code = 'loan_applications:disburse' LIMIT 1);
SET @disburse_head_perm_id = (SELECT id FROM permissions WHERE code = 'loan_applications:disburse_head' LIMIT 1);

-- Remove permissions
DELETE FROM role_permissions 
WHERE roleId = @accounting_head_role_id 
AND permissionId IN (@disburse_perm_id, @disburse_head_perm_id);
```

**Or use the complete script:** `vclop-backend/REMOVE_ACCT_HEAD_DISBURSE_PERMISSION.sql`

---

## Impact

### Who is affected:
- **Tunde Adeyemi** (`accthead@vclop.local`) - Accounting Head user will lose disbursement button

### Who can still disburse:
- **You** (System Admin) - Full access retained
- Any user with `SYSTEM_ADMIN` role

### UI Changes:
- Accounting Head will no longer see "Approve Disbursement" button on loan details page
- Accounting page will show read-only loan list
- Transport "Mark Paid" button will be hidden for Accounting Head

---

## Testing After Deployment

1. **Login as Accounting Head** (`accthead@vclop.local`):
   - ✅ Can view loans
   - ✅ Can view reports
   - ❌ Cannot see "Approve Disbursement" button
   - ❌ Cannot access transport payment

2. **Login as System Admin** (you):
   - ✅ Can view loans
   - ✅ **Can approve disbursements**
   - ✅ Can pay transport requests
   - ✅ All features work

---

## Rollback Plan

If you need to restore disbursement rights to Accounting Head:

```sql
-- Find IDs
SET @accounting_head_role_id = (SELECT id FROM roles WHERE code = 'ACCOUNTING_HEAD' LIMIT 1);
SET @disburse_perm_id = (SELECT id FROM permissions WHERE code = 'loan_applications:disburse' LIMIT 1);
SET @disburse_head_perm_id = (SELECT id FROM permissions WHERE code = 'loan_applications:disburse_head' LIMIT 1);

-- Add permissions back
INSERT IGNORE INTO role_permissions (roleId, permissionId) 
VALUES 
  (@accounting_head_role_id, @disburse_perm_id),
  (@accounting_head_role_id, @disburse_head_perm_id);
```

---

## Next Steps

1. ✅ Code changes pushed to GitHub
2. ⏳ Run SQL script on production database (Hostinger phpMyAdmin)
3. ⏳ Deploy updated backend code
4. ⏳ Test with both accounts (admin & accthead)
5. ⏳ Inform Accounting Head of the change

**Ready to deploy!** 🚀
