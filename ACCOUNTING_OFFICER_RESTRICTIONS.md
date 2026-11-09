# Accounting Officer Branch-Based Restrictions

## Overview
Implemented location-based data access restrictions for accounting officers (non-head). Regular accounting officers can now only view customers, loan applications, and disbursements within their assigned branch(es), while the Head of Accounting retains full system access.

## Changes Implemented

### 1. Customers Module (`customers.controller.ts`)

**Access Control Logic:**
- **Admin/IC/Accounting Head** (`loan_applications:disburse_head`) - See all customers across all branches
- **Compliance Officers** (`loan_applications:compliance_review`) - Scope to their assigned branches
- **Accounting Officers** (`virtual_accounts:reconcile`) - **NEW:** Scoped to their assigned branches
- **Loan Officers** - See only customers they registered

**Key Change:**
```typescript
const isAcctHead = actor.permissions.has('loan_applications:disburse_head');
const canViewAll = actor.permissions.has('customers:manage') || isAcctHead; // Only accounting HEAD sees all

// Compliance officers or regular Accounting officers — scope to their branches
if (isCompliance || isAccounting) {
  // Apply branch filtering
}
```

**CSV Export:** Updated to respect the same branch-scoping rules.

### 2. Loan Applications Module (`loan-applications.service.ts`)

**Access Control Logic:**
- **Admin/IC/Accounting Head** - See all loan applications
- **Accounting Officers** (non-head) - **NEW:** Scoped to branches they manage
- **Compliance Officers** - Scoped to their branches
- **Loan Officers** - See only applications assigned to them

**Key Change:**
```typescript
const isAcctHead = permissions.has('loan_applications:disburse_head');
const isAccounting = permissions.has('virtual_accounts:reconcile');

// Accounting officers (non-head) and compliance — scope to their branches
if ((isAccounting || isCompliance) && !isAdmin && !isIC && !isAcctHead && !query.customerId) {
  const branchIds = [...user.branchId, ...user.managedBranchIds];
  where.customer = { branchId: { in: uniqueBranchIds } };
}
```

### 3. Reports Module - Disbursements (`reports.service.ts` & `reports.controller.ts`)

**New Features:**
1. **Branch filtering** - Filter disbursements by specific branch
2. **Officer filtering** - Filter disbursements by loan officer
3. **Date range filtering** - Existing feature maintained
4. **Branch-scoped access for accounting officers**

**API Parameters (DateRangeDto):**
```typescript
{
  from?: string;        // Date filter (ISO string)
  to?: string;          // Date filter (ISO string)
  branchId?: string;    // NEW: Filter by branch
  officerId?: string;   // NEW: Filter by loan officer
}
```

**Access Control:**
- **Accounting Officers** (non-head) - Automatically restricted to disbursements in their branches
- **Accounting Head** - Can filter by any branch/officer or see all
- **Admin/IC** - Full access

**Endpoints Updated:**
- `GET /api/v1/reports/disbursements` - View disbursements with filters
- `GET /api/v1/reports/export/disbursements` - Export filtered disbursements to Excel

## Permission Hierarchy

### Full Access (All Branches)
- `system:admin` - System Administrator
- `loan_applications:internal_control_approve` - Internal Control
- `loan_applications:disburse_head` - **Accounting Head**
- `customers:manage` - Customer Manager role

### Branch-Scoped Access
- `virtual_accounts:reconcile` - **Accounting Officer** (regular)
- `loan_applications:compliance_review` - Compliance Officer

### Self-Scoped Access
- Loan Officers - Only see their own data (assigned applications, registered customers)

## User Experience

### For Regular Accounting Officers
1. **Customers Page** - See only customers in their branch(es)
2. **Loan Applications** - See only applications from their branch(es)
3. **Disbursements (Reports)** - Automatically filtered to their branch(es)
4. **Can filter by:**
   - Date range (from/to)
   - Officers within their branch(es)
   - Specific branches they manage

### For Head of Accounting
1. **Full system access** - No restrictions
2. **Can filter by:**
   - Any branch
   - Any officer
   - Date range

## Database Fields Used

**Branch Assignment:**
- `users.branchId` - Primary branch assignment
- `users.managedBranchIds` - Additional branches the user manages (array)

**Customer/Application Linking:**
- `customers.branchId` - Customer's assigned branch
- `loan_applications.customer.branchId` - Via relationship

**Disbursement Filtering:**
- `loans.loanApplication.customer.branchId` - Nested relationship for branch filtering
- `loans.loanApplication.submittedById` - For officer filtering

## Testing

To test the restrictions:

1. **Create a regular accounting officer:**
   - Assign `virtual_accounts:reconcile` permission
   - Assign to specific branch

2. **Create accounting head:**
   - Assign `loan_applications:disburse_head` permission
   - Assign `virtual_accounts:reconcile` permission

3. **Verify:**
   - Regular officer sees only their branch data
   - Head sees all data
   - Filters work correctly

## Migration Notes

**No database migration required** - Uses existing permissions and branch assignment fields.

**Existing users:**
- Accounting officers with `virtual_accounts:reconcile` only - Now branch-scoped
- Users with `loan_applications:disburse_head` - Retain full access

## Date
October 28, 2026

## Commit
`f9c1f254` - "Restrict accounting officers to branch-scoped data and add disbursement filters"
