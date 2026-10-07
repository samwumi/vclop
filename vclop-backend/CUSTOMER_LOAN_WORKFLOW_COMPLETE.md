# Complete Customer-to-Loan Workflow

## 📋 Overview
This document explains the complete journey from customer registration to loan disbursement, including all required fields, validations, and status transitions.

---

## 🎯 Stage 1: Customer Registration

### **Who:** Loan Officer
### **Status:** `REGISTERED`

### **Required Fields:**
```typescript
✅ firstName (string)
✅ lastName (string)
✅ phone (string) - must be unique
✅ bvn (string) - must be unique, 11 digits
✅ nin (string) - must be unique, 11 digits
✅ dataProcessingConsent (boolean) - NDPA 2023 requirement
✅ creditBureauConsent (boolean) - for credit checks
```

### **Optional Fields:**
- middleName
- email (unique if provided)
- dateOfBirth
- gender
- alternatePhone
- businessName (required if type = BUSINESS)
- residentialAddress
- businessAddress
- GPS coordinates
- Bank details (accountNumber, bankCode)
- Employment info (employerName, jobTitle, monthlyIncome)
- Next of Kin (nokName, nokPhone, nokRelationship)
- Branch assignment
- Assigned loan officer

### **What Happens:**
1. ✅ Backend validates all required fields
2. ✅ Checks for duplicate phone/email/BVN/NIN
3. ✅ Encrypts BVN/NIN (NDPA 2023 compliance)
4. ✅ Generates customer number (e.g., VC-000029)
5. ✅ Calculates profile completion percentage
6. ✅ Sets status = `REGISTERED`
7. ✅ Creates audit log entry
8. ✅ Customer can now be used for loan applications

### **Next Step:**
Customer can proceed to document upload and loan application creation

---

## 📄 Stage 2: Document Upload

### **Who:** Loan Officer or Customer
### **Status:** Customer remains `REGISTERED`

### **Required Documents (Minimum):**
At least **1 document** must be uploaded before loan application

### **Document Types:**
- Passport photograph
- Valid ID card (National ID, Driver's License, Voter's Card)
- NIN slip
- Utility bill (for address verification)
- Bank statement
- Guarantor form(s)
- Collateral documents (if applicable)
- Business registration (for business loans)

### **Document Upload Process:**
1. ✅ Loan Officer selects document type
2. ✅ Uploads file (max 10MB)
3. ✅ Backend validates file type and size
4. ✅ Stores file at: `uploads/customers/<customer-uuid>/documents/<file-uuid>.ext`
5. ✅ Document status = `PENDING`
6. ✅ Updates customer profile completion percentage

### **Document Status Flow:**
```
PENDING → VERIFIED (by Compliance)
PENDING → REJECTED (by Compliance with reason)
VERIFIED → EXPIRED (after expiryDate passes)
```

### **Validation:**
- At least 1 document must exist before creating loan application
- Documents will be verified during compliance review

---

## 💰 Stage 3: Loan Application Creation

### **Who:** Loan Officer
### **Status:** Loan status = `COMPLIANCE_REVIEW`

### **Prerequisites:**
✅ Customer status = `REGISTERED` (or better)
✅ Customer NOT blacklisted
✅ At least 1 document uploaded
✅ No active loan application for this customer

### **Required Fields:**
```typescript
✅ customerId (UUID)
✅ loanProductId (UUID) - selects loan product
✅ requestedAmount (Decimal) - must be within product min/max
✅ tenureDays (Integer) - must be within product min/max
✅ purpose (string) - reason for loan
```

### **Product-Specific Validations:**
If loan product has `requiresGuarantor = true`:
- ✅ At least 1 guarantor must be added

If loan product has `requiresCollateral = true`:
- ✅ At least 1 collateral item must be added

### **What Happens:**
1. ✅ Validates customer is not blacklisted
2. ✅ Checks no active loan exists for customer
3. ✅ Validates at least 1 document uploaded
4. ✅ Validates loan amount is within product limits
5. ✅ Validates tenure is within product limits
6. ✅ Checks guarantor requirement (if applicable)
7. ✅ Checks collateral requirement (if applicable)
8. ✅ Generates application number (e.g., LA-000030)
9. ✅ Creates loan application with status = `COMPLIANCE_REVIEW`
10. ✅ Creates workflow instance
11. ✅ Creates workflow task for Compliance Officer
12. ✅ Notifies Compliance Officers at the branch

### **Loan Application Statuses:**
- `DRAFT` - not used in current flow
- `SUBMITTED` - not used in current flow  
- `COMPLIANCE_REVIEW` - initial status
- `NEEDS_ATTENTION` - returned to LO for corrections
- `AWAITING_INFORMATION` - waiting for customer info
- `INTERNAL_CONTROL_REVIEW` - after compliance approval
- `APPROVED` - after IC approval
- `REJECTED` - denied at any stage
- `DISBURSED` - funds transferred to customer
- `CANCELLED` - cancelled by admin

---

## ✅ Stage 4: Compliance Review

### **Who:** Compliance Officer
### **Status:** Loan = `COMPLIANCE_REVIEW`

### **Compliance Officer Responsibilities:**
1. ✅ Review all uploaded customer documents
2. ✅ Verify documents are authentic and readable
3. ✅ Check BVN/NIN matches customer information
4. ✅ Verify customer identity
5. ✅ Approve or reject individual documents
6. ✅ Ensure at least 1 document is marked `APPROVED`
7. ✅ Verify guarantor information (if applicable)

### **NEW VALIDATION (Just Added):**
Before Compliance can approve the loan:
- ✅ At least 1 document must be uploaded
- ✅ At least 1 document must have status = `APPROVED`
- ✅ Guarantor must be present (if loan product requires it)

### **Compliance Decision Options:**

#### **Option 1: APPROVE**
- Loan moves to `INTERNAL_CONTROL_REVIEW`
- IC Officers at the branch are notified
- Workflow task created for IC

#### **Option 2: REQUEST_CHANGES**
- Loan status = `NEEDS_ATTENTION`
- Feedback message sent to Loan Officer
- LO must address feedback and resubmit

#### **Option 3: REJECT**
- Loan status = `REJECTED`
- Rejection reason recorded
- Loan Officer notified
- Application ends here

---

## 🛡️ Stage 5: Internal Control Review

### **Who:** Internal Control Officer
### **Status:** Loan = `INTERNAL_CONTROL_REVIEW`

### **IC Officer Responsibilities:**
1. ✅ Review compliance approval
2. ✅ Verify loan amount is appropriate for customer profile
3. ✅ Check customer credit history
4. ✅ Assess risk factors
5. ✅ Review guarantor creditworthiness
6. ✅ Review collateral value (if applicable)
7. ✅ Make final approval/rejection decision

### **IC Decision Options:**

#### **Option 1: APPROVE**
- Loan status = `APPROVED`
- Customer status may be updated to `ELIGIBLE`
- Loan is ready for disbursement
- Authorized users can now disburse

#### **Option 2: REJECT**
- Loan status = `REJECTED`
- Rejection reason recorded
- Loan Officer notified
- Application ends here

---

## 💸 Stage 6: Loan Disbursement

### **Who:** System Admin or authorized IC Officer
### **Status:** Loan = `APPROVED` → `DISBURSED`

### **Prerequisites:**
✅ Loan status = `APPROVED`
✅ User has `loan_applications:disburse` permission
✅ Virtual account exists for the loan
✅ Disbursement details confirmed

### **What Happens:**
1. ✅ Creates a `Loan` record (separate from LoanApplication)
2. ✅ Generates loan account number
3. ✅ Creates repayment schedule (installments)
4. ✅ Records disbursement transaction
5. ✅ Updates loan application status = `DISBURSED`
6. ✅ Updates loan status = `ACTIVE`
7. ✅ Notifies customer of disbursement
8. ✅ May update customer status to `ELIGIBLE`

### **Loan Record Created:**
```typescript
{
  loanNumber: "LN-000016",
  status: "ACTIVE",
  principalAmount: 100000,
  interestRate: 5.0,
  installments: [...] // repayment schedule
}
```

---

## 📊 Stage 7: Repayment Management

### **Who:** Collections Officer, Customer
### **Status:** Loan = `ACTIVE` → `COMPLETED` / `DEFAULTED`

### **Repayment Process:**
1. Customer makes payments via:
   - Bank transfer to virtual account
   - Direct payment to bank account
   - Cash payment at branch

2. Collections Officer records repayment:
   - ✅ Amount paid
   - ✅ Payment date
   - ✅ Payment method
   - ✅ Reference number

3. System updates:
   - ✅ Installment status = `PAID` / `PARTIALLY_PAID`
   - ✅ Loan balance reduced
   - ✅ Payment recorded in transactions

4. When fully repaid:
   - Loan status = `COMPLETED`
   - Customer remains `ELIGIBLE` for future loans

5. If payment overdue:
   - Installment status = `OVERDUE`
   - Collections follow-up triggered
   - If severely overdue: Loan status = `DEFAULTED`

---

## 📈 Customer Status Transitions

```
PROSPECT (not used in current flow)
    ↓
REGISTERED (initial registration)
    ↓
KYC_VERIFIED (after document verification - not auto-triggered)
    ↓
ELIGIBLE (after successful loan disbursement or manual approval)
    ↓
BLACKLISTED (manual action if customer defaults/fraud)
    
DORMANT (no activity for extended period)
INACTIVE (manually deactivated)
```

---

## 🔒 Required Permissions by Role

### **Loan Officer:**
- `customers:create` - register customers
- `customers:read` - view own customers
- `customers:update` - edit customer info
- `documents:upload` - upload customer documents
- `loan_applications:create` - create loan applications
- `loan_applications:read` - view own applications

### **Compliance Officer:**
- `customers:read` - view all customers
- `documents:read` - view documents
- `documents:verify` - approve/reject documents
- `loan_applications:read` - view all applications
- `loan_applications:compliance_review` - approve/reject at compliance stage

### **Internal Control Officer:**
- `customers:read` - view all customers
- `loan_applications:read` - view all applications
- `loan_applications:internal_control_approve` - approve/reject at IC stage
- `loan_applications:disburse` (if given) - disburse approved loans

### **System Admin:**
- All permissions
- `loan_applications:disburse_head` - approve disbursements
- `customers:manage` - full customer management

---

## ⚠️ Common Validation Errors

### **At Registration:**
- ❌ "BVN is required"
- ❌ "NIN is required"
- ❌ "Phone number already exists"
- ❌ "BVN already registered"
- ❌ "Data processing consent is required"

### **At Document Upload:**
- ❌ "File exceeds 10MB limit"
- ❌ "Invalid file type"
- ❌ "documentTypeId is required"

### **At Loan Application:**
- ❌ "Customer has an active loan application"
- ❌ "At least one document must be uploaded"
- ❌ "Amount exceeds product maximum"
- ❌ "Personal Loan requires at least one guarantor"
- ❌ "Customer is blacklisted"

### **At Compliance Review (NEW):**
- ❌ "Cannot approve: No documents have been uploaded"
- ❌ "Cannot approve: No documents have been verified and approved"
- ❌ "Cannot approve: [Product] requires at least one guarantor"

---

## 🔄 Workflow Summary

```
1. LOAN OFFICER
   → Registers Customer (status: REGISTERED)
   → Uploads Documents (at least 1)
   → Creates Loan Application (status: COMPLIANCE_REVIEW)
   
2. COMPLIANCE OFFICER
   → Reviews Documents
   → Approves Documents (at least 1)
   → Approves Loan Application
   → Loan moves to INTERNAL_CONTROL_REVIEW
   
3. INTERNAL CONTROL OFFICER
   → Reviews Risk & Creditworthiness
   → Approves Loan
   → Loan status: APPROVED
   
4. AUTHORIZED USER (Admin/IC)
   → Disburses Loan
   → Loan status: DISBURSED
   → Loan created with status: ACTIVE
   
5. COLLECTIONS OFFICER
   → Records Repayments
   → Monitors Installments
   → Follows up on overdue payments
   → Loan status: COMPLETED (when fully paid)
```

---

## ✅ Key Takeaways

1. **Customer Registration** requires BVN, NIN, consent
2. **At least 1 document** must be uploaded before loan application
3. **Compliance must approve at least 1 document** before approving loan
4. **Guarantor required** if loan product specifies it
5. **Two-level approval**: Compliance → Internal Control
6. **Only authorized users** can disburse approved loans
7. **Virtual account** automatically created for loan
8. **Repayments** tracked via installments

---

**This is the complete workflow!** Let me know if you need clarification on any stage.
