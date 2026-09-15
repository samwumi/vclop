# Compliance Verification Forms - Permission Restrictions

## Problem

IC (Internal Control) officers and Admins were seeing compliance officer verification **forms** when they should only see the verification **logs/status**. They don't perform KYC verification - that's the compliance officer's job - but they need to see what verifications were done.

## Solution

Wrapped all compliance verification forms with permission checks so only compliance officers can:
1. Change customer KYC status (KYC_VERIFIED, ELIGIBLE, INELIGIBLE, BLACKLISTED)
2. Mark items as verified (BVN, NIN, Phone, Employer, Business, Residence)
3. Log field visits

Everyone else (IC, Admin) can VIEW the verification status and history, but NOT the interactive forms.

## Changes Made

### 1. KYC Status Change Form (ComplianceReviewPanel.tsx)

**Before:** Everyone saw the status change buttons
**After:** Only compliance officers see buttons, others see read-only status

#### Compliance Officer View:
```
┌─────────────────────────────────────────┐
│  KYC Verification Status                │
│  Current Status: KYC_PENDING            │
│                                         │
│  After completing verifications:        │
│  [✓ KYC VERIFIED] [✓ ELIGIBLE]         │
│  [INELIGIBLE] [BLACKLISTED]            │
└─────────────────────────────────────────┘
```

#### IC/Admin View:
```
┌─────────────────────────────────────────┐
│  KYC Verification Status                │
│  Current Status: KYC_VERIFIED           │
│                                         │
│  Only compliance officers can update    │
│  KYC verification status. You can view  │
│  the current status and history above.  │
└─────────────────────────────────────────┘
```

### 2. Verification Checkboxes (VerifyRow Component)

**Before:** Everyone saw clickable "Mark Verified" buttons
**After:** Only compliance officers see buttons, others see read-only status with dates

#### Compliance Officer View:
```
Identity & Background
┌─────────────────────────────────────────┐
│ BVN Verified      [Mark Verified]      │
│ NIN Verified      [✓ Verified]         │
│ Phone Verified    [Mark Verified]      │
└─────────────────────────────────────────┘
```

#### IC/Admin View:
```
Identity & Background
┌─────────────────────────────────────────┐
│ BVN Verified      Not Verified          │
│ NIN Verified      ✓ Verified on Jan 15  │
│ Phone Verified    Not Verified          │
└─────────────────────────────────────────┘
```

### 3. Field Visit Logging Form

**Before:** Everyone saw the full field visit form
**After:** Only compliance officers see form, others see notice + history

#### Compliance Officer View:
```
┌─────────────────────────────────────────┐
│  Log Field Visit                        │
│  Visit Type: [BUSINESS ▼]              │
│  Arrived At: [datetime picker]         │
│  GPS: [📍 Capture Location]            │
│  Findings: [textarea...]               │
│  [Log Visit]                           │
└─────────────────────────────────────────┘

Visit History (3)
[... past visits ...]
```

#### IC/Admin View:
```
┌─────────────────────────────────────────┐
│  Only compliance officers can log       │
│  field visits. You can view visit       │
│  history below.                         │
└─────────────────────────────────────────┘

Visit History (3)
[... past visits ...]
```

## Permission Check

All forms use this permission check:
```typescript
hasPermission('loan_applications:compliance_review')
```

This permission is **ONLY** granted to:
- Compliance Officer role
- Compliance Head role
- System Admin (for oversight)

NOT granted to:
- Internal Control Officer
- Internal Control Head
- Loan Officers
- Accounting staff

## What IC/Admin CAN Still Do

### ✅ They CAN:
1. **View current KYC status** - See if customer is ELIGIBLE, KYC_VERIFIED, etc.
2. **View verification logs** - See what was verified and when
3. **View field visit history** - See all past visits with photos, GPS, findings
4. **View compliance decisions** - See compliance officer's recommendations
5. **Make workflow decisions** - Approve/reject in their own stage (IC Review)

### ❌ They CANNOT:
1. Change customer KYC status
2. Mark items as verified
3. Log new field visits
4. Edit compliance assessment data

## Files Modified

### Frontend
- `vclop-frontend/src/pages/compliance/ComplianceReviewPanel.tsx`
  - Added `import { useAuthStore } from '@/stores/auth.store'`
  - Added `const { hasPermission } = useAuthStore()` in component
  - Wrapped KYC status buttons with `hasPermission('loan_applications:compliance_review')`
  - Modified `VerifyRow` component to check permissions
  - Wrapped field visit form with permission check
  - Added read-only messages for non-compliance users

## Technical Implementation

### KYC Status Form
```typescript
{hasPermission('loan_applications:compliance_review') ? (
  <>
    <p>After completing verifications, advance the customer:</p>
    <div className="flex gap-2">
      {STATUS_OPTIONS.map(status => (
        <button onClick={() => updateStatus(status)}>
          {status}
        </button>
      ))}
    </div>
  </>
) : (
  <p className="italic text-gray-600">
    Only compliance officers can update KYC verification status.
  </p>
)}
```

### Verification Rows
```typescript
function VerifyRow({ label, verifiedAt }) {
  const canVerify = hasPermission('loan_applications:compliance_review');
  
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      {canVerify ? (
        <button onClick={toggle}>
          {verifiedAt ? 'Verified' : 'Mark Verified'}
        </button>
      ) : (
        <span>
          {verifiedAt ? `Verified on ${date}` : 'Not Verified'}
        </span>
      )}
    </div>
  );
}
```

### Field Visits
```typescript
{hasPermission('loan_applications:compliance_review') ? (
  <div>
    <p>Log Field Visit</p>
    <form>...</form>
  </div>
) : (
  <div className="bg-gray-50 p-4">
    <p>Only compliance officers can log field visits.</p>
  </div>
)}

{/* History visible to everyone */}
{visits.length > 0 && (
  <div>
    <p>Visit History</p>
    {visits.map(visit => <VisitCard key={visit.id} {...visit} />)}
  </div>
)}
```

## User Experience

### Compliance Officer
- Sees full forms to perform verifications
- Can change KYC status as they complete checks
- Can mark items verified (BVN, NIN, etc.)
- Can log field visits with GPS and photos
- Sees all history

### IC Officer / Admin
- Sees current status (read-only)
- Sees verification dates (read-only)
- Sees field visit history (read-only)
- Sees clear message explaining they can't edit
- Can still make workflow decisions in their own stage

## Benefits

1. **Clear Separation of Duties** - Only compliance does verification
2. **Audit Trail** - IC/Admin can review what was done without editing
3. **User Clarity** - Clear messages about who can do what
4. **Data Integrity** - Prevents accidental changes by non-compliance staff
5. **Compliance** - Matches actual business process (compliance verifies, IC reviews)

## No Backend Changes Needed

All changes are frontend-only. The backend already has proper permission checks on the API endpoints:
- `PATCH /customers/:id/status` - requires `customers:update`
- `PATCH /compliance/assessment/:id` - requires `loan_applications:compliance_review`
- `POST /compliance/:id/visits` - requires `loan_applications:compliance_review`

Frontend now matches backend security model.
