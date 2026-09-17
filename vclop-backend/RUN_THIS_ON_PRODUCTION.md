# URGENT: Run Database Migrations on Production

## Issue
Loan page is giving 500 error because the database doesn't have the new columns yet.

## Solution
Run these SQL migrations on the production database:

### Step 1: Connect to Production Database
```bash
mysql -h srv1461.hstgr.io -P 3306 -u u215495167_vclop -p u215495167_vclop
```

### Step 2: Run Migration for NEEDS_ATTENTION Workflow
```sql
-- Add NEEDS_ATTENTION status to enum
ALTER TABLE loan_applications 
MODIFY COLUMN status ENUM('DRAFT', 'SUBMITTED', 'COMPLIANCE_REVIEW', 'NEEDS_ATTENTION', 'AWAITING_INFORMATION', 'INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED', 'DISBURSED', 'CANCELLED') 
NOT NULL DEFAULT 'DRAFT';

-- Add new columns for workflow
ALTER TABLE loan_applications 
ADD COLUMN assigned_to_id VARCHAR(36) NULL AFTER rejection_reason,
ADD COLUMN compliance_feedback TEXT NULL AFTER assigned_to_id;

-- Add index for performance
CREATE INDEX idx_assigned_to_status ON loan_applications(assigned_to_id, status);
```

### Step 3: Run Migration for Transport (Optional - if transport still gives errors)
```sql
-- Make loan_application_id optional in transport_requests
ALTER TABLE transport_requests 
MODIFY COLUMN loan_application_id VARCHAR(36) NULL;
```

### Step 4: Verify Changes
```sql
-- Check loan_applications table
DESCRIBE loan_applications;

-- Check if NEEDS_ATTENTION is in enum
SHOW COLUMNS FROM loan_applications LIKE 'status';

-- Check transport_requests
DESCRIBE transport_requests;
```

## After Running Migrations
1. Refresh the loan page
2. The 500 error should be gone
3. New workflow features will work

## If Still Having Issues
Check the backend logs for specific error messages:
```bash
# On Hostinger server
tail -f /path/to/logs/application.log
```
