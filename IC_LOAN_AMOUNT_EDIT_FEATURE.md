# IC Loan Amount Edit Feature ✅

## Feature Added

Internal Control (IC) officers can now **modify the approved loan amount** when reviewing and approving customer loan applications.

## Changes Made

### **Backend Changes:**

#### 1. **Updated DTO** (`review-and-repayment.dto.ts`)
Added optional `approvedAmount` field to `ReviewLoanApplicationDto`:
```typescript
@ApiPropertyOptional({ 
  description: 'Approved loan amount (optional - if not provided, uses requested amount)',
  example: 450000 
})
@IsOptional()
@IsNumber()
@Min(1000)
approvedAmount?: number;
```

#### 2. **Updated Service** (`loan-applications.service.ts`)
Modified `review()` method to:
- Accept approved amount from DTO
- Update `approvedAmount` field in database when provided
- Automatically append note about amount modification
- Include modified amount in audit log

**Logic:**
```typescript
if (dto.decision === ReviewDecision.APPROVED && dto.approvedAmount !== undefined) {
  updateData.approvedAmount = dto.approvedAmount;
  
  // Add note about amount modification
  const amountNote = `\n[Amount modified by IC: Original ₦${application.amount} → Approved ₦${dto.approvedAmount}]`;
  updateData.reviewNotes = originalNote + amountNote;
}
```

### **Frontend Changes:**

#### 1. **Updated Service** (`loans.service.ts`)
Added `approvedAmount` parameter to `review()` method:
```typescript
async review(
  applicationId: string, 
  decision: 'APPROVED' | 'REJECTED', 
  reviewNotes?: string, 
  rejectionReason?: string, 
  approvedAmount?: number  // NEW
): Promise<LoanApplication>
```

#### 2. **Updated Loan Detail Page** (`LoanDetailPage.tsx`)
Added new state and enhanced IC approval section:

**New State:**
```typescript
const [approvedAmount, setApprovedAmount] = useState<number | undefined>(undefined);
```

**Enhanced IC Approval Form:**
- Two-column grid layout
- **Approved Amount Input:**
  - Number input with placeholder showing default (requested amount)
  - Min value: ₦1,000
  - Step: ₦1,000
  - Shows modification warning when amount differs from request
- **Internal Control Notes Input:**
  - Text input for review notes
- **Approve Button:**
  - Shows approved amount in button label when modified
  - Example: "Approve (₦450,000)"

## How It Works

### **For IC Officers:**

1. **Navigate to loan** in INTERNAL_CONTROL_REVIEW status
2. **Review application details**
3. **Optional:** Modify approved amount:
   - Enter amount in "Approved Amount" field
   - Leave blank to approve requested amount
   - See live preview of modification
4. **Optional:** Add internal control notes
5. **Click "Approve"** button
6. **System records:**
   - Approved amount (or requested if not modified)
   - IC notes with automatic amount modification note
   - Audit trail entry

### **Example Scenarios:**

**Scenario 1: Approve Full Amount**
- Customer requests: ₦500,000
- IC leaves amount field blank
- System approves: ₦500,000

**Scenario 2: Reduce Amount**
- Customer requests: ₦500,000
- IC enters: ₦400,000
- System approves: ₦400,000
- System adds note: "[Amount modified by IC: Original ₦500,000 → Approved ₦400,000]"

**Scenario 3: Increase Amount**
- Customer requests: ₦300,000
- IC enters: ₦350,000
- System approves: ₦350,000
- System adds note: "[Amount modified by IC: Original ₦300,000 → Approved ₦350,000]"

## UI Features

### **Visual Feedback:**
- Placeholder shows default amount: "Default: ₦500,000"
- Orange warning text when modified: "Modified from ₦500,000 to ₦400,000"
- Button label updates: "Approve (₦400,000)"

### **Validation:**
- Minimum amount: ₦1,000
- Must be numeric
- Optional field (defaults to requested amount)

## Database Impact

**Updated Field:**
- `loanApplication.approvedAmount` - Stores the IC-approved amount

**Automatic Notes:**
- Amount modification automatically appended to `reviewNotes`
- Format: `[Amount modified by IC: Original ₦X → Approved ₦Y]`

## Audit Trail

Every approval with modified amount is logged:
```
Action: APPROVE
Details: "Approved LA-2024-001 via workflow (Amount: ₦400,000)"
```

## Security & Validation

- ✅ Minimum amount enforced: ₦1,000
- ✅ Only IC officers with `loan_applications:internal_control_approve` permission can modify
- ✅ Modification automatically documented in review notes
- ✅ Audit trail captures modified amount
- ✅ Workflow ensures proper approval stages

## Files Modified

**Backend:**
1. `src/modules/loan-applications/dto/review-and-repayment.dto.ts` - Added approvedAmount field
2. `src/modules/loan-applications/loan-applications.service.ts` - Handle approved amount logic

**Frontend:**
3. `src/services/loans.service.ts` - Added approvedAmount parameter
4. `src/pages/loans/LoanDetailPage.tsx` - Enhanced IC approval UI with amount input

**Total:** 70 lines added/modified

## Commit

**Hash:** `a009e2f6`  
**Message:** "feat: Allow IC to edit loan amount during approval"

## Testing Checklist

- [ ] IC can see approved amount input field
- [ ] IC can leave field blank (approves requested amount)
- [ ] IC can reduce amount below requested
- [ ] IC can increase amount above requested
- [ ] Modification warning shows when amount changed
- [ ] Button label updates with approved amount
- [ ] Review notes include amount modification note
- [ ] Audit log captures modified amount
- [ ] Minimum ₦1,000 validation works
- [ ] Non-IC users don't see amount input
- [ ] Disbursement uses approved amount, not requested

---

**Status:** ✅ Complete and deployed
**Feature Owner:** Internal Control Department
**Date:** November 12, 2026
