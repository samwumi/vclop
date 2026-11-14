# Employment Workflow Implementation Status

**Last Updated:** November 14, 2026  
**Current Commit:** `bf7eb318`

---

## ✅ COMPLETED (Backend & Services)

### 1. Database Schema ✅
- [x] Added `EmploymentSubmissionStatus` enum
- [x] Added workflow fields to `employment_periods`
- [x] Added workflow fields to `employee_guarantors`
- [x] Added workflow fields to `employee_next_of_kin`
- [x] Migration script created and executed
- [x] Existing records set to APPROVED

### 2. Backend Services ✅
- [x] `submitEmploymentForReview()` - validates guarantor + NOK
- [x] `getPendingSubmissions()` - lists pending for HR
- [x] `approveEmployment()` - approves and locks
- [x] `rejectEmployment()` - rejects with reason
- [x] `requestRevision()` - reopens for editing
- [x] `grantEditRights()` - temporary unlock
- [x] `revokeEditRights()` - lock again
- [x] `canEditEmployment()` - check if editable

### 3. API Endpoints ✅
- [x] `POST /hr/employees/:id/submit`
- [x] `GET /hr/employees/pending-submissions`
- [x] `POST /hr/employees/:id/approve`
- [x] `POST /hr/employees/:id/reject`
- [x] `POST /hr/employees/:id/request-revision`
- [x] `POST /hr/employees/:id/grant-edit`
- [x] `POST /hr/employees/:id/revoke-edit`
- [x] `GET /hr/employees/:id/can-edit`

### 4. Frontend Services ✅
- [x] Updated `employment.service.ts` with all workflow methods
- [x] Updated `EmploymentPeriod` interface with workflow fields
- [x] Created `SubmissionStatusBadge` component

### 5. Permissions SQL ✅
- [x] Created `ADD_EMPLOYMENT_WORKFLOW_PERMISSIONS.sql`
- [x] 5 new permissions defined
- [x] Role assignments included

---

## ⏳ REMAINING WORK (Frontend UI)

### 1. Update MyEmploymentPage.tsx
**File:** `vclop-frontend/src/pages/hr/MyEmploymentPage.tsx`

**Changes Needed:**
```tsx
// 1. Add submission status display at top
<SubmissionStatusBadge status={currentEmployment.submissionStatus} />

// 2. Add submit button (show when DRAFT or NEEDS_REVISION)
{canSubmit && (
  <button onClick={handleSubmit} className="btn-primary">
    Submit for HR Review
  </button>
)}

// 3. Disable edit buttons when not editable
<button 
  disabled={!currentEmployment.isEditable}
  onClick={handleEditGuarantor}
>
  Edit Guarantor
</button>

// 4. Show HR feedback when available
{currentEmployment.reviewNotes && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <p className="font-semibold">HR Feedback:</p>
    <p>{currentEmployment.reviewNotes}</p>
  </div>
)}

// 5. Show waiting message when submitted
{currentEmployment.submissionStatus === 'SUBMITTED' && (
  <div className="bg-blue-50 p-4 rounded">
    <p>Your employment data has been submitted and is awaiting HR review.</p>
  </div>
)}
```

**New State:**
- `canSubmit` - derived from status and validation
- `submitMutation` - useMutation for submit

**Validation Before Submit:**
- At least 1 guarantor
- At least 1 next of kin
- All employment fields filled

---

### 2. Update EmployeeDetailsPage.tsx (HR View)
**File:** `vclop-frontend/src/pages/hr/employees/EmployeeDetailsPage.tsx`

**Changes Needed:**
```tsx
// 1. Show submission status
<div className="flex items-center gap-4">
  <h1>{employee.name}</h1>
  <SubmissionStatusBadge status={currentEmployment.submissionStatus} />
</div>

// 2. Add review section (show when SUBMITTED or UNDER_REVIEW)
{isPending && (
  <div className="bg-blue-50 border rounded-lg p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Review Submission</h3>
    <div className="flex gap-3">
      <button onClick={handleApprove} className="btn-success">
        Approve
      </button>
      <button onClick={handleRequestRevision} className="btn-warning">
        Request Revision
      </button>
      <button onClick={handleReject} className="btn-danger">
        Reject
      </button>
    </div>
  </div>
)}

// 3. Add edit rights control (show when APPROVED)
{isApproved && (
  <button onClick={toggleEditRights} className="btn-secondary">
    {currentEmployment.isEditable ? 'Lock Data' : 'Unlock for Editing'}
  </button>
)}

// 4. Show review history
{currentEmployment.reviewedAt && (
  <div className="text-sm text-gray-600">
    Reviewed by {reviewedBy.name} on {formatDate(currentEmployment.reviewedAt)}
  </div>
)}
```

**New Modals:**
- Review notes modal (for reject/request revision)

---

### 3. Create PendingSubmissionsPage.tsx
**File:** `vclop-frontend/src/pages/hr/PendingSubmissionsPage.tsx`

**Purpose:** List all pending employment submissions for HR review

**Features:**
- Table with employee name, submission date, status
- Quick action buttons (Approve, Review, Reject)
- Click row to view full details
- Filter by status (SUBMITTED, UNDER_REVIEW)

**Structure:**
```tsx
export function PendingSubmissionsPage() {
  const { data: submissions } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () => employmentService.getPendingSubmissions(),
  });

  return (
    <div className="container mx-auto py-8">
      <h1>Pending Employment Submissions</h1>
      
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Submission Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions?.map(sub => (
            <tr key={sub.id}>
              <td>{sub.user.firstName} {sub.user.lastName}</td>
              <td>{formatDate(sub.submittedAt)}</td>
              <td><SubmissionStatusBadge status={sub.submissionStatus} /></td>
              <td>
                <button onClick={() => navigate(`/hr/employees/${sub.userId}`)}>
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 4. Update HRDashboardPage.tsx
**File:** `vclop-frontend/src/pages/hr/HRDashboardPage.tsx`

**Changes Needed:**
```tsx
// Add pending submissions query
const { data: pendingSubmissions } = useQuery({
  queryKey: ['pending-submissions'],
  queryFn: () => employmentService.getPendingSubmissions(),
});

// Add card in dashboard
<div 
  onClick={() => navigate('/hr/pending-submissions')}
  className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 cursor-pointer"
>
  <div className="flex items-center justify-between mb-4">
    <FileText className="w-8 h-8" />
    <AlertCircle className="w-5 h-5 opacity-70" />
  </div>
  <p className="text-3xl font-bold mb-1">{pendingSubmissions?.length || 0}</p>
  <p className="text-indigo-100">Pending Employment Reviews</p>
</div>
```

---

### 5. Add Route
**File:** `vclop-frontend/src/router/AppRouter.tsx`

```tsx
// Add route
<Route 
  path="/hr/pending-submissions" 
  element={
    <ProtectedRoute permission="employees:review">
      <PendingSubmissionsPage />
    </ProtectedRoute>
  } 
/>
```

---

## 🔒 Permissions to Apply

**Run on Database:**
```sql
-- Run ADD_EMPLOYMENT_WORKFLOW_PERMISSIONS.sql
-- This adds 5 new permissions and assigns them to appropriate roles
```

**Permissions:**
1. `employees:submit` → All staff
2. `employees:review` → HR only
3. `employees:approve` → HR only
4. `employees:reject` → HR only
5. `employees:grant_edit` → HR only

---

## 🧪 Testing Checklist

### Employee Tests
- [ ] Create employment record (starts as DRAFT)
- [ ] Add guarantors and next of kin
- [ ] Try to submit without guarantor (should fail)
- [ ] Try to submit without next of kin (should fail)
- [ ] Submit successfully
- [ ] Status changes to SUBMITTED
- [ ] Edit buttons become disabled
- [ ] Cannot resubmit while pending

### HR Tests
- [ ] See pending submission in list
- [ ] Click to review details
- [ ] Approve - data locks for employee
- [ ] Reject with reason - employee sees feedback
- [ ] Request revision - employee can edit again
- [ ] Employee resubmits after revision
- [ ] Grant temporary edit rights to approved record
- [ ] Revoke edit rights

---

## 📊 Workflow States

```
Employee Journey:
1. DRAFT → filling details
2. SUBMITTED → waiting for HR (read-only)
3a. APPROVED → permanently locked (unless HR grants edit)
3b. NEEDS_REVISION → can edit and resubmit
3c. REJECTED → closed (cannot edit)

HR Actions:
- APPROVE → locks for employee
- REJECT → closes with feedback
- REQUEST REVISION → reopens for employee
- GRANT EDIT → temporary unlock (on APPROVED only)
- REVOKE EDIT → lock again (on APPROVED only)
```

---

## 🚀 Deployment Steps

1. **Run Migration** ✅
   - Already executed: `add-employment-workflow.ts`

2. **Add Permissions**
   - Run: `ADD_EMPLOYMENT_WORKFLOW_PERMISSIONS.sql`

3. **Deploy Backend** ⏳
   - Commit `bf7eb318` includes all backend changes
   - Services and endpoints ready

4. **Complete Frontend** ⏳
   - Update MyEmploymentPage
   - Update EmployeeDetailsPage
   - Create PendingSubmissionsPage
   - Update HRDashboardPage
   - Add route

5. **Test End-to-End** ⏳
   - Employee submission flow
   - HR review flow
   - Edit rights management

---

## 📝 Quick Implementation Guide

### For MyEmploymentPage.tsx:
1. Import `SubmissionStatusBadge` and `employmentService`
2. Add `submitMutation` using `useMutation`
3. Add `canSubmit` computed state
4. Show status badge at top
5. Show submit button when `canSubmit`
6. Disable edit buttons when `!isEditable`
7. Show HR feedback when available
8. Show waiting message when submitted

### For EmployeeDetailsPage.tsx:
1. Import submission workflow mutations
2. Show status badge
3. Add review section (conditional on status)
4. Add approve/reject/request revision modals
5. Add edit rights toggle
6. Show review history

### For PendingSubmissionsPage.tsx:
1. Create new file
2. Fetch pending submissions
3. Render table with submissions
4. Add action buttons
5. Navigate to employee details on click

---

**Current Status:** Backend complete ✅, Frontend UI remaining ⏳  
**Estimated Time:** 2-3 hours for complete frontend implementation
