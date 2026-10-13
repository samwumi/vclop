# Loan Application Workflow Changes

## Summary
Changed the loan application workflow to allow Loan Officers to create applications for customers at any status (except BLACKLISTED). KYC verification and document verification now happen AFTER application creation, during the Compliance Review stage.

## What Changed

### Before
- ❌ Customers needed **KYC_VERIFIED** or **ELIGIBLE** status to apply for loans
- ❌ Documents had to be **VERIFIED** before creating application
- ❌ Loan Officers blocked from creating applications for PROSPECT, REGISTERED, or KYC_PENDING customers

### After  
- ✅ Loan Officers can create applications for customers at any status (except BLACKLISTED, INELIGIBLE, SUSPENDED)
- ✅ Documents only need to be **uploaded** (not verified) before creating application
- ✅ Compliance verifies KYC and documents during application review
- ✅ Clear info banner explaining the new workflow to Loan Officers

## New Workflow

### Step 1: Customer Registration (Loan Officer)
- Status: **REGISTERED**
- Complete customer profile with required fields
- Upload at least one document (e.g., ID card, passport photo)

### Step 2: Loan Application Creation (Loan Officer)
- Can create application immediately after customer registration
- Required:
  - ✅ Complete profile (BVN, NIN, bank account, employment, etc.)
  - ✅ At least one document uploaded (unverified is OK)
  - ✅ No active loans or pending applications
  - ✅ Customer not BLACKLISTED
- Application status: **COMPLIANCE_REVIEW** (or **DRAFT** if guarantor required)

### Step 3: Compliance Review (Compliance Officer)
- Reviews the application
- **Verifies documents** (changes status from PENDING to VERIFIED/REJECTED)
- **Verifies KYC** (can update customer status to KYC_VERIFIED/ELIGIBLE)
- Validates guarantor/collateral requirements
- Cannot approve until:
  - ✅ At least one document is VERIFIED
  - ✅ Guarantor requirements met (if applicable)
- Decision options:
  - **APPROVE** → Moves to Internal Control Review
  - **REQUEST_CHANGES** → Returns to Loan Officer
  - **REJECT** → Application rejected

### Step 4+: Internal Control, Accounting, Disbursement
- Same as before

## Benefits

1. **Faster Application Creation**: Loan Officers don't wait for Compliance to verify KYC
2. **Centralized Review**: All verification (KYC + documents) happens in one place during Compliance Review
3. **Better Workflow**: Reflects real-world process where LO collects info, Compliance validates
4. **No Data Loss**: Applications created early, even if customer needs corrections

## Technical Changes

### Frontend: `vclop-frontend/src/pages/loans/NewLoanPage.tsx`
- **Line 54**: Changed `LOAN_BLOCKED_STATUSES` from `['INELIGIBLE', 'BLACKLISTED', 'SUSPENDED', 'PROSPECT', 'REGISTERED', 'KYC_PENDING']` to `['INELIGIBLE', 'BLACKLISTED', 'SUSPENDED']`
- **Line 43**: Changed document check label from "At least 1 VERIFIED document uploaded" to "At least 1 document uploaded (verification during compliance review)"
- **Lines 174-182**: Added new info banner for REGISTERED/KYC_PENDING customers explaining they can proceed
- **Lines 163-173**: Updated blocked status banner to only show for actually blocked statuses
- **Line 186**: Added ACTIVE_BORROWER to success banner statuses

### Backend: No changes needed
Backend already allows this workflow. It only checks:
- Customer not BLACKLISTED
- At least one document exists (doesn't check if verified)
- Complete profile
- No active loans/applications

## Testing Checklist

- [ ] Create customer with REGISTERED status
- [ ] Upload one unverified document
- [ ] Create loan application (should succeed)
- [ ] Application moves to COMPLIANCE_REVIEW status
- [ ] Compliance officer can verify documents during review
- [ ] Application cannot be approved until at least one document is verified
- [ ] Test with KYC_PENDING customer (should also work)
- [ ] Test with BLACKLISTED customer (should still be blocked)

## Migration Notes

- No database changes required
- No data migration needed
- Existing applications continue working as before
- Deploy frontend changes to take effect immediately
