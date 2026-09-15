# No Duplicate Loan Applications - Strict Enforcement

## Problem

Customers were able to apply for multiple loans simultaneously, leading to:
- Multiple pending applications for the same customer
- Loans approved while customer has outstanding debt
- Confusion in workflow and review queues
- Risk of over-lending to customers

## Solution

### Backend Validation (loan-applications.service.ts)

Added strict checks in the `create()` method that **block** loan application creation if:

#### 1. Customer Has Active Loan
Check for any disbursed loan that is not fully repaid:
```typescript
LoanStatus: DISBURSED | ACTIVE | OVERDUE | DEFAULTED
```

**Error Message:**
```
Customer has an active loan (LN-2026-0001) with status ACTIVE.
Outstanding balance: ₦50,000.
Please ensure the current loan is fully repaid before applying for a new loan.
```

#### 2. Customer Has Active Application
Check for any loan application in progress:
```typescript
LoanApplicationStatus: DRAFT | IN_REVIEW | PENDING_APPROVAL | APPROVED
```

**Error Message:**
```
Customer already has an active loan application (APP-2026-0001) 
with status IN_REVIEW for Quick Cash.
Please wait for the current application to be completed (approved, rejected, or disbursed) 
before applying for a new loan.
```

### Frontend Prevention (NewLoanPage.tsx)

Added real-time checks when customer is selected:

#### Visual Warnings

**Active Loan:**
- Red danger banner displayed
- Shows that customer has outstanding loan
- Provides link to view customer's loans tab
- Submit button **disabled**

**Active Application:**
- Red danger banner displayed
- Shows that customer has pending application
- Provides link to view customer's applications tab
- Submit button **disabled**

#### Implementation
```typescript
const { data: activeLoans } = useQuery({
  queryKey: ['loans', 'active', selectedCustomer?.id],
  queryFn: () => loansService.list({ customerId: selectedCustomer!.id }),
  enabled: !!selectedCustomer,
});

const hasActiveLoan = activeLoans?.data?.some((loan) => 
  ['DISBURSED', 'ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(loan.status)
);

const hasActiveApplication = activeLoans?.data?.some((loan) => 
  ['DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED'].includes(loan.status)
);

const isBlocked = hasActiveLoan || hasActiveApplication || ...otherChecks;
```

## Allowed States

### Customer CAN Apply When:
- ✅ Previous loan is **CLOSED** (fully repaid)
- ✅ Previous application was **REJECTED** or **CANCELLED**
- ✅ Previous application was **DISBURSED** (becomes a loan, so check loan status)

### Customer CANNOT Apply When:
- ❌ Has loan with status: `DISBURSED`, `ACTIVE`, `OVERDUE`, `DEFAULTED`
- ❌ Has application with status: `DRAFT`, `IN_REVIEW`, `PENDING_APPROVAL`, `APPROVED`

## Status Flow

### Application Statuses
```
DRAFT → IN_REVIEW → PENDING_APPROVAL → APPROVED → DISBURSED
                                    ↘ REJECTED
```

### Loan Statuses
```
DISBURSED → ACTIVE → CLOSED
         ↘ OVERDUE → DEFAULTED
```

## User Experience

### Scenario 1: Try to Apply with Outstanding Loan
1. User goes to "New Loan Application"
2. Selects customer with active loan
3. **Red banner appears:** "Customer has an outstanding loan"
4. Shows link to view customer's loans
5. Submit button is **disabled**

### Scenario 2: Try to Apply with Pending Application
1. User goes to "New Loan Application"
2. Selects customer with IN_REVIEW application
3. **Red banner appears:** "Customer has a pending loan application"
4. Shows link to view customer's applications
5. Submit button is **disabled**

### Scenario 3: Attempt via API (bypassing frontend)
1. User sends POST request directly to `/loan-applications`
2. Backend validates and **rejects** with 400 Bad Request
3. Returns detailed error message with:
   - Existing loan/application number
   - Current status
   - Outstanding balance (if loan)
   - Clear instruction on what to do

## Edge Cases Handled

### Multiple Loans Over Time (Sequential)
✅ **Allowed** - Customer can have multiple loans across their lifetime, but only ONE at a time
```
Loan 1: DISBURSED → CLOSED ✅
Apply for Loan 2 ✅
Loan 2: DISBURSED → CLOSED ✅
Apply for Loan 3 ✅
```

### Rejected Application, Try Again
✅ **Allowed** - Customer can apply again after rejection
```
App 1: DRAFT → REJECTED ✅
Apply again ✅
App 2: DRAFT → APPROVED → DISBURSED
```

### Approved but Not Disbursed Yet
❌ **Blocked** - Application in APPROVED status blocks new applications
```
App 1: APPROVED (waiting for disbursement) ❌
Try to apply ❌ BLOCKED
```

Wait until disbursed:
```
App 1: DISBURSED (becomes a loan) ✅
Now customer has active loan, still blocked ❌
```

Wait until loan is closed:
```
Loan 1: CLOSED ✅
Apply for new loan ✅
```

## Testing

### Test Case 1: Block Duplicate Application
```bash
# Create first application
POST /loan-applications
{
  "customerId": "customer-id",
  "loanProductId": "product-id",
  "amount": 100000,
  "tenureDays": 30
}
# ✅ Success → APP-0001

# Try to create second application
POST /loan-applications
{
  "customerId": "same-customer-id",
  "loanProductId": "product-id",
  "amount": 50000,
  "tenureDays": 30
}
# ❌ 400 Bad Request
# "Customer already has an active loan application (APP-0001) with status DRAFT..."
```

### Test Case 2: Block Application with Active Loan
```bash
# Customer has disbursed loan
GET /loans?customerId=customer-id
# Returns: LN-0001, status: ACTIVE, outstanding: 50000

# Try to apply for new loan
POST /loan-applications
{
  "customerId": "customer-id",
  "loanProductId": "product-id",
  "amount": 100000,
  "tenureDays": 30
}
# ❌ 400 Bad Request
# "Customer has an active loan (LN-0001) with status ACTIVE. Outstanding balance: ₦50,000..."
```

### Test Case 3: Allow After Loan Closure
```bash
# Close the loan (full repayment)
PATCH /loans/loan-id/status
{ "status": "CLOSED" }

# Now customer can apply
POST /loan-applications
{
  "customerId": "customer-id",
  "loanProductId": "product-id",
  "amount": 100000,
  "tenureDays": 30
}
# ✅ Success → APP-0002
```

## Files Modified

### Backend
- `vclop-backend/src/modules/loan-applications/loan-applications.service.ts`
  - Added active loan check in `create()`
  - Added active application check in `create()`
  - Both checks happen BEFORE any other validation

### Frontend
- `vclop-frontend/src/pages/loans/NewLoanPage.tsx`
  - Added `useQuery` to fetch customer's loans when selected
  - Added `hasActiveLoan` computed flag
  - Added `hasActiveApplication` computed flag
  - Added red banner warnings for both cases
  - Added links to customer's loans tab
  - Disabled submit button when blocked

## Benefits

1. **Data Integrity** - No duplicate applications in the system
2. **Risk Management** - Prevents over-lending to customers
3. **Clear Workflow** - One application at a time, sequential process
4. **User Feedback** - Clear error messages explaining why they're blocked
5. **Audit Trail** - All blocked attempts logged with clear reasons
6. **Business Logic** - Enforces "one loan at a time" policy

## Migration / Historical Data

No migration needed - this is forward-looking validation only.

Existing duplicate applications (if any) can still be processed through their workflow.

The validation only affects **new** application creation attempts.
