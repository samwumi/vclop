# KYC Validation Rules for Loan Approval

## Overview
Compliance officers **CANNOT** approve loan applications without completing proper KYC verification. The system now enforces strict validation rules before allowing loan approval.

---

## ✅ Requirements for Loan Approval

Before a compliance officer can approve a loan application, **ALL** of the following must be completed:

### 1. **Customer KYC Status** ✓
The customer's status must be one of:
- `KYC_VERIFIED` 
- `ELIGIBLE`

**Blocked Statuses:**
- ❌ `PROSPECT`
- ❌ `REGISTERED`
- ❌ `KYC_PENDING`
- ❌ `INELIGIBLE`
- ❌ `BLACKLISTED`

### 2. **Required Documents Uploaded** ✓
All documents required by the loan product must be uploaded.

Example:
- **Quick Cash (30 Days)** requires:
  - NIN Slip
  - Passport Photo
  - Selfie with ID

- **Business Growth (90 Days)** requires:
  - NIN Slip
  - CAC Certificate
  - Passport Photo
  - Utility Bill
  - Selfie with ID

### 3. **Documents Verified** ✓
Each required document must have status = `VERIFIED`

**Not accepted:**
- ❌ `PENDING` - Document uploaded but not yet reviewed
- ❌ `REJECTED` - Document rejected, needs re-upload
- ❌ `EXPIRED` - Document expired

### 4. **Minimum Document Count** ✓
Even if the loan product doesn't specify requirements, at least **one document** must be:
- Uploaded
- Verified by a compliance officer

---

## 🚫 What Happens if Requirements Not Met?

If a compliance officer tries to approve without meeting requirements, the system will:

1. **Block the approval** ❌
2. **Show a clear error message** explaining what's missing
3. **Suggest next actions** (verify documents, update customer status)

### Example Error Messages:

```
❌ Cannot approve loan: Customer KYC status is KYC_PENDING. 
   Customer must be marked as KYC_VERIFIED or ELIGIBLE before loan approval.
```

```
❌ Cannot approve loan: The following required documents are not verified: 
   NIN Slip, Utility Bill. All required documents must be uploaded and 
   verified before approval.
```

```
❌ Cannot approve loan: No documents have been verified for this customer. 
   At least one document must be verified before loan approval.
```

---

## 📋 Compliance Officer Workflow

### Step-by-Step Process:

1. **Review Loan Application**
   - Open the loan application in compliance review queue
   - Check customer details and loan amount

2. **Verify Customer Documents** ⚠️ CRITICAL
   - Navigate to customer's documents section
   - Review each uploaded document:
     - Check authenticity
     - Verify information matches application
     - Upload verification photos if needed (e.g., selfie comparison)
   - Mark each document as:
     - `VERIFIED` ✅ if authentic
     - `REJECTED` ❌ if fake/unclear (provide reason)

3. **Update Customer KYC Status** ⚠️ CRITICAL
   - After all documents verified, update customer status:
     - Change from `KYC_PENDING` → `KYC_VERIFIED`
     - Or mark as `ELIGIBLE` for loan products
   - Save the status change

4. **Approve Loan Application**
   - Return to loan application
   - Click "Approve" button
   - System validates KYC requirements
   - If all checks pass ✅, loan moves to next stage
   - If checks fail ❌, fix issues and try again

---

## 🔄 Alternative Actions

If customer doesn't meet requirements, compliance officers can:

### Option 1: Request More Information
- Select "Request More Information"
- Specify what documents/info is needed
- System notifies loan officer
- Application status → `AWAITING_INFORMATION`

### Option 2: Reject Application
- Select "Reject"
- Provide rejection reason
- Application status → `REJECTED`

---

## 🎯 Business Impact

### Before This Feature:
- ❌ Officers could approve loans without KYC
- ❌ Risk of fraud and defaults
- ❌ Regulatory compliance issues
- ❌ No document verification trail

### After This Feature:
- ✅ Forced KYC verification before approval
- ✅ Reduced fraud risk
- ✅ Regulatory compliance maintained
- ✅ Clear audit trail of document verification
- ✅ Consistent approval process

---

## 🔧 Technical Details

### Database Validations:
The system checks:
1. `customers.status` IN ('KYC_VERIFIED', 'ELIGIBLE')
2. All `loan_product_document_requirements` where `isRequired=true` have matching `customer_documents` with `status='VERIFIED'`
3. At least one `customer_document` exists with `status='VERIFIED'`

### Validation Trigger:
- Runs **before** loan application status changes to `APPROVED`
- Blocks the approval transaction if any check fails
- Returns detailed error message to frontend

### Code Location:
- File: `src/modules/loan-applications/loan-applications.service.ts`
- Method: `validateKYCBeforeApproval()`
- Called from: `review()` method when decision is `APPROVED`

---

## 📞 FAQs

### Q: Can I approve a loan if customer uploaded documents but I haven't verified them yet?
**A:** No. You must verify each document first by marking it as `VERIFIED`.

### Q: What if the customer uploaded the wrong document type?
**A:** Reject the document with a reason, then use "Request More Information" to ask the loan officer to get the correct document from the customer.

### Q: Can I skip verification for small loans?
**A:** No. KYC verification is required for **all** loan amounts. This is a regulatory requirement.

### Q: What if the customer's NIN or BVN is not in the system?
**A:** Ensure the customer record has BVN/NIN filled in, then verify the NIN Slip document matches. Update customer status after verification.

### Q: Can I override the validation in emergencies?
**A:** No. There is no override. This is a security feature. If there's a legitimate exception, contact the development team.

---

## 🔐 Security Note

This validation is **server-side** and cannot be bypassed through the frontend. Any attempt to approve without KYC will be blocked by the API.

---

## 📊 Monitoring

### Metrics to Track:
- Number of approval attempts blocked due to KYC
- Average time to complete KYC verification
- Most commonly rejected document types
- Number of "Request More Information" vs "Reject" decisions

### Red Flags:
- Multiple approval attempts without document verification
- Customer status manually changed without document uploads
- Documents marked as verified without uploaded files

---

**Implemented:** 2026-09-11  
**Affects:** All compliance officers, underwriters  
**Priority:** 🔴 CRITICAL - Regulatory Compliance  
**Version:** Phase 6 - Enhanced KYC Validation
