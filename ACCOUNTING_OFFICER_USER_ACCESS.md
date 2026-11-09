# Accounting Officer User Access Restriction

## Overview
Accounting officers (non-head) can now view and filter by loan officers, but are restricted to seeing only officers in their assigned branch/location.

## Implementation

### Backend Changes

#### 1. Users Controller (`src/modules/users/users.controller.ts`)
- Modified `findAll()` endpoint to accept `actor` parameter
- Passes current user context to service for branch filtering

#### 2. Users Service (`src/modules/users/users.service.ts`)
- Added branch-scoped filtering for accounting officers
- Logic:
  - Checks if user has `virtual_accounts:reconcile` permission (accounting officer)
  - Checks if user has `loan_applications:disburse_head` permission (accounting head)
  - If accounting officer but NOT head: filters users by `branchId` + `managedBranchIds`
  - Accounting head sees all users (no filter applied)

```typescript
const isAcctOfficer = actor && actor.permissions.has('virtual_accounts:reconcile');
const isAcctHead = actor && actor.permissions.has('loan_applications:disburse_head');

if (isAcctOfficer && !isAcctHead && actor) {
  const branchIds = [
    actor.branchId,
    ...actor.managedBranchIds,
  ].filter(Boolean);
  
  branchFilter = branchIds.length > 0 ? { branchId: { in: branchIds } } : {};
}
```

### Database Changes

#### Required SQL Script
Run `ADD_USERS_READ_TO_ACCOUNTING_OFFICERS.sql` to grant `users:read` permission to:
- Accounting Officer role
- Accounting Head role

This allows them to call the `/api/v1/users` endpoint to fetch the officer list for dropdowns.

### Frontend
No changes needed - the `CustomersPage.tsx` already calls `usersService.list()` which now respects branch filtering on the backend.

## Security Model

| Role | Can View Users |
|------|---------------|
| **Accounting Officer** | Only users in their branch(es) |
| **Accounting Head** | All users |
| **Others with users:read** | All users (no restriction) |

## Testing

1. **Login as Accounting Officer** (non-head, assigned to a specific branch)
2. **Navigate to Customers page**
3. **Open the "All loan officers" dropdown**
4. **Verify**: Only officers from your branch appear

## Files Modified
- `vclop-backend/src/modules/users/users.controller.ts`
- `vclop-backend/src/modules/users/users.service.ts`
- `vclop-backend/ADD_USERS_READ_TO_ACCOUNTING_OFFICERS.sql` (new)
- `vclop-backend/CHECK_ACCOUNTING_OFFICER_PERMISSIONS.sql` (new, diagnostic)
