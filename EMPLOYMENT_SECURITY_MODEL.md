# Employment Module - Security & Access Control

## 🔐 Security Model

The employment workflow module implements a **self-service + HR oversight** security model.

---

## 👤 Regular Employees (No Special Permissions)

### What They CAN Do:
✅ **View their OWN employment data**
- Employment history (positions, salary history, transfers)
- Current employment details
- Their own guarantors
- Their own next of kin

✅ **Edit their OWN employment data** (when editable)
- Add/edit guarantors
- Add/edit next of kin
- Update employment details (if not locked)

✅ **Submit their data for HR review**
- Requires: `employees:submit` permission (everyone has this)
- Data becomes locked after submission

### What They CANNOT Do:
❌ View other employees' data
❌ View pending submissions list
❌ Approve/reject submissions
❌ Access `/hr/employees` route (employee list)
❌ Access `/hr/pending-submissions` route

---

## 👔 HR Staff (employees:review permission)

### What They CAN Do:
✅ **Everything regular employees can do** PLUS:
✅ **View ALL employees' employment data**
✅ **View pending submissions list** (`/hr/pending-submissions`)
✅ **Review employee submissions**
✅ **Request revisions** with feedback notes

### What They CAN Do with additional permissions:

**With `employees:approve`:**
✅ Approve employment submissions

**With `employees:reject`:**
✅ Reject employment submissions with notes

**With `employees:grant_edit`:**
✅ Grant edit rights to locked data
✅ Revoke edit rights

---

## 🔑 Admin Role (Full Control)

### What They CAN Do:
✅ **Everything** - all 5 employment workflow permissions:
- `employees:submit` - Submit employment data
- `employees:review` - View pending submissions
- `employees:approve` - Approve submissions
- `employees:reject` - Reject submissions
- `employees:grant_edit` - Manage edit rights

✅ **Manage permissions** via Settings → Roles
✅ **Delegate permissions** to other roles
✅ **Complete control** over the employment module

---

## 🛡️ Backend Protection

### Permission Checks (employment.controller.ts):

```typescript
// Check if user owns the data OR has permission
const isOwnData = req.user.id === userId;
const hasPermission = req.user.permissions?.includes('employees:read');

if (!isOwnData && !hasPermission) {
  throw new ForbiddenException('Insufficient permissions');
}
```

### Protected Routes:

| Route | Access |
|-------|--------|
| `GET /hr/employees/:id/employment-history` | Own data OR `employees:read` |
| `GET /hr/employees/:id/current-employment` | Own data OR `employees:read` |
| `GET /hr/employees/employment/:id/guarantors` | Own data OR `employees:read` |
| `POST /hr/employees/employment/:id/guarantors` | Own data OR `employees:create` |
| `PUT /hr/employees/guarantors/:id` | Own data OR `employees:update` |
| `GET /hr/employees/employment/:id/next-of-kin` | Own data OR `employees:read` |
| `POST /hr/employees/employment/:id/next-of-kin` | Own data OR `employees:create` |
| `PUT /hr/employees/next-of-kin/:id` | Own data OR `employees:update` |
| **`GET /hr/employees/pending-submissions`** | **`employees:review` ONLY** |
| `POST /hr/employees/:id/submit` | `employees:submit` |
| `POST /hr/employees/:id/approve` | `employees:approve` |
| `POST /hr/employees/:id/reject` | `employees:reject` |
| `POST /hr/employees/:id/request-revision` | `employees:review` |
| `POST /hr/employees/:id/grant-edit` | `employees:grant_edit` |
| `POST /hr/employees/:id/revoke-edit` | `employees:grant_edit` |

---

## 🎯 Frontend Protection

### Protected Routes (AppRouter.tsx):

```tsx
// Regular employees can access (own data only)
<Route 
  path="/hr/my-employment" 
  element={<ProtectedRoute permission="dashboard:read">
    <MyEmploymentPage />
  </ProtectedRoute>} 
/>

// HR only - requires employees:review
<Route 
  path="/hr/pending-submissions" 
  element={<ProtectedRoute permission="employees:review">
    <PendingSubmissionsPage />
  </ProtectedRoute>} 
/>

// HR only - requires employees:read
<Route 
  path="/hr/employees" 
  element={<ProtectedRoute permission="employees:read">
    <EmployeesListPage />
  </ProtectedRoute>} 
/>

<Route 
  path="/hr/employees/:userId" 
  element={<ProtectedRoute permission="employees:read">
    <EmployeeDetailsPage />
  </ProtectedRoute>} 
/>
```

---

## 🔄 Workflow States & Access

### DRAFT
- **Employee:** Can edit freely
- **HR:** Can view (if has permission)

### SUBMITTED
- **Employee:** Read-only, cannot edit
- **HR:** Can review, approve, reject, or request revision

### UNDER_REVIEW
- **Employee:** Read-only, cannot edit
- **HR:** Processing, can approve/reject/request revision

### APPROVED
- **Employee:** Read-only, permanently locked
- **HR:** Can grant temporary edit rights if needed

### REJECTED
- **Employee:** Read-only, can see rejection notes
- **HR:** Can view, request revision to allow resubmission

### NEEDS_REVISION
- **Employee:** Can edit and resubmit
- **HR:** Can view, waiting for employee to fix issues

---

## 📋 Permission Matrix

| Action | Regular Employee | HR Staff | Admin |
|--------|-----------------|----------|-------|
| View own employment data | ✅ | ✅ | ✅ |
| Edit own employment data | ✅ | ✅ | ✅ |
| Submit own data | ✅ | ✅ | ✅ |
| View other employees' data | ❌ | ✅ | ✅ |
| View pending submissions list | ❌ | ✅ | ✅ |
| Approve submissions | ❌ | ✅* | ✅ |
| Reject submissions | ❌ | ✅* | ✅ |
| Request revisions | ❌ | ✅ | ✅ |
| Grant edit rights | ❌ | ✅* | ✅ |
| Manage permissions | ❌ | ❌ | ✅ |

*Requires specific permission (approve/reject/grant_edit)

---

## 🚨 Security Features

### 1. **Self-Service Access**
Users can only access their own data without special permissions.

### 2. **Permission-Based HR Access**
HR can only see employee list if they have `employees:review` or `employees:read`.

### 3. **Data Ownership Validation**
Backend validates that userId matches the logged-in user OR user has permission.

### 4. **Related Data Protection**
When editing guarantors/NOK, checks ownership through employment period relationship.

### 5. **Proper HTTP Exceptions**
Returns `403 Forbidden` instead of generic errors for unauthorized access.

### 6. **Frontend Route Guards**
ProtectedRoute component blocks navigation to restricted pages.

### 7. **API Endpoint Guards**
Every endpoint validates permissions before processing.

---

## 🎓 How to Give Someone HR Access

### Option 1: Assign HR Role
```
1. Go to Users → [Find Person]
2. Edit → Assign Role: "HR Manager" or "HR Officer"
3. They now have all HR permissions
```

### Option 2: Grant Individual Permissions
```
1. Go to Settings → Roles
2. Select their current role
3. Add permissions:
   - employees:review (view pending submissions)
   - employees:approve (approve submissions)
   - employees:reject (reject submissions)
   - employees:grant_edit (manage edit rights)
```

---

## ✅ Testing the Security

### Test 1: Regular User Cannot See Employee List
1. Login as regular employee
2. Try to navigate to `/hr/employees`
3. Should be blocked or show "No permission"

### Test 2: Regular User Can See Own Data
1. Login as regular employee
2. Go to `/hr/my-employment`
3. Should see their own employment form

### Test 3: Regular User Cannot See Pending List
1. Login as regular employee
2. Try to navigate to `/hr/pending-submissions`
3. Should be blocked

### Test 4: HR Can See Everything
1. Login as HR Manager/Officer
2. Navigate to `/hr/pending-submissions`
3. Should see list of all pending submissions
4. Can click and review each one

### Test 5: Admin Has Full Control
1. Login as Admin
2. Can access all routes
3. Can manage permissions
4. Can delegate HR access

---

## 🎉 Summary

The employment module now has **proper security**:

- ✅ Regular employees can ONLY view/edit their own data
- ✅ HR can view/manage all employee submissions (with permission)
- ✅ Admin has complete control
- ✅ Unauthorized access is blocked at both frontend and backend
- ✅ Data is protected by ownership validation
- ✅ Permissions are flexible and can be delegated

**No one can see data they shouldn't have access to!** 🔒
