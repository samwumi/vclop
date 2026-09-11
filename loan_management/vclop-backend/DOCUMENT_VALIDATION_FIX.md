# 🔒 Document Validation Fix

## Problem Identified

Officers were able to submit loan applications **without uploading required documents** because the `loan_product_document_requirements` table was empty.

### Root Cause Analysis

The validation code existed in `loan-applications.service.ts` (lines 144-152):

```typescript
const requiredDocTypeIds = application.loanProduct.documentRequirements
  .filter((r) => r.isRequired)
  .map((r) => r.documentTypeId);

if (requiredDocTypeIds.length > 0) {  // ← This was FALSE!
  // Document validation never ran because no requirements were configured
  const verifiedCount = await this.prisma.customerDocument.count({
    where: { 
      customerId: application.customerId, 
      documentTypeId: { in: requiredDocTypeIds }, 
      status: 'VERIFIED' 
    },
  });
  
  if (verifiedCount < requiredDocTypeIds.length) {
    throw new BusinessException(
      `Customer is missing ${requiredDocTypeIds.length - verifiedCount} verified document(s) required by ${application.loanProduct.name}`
    );
  }
}
```

Since `documentRequirements` was empty (no data in database), `requiredDocTypeIds.length` was always 0, so the validation was **skipped entirely**.

---

## ✅ Solution Implemented

### 1. Updated Seed File
Added loan product document requirements to `prisma/seed.ts`:

**Quick Cash (30 Days)** - 3 Required Documents:
- ✅ NIN Slip (Required)
- ✅ Passport Photograph (Required)
- ✅ Selfie (Required)

**Business Growth Loan (90 Days)** - 5 Required Documents:
- ✅ NIN Slip (Required)
- ✅ CAC Certificate (Required - for business)
- ✅ Passport Photograph (Required)
- ✅ Utility Bill (Required - proof of address)
- ✅ Selfie (Required)

### 2. Ran Seed Successfully
```bash
npm run prisma:seed
```

Output:
```
✔  Quick Cash: 3 required documents configured
✔  Business Growth: 5 required documents configured
✔  Loan product document requirements seeded
```

### 3. Verified Database
```sql
SELECT lp.name, dt.name AS document, lpdr.isRequired 
FROM loan_products lp 
JOIN loan_product_document_requirements lpdr ON lp.id = lpdr.loanProductId 
JOIN document_types dt ON lpdr.documentTypeId = dt.id;
```

Result: **8 document requirements** configured (3 for Quick Cash, 5 for Business Growth)

---

## 🔐 How It Works Now

### Submission Flow with Document Validation

1. **Officer creates loan application** (status: DRAFT)
2. **Customer uploads documents** (must be VERIFIED by admin)
3. **Officer attempts to submit application**
4. **System validates:**
   - ✅ Guarantor requirements (if product requires)
   - ✅ Collateral requirements (if product requires)
   - ✅ **Document requirements (NOW ENFORCED!)**
5. **Submission allowed only if all requirements met**

### Example Error Messages

#### Quick Cash (Missing 2 documents):
```
Customer is missing 2 verified document(s) required by Quick Cash (30 Days)
```

#### Business Growth (Missing 3 documents):
```
Customer is missing 3 verified document(s) required by Business Growth Loan (90 Days)
```

---

## 🧪 Testing the Fix

### Manual Test Steps

1. **Create a new customer** (via API or admin panel)
2. **Create a loan application** for that customer
3. **Try to submit WITHOUT uploading documents**
   - Expected: ❌ Error message about missing documents
4. **Upload some (but not all) required documents**
   - Expected: ❌ Error message about remaining missing documents
5. **Upload all required documents, but keep status as PENDING**
   - Expected: ❌ Error message (documents must be VERIFIED)
6. **Admin verifies all uploaded documents** (status: VERIFIED)
7. **Try to submit again**
   - Expected: ✅ Success! Application moves to COMPLIANCE_REVIEW

### API Test Example

```bash
# 1. Create loan application (returns application ID)
POST /api/v1/loan-applications
{
  "customerId": "customer-uuid",
  "loanProductId": "quick-cash-product-uuid",
  "amount": 50000,
  "tenureDays": 30,
  "purpose": "Business expansion"
}

# 2. Try to submit WITHOUT documents (should fail)
PATCH /api/v1/loan-applications/{id}/submit
# Response: 400 Bad Request
# "Customer is missing 3 verified document(s) required by Quick Cash (30 Days)"

# 3. Upload documents (use /api/v1/documents endpoints)
# 4. Admin verifies documents
# 5. Try to submit again (should succeed)
```

---

## 📊 Current Configuration

### Quick Cash (30 Days)
| Document Type | Required | Purpose |
|--------------|----------|---------|
| NIN Slip | ✅ Yes | Identity verification |
| Passport Photo | ✅ Yes | Visual identification |
| Selfie | ✅ Yes | Liveness check |

### Business Growth Loan (90 Days)
| Document Type | Required | Purpose |
|--------------|----------|---------|
| NIN Slip | ✅ Yes | Identity verification |
| CAC Certificate | ✅ Yes | Business registration proof |
| Passport Photo | ✅ Yes | Visual identification |
| Utility Bill | ✅ Yes | Proof of address |
| Selfie | ✅ Yes | Liveness check |

---

## 🔧 Admin Configuration

### Adding New Document Requirements

If you need to add/modify document requirements:

#### Option 1: Via Admin Panel (Recommended)
- Navigate to Loan Products management
- Edit the loan product
- Configure required documents in the checklist

#### Option 2: Via Database
```sql
-- Add a new requirement
INSERT INTO loan_product_document_requirements 
(id, loanProductId, documentTypeId, isRequired)
VALUES 
(UUID(), 'loan-product-uuid', 'document-type-uuid', 1);

-- Make existing requirement optional
UPDATE loan_product_document_requirements 
SET isRequired = 0 
WHERE loanProductId = 'loan-product-uuid' 
AND documentTypeId = 'document-type-uuid';
```

#### Option 3: Update Seed File
Add to the seed file and re-run `npm run prisma:seed`

---

## 🚀 Deployment Checklist

When deploying to production:

1. ✅ **Run database migrations** (if any)
2. ✅ **Run seed file:** `npm run prisma:seed`
   - This will configure document requirements
   - Existing data is safe (upsert operations)
3. ✅ **Verify requirements in database**
4. ✅ **Test submission validation**
5. ✅ **Notify loan officers about the new requirement**

---

## 📝 Important Notes

### For Loan Officers
- **All required documents must be VERIFIED** before submission
- Upload documents through the customer profile or application screen
- Documents in PENDING or REJECTED status don't count
- Check the document checklist for each loan product

### For Admins
- **You must verify customer documents** before applications can be submitted
- Review uploaded documents and change status to VERIFIED or REJECTED
- Customers will be notified when documents are verified/rejected

### For Developers
- Document validation runs in `loan-applications.service.ts` → `submit()` method
- Requirements are defined in `loan_product_document_requirements` table
- The validation checks for VERIFIED documents only
- Modify `prisma/seed.ts` to change default requirements

---

## 🎯 Impact

### Before Fix:
- ❌ Officers could submit applications without any documents
- ❌ No validation of customer documentation
- ❌ Risk of approving loans without proper KYC

### After Fix:
- ✅ Document validation enforced at submission
- ✅ Clear error messages guide officers
- ✅ Customers must complete documentation before submission
- ✅ Reduced risk of incomplete loan applications

---

## Related Files

- **Validation Logic:** `src/modules/loan-applications/loan-applications.service.ts` (lines 127-163)
- **Database Schema:** `prisma/schema.prisma` (LoanProductDocumentRequirement model)
- **Seed Configuration:** `prisma/seed.ts` (section 12: Document Requirements)
- **API Endpoint:** `PATCH /api/v1/loan-applications/:id/submit`

---

**Date Fixed:** September 9, 2026  
**Fixed By:** Kiro AI Assistant  
**Tested:** ✅ Seed ran successfully, 8 requirements configured  
**Status:** ✅ **READY FOR PRODUCTION**
