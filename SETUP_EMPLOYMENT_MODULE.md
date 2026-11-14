# Employment Module Setup Guide

## ✅ Module Status: DEPLOYED

**Commit:** `cda38d10` - All code deployed to Hostinger  
**Module Location:** "My Employment" under "HR & Staff" in sidebar

---

## 🚀 Quick Setup (No Manual SQL!)

### SSH into Hostinger and run ONE command:

```bash
cd ~/domains/yourapp.com/public_html/vclop-backend
npm run setup:employment-permissions
```

**That's it!** The script will automatically:
- ✅ Create 5 employment workflow permissions
- ✅ Give Admin FULL access to all permissions
- ✅ Give HR roles operational access
- ✅ Give ALL users the ability to submit their own data
- ✅ Show detailed verification output

---

## 📋 What Gets Created

### Permissions:
1. **employees:submit** - Submit own employment data
2. **employees:review** - Review pending submissions
3. **employees:approve** - Approve submissions
4. **employees:reject** - Reject submissions
5. **employees:grant_edit** - Grant/revoke edit rights

### Access Levels:
- **Admin Role:** 🔑 ALL 5 permissions (full control)
- **HR Manager/Officer:** 👔 ALL 5 permissions (operational access)
- **All Other Roles:** 👤 employees:submit only (self-service)

---

## 🎯 After Running the Script

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Look in the sidebar** under "HR & Staff" section
3. **You should see:**
   ```
   HR & Staff
   ├── 📋 My Employment    ← Click here!
   └── 💰 My Loans
   ```

---

## 📍 Module Routes

### For Employees:
- `/hr/my-employment` - Fill your employment details, guarantors, next of kin

### For HR:
- `/hr/dashboard` - HR Dashboard with pending submissions card
- `/hr/pending-submissions` - List of all pending employment submissions
- `/hr/employees/:id` - Review individual employee submission (approve/reject/request revision)

---

## 🔧 Troubleshooting

### Module not visible after running script?

1. **Check you ran the script:**
   ```bash
   npm run setup:employment-permissions
   ```

2. **Check the script output** - should show:
   ```
   🎉 SETUP COMPLETE!
   ✅ Employment workflow permissions have been created and assigned
   ```

3. **Hard refresh your browser:** Ctrl+Shift+R or Ctrl+F5

4. **Check your role:** Are you logged in as Admin?

5. **Log out and back in** to refresh permission cache

### Still not visible?

Check if permissions exist:
```bash
cd ~/domains/yourapp.com/public_html/vclop-backend
npm run setup:employment-permissions
```

Look for output showing your role has the permissions.

---

## 🎨 What Employees Can Do

1. **Fill Employment Details:**
   - Position, department, contract type
   - Salary, start date, employment status
   - Supervisor, location

2. **Add Guarantors:**
   - At least 1 required before submission
   - Name, phone, email, relationship, occupation

3. **Add Next of Kin:**
   - At least 1 required before submission
   - Emergency contacts with primary flag

4. **Submit for Review:**
   - Click "Submit for Review" button
   - Data becomes read-only after submission
   - See status badges (Submitted, Under Review, Approved, etc.)

5. **View HR Feedback:**
   - See review notes if rejected
   - See what changes HR is requesting

---

## 🎨 What HR Can Do

1. **View Pending Submissions:**
   - See all employees who submitted data
   - Filter by status
   - See submission dates

2. **Review Each Submission:**
   - View employee details, guarantors, next of kin
   - ✅ Approve (data becomes permanently locked)
   - ❌ Reject with notes
   - 🔄 Request revision with specific feedback

3. **Manage Edit Rights:**
   - Temporarily unlock approved data
   - Allow employee to make changes
   - Revoke edit rights when done

4. **View Review History:**
   - See who reviewed and when
   - View review notes
   - Track workflow status changes

---

## 🔐 What Admin Can Do

- **Everything HR can do** PLUS:
- Manage permissions via Roles & Permissions UI
- Grant/revoke HR access as needed
- Assign employment permissions to new roles
- Complete control over the module

---

## 📊 Permission Hierarchy

```
ADMIN (Full Control)
├── employees:submit ✅
├── employees:review ✅
├── employees:approve ✅
├── employees:reject ✅
└── employees:grant_edit ✅

HR MANAGER/OFFICER (Operational)
├── employees:submit ✅
├── employees:review ✅
├── employees:approve ✅
├── employees:reject ✅
└── employees:grant_edit ✅

ALL OTHER ROLES (Self-Service)
└── employees:submit ✅ (own data only)
```

---

## ✨ Features

- ✅ **Tabbed Interface** - Separate tabs for details, guarantors, next of kin
- ✅ **Workflow States** - DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/NEEDS_REVISION
- ✅ **Data Protection** - Automatic locking after approval
- ✅ **Edit Rights Management** - HR can temporarily unlock data
- ✅ **Status Badges** - Visual feedback on submission status
- ✅ **Validation** - Must have 1+ guarantor and 1+ next of kin before submit
- ✅ **Review Notes** - HR can provide feedback
- ✅ **Audit Trail** - Track who reviewed and when

---

## 🎉 You're Done!

The module is fully deployed and ready to use. Just run the setup script and refresh your browser!
