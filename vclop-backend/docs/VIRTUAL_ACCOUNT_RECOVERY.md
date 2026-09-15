# Virtual Account Recovery - Missing Virtual Accounts Fix

## Problem

Some customers have disbursed loans with full KYC details (NIN, BVN, bank account) but **no virtual accounts were created**. This prevents repayment collection because there's no dedicated account number to receive payments.

## Root Cause

Virtual accounts are created via an **asynchronous event listener** (`@OnEvent('loan.disbursed')`) in `VirtualAccountsService`. When a loan is disbursed:

1. Loan record is created and saved to database ✅
2. Event `loan.disbursed` is emitted ✅
3. Event listener calls `createForLoan()` to create virtual account ⚠️

**If step 3 fails** (provider API error, network issue, etc.), the event listener fails **silently** - the loan exists but no virtual account is created.

## Solution

### 1. Detection Endpoints

**GET `/api/v1/virtual-accounts/missing/list`**
- Lists all disbursed loans without virtual accounts
- Shows customer details and whether they have bank account info
- Helps identify the scope of the problem

**Response:**
```json
[
  {
    "loanId": "uuid",
    "loanNumber": "LN-2026-0001",
    "customerId": "uuid",
    "customerNumber": "CUS-0001",
    "customerName": "John Doe",
    "customerPhone": "08012345678",
    "customerEmail": "john@example.com",
    "hasBankAccount": true,
    "principal": 100000,
    "loanProduct": "Quick Cash",
    "disbursedAt": "2026-09-01T10:00:00Z"
  }
]
```

### 2. Bulk Fix Endpoint

**POST `/api/v1/virtual-accounts/missing/create-all`**
- Creates virtual accounts for ALL loans that are missing them
- Skips loans where customer has no bank account details
- Returns detailed results showing success/failure per loan

**Response:**
```json
{
  "total": 10,
  "created": 8,
  "skipped": 1,
  "failed": 1,
  "details": [
    {
      "loanNumber": "LN-2026-0001",
      "status": "created"
    },
    {
      "loanNumber": "LN-2026-0002",
      "status": "skipped",
      "reason": "Customer has no bank account details"
    },
    {
      "loanNumber": "LN-2026-0003",
      "status": "failed",
      "reason": "Provider API error: insufficient balance"
    }
  ]
}
```

### 3. Admin UI Page

**Location:** `/accounting/missing-virtual-accounts`

**Features:**
- Dashboard showing:
  - Total loans without virtual accounts
  - How many are ready to create (have bank details)
  - How many are missing bank details
- One-click bulk creation button
- Detailed list view showing each loan
- Real-time results after bulk creation

**Access:** Requires `loan_applications:disburse` permission (Accounting role)

## How to Use

### For System Admins

1. **Check for missing virtual accounts:**
   ```bash
   GET /api/v1/virtual-accounts/missing/list
   ```

2. **Create all missing virtual accounts:**
   ```bash
   POST /api/v1/virtual-accounts/missing/create-all
   ```

### For Accounting Staff

1. Navigate to **Accounting → Missing Virtual Accounts** in the web UI
2. Review the summary dashboard
3. Click **"Create All Virtual Accounts"** button
4. Wait for bulk creation to complete
5. Review results showing created/skipped/failed accounts

### For Individual Loans

If you need to manually create a virtual account for a specific loan:

```bash
POST /api/v1/virtual-accounts/create-for-loan/:loanId
```

This endpoint accepts either:
- Loan ID (`loan.id`)
- Loan Application ID (`loanApplication.id`)

## Prevention

To prevent this issue in the future, consider:

### Option A: Synchronous Creation (Recommended)
Move virtual account creation inside the disbursement transaction:

```typescript
const loan = await this.prisma.$transaction(async (tx) => {
  // Create loan
  const created = await tx.loan.create({ ... });
  
  // Create virtual account synchronously
  await this.virtualAccountsService.createForLoan(created.id, customerId);
  
  return created;
});
```

**Pros:**
- If VA creation fails, entire disbursement fails (no partial state)
- Guarantees every disbursed loan has a virtual account
- No silent failures

**Cons:**
- Disbursement takes longer (waits for provider API)
- If provider is down, disbursements are blocked

### Option B: Better Error Handling (Current Approach)
Keep async creation but add:
- Error logging with alerts
- Post-disbursement verification check
- Automatic retry mechanism

```typescript
@OnEvent('loan.disbursed')
async handleLoanDisbursed(payload) {
  try {
    await this.createForLoan(payload.loanId, payload.customerId);
  } catch (error) {
    this.logger.error(`CRITICAL: Failed to create VA for loan ${payload.loanId}`, error);
    // Send alert to accounting team
    this.notificationService.alertAccountingTeam({
      message: `Loan ${payload.loanId} disbursed without virtual account`,
      severity: 'critical',
    });
  }
}
```

## Files Modified

### Backend
- `vclop-backend/src/modules/virtual-accounts/virtual-accounts.service.ts`
  - Added `findLoansWithoutVirtualAccounts()` method
  - Added `bulkCreateMissingVirtualAccounts()` method

- `vclop-backend/src/modules/virtual-accounts/virtual-accounts.controller.ts`
  - Added `GET /missing/list` endpoint
  - Added `POST /missing/create-all` endpoint

### Frontend
- `vclop-frontend/src/pages/virtual-accounts/MissingVirtualAccountsPage.tsx`
  - New admin page for managing missing virtual accounts

- `vclop-frontend/src/router/AppRouter.tsx`
  - Added route `/accounting/missing-virtual-accounts`

## Testing

1. **Find a loan without a virtual account:**
   ```sql
   SELECT * FROM "Loan" 
   WHERE id NOT IN (SELECT "loanId" FROM "VirtualAccount");
   ```

2. **Check customer has bank details:**
   ```sql
   SELECT "bankAccountNumber", "bankCode" 
   FROM "Customer" 
   WHERE id = '<customerId>';
   ```

3. **Create virtual account via API:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/virtual-accounts/create-for-loan/<loanId> \
     -H "Authorization: Bearer <token>"
   ```

4. **Verify virtual account was created:**
   ```sql
   SELECT * FROM "VirtualAccount" WHERE "loanId" = '<loanId>';
   ```

## Notes

- Virtual accounts are **per-loan**, not per-customer
- Each disbursed loan gets its own dedicated virtual account for collecting repayments
- Customers with multiple loans will have multiple virtual accounts
- Virtual account creation requires customer to have `bankAccountNumber` AND `bankCode`
