# Production Database Migration Steps

## Overview
Two workflow improvements need to be applied to production database:
1. **Loan Application Workflow**: CO review with feedback loop
2. **Transport Requests**: Make independent of loan applications

## Connection Details
- Host: srv1461.hstgr.io:3306
- Database: u215495167_vclop
- User: u215495167_vclop

## Migration Files to Run

### 1. Add NEEDS_ATTENTION Workflow
```bash
mysql -h srv1461.hstgr.io -P 3306 -u u215495167_vclop -p u215495167_vclop < migrations/add_needs_attention_workflow.sql
```

**What this does:**
- Adds `NEEDS_ATTENTION` status to `LoanApplicationStatus` enum
- Adds `assigned_to_id` column (VARCHAR 36, nullable)
- Adds `compliance_feedback` column (TEXT, nullable)
- Updates indexes for performance

**Features enabled:**
- Compliance Officers can request changes on loan applications
- Loan Officers see "needs attention" counter on dashboard
- LO can fix and resubmit applications
- Feedback loop between CO and LO

### 2. Make Transport Requests Independent
```bash
mysql -h srv1461.hstgr.io -P 3306 -u u215495167_vclop -p u215495167_vclop < migrations/make_transport_loan_optional.sql
```

**What this does:**
- Changes `loan_application_id` column from NOT NULL to NULL
- Allows transport requests without a specific loan application

**Features enabled:**
- Compliance Officers can create general transport requests
- Transport requests no longer require loan application
- "Create Request" button appears on Transport page for COs

## Verification Steps

### After Migration 1 (NEEDS_ATTENTION):
```sql
-- Check enum values
SHOW COLUMNS FROM loan_applications LIKE 'status';

-- Check new columns exist
DESCRIBE loan_applications;

-- Should see: assigned_to_id, compliance_feedback
```

### After Migration 2 (Transport):
```sql
-- Check column is nullable
SELECT 
  COLUMN_NAME, 
  IS_NULLABLE, 
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'transport_requests' 
  AND COLUMN_NAME = 'loan_application_id';

-- Should show: IS_NULLABLE = 'YES'
```

## Testing After Deployment

### Test Loan Workflow:
1. Login as Loan Officer
2. Register customer and create loan application immediately
3. Login as Compliance Officer (same branch)
4. View application on dashboard → Click "Request Changes"
5. Login as Loan Officer again
6. See red "Needs Attention" badge on dashboard
7. View application → See CO feedback → Fix issues → Click "Resubmit"
8. Login as CO → Application back in queue

### Test Transport Requests:
1. Login as Compliance Officer
2. Go to Transport page
3. Click "Create Request" button (green, top-right)
4. Fill form (no loan application needed):
   - Purpose: "Branch visit for customer verification"
   - Location: "Lagos - Ibadan route"
   - Customer Count: 3
   - Distance: 150 km
   - Estimated Cost: 25000
5. Submit → Request appears in list with "General" in Application # column
6. IC Officer can review and approve as normal

## Rollback (If Needed)

### Rollback Migration 1:
```sql
-- Remove new columns
ALTER TABLE loan_applications 
  DROP COLUMN assigned_to_id,
  DROP COLUMN compliance_feedback;

-- Remove NEEDS_ATTENTION from enum (tricky - requires recreating enum)
-- Only do this if no applications have NEEDS_ATTENTION status
```

### Rollback Migration 2:
```sql
-- Make column NOT NULL again (only if no NULL values exist)
ALTER TABLE transport_requests 
  MODIFY COLUMN loan_application_id VARCHAR(36) NOT NULL;
```

## Important Notes

1. **Backup first**: Always backup database before running migrations
2. **Off-peak hours**: Run during low traffic periods
3. **Check Hostinger**: Ensure auto-deployment completed successfully
4. **Browser cache**: Users may need to clear cache to see frontend changes
5. **Monitor logs**: Check application logs after deployment for any errors

## Support

If issues occur:
- Check backend logs: `/var/log/vclop-backend/`
- Check Prisma migrations: `npx prisma migrate status`
- Verify API endpoints: Test `/api/loan-applications/:id/compliance-review` and `/api/transport-requests`
