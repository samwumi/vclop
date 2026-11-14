# Employment Submission & Approval Workflow

**Date:** November 14, 2026  
**Status:** 🚧 In Progress

---

## User Requirement

> "Employee should be able to fill the details which are submitted and editable by HR and becomes read only for them afterwards, unless given the right to edit"

---

## Workflow Design

### Employee Journey

```
1. DRAFT
   ↓ Employee fills employment details + guarantors + next of kin
2. SUBMITTED  
   ↓ Employee clicks "Submit for Review"
3. UNDER_REVIEW
   ↓ HR reviews the submission
4a. APPROVED → becomes READ-ONLY for employee
4b. REJECTED → employee cannot edit (must reapply)
4c. NEEDS_REVISION → becomes EDITABLE again for employee
```

### HR Journey

```
1. Receives notification of pending submission
2. Reviews employment details
3. Can:
   - APPROVE → locks for employee
   - REJECT → closes submission
   - REQUEST REVISION → reopens for employee to edit
   - GRANT EDIT RIGHTS → temporarily unlock approved record
```

---

## Database Schema (✅ DONE)

### employment_periods
- `submissionStatus` - ENUM(DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, NEEDS_REVISION)
- `submittedAt` - DateTime (when employee submitted)
- `reviewedAt` - DateTime (when HR reviewed)
- `reviewedById` - UUID (which HR officer reviewed)
- `reviewNotes` - Text (HR feedback)
- `isEditable` - Boolean (can employee edit?)

### employee_guarantors
- `submissionStatus` - ENUM
- `isEditable` - Boolean

### employee_next_of_kin
- `submissionStatus` - ENUM
- `isEditable` - Boolean

---

## API Endpoints To Create

### Employee Endpoints
```typescript
POST   /hr/my-employment/submit              // Submit for HR review
GET    /hr/my-employment/status              // Check submission status
PUT    /hr/my-employment/revise              // Edit after NEEDS_REVISION
```

### HR Endpoints
```typescript
GET    /hr/employees/pending-submissions     // List pending reviews
POST   /hr/employees/:userId/approve         // Approve submission
POST   /hr/employees/:userId/reject          // Reject submission  
POST   /hr/employees/:userId/request-revision // Request changes
POST   /hr/employees/:userId/grant-edit      // Temporarily unlock
POST   /hr/employees/:userId/revoke-edit     // Lock again
```

---

## Frontend Changes Needed

### 1. MyEmploymentPage.tsx

#### Current State
- Employee can always edit guarantors/next of kin
- No submission workflow
- No status indicators

#### New State
- Show submission status badge (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, etc.)
- Add "Submit for Review" button when DRAFT or NEEDS_REVISION
- Disable edit buttons when `isEditable = false`
- Show HR feedback/review notes when available
- Show "Waiting for HR Review" message when SUBMITTED or UNDER_REVIEW

#### UI Components
```tsx
// Status Badge
<StatusBadge status={submissionStatus} />

// Submit Button (only when DRAFT or NEEDS_REVISION)
{(status === 'DRAFT' || status === 'NEEDS_REVISION') && (
  <button onClick={handleSubmit}>Submit for HR Review</button>
)}

// Edit Protection
{!isEditable && (
  <p>This information is locked. Contact HR to request changes.</p>
)}

// HR Feedback
{reviewNotes && (
  <div className="bg-yellow-50 p-4">
    <p>HR Feedback: {reviewNotes}</p>
  </div>
)}
```

---

### 2. EmployeeDetailsPage.tsx (HR View)

#### New Features
- Show submission status for the employee
- Add "Review Submission" section with:
  - Approve button
  - Reject button (with reason)
  - Request Revision button (with feedback)
- Add "Grant Edit Rights" toggle
- Show who reviewed and when

#### UI Components
```tsx
// Review Actions (only when SUBMITTED or UNDER_REVIEW)
{status === 'SUBMITTED' || status === 'UNDER_REVIEW' ? (
  <div className="bg-blue-50 p-4">
    <h3>Review Submission</h3>
    <button onClick={handleApprove}>Approve</button>
    <button onClick={handleReject}>Reject</button>
    <button onClick={handleRequestRevision}>Request Revision</button>
  </div>
) : null}

// Edit Rights Control (only when APPROVED)
{status === 'APPROVED' && (
  <button onClick={toggleEditRights}>
    {isEditable ? 'Revoke Edit Rights' : 'Grant Edit Rights'}
  </button>
)}
```

---

### 3. HRDashboardPage.tsx

#### New Card
```tsx
<div className="bg-white border rounded-lg p-6">
  <h3>Pending Submissions</h3>
  <p className="text-3xl font-bold">{pendingCount}</p>
  <button onClick={() => navigate('/hr/employees/pending-submissions')}>
    Review Now
  </button>
</div>
```

---

### 4. New Page: PendingSubmissionsPage.tsx

#### Purpose
List all employment submissions awaiting HR review

#### Features
- Filter by status (SUBMITTED, UNDER_REVIEW)
- Show employee name, submission date
- Quick approve/reject/request revision actions
- Click to view full details

---

## Business Rules

### Employee Rules
1. **Can Edit When:**
   - `submissionStatus = DRAFT` (initial creation)
   - `submissionStatus = NEEDS_REVISION` (HR requested changes)
   - `isEditable = true` (HR granted temporary edit rights)

2. **Cannot Edit When:**
   - `submissionStatus = SUBMITTED` (waiting for review)
   - `submissionStatus = UNDER_REVIEW` (HR is reviewing)
   - `submissionStatus = APPROVED` AND `isEditable = false` (locked)
   - `submissionStatus = REJECTED` (closed - must create new)

3. **Must Submit All:**
   - Employment details (job title, department, branch, salary)
   - At least 1 guarantor
   - At least 1 next of kin
   - Validation before submission

### HR Rules
1. **Can Review When:**
   - `submissionStatus = SUBMITTED` or `UNDER_REVIEW`

2. **Approve Action:**
   - Sets `submissionStatus = APPROVED`
   - Sets `isEditable = false`
   - Records `reviewedAt` and `reviewedById`
   - Notifies employee

3. **Reject Action:**
   - Sets `submissionStatus = REJECTED`
   - Requires `reviewNotes` (reason)
   - Employee cannot edit (must reapply)
   - Notifies employee

4. **Request Revision:**
   - Sets `submissionStatus = NEEDS_REVISION`
   - Sets `isEditable = true`
   - Requires `reviewNotes` (what to change)
   - Notifies employee

5. **Grant/Revoke Edit Rights:**
   - Only available for APPROVED records
   - Toggles `isEditable` flag
   - Does NOT change `submissionStatus`
   - Used for corrections/updates

---

## Permissions

### New Permissions Needed
```sql
INSERT INTO permissions (code, name, category, module, action) VALUES
  ('employees:submit', 'Submit Employment Data', 'HR', 'employees', 'submit'),
  ('employees:review', 'Review Employment Submissions', 'HR', 'employees', 'review'),
  ('employees:approve', 'Approve Employment', 'HR', 'employees', 'approve'),
  ('employees:reject', 'Reject Employment', 'HR', 'employees', 'reject'),
  ('employees:grant_edit', 'Grant Edit Rights', 'HR', 'employees', 'grant_edit');
```

### Permission Matrix
| Action | Permission | Who |
|--------|-----------|-----|
| Fill details | `dashboard:read` | All Staff |
| Submit for review | `employees:submit` | All Staff |
| View pending submissions | `employees:review` | HR |
| Approve | `employees:approve` | HR |
| Reject | `employees:reject` | HR |
| Request revision | `employees:review` | HR |
| Grant edit rights | `employees:grant_edit` | HR |

---

## Notifications

### Employee Notifications
1. **Submission Received** - "Your employment data has been submitted for review"
2. **Approved** - "Your employment data has been approved"
3. **Rejected** - "Your employment submission was rejected. Reason: ..."
4. **Revision Requested** - "HR has requested changes to your employment data"
5. **Edit Rights Granted** - "You can now edit your employment information"
6. **Edit Rights Revoked** - "Your employment information is now locked"

### HR Notifications
1. **New Submission** - "New employment submission from [Employee Name]"
2. **Revision Completed** - "[Employee Name] has updated their employment data"

---

## Implementation Order

### Phase 1: Backend (Priority: HIGH)
1. ✅ Add workflow fields to database schema
2. ✅ Run migration to add fields
3. ⏳ Update employment.service.ts with submission methods
4. ⏳ Update employment.controller.ts with new endpoints
5. ⏳ Add validation logic (must have guarantor + next of kin before submit)

### Phase 2: Frontend (Priority: HIGH)
1. ⏳ Update MyEmploymentPage with submission workflow
2. ⏳ Update EmployeeDetailsPage with review actions
3. ⏳ Create PendingSubmissionsPage
4. ⏳ Add pending submissions card to HRDashboardPage
5. ⏳ Add status badges and edit protection UI

### Phase 3: Navigation (Priority: MEDIUM)
1. ⏳ Add "Pending Submissions" link to HR Dashboard
2. ⏳ Add notification badge for pending count
3. ⏳ Add breadcrumbs for navigation

### Phase 4: Permissions & Access (Priority: MEDIUM)
1. ⏳ Create new permissions in database
2. ⏳ Assign permissions to HR role
3. ⏳ Update route protection

### Phase 5: Notifications (Priority: LOW)
1. ⏳ Email notifications for approvals/rejections
2. ⏳ In-app notification system

---

## Testing Checklist

### Employee Flow
- [ ] Create employment record in DRAFT status
- [ ] Add guarantors and next of kin
- [ ] Submit for review
- [ ] Status changes to SUBMITTED
- [ ] Cannot edit while waiting for review
- [ ] Receive notification when approved
- [ ] Confirmed read-only after approval
- [ ] Request changes and edit becomes available
- [ ] Resubmit after revision

### HR Flow
- [ ] See pending submissions list
- [ ] Review employee details
- [ ] Approve submission - employee locked
- [ ] Reject submission - with feedback
- [ ] Request revision - employee can edit
- [ ] Grant temporary edit rights to approved record
- [ ] Revoke edit rights

---

## Current Status

✅ **Database Migration Complete**
- Schema updated with workflow fields
- Migration script created and executed
- All existing records marked as APPROVED

⏳ **Next Steps**
1. Update backend services (employment.service.ts)
2. Add new API endpoints (employment.controller.ts)
3. Update frontend MyEmploymentPage with workflow
4. Create PendingSubmissionsPage for HR
5. Add review UI to EmployeeDetailsPage

---

**Estimated Time:** 4-6 hours for complete implementation
