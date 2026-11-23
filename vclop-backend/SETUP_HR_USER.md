# HR User Setup Guide

This guide shows you how to create the HR user account using Prisma.

## 🎯 What This Does

Creates a complete HR user with:
- Username: `hr`
- Password: `HR@2024` 
- Email: `hr@verticalcapital.ng`
- Full access to all HR modules

## 🚀 Quick Start

### Option 1: Run Against Production Database (Recommended)

1. **Temporarily update your local `.env` file** with production database credentials:

```env
DATABASE_URL="mysql://prod_user:prod_password@prod_host:3306/prod_database"
```

2. **Run the script**:

```bash
cd vclop-backend
npm run setup:hr-user
```

3. **Restore your local `.env`** back to your local database

### Option 2: Run the SQL Script

If you prefer SQL, use the `CREATE_HR_USER.sql` file in phpMyAdmin or MySQL Workbench.

## 📋 What Gets Created

### User Account
- **Username**: `hr`
- **Password**: `HR@2024` (must change after first login!)
- **Email**: `hr@verticalcapital.ng`
- **Status**: ACTIVE
- **Branch**: Automatically assigned to Head Office or Main branch

### Role
- **Name**: HR Manager
- **Description**: Full access to all HR modules

### Permissions
The HR user gets these permissions:
- ✅ `dashboard:read` - View dashboard
- ✅ `users:read` - View users
- ✅ `leaves:read` - View leave applications
- ✅ `leaves:manage` - Manage leave entitlements
- ✅ `leaves:approve` - Approve/reject leave requests
- ✅ `employment:read` - View employment records
- ✅ `employment:update` - Update employment records
- ✅ `offboarding:read` - View offboarding cases
- ✅ `offboarding:update` - Update offboarding cases
- ✅ `staff_loans:read` - View staff loans
- ✅ `staff_loans:approve` - Approve/reject staff loans
- ✅ `resources:read` - View resources
- ✅ `resources:update` - Manage resources
- ✅ `reports:read` - View reports

## 📱 How HR Uses the System

After logging in, HR can access:

1. **HR Dashboard** (`/hr`) - Central hub with:
   - Quick stats for all HR modules
   - Pending actions requiring attention
   - Quick access cards for each module

2. **Leave Management**:
   - Apply for personal leave
   - Approve/reject employee leave requests
   - **Manage leave entitlements** - Set balances for all employees

3. **Staff Loans**:
   - View all staff loan applications
   - Approve/reject applications
   - Track loan repayments

4. **Employment**:
   - View all employee records
   - Update employment details
   - Manage work history

5. **Offboarding**:
   - Manage employee exits
   - Track clearance progress
   - Handle final settlements

6. **Resources**:
   - Manage company resources
   - Handle delegations

## 🔐 Login Credentials

```
Username: hr
Password: HR@2024
Email:    hr@verticalcapital.ng
```

⚠️ **IMPORTANT**: HR must change the password after first login!

## ✅ Verification

After running the script, you'll see output like:

```
🎉 HR USER SETUP COMPLETE!
======================================================================

📋 USER DETAILS:
  Username:  hr
  Email:     hr@verticalcapital.ng
  Name:      HR Manager
  Branch:    Head Office
  Status:    ACTIVE

🔑 LOGIN CREDENTIALS:
  ┌────────────────────────────────────────────────────┐
  │  Username:  hr                                     │
  │  Password:  HR@2024                                │
  │  Email:     hr@verticalcapital.ng                  │
  └────────────────────────────────────────────────────┘

📌 ASSIGNED ROLES:
  - HR Manager

🔐 ASSIGNED PERMISSIONS:
  ✓ dashboard:read
  ✓ employment:read
  ✓ leaves:approve
  ...
```

## 🔧 Troubleshooting

### "No active branch found"
Create at least one branch in the system first.

### "HR user already exists"
The script is safe to run multiple times. It will skip user creation if the user exists.

### Script hangs or fails
Check that:
1. Database credentials in `.env` are correct
2. Database is accessible from your machine
3. All required tables exist (run migrations if needed)

## 🎯 Next Steps

After creating the HR user:

1. **Set up leave entitlements**: Run `npm run setup:leave-entitlements`
2. **Set environment variable**: `AUTO_SETUP_LEAVE_ENTITLEMENTS=true`
3. **HR logs in** and starts managing!

---

**Need help?** Contact the development team.
