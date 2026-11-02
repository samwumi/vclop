# 🎯 VCLOP Recovery Module User Guide

**DROS - Debt Resolution Operating System**

Complete guide on how to use the Recovery Management Module for tracking and recovering defaulted loans.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Dashboard](#dashboard)
5. [Managing Recovery Accounts](#managing-recovery-accounts)
6. [Officer Workflow](#officer-workflow)
7. [Payment Management](#payment-management)
8. [Importing Historical Loans](#importing-historical-loans)
9. [Reports & Analytics](#reports--analytics)
10. [Best Practices](#best-practices)

---

## 🎯 Overview

The Recovery Module helps you:
- Track historical loans from Excel spreadsheets
- Manage defaulted VCLOP loans
- Assign accounts to recovery officers
- Track recovery activities and progress
- Record and verify payments
- Monitor recovery expenses
- Generate recovery reports

### Key Features

✅ **Dual Source Support**: Historical loans (LEGACY) + VCLOP defaulted loans  
✅ **Officer Assignment**: Assign accounts to specific recovery officers  
✅ **Activity Tracking**: Log calls, visits, negotiations, promises  
✅ **Payment Verification**: Accounting Head verifies all payments  
✅ **Expense Tracking**: Track recovery costs (travel, legal fees, etc.)  
✅ **Promise Management**: Track repayment promises and follow-ups  
✅ **Document Storage**: Upload and manage recovery documents  
✅ **CSV Import**: Bulk import historical loans from Excel  

---

## 🚀 Getting Started

### 1. Access the Recovery Module

**Navigate to:**
- Click **"Recovery"** in the sidebar
- You'll see the Recovery Dashboard

**Available Pages:**
- 💰 **Recovery** - Dashboard with metrics
- 💰 **Recovery Accounts** - All accounts list
- 💰 **My Accounts** - Your assigned accounts (Officers)
- 💰 **Verify Payments** - Payment verification (Accounting Head)
- 💰 **Import Accounts** - Bulk import from CSV

### 2. Check Your Permissions

Go to your **Profile** to see which recovery permissions you have.

**Common permission sets:**
- **System Administrator**: All permissions (full access)
- **Loan Officer**: Create, update, record activities & payments
- **Accounting Head**: Verify payments, view reports
- **Manager**: View-only access + reports

---

## 👥 User Roles & Permissions

### Assign Permissions to Roles

**As System Administrator:**

1. Go to **Roles** page (in sidebar)
2. Click the **Edit icon** (✏️) next to a role
3. Scroll to the **RECOVERY** section
4. Check the permissions you want to grant:

#### Permission Categories:

**Dashboard (1 permission):**
- ✅ View Recovery Dashboard

**Accounts (7 permissions):**
- ✅ Create Recovery Account
- ✅ View Recovery Accounts
- ✅ Update Recovery Account
- ✅ Delete Recovery Account
- ✅ Import Recovery Accounts
- ✅ Assign Recovery Accounts
- ✅ View All Recovery Accounts (not just assigned)

**Activities (2 permissions):**
- ✅ Log Recovery Activity
- ✅ View Recovery Activities

**Payments (3 permissions):**
- ✅ Record Recovery Payment
- ✅ Verify Recovery Payment (Accounting Head only)
- ✅ View Recovery Payments

**Promises (3 permissions):**
- ✅ Create Repayment Promise
- ✅ View Repayment Promises
- ✅ Update Promise Status

**Expenses (2 permissions):**
- ✅ Record Recovery Expense
- ✅ View Recovery Expenses

**Documents (3 permissions):**
- ✅ Upload Recovery Document
- ✅ View Recovery Documents
- ✅ Delete Recovery Document

**Reports (2 permissions):**
- ✅ View Recovery Reports
- ✅ Export Recovery Reports

4. Click **"Save Permissions"**

### Recommended Permission Sets

**Recovery Officer (Field Staff):**
- ✅ View dashboard
- ✅ View/Update accounts (only assigned ones)
- ✅ Log activities
- ✅ Record payments (pending verification)
- ✅ Create/update promises
- ✅ Record expenses
- ✅ Upload/view documents

**Accounting Head:**
- ✅ View dashboard
- ✅ View all accounts
- ✅ View activities
- ✅ **Verify payments** ⭐
- ✅ View promises
- ✅ View expenses
- ✅ View/export reports

**Collections Manager:**
- ✅ All recovery permissions (full access)
- Can assign accounts, create accounts, delete if needed

---

## 📊 Dashboard

### What You'll See

**Key Metrics:**
- **Total Accounts**: Number of recovery accounts
- **Total Outstanding**: Total balance to recover (₦)
- **Total Recovered**: Total amount recovered (₦)
- **Total Expenses**: Recovery costs (₦)
- **Net Recovery**: Recovered - Expenses (₦)
- **Recovery Rate**: % of successful recovery

**Charts:**
- Accounts by Status (pie chart)
- Accounts by Source (LEGACY vs VCLOP)
- Recent payments list

**Status Breakdown:**
- Pending Verification
- Assigned
- In Progress
- Promise Active
- Legal Action
- Partially Recovered
- Fully Recovered
- Written Off
- Closed

---

## 💼 Managing Recovery Accounts

### Creating a New Account (Manual)

1. Go to **Recovery Accounts**
2. Click **"New Account"** button
3. Fill in the form:

**Required Fields:**
- **Source**: LEGACY or VCLOP
- **Customer Name**: Full name
- **Customer Phone**: 08012345678
- **Original Principal**: ₦50,000
- **Disbursement Date**: When loan was given
- **Historical Repayments**: ₦10,000 (already paid)
- **Outstanding Balance**: ₦40,000 (current balance)

**Optional Fields:**
- Customer Email
- Customer Address
- Customer BVN/NIN
- Priority Level (LOW, MEDIUM, HIGH, URGENT)
- Branch (if applicable)
- Notes

4. Click **"Create Account"**

### Viewing Account Details

1. Click on any account from the list
2. You'll see:

**Account Info:**
- Account number
- Customer details
- Balance summary
- Assigned officer
- Status & priority

**Tabs:**
- 📋 **Overview**: Summary and key metrics
- 🎯 **Activities**: History of recovery activities
- 💰 **Payments**: Payment history
- 🤝 **Promises**: Repayment promises
- 💸 **Expenses**: Recovery costs
- 📎 **Documents**: Uploaded files

### Assigning Accounts to Officers

**As Manager/Admin:**

1. Open the account detail page
2. Click **"Assign Officer"** button
3. Select an officer from the dropdown
4. Click **"Assign"**

The officer will now see this account in their **"My Accounts"** page.

### Updating Account Status

Status changes automatically based on activities, but you can manually update:

**Status Progression:**
1. **Pending Verification** → Initial state
2. **Assigned** → Assigned to officer
3. **In Progress** → Officer working on it
4. **Promise Active** → Customer made promise
5. **Partially Recovered** → Some payment received
6. **Fully Recovered** → Full balance recovered
7. **Written Off** → Unrecoverable
8. **Closed** → Case closed

---

## 👨‍💼 Officer Workflow

### For Recovery Officers

#### 1. View Your Assigned Accounts

Go to **"My Accounts"** in sidebar:
- See only accounts assigned to you
- Filter by status/priority
- Sort by outstanding balance, last activity date

#### 2. Log Recovery Activities

**For each account:**

1. Open the account detail page
2. Go to **Activities** tab
3. Click **"Log Activity"**
4. Fill in:

**Activity Details:**
- **Type**: Phone Call, SMS, Email, Field Visit, Office Visit, Negotiation, etc.
- **Contact Method**: Phone, SMS, Email, In-Person, WhatsApp
- **Outcome**: Contacted, No Answer, Wrong Number, Promised Payment, Refused to Pay, etc.
- **Notes**: What was discussed, next steps
- **Next Follow-up Date**: When to contact again

5. Click **"Save Activity"**

#### 3. Record Repayment Promises

When customer promises to pay:

1. Go to **Promises** tab
2. Click **"New Promise"**
3. Fill in:
   - **Amount Promised**: ₦10,000
   - **Promise Date**: When they said they'll pay
   - **Notes**: Additional details

4. Click **"Create Promise"**

**Track Promise Status:**
- 🟢 **ACTIVE** - Promise made, waiting
- ✅ **KEPT** - Customer paid as promised
- 🟡 **PARTIAL** - Paid less than promised
- 🔴 **BROKEN** - Didn't pay, follow up needed
- ⚫ **CANCELLED** - Promise cancelled

#### 4. Record Payments (Pending Verification)

When customer makes a payment:

1. Go to **Payments** tab
2. Click **"Record Payment"**
3. Fill in:
   - **Amount**: ₦5,000
   - **Payment Date**: Date received
   - **Payment Method**: Cash, Bank Transfer, Check, Mobile Money
   - **Reference**: Transaction ID or receipt number
   - **Notes**: Additional info
   - **Receipt**: Upload payment receipt (optional)

4. Click **"Record Payment"**

**Status**: PENDING_VERIFICATION (waiting for Accounting Head)

#### 5. Record Recovery Expenses

Track costs incurred:

1. Go to **Expenses** tab
2. Click **"Record Expense"**
3. Fill in:
   - **Expense Type**: Transport, Legal Fees, Administrative, Communication, Other
   - **Amount**: ₦2,000
   - **Date**: When expense occurred
   - **Description**: What it was for
   - **Receipt**: Upload receipt (optional)

4. Click **"Save Expense"**

#### 6. Upload Documents

Store relevant documents:

1. Go to **Documents** tab
2. Click **"Upload Document"**
3. Select:
   - **Document Type**: Agreement, Legal Notice, Payment Receipt, Correspondence, Other
   - **File**: Select file (PDF, images, etc.)
   - **Description**: What this document is

4. Click **"Upload"**

---

## 💰 Payment Management

### For Accounting Head

#### Verify Payments

1. Go to **"Verify Payments"** in sidebar
2. You'll see all **PENDING_VERIFICATION** payments
3. For each payment:

**Review:**
- Account details
- Payment amount
- Payment method
- Reference number
- Receipt (if uploaded)
- Officer who recorded it

**Actions:**
- ✅ **Approve**: Payment is valid
  - Balance automatically updates
  - Status changes to VERIFIED
  - Outstanding balance decreases
  - Recovered amount increases

- ❌ **Reject**: Payment is invalid/incorrect
  - Enter rejection reason
  - Status changes to REJECTED
  - Officer gets notified

4. Click **"Approve"** or **"Reject"**

#### Payment Verification Best Practices

✅ **Check:**
- Payment amount matches bank statement
- Reference number is valid
- Receipt is authentic
- Customer details match
- Date is accurate

❌ **Reject if:**
- Amount doesn't match records
- Duplicate payment
- Invalid receipt
- Wrong account credited

---

## 📥 Importing Historical Loans

### Bulk Import from Excel/CSV

Perfect for importing old loans from spreadsheets!

#### Step 1: Download CSV Template

1. Go to **"Import Accounts"** in sidebar
2. Click **"Download CSV Template"**
3. Open the template in Excel

#### Step 2: Fill in Your Data

**Required Columns:**
- `customer_name` - Full name (e.g., "John Doe")
- `customer_phone` - Phone number (e.g., "08012345678")
- `original_principal` - Original loan amount (number only, e.g., 50000)
- `disbursement_date` - Date format YYYY-MM-DD (e.g., "2023-06-15")
- `historical_repayments` - Amount already paid (e.g., 10000)
- `outstanding_balance` - Current balance (e.g., 40000)

**Optional Columns:**
- `customer_email` - Email address
- `customer_address` - Physical address
- `customer_bvn` - Bank Verification Number
- `customer_nin` - National ID Number
- `priority_level` - LOW, MEDIUM, HIGH, or URGENT
- `notes` - Any additional notes

**Example:**
```csv
customer_name,customer_phone,original_principal,disbursement_date,historical_repayments,outstanding_balance,priority_level
John Doe,08012345678,50000,2023-06-15,10000,40000,HIGH
Jane Smith,08087654321,100000,2023-05-20,20000,80000,URGENT
```

#### Step 3: Upload and Validate

1. Save your Excel file as **CSV**
2. Click **"Upload File"** button
3. Select your CSV file
4. Click **"Parse File"**

**Validation:**
- ✅ Green: All data is valid
- 🔴 Red: Errors found (fix and try again)

**Common Errors:**
- Missing required fields
- Invalid date format (must be YYYY-MM-DD)
- Invalid phone number format
- Negative amounts
- Outstanding balance > Original principal

#### Step 4: Import

1. Review the preview (first 10 rows shown)
2. Check the count: "Ready to Import (X accounts)"
3. Click **"Import Accounts"**
4. Wait for confirmation: "✅ Successfully imported X accounts"

**What Happens:**
- All accounts created with status: PENDING_VERIFICATION
- Source automatically set to: LEGACY
- Accounts appear in Recovery Accounts list
- Ready to assign to officers!

---

## 📈 Reports & Analytics

### Available Reports

1. **Recovery Dashboard**
   - Overall metrics
   - Visual charts
   - Recent activity

2. **Accounts Report** (Coming Soon)
   - Filter by status, officer, branch
   - Export to Excel
   - Custom date ranges

3. **Officer Performance** (Coming Soon)
   - Accounts assigned per officer
   - Recovery rate per officer
   - Activity logs per officer

4. **Financial Report** (Coming Soon)
   - Total recovered vs. expenses
   - Net recovery calculation
   - Payment trends over time

### Exporting Data

**With `recovery:reports_export` permission:**

1. Go to any report page
2. Apply filters (date range, status, etc.)
3. Click **"Export to Excel"** button
4. Download and open in Excel

---

## ✅ Best Practices

### For Recovery Officers

**Daily Routine:**
1. Check **"My Accounts"** for follow-up tasks
2. Review accounts with **upcoming promise dates**
3. Log all customer interactions immediately
4. Record payments same day
5. Update promise status after due date

**Communication:**
- 📞 Call first, then SMS/Email if no answer
- 📝 Log every attempt (even "No Answer")
- 🤝 Be professional and respectful
- 📅 Set realistic follow-up dates
- 🎯 Focus on HIGH/URGENT priority accounts first

**Payment Collection:**
- ✅ Get transaction reference number
- 📸 Request payment receipt
- 💰 Record payment immediately
- 📋 Upload receipt to Documents tab

### For Accounting Head

**Payment Verification:**
- ⏰ Verify payments within 24 hours
- 🔍 Cross-check with bank statements
- ❌ Reject with clear reason
- 📧 Communicate with officers on rejections

### For Managers

**Account Assignment:**
- 👤 Assign based on officer workload
- 🗺️ Consider geographic location
- 📊 Review officer performance regularly
- 🔄 Reassign if no progress after 30 days

**Monitoring:**
- 📈 Check dashboard daily
- 🎯 Track recovery rate trends
- 💸 Monitor expenses vs. recovery
- 👥 Hold weekly team meetings

---

## 🎓 Training Checklist

### For New Users

**Week 1: Basics**
- [ ] Login and navigate Recovery module
- [ ] Understand dashboard metrics
- [ ] View recovery accounts list
- [ ] Open and read account details

**Week 2: Activities**
- [ ] Log a recovery activity
- [ ] Create a repayment promise
- [ ] Upload a document
- [ ] Record an expense

**Week 3: Payments**
- [ ] Record a payment (Officer)
- [ ] Verify a payment (Accounting Head)
- [ ] Check payment status

**Week 4: Advanced**
- [ ] Import accounts from CSV
- [ ] Assign accounts to officers
- [ ] Generate and export reports
- [ ] Manage permissions (Admin)

---

## 🆘 Common Questions

### Q: Can I edit an account after creating it?
**A:** Yes! Click on the account, then click **"Edit"** button. You can update customer info, balance, priority, etc.

### Q: How do I delete a payment by mistake?
**A:** Only unverified payments can be deleted. Go to the account's Payments tab, find the payment, click **"Delete"**. Verified payments cannot be deleted (create a reversal instead).

### Q: What if a customer has multiple defaulted loans?
**A:** Create separate recovery accounts for each loan. You can link them using customer name/phone in the notes.

### Q: How do I know when a promise is due?
**A:** Go to **"My Accounts"**, sort by "Next Follow-up Date". Overdue promises show in red.

### Q: Can I reassign an account to another officer?
**A:** Yes! With `recovery:accounts_assign` permission, open the account and click **"Reassign Officer"**.

### Q: What happens when balance reaches zero?
**A:** Status automatically changes to **FULLY_RECOVERED**. You can then close the account.

### Q: How do I handle partial payments?
**A:** Record each payment separately. Outstanding balance decreases automatically. Status becomes **PARTIALLY_RECOVERED**.

### Q: Can I export my accounts to Excel?
**A:** Yes! Go to Recovery Accounts, apply filters, click **"Export"** (requires `recovery:reports_export` permission).

---

## 🎯 Success Metrics

### Track These KPIs

**Team Performance:**
- Recovery rate (% of outstanding recovered)
- Average days to first contact
- Average days to first payment
- Promise keeping rate (% of promises kept)

**Financial:**
- Total recovered per month
- Net recovery (recovered - expenses)
- Cost per recovery (expenses / recovered amount)
- Recovery efficiency ratio

**Operational:**
- Number of active accounts
- Accounts per officer
- Activities logged per day
- Payment verification turnaround time

---

## 📞 Support

**Need Help?**
- Check this guide first
- Review the **RECOVERY_MODULE_TROUBLESHOOTING.md** for technical issues
- Contact your System Administrator
- Check the dashboard for announcements

---

## 🚀 Quick Start Summary

1. ✅ **Setup**: Assign permissions to your team
2. 📥 **Import**: Bulk import historical loans from Excel
3. 👤 **Assign**: Assign accounts to recovery officers
4. 📞 **Engage**: Officers contact customers and log activities
5. 💰 **Collect**: Record payments (pending verification)
6. ✅ **Verify**: Accounting Head verifies payments
7. 📊 **Monitor**: Track progress on dashboard
8. 🎯 **Optimize**: Review reports and adjust strategy

---

**Built for VCLOP by Kiro AI** 🤖  
**Version:** 1.0.0  
**Last Updated:** October 28, 2026

---

**Start recovering defaulted loans today!** 💪
