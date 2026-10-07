# Document Validation in Compliance Review - Fixed

## Problem Identified
**Compliance Officers could approve loan applications without verifying that documents were uploaded and approved.** This was a serious workflow flaw that violated KYC requirements and NDPA 2023 compliance.

---

## What Changed

### Before (Security Risk):
```typescript
if (decision === 'APPROVE') {
  // No document validation!
  // Compliance could approve with zero documents
  await this.prisma.loanApplication.update({
    status: LoanApplicationStatus.INTERNAL_CONTROL_REVIEW
  });
}
```

### After (Secure):
```typescript
if (decision === 'APPROVE') {
  // ✅ Check at least 1 document uploaded
  const documentCount = await this.prisma.customerDocument.count({
    where: { customerId: application.customerId, deletedAt: null }
  });
  if (documentCount === 0) {
    throw new BusinessException('No documents uploaded');
  }

  // ✅ Check at least 1 document APPROVED
  const approvedDocCount = await this.prisma.customerDocument.count({
    where: { 
      customerId: application.customerId,
      status: 'APPROVED',
      deletedAt: null 
    }
  });
  if (approvedDocCount === 0) {
    throw new BusinessException('No documents verified');
  }

  // ✅ Check guarantor if required
  if (loanProduct.requiresGuarantor && guarantors.length === 0) {
    throw new BusinessException('Guarantor required');
  }

  // NOW proceed with approval
}
```

---

## New Validation Rules

When Compliance Officer clicks "Approve" on a loan application, the system now validates:

1. **✅ At least 1 document uploaded**
   - Error: "Cannot approve: No documents have been uploaded for this customer"
   
2. **✅ At least 1 document status = APPROVED**
   - Error: "Cannot approve: No documents have been verified and approved"
   - Compliance must review and approve documents before approving loan

3. **✅ Guarantor present (if loan product requires it)**
   - Error: "Cannot approve: [Product Name] requires at least one guarantor"
   - Checks `loanProduct.requiresGuarantor` field

---

## User Flow Impact

### Compliance Officer Workflow (Updated):

1. **Receive loan** in COMPLIANCE_REVIEW status
2. **View customer documents** (passport, ID, guarantor forms, etc.)
3. **Review each document:**
   - If valid → Mark as "APPROVED"
   - If invalid → Mark as "REJECTED" with reason
   - If missing → Click "REQUEST_CHANGES" to return to Loan Officer
4. **Verify guarantor** (if product requires it)
5. **Click "Approve"** → System validates:
   - ❌ If no documents uploaded → ERROR shown
   - ❌ If no documents approved → ERROR shown  
   - ❌ If guarantor missing → ERROR shown
   - ✅ If all validations pass → Moves to INTERNAL_CONTROL_REVIEW

### Error Messages (User-Friendly):

```
❌ "Cannot approve: No documents have been uploaded for this customer. 
    Please ensure customer has uploaded required documents before approval."

❌ "Cannot approve: No documents have been verified and approved. 
    Please review and approve at least one customer document before approving the loan application."

❌ "Cannot approve: Personal Loan requires at least one guarantor. 
    Please ensure guarantor information is added before approval."
```

---

## NDPA 2023 Compliance Benefit

This change enforces **proper KYC verification** as required by Nigeria Data Protection Act 2023:

- ✅ Ensures identity documents are uploaded
- ✅ Ensures documents are reviewed and verified by authorized officer
- ✅ Creates audit trail (who approved documents, when)
- ✅ Prevents loans from proceeding without proper documentation
- ✅ Compliance with Section 2.5 (Lawful Processing) - identity verification required

---

## Testing

### Test Case 1: No Documents Uploaded
**Steps:**
1. Login as Compliance Officer
2. View loan LA-000030
3. Click "Approve" without uploading any documents

**Expected:** ❌ Error: "No documents have been uploaded"

---

### Test Case 2: Documents Uploaded but Not Approved
**Steps:**
1. Customer uploads passport photo
2. Compliance views loan
3. Compliance clicks "Approve" WITHOUT approving the document

**Expected:** ❌ Error: "No documents have been verified and approved"

---

### Test Case 3: Valid Approval
**Steps:**
1. Customer uploads passport, ID card
2. Compliance reviews documents
3. Compliance marks passport as "APPROVED"
4. Compliance clicks "Approve" on loan

**Expected:** ✅ Success → Loan moves to INTERNAL_CONTROL_REVIEW

---

### Test Case 4: Missing Guarantor
**Steps:**
1. Loan product has `requiresGuarantor = true`
2. Customer creates loan WITHOUT adding guarantor
3. Compliance tries to approve

**Expected:** ❌ Error: "[Product Name] requires at least one guarantor"

---

## Deployment

**Commit:** `27e9253f`  
**Date:** September 25, 2026  
**Status:** ✅ Pushed to GitHub `main` branch  

**Next Steps:**
1. ⏳ Deploy to Hostinger production
2. ⏳ Test with real Compliance Officer user
3. ⏳ Monitor error logs for validation failures
4. ⏳ Train Compliance Officers on new document approval workflow

---

## Rollback Plan

If this validation causes issues, revert with:

```bash
git revert 27e9253f
git push origin main
```

Then redeploy the backend.

---

## Related Files

- **Modified:** `src/modules/loan-applications/loan-applications.service.ts` (complianceReview method)
- **Validation added:** Lines ~900-940
- **Affects:** Compliance Officers with `loan_applications:compliance_review` permission

---

## Questions Answered

**Q: "How can compliance approve and send to IC without verifying documents?"**  
**A:** They can't anymore. This fix enforces document verification before approval.

**Q: "Is guarantor still a requirement?"**  
**A:** Yes, but only if the loan product has `requiresGuarantor = true`. It's product-specific.

**Q: "At least 1 document should be uploaded and approved"**  
**A:** ✅ Both validations are now in place.

---

**Status:** ✅ FIXED - Production-ready after deployment
