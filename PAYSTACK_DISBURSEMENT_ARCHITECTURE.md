# Paystack Automatic Disbursement - Complete Architecture

## Overview
Build a **GENERIC disbursement/payment system** using Paystack Transfer API for:
- **Loan disbursements** to customers
- **Transport reimbursements** to staff/officers  
- **Expense reimbursements** to employees
- **Any other bank transfers** needed in the app

This is a reusable payment engine, not loan-specific.

---

## 1. Database Changes

### A. New Table: `disbursement_transactions` (Generic for all transfers)
Tracks ALL payment/disbursement attempts across the app.

```sql
CREATE TABLE disbursement_transactions (
  id VARCHAR(36) PRIMARY KEY,
  
  -- What is being paid
  entityType VARCHAR(50) NOT NULL, -- LOAN, TRANSPORT, EXPENSE, STAFF_LOAN, OTHER
  entityId VARCHAR(36) NOT NULL, -- ID of loan/transport/expense record
  
  -- Who is receiving payment
  recipientType VARCHAR(50) NOT NULL, -- CUSTOMER, EMPLOYEE, VENDOR
  recipientId VARCHAR(36) NOT NULL, -- ID of customer/employee/vendor
  recipientName VARCHAR(150),
  
  -- Payment details
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  purpose VARCHAR(500), -- Description of payment
  
  -- Bank details
  accountNumber VARCHAR(20),
  accountName VARCHAR(150),
  bankCode VARCHAR(10),
  bankName VARCHAR(100),
  
  -- Paystack fields
  paystackTransferCode VARCHAR(100),
  paystackRecipientCode VARCHAR(100),
  paystackReference VARCHAR(100) UNIQUE,
  paystackStatus VARCHAR(50), -- pending, success, failed, reversed
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCESS, FAILED, REVERSED
  initiatedById VARCHAR(36),
  initiatedAt DATETIME DEFAULT NOW(),
  completedAt DATETIME,
  failureReason TEXT,
  retryCount INT DEFAULT 0,
  lastRetryAt DATETIME,
  
  -- Audit
  metadata JSON, -- Store extra context (e.g., transport request details)
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW(),
  
  INDEX idx_entity (entityType, entityId),
  INDEX idx_recipient (recipientType, recipientId),
  INDEX idx_status (status),
  INDEX idx_paystack_ref (paystackReference)
);
```

### B. New Table: `paystack_transfer_recipients`
Stores Paystack recipient codes for ANY person (reusable).

```sql
CREATE TABLE paystack_transfer_recipients (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Who owns this recipient
  ownerType VARCHAR(50) NOT NULL, -- CUSTOMER, EMPLOYEE, VENDOR
  ownerId VARCHAR(36) NOT NULL,
  
  -- Bank details
  recipientCode VARCHAR(100) NOT NULL UNIQUE,
  accountNumber VARCHAR(20) NOT NULL,
  accountName VARCHAR(150) NOT NULL,
  bankCode VARCHAR(10) NOT NULL,
  bankName VARCHAR(100),
  
  -- Status
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW(),
  
  UNIQUE KEY unique_owner (ownerType, ownerId),
  INDEX idx_owner (ownerType, ownerId),
  INDEX idx_recipient_code (recipientCode)
);
```

### C. Add fields to existing tables

**loan_applications:**
```sql
ALTER TABLE loan_applications ADD COLUMN disbursementTransactionId VARCHAR(36);
ALTER TABLE loan_applications ADD COLUMN disbursementStatus VARCHAR(50) DEFAULT 'NOT_INITIATED';
```

**transport_requests** (if exists):
```sql
ALTER TABLE transport_requests ADD COLUMN disbursementTransactionId VARCHAR(36);
ALTER TABLE transport_requests ADD COLUMN reimbursementStatus VARCHAR(50) DEFAULT 'NOT_INITIATED';
```

**employees** (store bank details):
```sql
ALTER TABLE employees ADD COLUMN bankAccountNumber VARCHAR(20);
ALTER TABLE employees ADD COLUMN bankCode VARCHAR(10);
ALTER TABLE employees ADD COLUMN bankName VARCHAR(100);
```

**customers:**
```sql
ALTER TABLE customers ADD COLUMN bankName VARCHAR(100);
```

---

## 2. Paystack Integration Strategy

### A. Paystack APIs Used
1. **Banks API** - Get list of Nigerian banks
2. **Transfer Recipient API** - Create recipient for customer
3. **Transfers API** - Initiate transfer
4. **Transfer Webhook** - Receive status updates

### B. Flow Diagram
```
1. Loan APPROVED → Trigger Disbursement
2. Check/Create Paystack Recipient for Customer
3. Initiate Transfer via Paystack
4. Save Transaction Record (status: PROCESSING)
5. Wait for Webhook Confirmation
6. Webhook Received → Update Transaction & Loan Status
7. If Failed → Log, Notify, Allow Retry
```

### C. Error Handling Strategy
- **Insufficient Balance** → Notify accounting, mark as FAILED
- **Invalid Account** → Notify loan officer, mark as FAILED
- **Network Error** → Auto-retry up to 3 times
- **Recipient Creation Failed** → Log error, manual intervention required
- **Transfer Timeout** → Query Paystack status after 2 minutes

---

## 3. Backend Implementation Plan

### A. Environment Variables (.env)
```env
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx
PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_ENVIRONMENT=test # test | live
```

### B. Module Structure
```
src/modules/payments/
├── paystack/
│   ├── paystack.module.ts
│   ├── paystack.service.ts (Core API wrapper)
│   ├── paystack-transfer.service.ts (Transfer logic)
│   ├── paystack-recipient.service.ts (Recipient management)
│   └── dto/
│       ├── create-transfer.dto.ts
│       ├── transfer-webhook.dto.ts
│       └── create-recipient.dto.ts
├── disbursements/
│   ├── disbursement.module.ts
│   ├── disbursement.service.ts (Business logic)
│   ├── disbursement.controller.ts (Admin endpoints)
│   └── dto/
│       ├── initiate-disbursement.dto.ts
│       └── retry-disbursement.dto.ts
└── webhooks/
    ├── paystack-webhook.controller.ts
    └── paystack-webhook.service.ts
```

### C. Key Services

**PaystackService** (Core wrapper)
- `getBanks()` - Fetch Nigerian banks
- `verifyAccount(accountNumber, bankCode)` - Verify account name
- `createRecipient(data)` - Create transfer recipient
- `initiateTransfer(data)` - Start transfer
- `getTransferStatus(reference)` - Query status
- `listTransfers(params)` - List transfers

**DisbursementService** (Generic business logic)
- `initiateDisbursement(params)` - Main entry point for ANY payment
  ```typescript
  initiateDisbursement({
    entityType: 'LOAN' | 'TRANSPORT' | 'EXPENSE',
    entityId: string,
    recipientType: 'CUSTOMER' | 'EMPLOYEE',
    recipientId: string,
    amount: number,
    purpose: string,
    metadata?: any
  })
  ```
- `createOrGetRecipient(ownerType, ownerId)` - Get/create Paystack recipient
- `createTransfer(disbursementId)` - Initiate Paystack transfer
- `handleWebhookEvent(event)` - Process webhook
- `retryFailedDisbursement(disbursementId)` - Manual retry
- `getPendingDisbursements(entityType?)` - Filter by type
- `getFailedDisbursements(entityType?)` - Failed transfers

**Use Cases:**
```typescript
// Loan disbursement
await disbursementService.initiateDisbursement({
  entityType: 'LOAN',
  entityId: loanApplication.id,
  recipientType: 'CUSTOMER',
  recipientId: customer.id,
  amount: loanApplication.amount,
  purpose: `Loan disbursement for ${loanApplication.applicationNumber}`
});

// Transport reimbursement
await disbursementService.initiateDisbursement({
  entityType: 'TRANSPORT',
  entityId: transportRequest.id,
  recipientType: 'EMPLOYEE',
  recipientId: employee.id,
  amount: transportRequest.approvedAmount,
  purpose: `Transport reimbursement for ${transportRequest.reference}`
});
```

---

## 4. Webhook Handling

### A. Webhook Events to Handle
```typescript
{
  event: "transfer.success",
  data: {
    reference: "ref_xxx",
    status: "success",
    transfer_code: "TRF_xxx",
    amount: 50000,
    recipient: {...}
  }
}

{
  event: "transfer.failed",
  data: {
    reference: "ref_xxx",
    status: "failed",
    reason: "Insufficient funds"
  }
}

{
  event: "transfer.reversed",
  data: {
    reference: "ref_xxx",
    status: "reversed"
  }
}
```

### B. Webhook Security
- Verify signature using `PAYSTACK_WEBHOOK_SECRET`
- Validate event structure
- Idempotency check (don't process same event twice)
- Log all webhook events for audit

### C. Webhook Endpoint
```
POST /api/webhooks/paystack/transfers
Headers:
  x-paystack-signature: sha512_hash
Body: Webhook event JSON
```

---

## 5. Frontend Implementation

### A. New Pages/Components

**DisbursementMonitoringPage** (`/accounting/disbursements`)
- Tabs: All | Pending | Failed | Success
- Table: Loan#, Customer, Amount, Status, Date, Actions
- Actions: View Details, Retry (for failed)
- Filters: Date range, Status
- Export to CSV

**DisbursementDetailsModal**
- Transaction info
- Paystack reference
- Error details (if failed)
- Retry history
- Webhook events log

**Loan Detail Page Updates**
- Add "Disbursement Status" section
- Show: Status badge, Paystack reference, Transfer date
- If failed: Show error + Retry button (for accounting)

### B. Permissions
- `disbursements:view` - View disbursement page
- `disbursements:retry` - Retry failed disbursements
- `disbursements:initiate` - Manual disbursement trigger

---

## 6. Workflow Integration

### Current Workflow
```
APPROVED → Manual Disbursement → DISBURSED
```

### New Automated Workflow
```
APPROVED → Auto-create Transfer → PENDING_DISBURSEMENT
         ↓
    Webhook Success → DISBURSED
         ↓
    Webhook Failed → DISBURSEMENT_FAILED (manual intervention)
```

### Trigger Points
1. **Automatic**: When loan status changes to APPROVED
2. **Manual**: Accounting officer clicks "Disburse Now" button
3. **Retry**: Accounting officer retries failed disbursement

---

## 7. Error Scenarios & Recovery

| Scenario | System Response | Recovery |
|----------|----------------|----------|
| Insufficient Paystack Balance | Log, notify accounting | Top up Paystack balance, retry |
| Invalid Customer Account | Mark FAILED, notify LO | Update customer account, retry |
| Network Timeout | Auto-retry 3x with backoff | Manual retry if all fail |
| Paystack API Down | Queue for retry | Automatic retry every 5 mins |
| Webhook Not Received | Poll status after 2 mins | Mark as per polled status |
| Duplicate Transfer | Idempotency check prevents | No action needed |

---

## 8. Notifications

### Email Notifications
- **To Accounting** - When disbursement fails (immediate)
- **To Accounting** - Daily summary of failed disbursements
- **To Loan Officer** - When customer's account is invalid
- **To Admin** - When Paystack balance is low

### In-App Notifications
- **To Accounting** - Failed disbursement alert
- **To Customer** (future) - "Your loan has been disbursed"

---

## 9. Audit & Logging

### What to Log
- Every API call to Paystack (request + response)
- Every webhook event received
- Every status change in disbursement_transactions
- Every retry attempt
- Every error/failure

### Where to Log
- Database: `disbursement_transactions` table
- File: `logs/paystack-{date}.log`
- Monitoring: Send failures to error tracking service

---

## 10. Configuration

### Paystack Settings (Database: `settings` table)
```json
{
  "paystack": {
    "enabled": true,
    "auto_disburse_on_approval": true,
    "max_retry_attempts": 3,
    "retry_delay_minutes": 5,
    "low_balance_threshold": 1000000,
    "notification_emails": ["accounting@company.com"]
  }
}
```

---

## 11. Testing Strategy

### Test Mode (Paystack Test Keys)
- Use test secret key
- Test banks: 000 (Test Bank)
- Test account: 0123456789
- Webhook: Use ngrok for local testing

### Test Scenarios
1. ✅ Successful transfer (approved loan → auto-disburse → success)
2. ✅ Failed transfer (invalid account)
3. ✅ Retry after failure
4. ✅ Webhook handling (success, failed, reversed)
5. ✅ Duplicate prevention
6. ✅ Manual trigger from UI
7. ✅ Low balance handling
8. ✅ Network failure recovery

---

## 12. Deployment Checklist

- [ ] Add Paystack credentials to production .env
- [ ] Run database migrations
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Test with test keys first
- [ ] Set auto_disburse_on_approval to false initially
- [ ] Manually test 1-2 disbursements
- [ ] Enable auto-disbursement
- [ ] Monitor for 24 hours
- [ ] Document runbook for accounting team

---

## 13. API Endpoints Summary

### Admin/Accounting Endpoints
```
GET    /api/disbursements                 - List all disbursements
GET    /api/disbursements/pending         - Pending disbursements
GET    /api/disbursements/failed          - Failed disbursements
GET    /api/disbursements/:id             - Get details
POST   /api/disbursements/:id/retry       - Retry failed
POST   /api/disbursements/initiate/:loanId - Manual trigger
GET    /api/disbursements/stats           - Dashboard stats
```

### Webhook
```
POST   /api/webhooks/paystack/transfers   - Receive Paystack events
```

### Paystack Utilities
```
GET    /api/paystack/banks                - List Nigerian banks
POST   /api/paystack/verify-account       - Verify account name
```

---

## 14. Future Enhancements

1. **Scheduled Disbursements** - Queue transfers for specific time
2. **Batch Disbursements** - Disburse multiple loans at once
3. **SMS Notifications** - Notify customers of disbursement
4. **Reconciliation Dashboard** - Match Paystack transactions with loans
5. **Multi-Provider Support** - Add Flutterwave as backup
6. **Approval Workflow** - Require approval before auto-disbursement
7. **Customer Verification** - Verify BVN matches account before transfer

---

**Status**: Architecture Complete ✅  
**Next**: Proceed with implementation
