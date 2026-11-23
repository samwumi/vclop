# How to Create HR Users from Admin Dashboard

You don't need to run scripts! You can create HR users (or any user) directly from the admin dashboard.

## 🎯 Quick Steps

### 1. **Navigate to Users Page**
- Click **"Users"** in the **Administration** section of the sidebar
- Or go to: `/users`

### 2. **Click "New User" Button**
- Top right corner of the page
- You need `users:create` permission

### 3. **Fill in User Details**

#### Basic Information:
- **First Name**: e.g., "HR"
- **Last Name**: e.g., "Manager"  
- **Email**: e.g., "hr@verticalcapital.ng"
- **Username**: e.g., "hr" (lowercase automatically)
- **Temporary Password**: Min 8 characters (user must change on first login)
- **Job Title**: e.g., "HR Manager" (optional)

#### Assign Roles:
✅ Select the **HR Manager** role (or create one with HR permissions)

The system already has these roles:
- HR Manager
- Operations Manager
- Admin
- etc.

#### Location/Branch:
- Select the user's primary **branch** (e.g., Head Office)
- If the role requires multi-location access, you can add additional branches

#### Department:
- Select their **department** (optional)

### 4. **Click "Create User"**
Done! ✅

---

## 🔑 Managing Permissions

After creating a user, you can:

### Option 1: Assign Roles (Recommended)
Roles bundle multiple permissions together. Create roles like:
- **HR Manager** - with leaves:manage, employment:update, etc.
- **Finance Manager** - with accounting permissions
- **Operations Manager** - with loan and customer permissions

### Option 2: Assign Individual Permissions
Click the **⋯** menu next to any user → **"Manage Permissions"**
- Assign specific permissions directly
- Useful for one-off access needs

---

## 📋 Creating an HR Manager Role

If the HR Manager role doesn't exist yet:

### 1. Go to Roles Page
- Navigate to **Administration** → **Roles**
- Or go to: `/roles`

### 2. Create New Role
- Click **"New Role"**
- **Name**: HR Manager
- **Code**: hr_manager (lowercase, no spaces)
- **Description**: "Full access to all HR modules"
- **Status**: Active

### 3. Assign Permissions
Select these permissions:
- ✅ `dashboard:read` - View dashboard
- ✅ `users:read` - View users
- ✅ `leaves:read` - View leaves
- ✅ `leaves:manage` - **Manage leave entitlements**
- ✅ `leaves:approve` - Approve leave requests
- ✅ `employment:read` - View employment
- ✅ `employment:update` - Update employment
- ✅ `offboarding:read` - View offboarding
- ✅ `offboarding:update` - Update offboarding  
- ✅ `staff_loans:read` - View staff loans
- ✅ `staff_loans:approve` - Approve staff loans
- ✅ `resources:read` - View resources
- ✅ `resources:update` - Manage resources
- ✅ `reports:read` - View reports

### 4. Save Role
Now you can assign this role to any HR staff member!

---

## 🎯 For HR Functionality Specifically

### Leave Management Requires:
- ✅ `leaves:manage` - **This is the key permission!**
- Allows access to `/hr/leaves/entitlements`
- HR can adjust leave balances for all employees

### Staff Loan Approval Requires:
- ✅ `staff_loans:approve`

### Employment Management Requires:
- ✅ `employment:update`

### Offboarding Management Requires:
- ✅ `offboarding:update`

---

## 🔧 Additional User Management Features

From the Users page, you can also:

### For Each User:
- **Reset Password** - Generate a temporary password
- **Manage Permissions** - Add/remove specific permissions
- **Location Permissions** - Control which branches they can access
- **Activate/Deactivate** - Toggle user status
- **Unlock Account** - If locked due to failed logins
- **Delete User** - Permanently remove (cannot be undone)

---

## ✅ Summary

**To give someone HR capabilities:**

1. Go to **Users** page
2. Click **"New User"**
3. Fill in their details
4. Assign the **"HR Manager"** role
5. Done!

**No scripts needed!** Everything is managed through the UI.

---

## 🆘 Troubleshooting

### "I don't see the New User button"
You need the `users:create` permission. Contact your administrator.

### "HR Manager role doesn't exist"
Create it on the **Roles** page with the permissions listed above.

### "User can't access leave entitlements"
Make sure they have the `leaves:manage` permission (included in HR Manager role).

### "I need to give someone specific access"
Use **"Manage Permissions"** from the user menu to grant individual permissions without changing their role.

---

**Need more help?** Check the Users, Roles, and Permissions pages in the Administration section.
