# 📋 Request More Information Feature

## Overview

Underwriters can now **request more information** from loan officers during the review process instead of only approving or rejecting applications. This creates a better workflow for handling incomplete or unclear applications.

---

## 🎯 How It Works

### **New Review Decision: REQUEST_INFORMATION**

Underwriters now have **3 options** when reviewing applications:

1. **APPROVED** - Move to next stage
2. **REJECTED** - Final rejection
3. **REQUEST_INFORMATION** - Send back for additional details ⭐ NEW!

---

## 🔄 Workflow Flow

```
DRAFT
  ↓ (Officer submits)
COMPLIANCE_REVIEW
  ↓ (Underwriter reviews)
  ├─ APPROVED → INTERNAL_CONTROL_REVIEW
  ├─ REJECTED → Application rejected
  └─ REQUEST_INFORMATION → AWAITING_INFORMATION ⭐
       ↓ (Officer provides info & resubmits)
     COMPLIANCE_REVIEW (returns to underwriter)
```

---

## 📝 Application Status

### **New Status: AWAITING_INFORMATION**

- Application is in a "pending" state waiting for additional information
- Officer can add/update documents, guarantors, or collateral
- Officer resubmits when ready
- Returns to COMPLIANCE_REVIEW for underwriter to re-review

---

## 🚀 API Endpoints

### **1. Review Application (Updated)**

**Endpoint:** `PATCH /api/v1/loan-applications/:id/review`

**Permission:** `loan_applications:compliance_review`

**Request Body:**
```json
{
  "decision": "REQUEST_INFORMATION",
  "rejectionReason": "Please provide the customer's updated bank statement and proof of income",
  "reviewNotes": "Initial documents are outdated (6 months old)"
}
```

**Decisions:**
- `APPROVED` - Approve and move forward
- `REJECTED` - Reject application (final)
- `REQUEST_INFORMATION` - Request more info (application becomes AWAITING_INFORMATION)

**Required Fields:**
- `rejectionReason` is **required** when decision is `REJECTED` or `REQUEST_INFORMATION`
- `reviewNotes` is optional for all decisions

**Response:**
```json
{
  "success": true,
  "message": "Review recorded",
  "data": {
    "id": "app-uuid",
    "status": "AWAITING_INFORMATION",
    "rejectionReason": "Please provide the customer's updated bank statement...",
    "reviewNotes": "Initial documents are outdated...",
    "reviewedById": "underwriter-uuid",
    "reviewedAt": "2026-09-09T14:30:00Z"
  }
}
```

---

### **2. Resubmit Application (New)**

**Endpoint:** `PATCH /api/v1/loan-applications/:id/resubmit`

**Permission:** `loan_applications:submit`

**Description:** Resubmit an application that is AWAITING_INFORMATION

**Request Body:** None (empty body)

**Requirements:**
- Application must be in `AWAITING_INFORMATION` status
- All document requirements must still be met
- All guarantor/collateral requirements must still be met

**Response:**
```json
{
  "success": true,
  "message": "Application resubmitted",
  "data": {
    "id": "app-uuid",
    "status": "COMPLIANCE_REVIEW",
    "submittedById": "officer-uuid",
    "submittedAt": "2026-09-09T15:00:00Z",
    "reviewNotes": null,
    "rejectionReason": null
  }
}
```

**Note:** Previous `reviewNotes` and `rejectionReason` are cleared on resubmission.

---

## 💼 Use Cases

### **Use Case 1: Missing Documents**

**Scenario:** Customer uploaded NIN but it's expired

**Underwriter Action:**
```json
{
  "decision": "REQUEST_INFORMATION",
  "rejectionReason": "Customer's NIN document has expired. Please request updated NIN.",
  "reviewNotes": "NIN expired on 2025-05-15"
}
```

**Officer Action:**
1. Contact customer
2. Customer uploads new NIN
3. Admin verifies new document
4. Officer resubmits: `PATCH /loan-applications/{id}/resubmit`

---

### **Use Case 2: Unclear Purpose**

**Scenario:** Loan purpose is vague

**Underwriter Action:**
```json
{
  "decision": "REQUEST_INFORMATION",
  "rejectionReason": "Please provide more details about the business expansion plan",
  "reviewNotes": "Current purpose: 'business' - too vague"
}
```

**Officer Action:**
1. Contact customer for detailed plan
2. Update application notes/purpose
3. Resubmit application

---

### **Use Case 3: Need Additional Collateral**

**Scenario:** Loan amount too high for current collateral

**Underwriter Action:**
```json
{
  "decision": "REQUEST_INFORMATION",
  "rejectionReason": "Loan amount of ₦2,000,000 requires additional collateral. Current collateral valued at ₦800,000",
  "reviewNotes": "Need collateral totaling at least ₦1,500,000"
}
```

**Officer Action:**
1. Request additional collateral from customer
2. Add collateral: `POST /loan-applications/{id}/collaterals`
3. Resubmit application

---

## 🔒 Validation Rules

### **When Requesting Information:**
- ✅ Application must be in `COMPLIANCE_REVIEW` or `SUBMITTED` status
- ✅ `rejectionReason` field is **required** (explain what information is needed)
- ✅ Application moves to `AWAITING_INFORMATION` status

### **When Resubmitting:**
- ✅ Application must be in `AWAITING_INFORMATION` status
- ✅ All document requirements must be met (same as initial submission)
- ✅ All guarantor/collateral requirements must be met
- ✅ Application moves back to `COMPLIANCE_REVIEW` status
- ✅ Previous review notes and rejection reason are cleared

### **Error Responses:**

**Trying to resubmit non-AWAITING_INFORMATION application:**
```json
{
  "success": false,
  "message": "Only applications AWAITING_INFORMATION can be resubmitted (currently COMPLIANCE_REVIEW)"
}
```

**Requesting information without reason:**
```json
{
  "success": false,
  "message": "rejectionReason is required when rejecting or requesting information"
}
```

**Resubmitting with missing documents:**
```json
{
  "success": false,
  "message": "Customer is missing 2 verified document(s) required by Quick Cash (30 Days)"
}
```

---

## 📊 Database Changes

### **Schema Updates:**

1. **ReviewDecision Enum (DTO):**
   ```typescript
   export enum ReviewDecision {
     APPROVED = 'APPROVED',
     REJECTED = 'REJECTED',
     REQUEST_INFORMATION = 'REQUEST_INFORMATION', // NEW
   }
   ```

2. **LoanApplicationStatus Enum (Already existed):**
   ```prisma
   enum LoanApplicationStatus {
     DRAFT
     SUBMITTED
     COMPLIANCE_REVIEW
     AWAITING_INFORMATION  // ✅ Already in schema, now being used!
     INTERNAL_CONTROL_REVIEW
     ACCOUNTING_REVIEW
     APPROVED
     REJECTED
     ...
   }
   ```

---

## 🎨 UI Suggestions

### **Underwriter Review Screen:**

Add a third button:
```
[Approve] [Request Info] [Reject]
```

When "Request Info" is clicked:
- Show textarea for required information request
- Make it clear this is NOT a rejection
- Show that application will return to officer

### **Officer Dashboard:**

Show applications with status `AWAITING_INFORMATION` separately:
```
📋 Applications Awaiting Information (3)
├─ LA-000123 - More documents needed
├─ LA-000125 - Clarify loan purpose
└─ LA-000128 - Additional collateral required
```

Click to view:
- Show underwriter's request (rejectionReason)
- Show review notes
- Provide "Resubmit" button after addressing issues

---

## 🔔 Notifications (Future Enhancement)

Recommended notification triggers:

1. **When underwriter requests information:**
   - Notify loan officer
   - Notify customer (optional)
   - Email: "Additional information needed for your loan application"

2. **When officer resubmits:**
   - Notify underwriter
   - Email: "Loan application LA-XXXXXX has been resubmitted for review"

---

## 📈 Benefits

### **For Underwriters:**
- ✅ More flexible than approve/reject binary choice
- ✅ Can request clarification without rejection
- ✅ Maintains application in system (not lost)
- ✅ Clear communication channel

### **For Officers:**
- ✅ Know exactly what information is needed
- ✅ Can fix issues without creating new application
- ✅ Preserves application history
- ✅ Faster resolution

### **For Customers:**
- ✅ Application not rejected prematurely
- ✅ Clear feedback on what's needed
- ✅ Can provide missing info and continue process
- ✅ Better experience

---

## 🧪 Testing

### **Test Case 1: Request Information**
```bash
# 1. Create and submit application
POST /loan-applications
PATCH /loan-applications/{id}/submit

# 2. Underwriter requests more info
PATCH /loan-applications/{id}/review
{
  "decision": "REQUEST_INFORMATION",
  "rejectionReason": "Need updated bank statement"
}

# 3. Verify status
GET /loan-applications/{id}
# Expected: status = "AWAITING_INFORMATION"
```

### **Test Case 2: Resubmit**
```bash
# 1. Officer provides information
# (upload documents, add collateral, etc.)

# 2. Resubmit
PATCH /loan-applications/{id}/resubmit

# 3. Verify status
GET /loan-applications/{id}
# Expected: status = "COMPLIANCE_REVIEW"
# Expected: rejectionReason = null
```

### **Test Case 3: Validation**
```bash
# Try to resubmit without required documents
PATCH /loan-applications/{id}/resubmit
# Expected: 400 Bad Request
# "Customer is missing X verified document(s)..."
```

---

## 🔄 Workflow States

| From Status | Action | To Status | Actor |
|------------|--------|-----------|-------|
| COMPLIANCE_REVIEW | REQUEST_INFORMATION | AWAITING_INFORMATION | Underwriter |
| AWAITING_INFORMATION | Resubmit | COMPLIANCE_REVIEW | Officer |
| AWAITING_INFORMATION | Can add documents | AWAITING_INFORMATION | Officer/Admin |
| AWAITING_INFORMATION | Can add collateral | AWAITING_INFORMATION | Officer |
| AWAITING_INFORMATION | Can add guarantors | AWAITING_INFORMATION | Officer |

---

## 📝 Audit Trail

All actions are logged:

```
✅ "Requested more information for LA-000123"
✅ "Resubmitted LA-000123 with requested information"
```

Audit events:
- `loan_application.reviewed` (with decision: REQUEST_INFORMATION)
- `loan_application.resubmitted` (new event)

---

## 🚀 Deployment

### **No Database Migration Needed!**

The `AWAITING_INFORMATION` status already exists in the schema. This is a **code-only change**.

### **Files Changed:**
1. ✅ `dto/review-and-repayment.dto.ts` - Added REQUEST_INFORMATION to enum
2. ✅ `loan-applications.service.ts` - Updated review() and added resubmitWithInformation()
3. ✅ `loan-applications.controller.ts` - Added resubmit endpoint

### **Deployment Steps:**
1. Deploy updated backend code
2. Restart backend service
3. Test endpoints
4. Update frontend to show new option
5. Notify users of new feature

---

## ✅ Summary

**Before:**
- Underwriter could only APPROVE or REJECT
- Incomplete applications were rejected
- Officers had to create new applications

**After:**
- Underwriter can REQUEST_INFORMATION ⭐
- Applications remain active, waiting for info
- Officers can fix issues and resubmit
- Better workflow, less frustration

---

**Feature Status:** ✅ Implemented and Ready for Testing  
**Database Changes:** None (using existing status)  
**Breaking Changes:** None  
**Backward Compatible:** Yes
