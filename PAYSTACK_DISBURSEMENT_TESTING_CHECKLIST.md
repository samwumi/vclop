# Paystack Disbursement System - Testing Checklist

## 🧪 Pre-Testing Setup

### ✅ 1. Database Migration
```bash
cd vclop/vclop-backend
npx prisma migrate deploy
```

**Verify:**
- [ ] `disbursement_transactions` table exists
- [ ] `paystack_transfer_recipients` table exists
- [ ] `users` table has bank fields (bankAccountNumber, bankCode, bankName)
- [ ] `loan_applications` has disbursementTransactionId and disbursementStatus
- [ ] `transport_requests` has disbursementTransactionId and reimbursementStatus

### ✅ 2. Environment Configuration
```bash
# Check .env file has:
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxxxxxxxxxx
```

**Verify:**
- [ ] Environment variables are set
- [ ] Using TEST keys (sk_test_ prefix) for testing
- [ ] Backend server restarts successfully

### ✅ 3. Permissions Setup
```bash
mysql -u user -p database < vclop/vclop-backend/SETUP_DISBURSEMENT_PERMISSIONS.sql
```

**Verify:**
- [ ] DISBURSEMENTS:VIEW permission exists
- [ ] DISBURSEMENTS:RETRY permission exists
- [ ] Accounting Officer role has VIEW permission
- [ ] Accounting Head role has VIEW + RETRY permissions

### ✅ 4. Backend Compilation
```bash
cd vclop/vclop-backend
npm run build
```

**Verify:**
- [ ] No TypeScript compilation errors
- [ ] PaymentsModule imports correctly
- [ ] DisbursementService imports correctly in LoanApplicationsModule

---

## 🔬 Unit Testing Checklist

### Test 1: PaystackService - Get Banks
```bash
# Manual test via API client (Postman/Insomnia)
GET https://api.paystack.co/bank?country=nigeria
Authorization: Bearer sk_test_your_key
```

**Expected Result:**
- [ ] Returns list of Nigerian banks
- [ ] Each bank has: id, name, code, active, country

### Test 2: PaystackService - Verify Account
```bash
# Test with known account
GET https://api.paystack.co/bank/resolve?account_number=0123456789&bank_code=044
Authorization: Bearer sk_test_your_key
```

**Expected Result:**
- [ ] Returns account_name, account_number, bank_id
- [ ] Or returns error if invalid

### Test 3: Database Records
```sql
-- Check empty tables before testing
SELECT COUNT(*) FROM disbursement_transactions;
SELECT COUNT(*) FROM paystack_transfer_recipients;
```

**Expected Result:**
- [ ] Tables exist and are accessible
- [ ] No errors querying tables

---

## 🎯 End-to-End Test: Loan Disbursement Flow

### Prerequisites
1. Create test customer with valid bank details:
   - Bank Account Number: `0123456789` (Paystack test account)
   - Bank Code: `044` (Access Bank test code)
   - Or use real test account from your Paystack dashboard

### Step 1: Create Test Customer
```
Navigate to: /customers/new
Fill in:
- First Name: Test
- Last Name: Customer
- Phone: 08012345678
- Bank Account Number: 0123456789
- Bank Code: 044
Save customer
```

**Verify:**
- [ ] Customer created successfully
- [ ] Bank details saved correctly
- [ ] Customer ID generated

### Step 2: Create Loan Application
```
Navigate to: /loans/new
Select customer: Test Customer
Fill in loan details:
- Loan Product: (any)
- Amount: 50000
- Tenure: 30 days
Submit application
```

**Verify:**
- [ ] Application created with status DRAFT
- [ ] Application number generated
- [ ] Customer bank details validated

### Step 3: Submit and Approve via Workflow
```
1. Submit application (status → SUBMITTED)
2. Compliance review → APPROVE
3. Internal Control → APPROVE
4. Accounting review → APPROVE
Final status: APPROVED
```

**Verify at each stage:**
- [ ] Status transitions correctly
- [ ] Workflow progresses through stages
- [ ] No errors in backend logs
- [ ] Final status is APPROVED

### Step 4: Disburse Loan
```
Navigate to loan detail page
Click "Disburse Loan" button
Confirm disbursement
```

**Expected Backend Flow:**
```
1. Loan record created in database
2. Repayment schedule generated
3. LoanApplication status → DISBURSED
4. DisbursementService.initiateDisbursement() called
5. disbursement_transaction record created (status: PENDING)
6. Paystack recipient created/retrieved
7. Paystack transfer initiated
8. disbursement_transaction updated (status: PROCESSING)
```

**Verify:**
- [ ] Loan status changes to DISBURSED
- [ ] No errors in backend console
- [ ] Check backend logs for disbursement messages

**Check Database:**
```sql
-- Check disbursement transaction was created
SELECT * FROM disbursement_transactions 
WHERE entityType = 'LOAN' 
ORDER BY createdAt DESC 
LIMIT 1;

-- Check recipient was created
SELECT * FROM paystack_transfer_recipients 
WHERE ownerType = 'CUSTOMER' 
ORDER BY createdAt DESC 
LIMIT 1;

-- Check loan application updated
SELECT disbursementTransactionId, disbursementStatus 
FROM loan_applications 
WHERE id = 'your_loan_id';
```

**Verify Database Records:**
- [ ] disbursement_transaction record exists
- [ ] entityType = 'LOAN'
- [ ] recipientType = 'CUSTOMER'
- [ ] amount matches loan amount
- [ ] status is PENDING or PROCESSING
- [ ] paystackRecipientCode is populated
- [ ] paystackReference is populated
- [ ] loan_applications.disbursementTransactionId links correctly

### Step 5: Check Admin Panel
```
Navigate to: /accounting/disbursements
Check "Pending & Processing" tab
```

**Verify:**
- [ ] New disbursement appears in pending list
- [ ] Shows correct amount
- [ ] Shows customer name
- [ ] Shows bank details
- [ ] Status chip displays correctly
- [ ] Can view details dialog
- [ ] Paystack reference is shown

### Step 6: Monitor Paystack Dashboard
```
Go to: https://dashboard.paystack.com/#/transfers
In TEST mode
```

**Verify:**
- [ ] Transfer appears in Paystack dashboard
- [ ] Status shows (pending/success/failed)
- [ ] Amount matches (in kobo: amount × 100)
- [ ] Reference matches database record
- [ ] Recipient details match

### Step 7: Webhook Status Update
```
Wait for Paystack webhook (usually < 1 minute)
Or manually trigger from Paystack dashboard
```

**Expected Backend Flow:**
```
1. Webhook received at /api/webhooks/paystack/transfers
2. Signature verified
3. Event processed: transfer.success or transfer.failed
4. disbursement_transaction updated
5. loan_application.disbursementStatus updated
```

**Verify Backend Logs:**
- [ ] Log: "Received Paystack webhook: transfer.success"
- [ ] Log: "Successfully processed webhook"
- [ ] No errors in webhook processing

**Check Database After Webhook:**
```sql
-- Check status updated
SELECT status, paystackStatus, completedAt 
FROM disbursement_transactions 
WHERE id = 'your_disbursement_id';

-- Check loan application updated
SELECT disbursementStatus 
FROM loan_applications 
WHERE id = 'your_loan_id';
```

**Verify:**
- [ ] disbursement_transaction.status = 'SUCCESS' (or 'FAILED')
- [ ] completedAt timestamp is set
- [ ] paystackStatus matches Paystack
- [ ] loan_applications.disbursementStatus updated

### Step 8: Verify UI Updates
```
Refresh admin panel: /accounting/disbursements
Refresh loan detail page
```

**Verify Admin Panel:**
- [ ] Disbursement moved to appropriate tab (success disappears from pending)
- [ ] Status updated in real-time
- [ ] Success icon/chip shows if successful

**Verify Loan Detail Page:**
- [ ] Disbursement status widget shows SUCCESS
- [ ] Completed timestamp displayed
- [ ] Bank account details shown
- [ ] Paystack reference visible

---

## 🔄 Test: Failed Disbursement & Retry

### Step 1: Force Failure (Use Invalid Bank Details)
```
Create customer with:
- Account Number: 1234567890 (invalid)
- Bank Code: 999 (invalid)
Create and approve loan
Disburse loan
```

**Expected Result:**
- [ ] Disbursement fails
- [ ] Error logged in backend
- [ ] disbursement_transaction.status = 'FAILED'
- [ ] failureReason populated

### Step 2: Check Failed Disbursement
```
Navigate to: /accounting/disbursements
Check "Failed" tab
```

**Verify:**
- [ ] Failed disbursement appears
- [ ] Error chip displayed
- [ ] Failure reason shown
- [ ] Retry button available

### Step 3: Fix and Retry
```
1. Update customer bank details (valid test account)
2. Click "Retry" button in admin panel
```

**Expected Result:**
- [ ] Retry initiated
- [ ] retryCount incremented
- [ ] Status changes to PROCESSING
- [ ] New transfer attempt on Paystack
- [ ] Eventually succeeds if details corrected

---

## 🚦 Test: Transport Reimbursement (Bonus)

### Prerequisites
1. User/Employee has bank details filled:
   - Navigate to: /profile
   - Add bank account number and bank code

### Flow
```
1. Create transport request
2. Approve transport request
3. System initiates disbursement to employee
4. Check disbursement in admin panel
   - Entity Type: TRANSPORT
   - Recipient Type: EMPLOYEE
```

**Verify:**
- [ ] Transport reimbursement works same as loan
- [ ] Recipient is employee (not customer)
- [ ] Uses employee's bank account

---

## 📊 Performance Testing

### Load Test: Multiple Disbursements
```
Create 10 loans and disburse all at once
```

**Verify:**
- [ ] All disbursements initiated
- [ ] No race conditions
- [ ] All recipients created correctly
- [ ] All transfers appear in Paystack
- [ ] Database handles concurrent inserts

---

## 🔐 Security Testing

### Test 1: Webhook Signature Verification
```
Send fake webhook with wrong signature
POST /api/webhooks/paystack/transfers
X-Paystack-Signature: invalid_signature
```

**Expected Result:**
- [ ] Request rejected
- [ ] Log: "Invalid Paystack webhook signature"
- [ ] Status 400 or similar

### Test 2: Permission Enforcement
```
Login as user WITHOUT DISBURSEMENTS:VIEW permission
Try to access: /accounting/disbursements
```

**Expected Result:**
- [ ] Access denied
- [ ] Redirected or 403 error

### Test 3: Retry Permission
```
Login as Accounting Officer (VIEW only)
Try to retry failed disbursement
```

**Expected Result:**
- [ ] Retry button disabled OR
- [ ] API returns 403 Forbidden

---

## ✅ Final Verification Checklist

### Backend
- [ ] No TypeScript errors
- [ ] All modules import correctly
- [ ] Environment variables loaded
- [ ] Paystack API connection works
- [ ] Webhook endpoint accessible
- [ ] Database migrations applied
- [ ] Permissions created and assigned

### Frontend
- [ ] No compilation errors
- [ ] Route /accounting/disbursements accessible
- [ ] Components render without errors
- [ ] API calls work (no CORS issues)
- [ ] Status updates display correctly
- [ ] Retry button functional

### Database
- [ ] All tables created
- [ ] Foreign keys valid
- [ ] Indexes created
- [ ] Data persists correctly
- [ ] Transactions atomic

### Integration
- [ ] Loan disbursement triggers transfer
- [ ] Webhook updates status
- [ ] Admin panel shows correct data
- [ ] Failed transfers can be retried
- [ ] Transport reimbursements work

### Production Readiness
- [ ] Test mode thoroughly tested
- [ ] KYC completed on Paystack (for live mode)
- [ ] Live API keys ready (don't use until ready!)
- [ ] Webhook URL configured
- [ ] SSL certificate valid
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Run `npx prisma generate`

### Issue: "PAYSTACK_SECRET_KEY is not configured"
**Solution:** Check `.env` file and restart backend

### Issue: Webhook not received
**Solution:** 
1. Check webhook URL in Paystack dashboard
2. Ensure URL is publicly accessible (use ngrok for local testing)
3. Check firewall/security group rules

### Issue: "Invalid account number or bank code"
**Solution:**
1. Verify account number is 10 digits
2. Use valid Nigerian bank codes
3. Test with Paystack test accounts

### Issue: Disbursement stuck in PENDING
**Solution:**
1. Check backend logs for errors
2. Check Paystack dashboard for transfer status
3. Manually trigger webhook from Paystack
4. Use retry button in admin panel

---

## 📝 Test Results Template

```
Test Date: _______________
Tested By: _______________
Environment: [ ] Test  [ ] Staging  [ ] Production

✅ PASSED  ❌ FAILED  ⚠️  PARTIAL

[ ] Database Migration
[ ] Environment Setup
[ ] Permissions Setup
[ ] Backend Compilation
[ ] Loan Disbursement Flow
[ ] Webhook Processing
[ ] Admin Panel UI
[ ] Failed Disbursement Retry
[ ] Transport Reimbursement
[ ] Security Tests

Notes:
_________________________________
_________________________________
_________________________________

Issues Found:
_________________________________
_________________________________
_________________________________

Next Steps:
_________________________________
_________________________________
_________________________________
```

---

## 🎓 Manual Testing Script

Copy and execute this in your browser console while testing:

```javascript
// Check if disbursement was created
fetch('/api/disbursements/pending')
  .then(r => r.json())
  .then(d => console.log('Pending:', d.data));

// Check specific loan's disbursements
const loanId = 'your-loan-id';
fetch(`/api/disbursements/entity/LOAN/${loanId}`)
  .then(r => r.json())
  .then(d => console.log('Loan disbursements:', d.data));

// Simulate webhook (DO NOT use in production!)
fetch('/api/webhooks/paystack/transfers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Paystack-Signature': 'test-signature'
  },
  body: JSON.stringify({
    event: 'transfer.success',
    data: {
      reference: 'your-reference',
      status: 'success'
    }
  })
});
```

---

**Happy Testing! 🚀**

Remember: Always test in TEST mode first before going live!
