# Paystack Automatic Disbursement System - Setup Guide

## Overview
This system automatically transfers loan disbursements, transport reimbursements, and other payments to bank accounts using the Paystack Transfer API.

## Features
✅ **Generic & Reusable** - Works for loans, transport, expenses, salaries, and any bank transfers  
✅ **Automatic Processing** - Transfers initiate automatically when loans are disbursed  
✅ **Webhook Integration** - Real-time status updates from Paystack  
✅ **Failure Recovery** - Manual retry for failed transfers from admin panel  
✅ **Audit Trail** - Complete tracking of all disbursement attempts  
✅ **Bank Verification** - Validates account details before transfer  

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
cd vclop/vclop-backend
npx prisma migrate deploy
```

This creates:
- `disbursement_transactions` table (tracks all transfers)
- `paystack_transfer_recipients` table (stores Paystack recipient codes)
- Adds bank fields to `users` table (for employee reimbursements)
- Adds disbursement tracking to `loan_applications` and `transport_requests`

### Step 2: Configure Paystack API Keys

1. **Get Paystack API Keys**
   - Go to https://dashboard.paystack.com/#/settings/developers
   - For testing: Use **Test Mode** keys (sk_test_...)
   - For production: Use **Live Mode** keys (sk_live_...)

2. **Add to Environment Variables**

Create or update `vclop/vclop-backend/.env`:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 3: Configure Paystack Webhook

1. Go to https://dashboard.paystack.com/#/settings/developers
2. Click **Webhooks** tab
3. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack/transfers`
4. Select events to listen for:
   - ✅ `transfer.success`
   - ✅ `transfer.failed`
   - ✅ `transfer.reversed`
5. Copy the **Webhook Secret** and add to `.env` as `PAYSTACK_WEBHOOK_SECRET`

### Step 4: Setup Permissions

Run the SQL script to create disbursement permissions:

```bash
mysql -u your_user -p your_database < vclop/vclop-backend/SETUP_DISBURSEMENT_PERMISSIONS.sql
```

This creates:
- `DISBURSEMENTS:VIEW` - View disbursement transactions
- `DISBURSEMENTS:RETRY` - Retry failed disbursements

And assigns them to:
- **Accounting Officer** - View only
- **Accounting Head** - View + Retry

### Step 5: Restart Backend Server

```bash
cd vclop/vclop-backend
npm run start:dev
```

---

## 📋 How It Works

### Loan Disbursement Flow

```
1. Loan Officer approves loan
   ↓
2. Loan status changes to DISBURSED
   ↓
3. System automatically initiates Paystack transfer
   ↓
4. Record created in disbursement_transactions (PENDING)
   ↓
5. Paystack recipient created/retrieved
   ↓
6. Transfer initiated via Paystack API (PROCESSING)
   ↓
7. Webhook receives status update (SUCCESS/FAILED)
   ↓
8. disbursement_transactions updated
   ↓
9. loan_applications.disbursementStatus updated
```

### Transport Reimbursement Flow

Same process, but:
- Entity type: `TRANSPORT`
- Recipient: Employee's bank account
- Triggered when transport request is approved

---

## 🎯 Usage

### Admin Panel - Monitor Disbursements

Navigate to: **Accounting → Disbursements** (`/accounting/disbursements`)

**Features:**
- ✅ View all pending/processing disbursements
- ✅ View all failed disbursements
- ✅ Filter by entity type (Loan, Transport, Expense, etc.)
- ✅ Retry failed disbursements manually
- ✅ View detailed transaction information
- ✅ See Paystack transfer codes and references

### Loan Detail Page - Disbursement Status

Each loan shows disbursement status widget with:
- Current status (Pending, Processing, Success, Failed)
- Amount transferred
- Bank account details
- Paystack reference
- Failure reason (if failed)
- Retry count

---

## 🔧 Manual Disbursement (Optional)

You can also trigger disbursement programmatically:

```typescript
import { DisbursementService } from './modules/payments/disbursements/disbursement.service';

await disbursementService.initiateDisbursement({
  entityType: 'LOAN',           // or TRANSPORT, EXPENSE, etc.
  entityId: loanApplicationId,
  recipientType: 'CUSTOMER',    // or EMPLOYEE, VENDOR
  recipientId: customerId,
  amount: 50000,
  purpose: 'Loan disbursement',
  initiatedById: userId,
});
```

---

## ⚠️ Important Notes

### Test Mode vs Live Mode

**Test Mode** (Recommended for development):
- Use test API keys (sk_test_...)
- No real money is transferred
- Test bank accounts: Use Paystack test account numbers
- Test banks: Use bank codes like `044` (Access Bank)

**Live Mode** (Production only):
- Requires KYC verification on Paystack
- Real money is transferred
- Use live API keys (sk_live_...)
- Customer bank accounts must be real and valid

### Bank Account Requirements

**For Customers (Loan disbursements):**
- `bankAccountNumber` - Required
- `bankCode` - Required (e.g., "044" for Access Bank)

**For Employees (Transport/Expense reimbursements):**
- `bankAccountNumber` - Required  
- `bankCode` - Required
- `bankName` - Optional (auto-fetched from Paystack)

### Failure Handling

If a disbursement fails:
1. Check failure reason in admin panel
2. Common issues:
   - Invalid bank account number
   - Invalid bank code
   - Insufficient balance on Paystack
   - Customer account name mismatch
3. Fix the issue (update bank details if needed)
4. Click **Retry** in admin panel

### Security

- API keys are sensitive - never commit to git
- Webhook signature is verified automatically
- All disbursements are logged with audit trail
- Only authorized roles can retry failed transfers

---

## 🗂️ Database Schema

### disbursement_transactions

Tracks ALL payment/transfer attempts:

| Field | Type | Description |
|-------|------|-------------|
| entityType | ENUM | LOAN, TRANSPORT, EXPENSE, STAFF_LOAN, SALARY, etc. |
| entityId | VARCHAR | ID of the loan/transport/expense record |
| recipientType | ENUM | CUSTOMER, EMPLOYEE, VENDOR |
| recipientId | VARCHAR | ID of the recipient |
| amount | DECIMAL | Amount in Naira |
| status | ENUM | PENDING, PROCESSING, SUCCESS, FAILED, REVERSED |
| paystackTransferCode | VARCHAR | Paystack transfer code |
| paystackReference | VARCHAR | Unique reference for tracking |
| failureReason | TEXT | Why it failed (if applicable) |
| retryCount | INT | Number of retry attempts |

### paystack_transfer_recipients

Stores Paystack recipient codes (reusable):

| Field | Type | Description |
|-------|------|-------------|
| ownerType | ENUM | CUSTOMER, EMPLOYEE, VENDOR |
| ownerId | VARCHAR | ID of the owner |
| recipientCode | VARCHAR | Paystack recipient code |
| accountNumber | VARCHAR | Bank account number |
| accountName | VARCHAR | Account holder name |
| bankCode | VARCHAR | Bank code |

---

## 🧪 Testing

### Test with Paystack Test Mode

1. Use test API keys
2. Test bank account: `0123456789`
3. Test bank code: `044` (Access Bank)
4. Test account name: Will auto-resolve

### Test Flow

```bash
# 1. Create test customer with bank details
# 2. Create loan application
# 3. Approve loan through workflow
# 4. Disburse loan
# 5. Check /accounting/disbursements for status
# 6. Webhook will update status automatically
```

---

## 📞 Troubleshooting

### "Paystack is not properly configured"
- Check `.env` file has `PAYSTACK_SECRET_KEY`
- Restart backend server

### "Invalid account number or bank code"
- Verify bank account number is 10 digits (NUBAN format)
- Verify bank code is correct (e.g., "044" for Access Bank)
- Get bank list: https://api.paystack.co/bank?country=nigeria

### "Insufficient balance"
- In live mode: Fund your Paystack account
- In test mode: This shouldn't happen

### Webhook not updating status
- Check webhook URL is correct in Paystack dashboard
- Verify webhook secret matches `.env`
- Check backend logs for webhook errors
- Test webhook: https://dashboard.paystack.com/#/settings/developers

### Transfer stuck in PENDING
- Check Paystack dashboard for transfer status
- Manually trigger webhook by clicking "Resend" in Paystack
- Or manually retry from admin panel

---

## 🎓 API Endpoints

### GET /api/disbursements/pending
Get all pending/processing disbursements  
**Permission:** `DISBURSEMENTS:VIEW`

### GET /api/disbursements/failed
Get all failed disbursements  
**Permission:** `DISBURSEMENTS:VIEW`

### GET /api/disbursements/:id
Get specific disbursement details  
**Permission:** `DISBURSEMENTS:VIEW`

### POST /api/disbursements/:id/retry
Retry failed disbursement  
**Permission:** `DISBURSEMENTS:RETRY`

### GET /api/disbursements/entity/:entityType/:entityId
Get disbursements for specific entity  
**Permission:** `DISBURSEMENTS:VIEW`

### POST /api/webhooks/paystack/transfers
Paystack webhook endpoint (public, signature-verified)

---

## 🔐 Security Checklist

- [ ] API keys stored in `.env` (not committed to git)
- [ ] Webhook secret configured and matches Paystack
- [ ] Webhook signature verification enabled
- [ ] Permissions assigned to appropriate roles
- [ ] SSL/HTTPS enabled for webhook endpoint
- [ ] KYC completed for live mode
- [ ] Bank account verification enabled

---

## 📚 Additional Resources

- [Paystack Transfers API Documentation](https://paystack.com/docs/transfers/single-transfers/)
- [Paystack Webhooks Documentation](https://paystack.com/docs/payments/webhooks/)
- [Nigerian Bank Codes](https://paystack.com/docs/api/#miscellaneous-bank)
- [Paystack Test Cards & Accounts](https://paystack.com/docs/payments/test-payments/)

---

## 🆘 Support

If you encounter issues:
1. Check backend logs for error messages
2. Check Paystack dashboard for transfer status
3. Review this guide's troubleshooting section
4. Contact system administrator

---

**System Version:** 1.0.0  
**Last Updated:** November 2026  
**Maintained by:** VCLOP Development Team
