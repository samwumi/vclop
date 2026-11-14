# Employee Management - Access Control Model

**Date:** November 14, 2026  
**Status:** ✅ Implemented

---

## Overview

The employee management system has **two distinct access levels**:

1. **Self-Service** - Staff can manage their own guarantors and next of kin
2. **HR Access** - HR staff can manage all employees' data

---

## Access Model

### 1. Self-Service Page: `/hr/my-employment`

**Who Can Access:** ALL staff (requires `dashboard:read` permission - basic access)

**What They Can Do:**
- ✅ View their own employment details (READ ONLY)
  - Job title, department, branch
  - Contract type, hire date
  - Monthly salary
  - Staff loan eligibility calculator
- ✅ Add their own guarantors
- ✅ Edit their own guarantors
- ✅ Add their own next of kin
- ✅ Edit their own next of kin
- ✅ Set primary next of kin

**What They CANNOT Do:**
- ❌ Edit employment details (salary, job title, department) - HR only
- ❌ Create employment record - HR only
- ❌ View other employees' data
- ❌ Delete their employment record

**No Employment Record:**
- Shows warning banner
- Explains what they need employment for (loans, leaves, etc.)
- Directs them to contact HR

---

### 2. HR Management Pages

#### A. `/hr/employees` - Employees List
**Permission Required:** `employees:read`

**Who Can Access:** HR staff only

**What They Can Do:**
- View list of all employees
- Search/filter employees
- Click to view individual employee details

#### B. `/hr/employees/:userId` - Employee Details (HR View)
**Permission Required:** `employees:read`

**Who Can Access:** HR staff only

**What They Can Do:**
- ✅ View ALL employee details
- ✅ Create employment record
- ✅ Update salary
- ✅ Add/edit guarantors for ANY employee
- ✅ Add/edit next of kin for ANY employee
- ✅ View employment history
- ✅ Transfer employees

---

## Permission Matrix

| Action | Permission Needed | Who Has It |
|--------|------------------|------------|
| View own employment | `dashboard:read` | All Staff |
| Add own guarantors | `dashboard:read` | All Staff |
| Add own next of kin | `dashboard:read` | All Staff |
| View all employees | `employees:read` | HR Staff |
| Create employment record | `employees:create` | HR Staff |
| Update salary | `employees:update_salary` | HR Staff |
| Add guarantors for others | `employees:create` | HR Staff |
| Update employee details | `employees:update` | HR Staff |

---

## Recommended Permission Setup

### For All Staff (Default Role)
```sql
INSERT INTO role_permissions (roleId, permissionId) VALUES
  (
    (SELECT id FROM roles WHERE code = 'staff'), 
    (SELECT id FROM permissions WHERE code = 'dashboard:read')
  );
```

This gives all staff access to `/hr/my-employment`

### For HR Staff (HR Role)
```sql
INSERT INTO role_permissions (roleId, permissionId) VALUES
  (
    (SELECT id FROM roles WHERE code = 'hr_staff'), 
    (SELECT id FROM permissions WHERE code = 'employees:read')
  ),
  (
    (SELECT id FROM roles WHERE code = 'hr_staff'), 
    (SELECT id FROM permissions WHERE code = 'employees:create')
  ),
  (
    (SELECT id FROM roles WHERE code = 'hr_staff'), 
    (SELECT id FROM permissions WHERE code = 'employees:update')
  ),
  (
    (SELECT id FROM roles WHERE code = 'hr_staff'), 
    (SELECT id FROM permissions WHERE code = 'employees:update_salary')
  );
```

---

## Navigation Flow

### From HR Dashboard (`/hr`)

**For All Staff:**
- Click "My Employment" button → `/hr/my-employment`
  - View employment details
  - Manage guarantors and next of kin

**For HR Staff Only:**
- Click "All Employees" button → `/hr/employees`
  - View employee list
  - Click employee → `/hr/employees/:userId`
    - Full access to edit everything

---

## Business Rules

### Guarantors
1. Staff can add **multiple guarantors** for themselves
2. HR can add guarantors for any employee
3. Guarantors include: firstName, lastName, phone, email, relationship, address, occupation
4. No approval workflow - immediate save
5. No restrictions on number of guarantors

### Next of Kin
1. Staff can add **multiple next of kin** for themselves
2. HR can add next of kin for any employee
3. Next of kin include: firstName, lastName, phone, email, relationship, address, **isPrimary flag**
4. **Only ONE primary next of kin** - setting a new primary auto-unsets others
5. No approval workflow - immediate save
6. No restrictions on number of next of kin

### Employment Details
1. **Only HR can create/edit** employment records
2. Staff can only **view** their own employment details
3. Salary updates require `employees:update_salary` permission
4. Employment history is preserved (not deleted)

---

## API Security

All backend endpoints enforce permissions:

### Self-Service Endpoints
```typescript
// Uses logged-in user's ID from JWT token
GET  /hr/employees/:id/current-employment
GET  /hr/employees/employment/:employmentPeriodId/guarantors
POST /hr/employees/employment/:employmentPeriodId/guarantors
PUT  /hr/employees/guarantors/:guarantorId
GET  /hr/employees/employment/:employmentPeriodId/next-of-kin
POST /hr/employees/employment/:employmentPeriodId/next-of-kin
PUT  /hr/employees/next-of-kin/:nextOfKinId
```

### HR-Only Endpoints
```typescript
@RequirePermissions('employees:read')
GET  /hr/employees/:id/employment-history

@RequirePermissions('employees:create')
POST /hr/employees/:id/employment

@RequirePermissions('employees:update_salary')
PUT  /hr/employees/:id/salary

@RequirePermissions('employees:update')
PUT  /hr/employees/:id/transfer
```

---

## Frontend Route Protection

```typescript
// Self-service - All staff
<Route 
  path="/hr/my-employment" 
  element={
    <ProtectedRoute permission="dashboard:read">
      <MyEmploymentPage />
    </ProtectedRoute>
  } 
/>

// HR-only
<Route 
  path="/hr/employees" 
  element={
    <ProtectedRoute permission="employees:read">
      <EmployeesListPage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/hr/employees/:userId" 
  element={
    <ProtectedRoute permission="employees:read">
      <EmployeeDetailsPage />
    </ProtectedRoute>
  } 
/>
```

---

## Why This Design?

### Data Integrity
- HR controls employment records (salary, job title) to prevent tampering
- Self-service for personal data (guarantors, next of kin) reduces HR workload

### Audit Trail
- All changes tracked with timestamps
- employmentPeriodId links guarantors/next of kin to specific employment periods

### Staff Loan Eligibility
- Staff can see their eligibility without contacting HR
- Guarantors required for staff loan applications
- Next of kin required for emergency scenarios

---

## Testing Access Control

1. **Test as Regular Staff:**
   - Login with regular staff account
   - Go to `/hr/my-employment` - ✅ Should work
   - Try to go to `/hr/employees` - ❌ Should redirect to forbidden page

2. **Test as HR Staff:**
   - Login with HR account (has `employees:read` permission)
   - Go to `/hr/employees` - ✅ Should see employee list
   - Go to `/hr/my-employment` - ✅ Should also work (own data)
   - Click any employee - ✅ Should see full details with edit buttons

---

## Commit Information

**Files Changed:**
- `vclop-frontend/src/pages/hr/MyEmploymentPage.tsx` - NEW self-service page
- `vclop-frontend/src/router/AppRouter.tsx` - Added `/hr/my-employment` route
- `vclop-frontend/src/pages/hr/HRDashboardPage.tsx` - Added "My Employment" button

**Next Commit:** `[next]`

---

**Summary:** Two-tier access model - staff manage their own guarantors/NOK, HR manages employment records.
