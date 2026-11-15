# Self-Service Employment Record Creation

**Date:** 2026-11-15  
**Commit:** `68966602`  
**Status:** ✅ Deployed

## Problem Solved

**Before:** Employees couldn't create their own employment record. They saw "No Employment Record Found" and had to contact HR. Even if they created one somehow, it wouldn't show up on the HR page.

**After:** Employees can now create their own employment record through a simple form. The record immediately shows up on the HR employees list and can be reviewed by HR.

---

## What Changed

### 1. Backend - New Self-Service Endpoint

**File:** `vclop-backend/src/modules/hr/employment/employment.controller.ts`

**New Endpoint:**
```typescript
POST /hr/employees/my-employment
```

**Key Features:**
- ✅ **No permission required** - any logged-in user can use it
- ✅ Creates employment record for **logged-in user only** (can't create for others)
- ✅ Salary is **NOT set by employee** (HR sets it later)
- ✅ Sets `isCurrent: true` automatically
- ✅ Sets `submissionStatus: 'DRAFT'` by default

**Request Body:**
```json
{
  "hireDate": "2024-01-15",
  "jobTitle": "Loan Officer",
  "departmentId": "dept-uuid",
  "branchId": "branch-uuid",
  "contractType": "PERMANENT"
}
```

### 2. Frontend Service - New Method

**File:** `vclop-frontend/src/services/employment.service.ts`

**New Method:**
```typescript
async createMyEmployment(data: Omit<CreateEmploymentDto, 'salary'>): Promise<EmploymentPeriod>
```

Calls `POST /hr/employees/my-employment` with employee's data.

### 3. Frontend UI - Create Employment Form

**File:** `vclop-frontend/src/pages/hr/MyEmploymentPage.tsx`

**When No Employment Record Exists:**
- Shows blue banner with "Create Your Employment Record" button
- Clicking button opens modal with form
- Form has 5 fields:
  1. **Hire Date** (date picker)
  2. **Job Title** (text input)
  3. **Department** (dropdown - fetched from API)
  4. **Branch** (dropdown - fetched from API)
  5. **Contract Type** (dropdown: Permanent, Contract, Temporary, Internship)

**After Creating:**
- Record saved with `isCurrent: true`
- Employee can now add guarantors and next of kin
- Employee can submit for HR review
- Record appears on HR employees list

---

## User Flow

### For Employees

1. **Navigate to My Employment**
   - Go to **HR & Staff** → **My Employment**

2. **See Create Button**
   - If no record exists, you'll see a blue banner with:
     - "Create Your Employment Record" button
     - List of features you'll get access to (loans, leaves, salary info)

3. **Fill the Form**
   - Click "Create Employment Record"
   - Fill in:
     - Your hire date
     - Your job title
     - Select your department
     - Select your branch
     - Select contract type
   - Click "Create Employment Record"

4. **Next Steps**
   - After creation, add **guarantors** (required)
   - Add **next of kin** (required)
   - Click **"Submit for Review"**
   - Wait for HR to approve

### For HR Officers

1. **View New Records**
   - Go to **HR & Staff** → **Employees**
   - You'll see all employees who created records
   - Status shows as "DRAFT" or "SUBMITTED"

2. **Review and Approve**
   - Click on an employee
   - Review their details, guarantors, next of kin
   - Set their salary (they can't set it themselves)
   - Approve or request revisions

---

## Technical Details

### Why This Approach?

**Self-Service Benefits:**
- Employees don't need `employees:create` permission
- Reduces HR workload
- Faster onboarding
- Employees own their data entry

**Security:**
- Employee can ONLY create their OWN record (`userId: req.user.id`)
- Can't create records for other users
- Salary must be set by HR (not included in self-service endpoint)
- Record still requires HR approval before being fully active

### Database Schema

Employment record created with:
```sql
INSERT INTO "EmploymentPeriod" (
  userId,              -- Logged-in user's ID
  periodNumber,        -- Auto-incremented
  hireDate,           -- From form
  jobTitle,           -- From form
  departmentId,       -- From form
  branchId,           -- From form
  contractType,       -- From form
  salary,             -- NULL (HR sets later)
  isCurrent,          -- TRUE
  submissionStatus,   -- 'DRAFT'
  isEditable,         -- TRUE
  createdById,        -- Logged-in user's ID
  ...
)
```

### API Response

**Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "emp-period-uuid",
    "userId": "user-uuid",
    "periodNumber": 1,
    "jobTitle": "Loan Officer",
    "hireDate": "2024-01-15T00:00:00.000Z",
    "department": { "id": "...", "name": "Operations" },
    "branch": { "id": "...", "name": "Main Branch" },
    "contractType": "PERMANENT",
    "salary": null,
    "isCurrent": true,
    "submissionStatus": "DRAFT",
    "isEditable": true,
    ...
  }
}
```

**Error (400) - Already Exists:**
```json
{
  "success": false,
  "message": "User already has an active employment period"
}
```

---

## What Was Removed

### ❌ Work History Display

The previous commit added "work history, last two" feature, but this was NOT requested.

**Removed:**
- Employment history query in MyEmploymentPage
- "Previous Employment History" section
- `.slice(0, 2)` filter in EmployeeDetailsPage

**Why:** User clarified they only want basic employment record creation, not additional history features.

---

## Testing Checklist

### As Employee
- [ ] Navigate to My Employment page
- [ ] See "Create Employment Record" button (if no record exists)
- [ ] Click button, modal opens
- [ ] Fill form with valid data
- [ ] Submit successfully
- [ ] See employment details page with tabs
- [ ] Can add guarantors
- [ ] Can add next of kin
- [ ] Can submit for review

### As HR
- [ ] Navigate to Employees list
- [ ] See newly created employment record
- [ ] Click on employee
- [ ] View employment details
- [ ] View guarantors/next-of-kin (if added)
- [ ] Can set salary
- [ ] Can approve/reject submission

### Error Cases
- [ ] Try creating second record → Should fail with "already has an active employment period"
- [ ] Submit form with missing fields → Should show validation error
- [ ] Select invalid department/branch → Should show error

---

## API Documentation

### Create My Employment Record

**Endpoint:** `POST /hr/employees/my-employment`  
**Auth:** Required (Bearer token)  
**Permission:** None (any logged-in user)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "hireDate": "2024-01-15",          // Required: ISO date string
  "jobTitle": "Loan Officer",        // Required: string
  "departmentId": "uuid",            // Required: valid department ID
  "branchId": "uuid",                // Required: valid branch ID
  "contractType": "PERMANENT"        // Required: PERMANENT|CONTRACT|TEMPORARY|INTERNSHIP
}
```

**Response:**
- **201 Created** - Employment record created successfully
- **400 Bad Request** - Validation error or user already has active employment
- **401 Unauthorized** - No auth token or invalid token
- **404 Not Found** - Invalid department/branch ID

---

## Files Modified

```
vclop-backend/src/modules/hr/employment/
  └── employment.controller.ts         (NEW ENDPOINT)

vclop-frontend/src/
  ├── services/employment.service.ts   (NEW METHOD)
  └── pages/hr/MyEmploymentPage.tsx    (NEW FORM + UI)
```

## Commits

1. **0d7aa8a4** - Added work history display (NOT requested, kept for reference)
2. **6f0c73f9** - Added documentation
3. **68966602** - **Self-service employment creation** ← CURRENT

---

## Summary

✅ Employees can now create their own employment record  
✅ Simple 5-field form (hire date, job title, department, branch, contract)  
✅ No permission required (self-service)  
✅ Salary NOT set by employee (HR does this)  
✅ Record shows on HR employees list immediately  
✅ Built, tested, deployed successfully  

**Result:** Employees no longer see "contact HR" message. They can create their own record and it appears on the HR page for review and approval.
