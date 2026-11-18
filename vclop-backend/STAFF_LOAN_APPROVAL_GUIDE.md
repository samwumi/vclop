# Staff Loan Approval Guide

## Who Can Approve Staff Loans?

Users with the **`staff_loans:approve`** permission can approve staff loan applications.

## Check Who Has Approval Permission

Run this SQL to see:
```sql
SELECT 
    u.email,
    u.firstName,
    u.lastName,
    r.name AS role_name
FROM users u
INNER JOIN user_roles ur ON u.id = ur.userId
INNER JOIN roles r ON ur.roleId = r.id
INNER JOIN role_permissions rp ON r.id = rp.roleId
INNER JOIN permissions p ON rp.permissionId = p.id
WHERE p.code = 'staff_loans:approve'
  AND u.deletedAt IS NULL
  AND u.status = 'ACTIVE'
ORDER BY u.firstName, u.lastName;
```

## Grant Approval Permission to a Role

If no one has the permission, grant it to the appropriate role (e.g., HR Manager, System Administrator):

```sql
-- Get the permission ID
SET @permissionId = (SELECT id FROM permissions WHERE code = 'staff_loans:approve');

-- Get the role ID (replace 'HR Manager' with your role name)
SET @roleId = (SELECT id FROM roles WHERE name = 'System Administrator');

-- Grant the permission to the role
INSERT INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
VALUES (@roleId, @permissionId, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();
```

## Current Approval Workflow

1. **Staff applies** → Creates loan in **DRAFT** status
2. **Staff submits** → Changes to **PENDING_APPROVAL** status
3. **HR/Admin approves** → Changes to **APPROVED** status
   - Endpoint: `POST /api/v1/hr/staff-loans/:id/approve`
   - Requires: `staff_loans:approve` permission
4. **Finance disburses** → Changes to **ACTIVE** status
   - Endpoint: `POST /api/v1/hr/staff-loans/:id/disburse`
   - Requires: `staff_loans:disburse` permission

## Where to Approve Loans

**Option 1: System Administrator Dashboard**
- Navigate to HR → Staff Loans
- View "Pending Approvals" section
- Click on a loan to review details
- Click "Approve" or "Reject" button

**Option 2: Pending Approvals API**
- Endpoint: `GET /api/v1/hr/staff-loans/pending/approvals`
- Returns list of loans with status = PENDING_APPROVAL

## Approval Notes

The `StaffLoanApproval` table in the schema suggests multi-level approval support, but currently the system uses a simpler single-approval workflow with just the `reviewedBy` field. If you need multi-level approvals (e.g., Supervisor → HR Manager → Finance), that would require additional implementation.
