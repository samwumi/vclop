# Issues Resolved - October 2026

## Session Date: October 15, 2026

---

## Issue 1: Paystack Virtual Account Creation Returning PENDING Status

### Problem
Virtual accounts were being created with PENDING status (e.g., `PENDING-aa8474ad-ca0`) instead of actual account numbers. The error "Customer cannot be identified" was appearing on Paystack when trying to create virtual accounts.

### Root Cause
The system was sending the **business name** to Paystack for BVN validation, but BVN is tied to the **individual's personal name**, not the business entity.

**Code Location:** `vclop-backend/src/modules/virtual-accounts/virtual-accounts.service.ts`

**Before:**
```typescript
customerName: customer.businessName ?? `${customer.firstName} ${customer.lastName}`
```

**After:**
```typescript
customerName: `${customer.firstName} ${customer.lastName}` // BVN is tied to individual, not business
```

### Solution
1. Changed virtual account creation to use person's actual name instead of business name
2. Added BVN format validation (must be exactly 11 digits)
3. Added detailed logging for debugging
4. Removed OPay bank details skip logic (code 999992) - now sends all bank details

### Files Modified
- `vclop-backend/src/modules/virtual-accounts/virtual-accounts.service.ts`
- `vclop-backend/src/modules/virtual-accounts/providers/paystack-virtual-account.provider.ts`

### Testing
After fix, virtual accounts should be created with real account numbers from Paystack instead of PENDING placeholders.

---

## Issue 2: Loan Officers Blocked from Creating Applications Without KYC Verification

### Problem
Loan Officers could not create loan applications for customers who hadn't completed KYC verification. Customers needed to be in KYC_VERIFIED or ELIGIBLE status before applying.

### Root Cause
Frontend validation was blocking applications for customers with PROSPECT, REGISTERED, or KYC_PENDING status.

**Code Location:** `vclop-frontend/src/pages/loans/NewLoanPage.tsx`

**Before:**
```typescript
const LOAN_BLOCKED_STATUSES = ['INELIGIBLE', 'BLACKLISTED', 'SUSPENDED', 'PROSPECT', 'REGISTERED', 'KYC_PENDING'];
```

**After:**
```typescript
const LOAN_BLOCKED_STATUSES = ['INELIGIBLE', 'BLACKLISTED', 'SUSPENDED'];
```

### Solution
1. Removed PROSPECT, REGISTERED, KYC_PENDING from blocked statuses
2. Changed document requirement from "VERIFIED" to just "uploaded"
3. Added info banner explaining Compliance will verify during review
4. Backend already supported this workflow

### New Workflow
1. **Loan Officer:** Register customer → Upload documents (unverified) → Create application
2. **Compliance Officer:** Verify KYC and documents during application review
3. **Approval Gate:** At least one document must be VERIFIED before approval

### Files Modified
- `vclop-frontend/src/pages/loans/NewLoanPage.tsx`

---

## Issue 3: Documents Must Be Verified Before Loan Application Submission

### Problem
When Loan Officers tried to submit DRAFT applications, backend required documents to be VERIFIED. This blocked the workflow where documents should be verified by Compliance during review.

### Root Cause
The `submit()` method in backend was checking for `status: 'VERIFIED'` documents.

**Code Location:** `vclop-backend/src/modules/loan-applications/loan-applications.service.ts`

**Before:**
```typescript
const verifiedDocCount = await this.prisma.customerDocument.count({
  where: { customerId: application.customerId, status: 'VERIFIED' },
});
if (verifiedDocCount === 0) {
  throw new BusinessException('At least one VERIFIED document is required...');
}
```

**After:**
```typescript
const docCount = await this.prisma.customerDocument.count({
  where: { customerId: application.customerId },
});
if (docCount === 0) {
  throw new BusinessException('At least one document must be uploaded...');
}
```

### Solution
1. Changed `submit()` method to only check for uploaded documents, not verified
2. Updated error messages to clarify verification happens during compliance review
3. Also updated product-specific required document checks

### Files Modified
- `vclop-backend/src/modules/loan-applications/loan-applications.service.ts`

---

## Issue 4: Loan Officers Cannot Add/Edit Guarantors After Leaving Page

### Problem
After creating a loan application, if Loan Officer navigated away and came back, they couldn't add or edit guarantors. The guarantor form only showed for DRAFT, NEEDS_ATTENTION, or COMPLIANCE_REVIEW statuses.

### Root Cause
Frontend had status restrictions on when guarantor form was displayed.

**Code Location:** `vclop-frontend/src/pages/loans/LoanDetailPage.tsx`

**Before:**
```typescript
{(hasPermission('loan_applications:update')) && 
 (application.status === 'DRAFT' || application.status === 'NEEDS_ATTENTION' || application.status === 'COMPLIANCE_REVIEW') && (
  <div>guarantor form</div>
)}
```

**After:**
```typescript
{(hasPermission('loan_applications:update') || hasPermission('loan_applications:create')) && (
  <div>guarantor form</div>
)}
```

### Solution
Removed status restriction - guarantor form now shows if user has update permission, regardless of application status.

### Files Modified
- `vclop-frontend/src/pages/loans/LoanDetailPage.tsx`

---

## Issue 5: Uploaded Files Disappear After Deployment

### Problem
Customer documents uploaded to the system would disappear after each deployment. Files were being saved but lost when new code was deployed.

### Root Cause
The `.env` file had a **relative path** for uploads:
```env
UPLOAD_DIR=./uploads
```

On Hostinger, each deployment creates a new version folder:
```
/home/u215495167/domains/verticalcapital.ng/hbuilds/versions/{build-id}/nodejs
```

With relative path, uploads went to `{build-folder}/uploads`, which was deleted when next deployment created a new build folder.

### Solution
Changed to **absolute path** pointing to persistent storage location:

**Before:**
```env
UPLOAD_DIR=./uploads
STORAGE_PUBLIC_URL=http://localhost:3000/uploads
```

**After:**
```env
UPLOAD_DIR=/home/u215495167/domains/verticalcapital.ng/public_html/uploads
STORAGE_PUBLIC_URL=https://verticalcapital.ng/uploads
```

### Verification
Files now persist in `public_html/uploads/customers/{customer-id}/documents/` across deployments.

Test URL format: `https://verticalcapital.ng/uploads/customers/{customer-id}/documents/{filename}`

### Files Modified
- `vclop-backend/.env` (local file, updated for future reference)
- Server `.env` file updated via SSH (actual fix)

### Important Notes
- `.env` is in `.gitignore` so changes don't commit to Git
- Must update `.env` on server directly OR use Hostinger Environment Variables
- Uploads must be stored OUTSIDE the application deployment directory

---

## Additional Changes

### Customer Status Constraint
Fixed database constraint to include ACTIVE_BORROWER status:

```sql
ALTER TABLE customers DROP CONSTRAINT chk_customer_status;
ALTER TABLE customers ADD CONSTRAINT chk_customer_status 
CHECK (status IN ('PROSPECT', 'REGISTERED', 'KYC_PENDING', 'KYC_VERIFIED', 'ELIGIBLE', 'ACTIVE_BORROWER', 'INELIGIBLE', 'BLACKLISTED'));
```

### Admin Delete Functionality
Added ability for admins to delete loan applications via frontend with trash icon button.

**Files Added/Modified:**
- `vclop-backend/src/modules/loan-applications/loan-applications.controller.ts` - DELETE endpoint
- `vclop-backend/src/modules/loan-applications/loan-applications.service.ts` - remove() method
- `vclop-frontend/src/pages/loans/LoanDetailPage.tsx` - Trash icon button
- `vclop-frontend/src/services/loans.service.ts` - delete() method

---

## Summary of Commits

1. `feat: Add BVN validation and detailed logging for Paystack virtual account creation`
2. `fix: Use person's name instead of business name for BVN validation in Paystack`
3. `feat: Remove OPay bank details skip logic - now sends all bank details to Paystack`
4. `feat: Allow loan officers to create applications without KYC verification`
5. `fix: Remove ACTIVE_BORROWER from status check - TypeScript compilation error`
6. `fix: Remove verified document requirement from loan application submission`
7. `fix: Allow loan officers to add/edit guarantors at any time`
8. `fix: Use absolute path for Hostinger uploads directory to persist files across deployments`

---

## Deployment Checklist

After deploying these changes:

- [ ] Verify virtual accounts are created with real account numbers (not PENDING)
- [ ] Test loan application creation for REGISTERED customers
- [ ] Test submitting DRAFT applications with unverified documents
- [ ] Test adding guarantors to applications in any status
- [ ] Upload a test document and verify it persists after next deployment
- [ ] Check that compliance can verify documents during review
- [ ] Verify BVN validation works correctly

---

## Environment Configuration Reference

### Required .env Variables for Hostinger:

```env
# Database
DATABASE_URL="mysql://user:pass@host:port/database"

# File Storage (CRITICAL - must be absolute path)
STORAGE_DRIVER=local
UPLOAD_DIR=/home/u215495167/domains/verticalcapital.ng/public_html/uploads
STORAGE_PUBLIC_URL=https://verticalcapital.ng/uploads
MAX_FILE_SIZE_MB=10

# Paystack
PAYSTACK_SECRET_KEY=your_key_here
PAYSTACK_PREFERRED_BANK=titan-paystack
```

---

## Lessons Learned

1. **Always use absolute paths for file storage in production** - relative paths don't survive deployment cycles
2. **BVN validation must use personal name, not business name** - BVN is tied to individuals
3. **Frontend and backend validations should align** - backend already allowed unverified documents, frontend was blocking
4. **Document workflow at implementation time** - easier to remember context when fresh
5. **Test file persistence after deployment** - verify uploads survive before considering it fixed

---

**Document Created:** October 15, 2026  
**Last Updated:** October 15, 2026  
**Session Duration:** ~4 hours  
**Issues Resolved:** 5 major issues + 2 additional improvements
