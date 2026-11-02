# VCLOP Recovery Module - Deployment Checklist

## Overview
This document provides a complete checklist for deploying the VCLOP Loan Recovery Management Module (DROS - Debt Resolution Operating System).

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Database Migration
- [ ] **Run on Production Database**: Execute `ADD_RECOVERY_MODULE.sql`
  ```sql
  -- Creates 6 tables:
  -- - recovery_accounts
  -- - recovery_activities
  -- - recovery_payments
  -- - repayment_promises
  -- - recovery_documents
  -- - recovery_expenses
  ```
  
- [ ] **Verify Tables Created**: Check all 6 tables exist
  ```sql
  SHOW TABLES LIKE 'recovery_%';
  SHOW TABLES LIKE 'repayment_promises';
  ```

- [ ] **Run Permissions Script**: Execute `ADD_RECOVERY_PERMISSIONS.sql`
  ```sql
  -- Creates 24 recovery permissions
  -- Assigns permissions to roles:
  -- - Admin (all permissions)
  -- - MD (dashboard, reports, view all)
  -- - Operations Manager (all except delete)
  -- - Accounting Head (payment verification, reports)
  -- - Loan Officer (basic recovery operations)
  ```

- [ ] **Verify Permissions**: Check permissions were created
  ```sql
  SELECT COUNT(*) FROM permissions WHERE code LIKE 'recovery:%';
  -- Should return 24
  
  SELECT r.name, COUNT(rp.id) as recovery_permissions
  FROM roles r
  LEFT JOIN role_permissions rp ON r.id = rp.roleId
  LEFT JOIN permissions p ON rp.permissionId = p.id
  WHERE p.code LIKE 'recovery:%'
  GROUP BY r.name;
  ```

### 2. Backend Deployment

- [ ] **Prisma Client Generation**: Regenerate Prisma client
  ```bash
  cd vclop-backend
  npx prisma generate
  ```

- [ ] **Build Backend**: Compile TypeScript
  ```bash
  npm run build
  ```

- [ ] **Environment Variables**: Verify all required env vars are set
  ```
  DATABASE_URL=<production-database-url>
  JWT_SECRET=<jwt-secret>
  # ... other existing vars
  ```

- [ ] **Deploy Backend**: Push to production server
  ```bash
  git add .
  git commit -m "feat: Add Recovery Module backend"
  git push origin main
  ```

- [ ] **Restart Backend Service**: On production server
  ```bash
  pm2 restart vclop-backend
  # or
  npm run start:prod
  ```

- [ ] **Verify API Health**: Check `/api/v1/health`
  ```bash
  curl https://your-api-domain.com/api/v1/health
  ```

### 3. Frontend Integration

#### A. Add Routes to AppRouter.tsx
- [ ] **Import Recovery Pages**
  ```typescript
  import { RecoveryDashboardPage } from '@/pages/recovery/RecoveryDashboardPage';
  import { RecoveryAccountsPage } from '@/pages/recovery/RecoveryAccountsPage';
  import { RecoveryAccountDetailPage } from '@/pages/recovery/RecoveryAccountDetailPage';
  import { MyRecoveryAccountsPage } from '@/pages/recovery/MyRecoveryAccountsPage';
  import { PaymentVerificationPage } from '@/pages/recovery/PaymentVerificationPage';
  import { ImportRecoveryAccountsPage } from '@/pages/recovery/ImportRecoveryAccountsPage';
  ```

- [ ] **Add Routes** (see RECOVERY_MODULE_ROUTES.md for details)
  ```typescript
  // Recovery Module Routes
  { path: '/recovery', element: <ProtectedRoute permission="recovery:dashboard_view"><RecoveryDashboardPage /></ProtectedRoute> },
  { path: '/recovery/accounts', element: <ProtectedRoute permission="recovery:accounts_read"><RecoveryAccountsPage /></ProtectedRoute> },
  { path: '/recovery/accounts/import', element: <ProtectedRoute permission="recovery:accounts_import"><ImportRecoveryAccountsPage /></ProtectedRoute> },
  { path: '/recovery/accounts/:id', element: <ProtectedRoute permission="recovery:accounts_read"><RecoveryAccountDetailPage /></ProtectedRoute> },
  { path: '/recovery/my-accounts', element: <ProtectedRoute permission="recovery:accounts_read"><MyRecoveryAccountsPage /></ProtectedRoute> },
  { path: '/recovery/payments/verify', element: <ProtectedRoute permission="recovery:payments_verify"><PaymentVerificationPage /></ProtectedRoute> },
  ```

#### B. Add Navigation Menu Items
- [ ] **Find Navigation Component** (likely in `src/components/layout/` or similar)

- [ ] **Add Recovery Menu for Admin/Operations Manager**
  ```typescript
  {
    label: 'Recovery',
    icon: HandCoins, // from lucide-react
    href: '/recovery',
    permission: 'recovery:dashboard_view',
    children: [
      { label: 'Dashboard', href: '/recovery', permission: 'recovery:dashboard_view' },
      { label: 'All Accounts', href: '/recovery/accounts', permission: 'recovery:accounts_all' },
      { label: 'Import Accounts', href: '/recovery/accounts/import', permission: 'recovery:accounts_import' },
    ],
  }
  ```

- [ ] **Add Recovery Menu for Accounting Head**
  ```typescript
  {
    label: 'Recovery',
    icon: HandCoins,
    href: '/recovery',
    permission: 'recovery:dashboard_view',
    children: [
      { label: 'Dashboard', href: '/recovery', permission: 'recovery:dashboard_view' },
      { label: 'All Accounts', href: '/recovery/accounts', permission: 'recovery:accounts_read' },
      { label: 'Verify Payments', href: '/recovery/payments/verify', permission: 'recovery:payments_verify' },
    ],
  }
  ```

- [ ] **Add Recovery Menu for Loan Officers**
  ```typescript
  {
    label: 'My Recovery',
    icon: HandCoins,
    href: '/recovery/my-accounts',
    permission: 'recovery:accounts_read',
  }
  ```

#### C. Build and Deploy Frontend
- [ ] **Build Frontend**
  ```bash
  cd vclop-frontend
  npm run build
  ```

- [ ] **Deploy Frontend**: Upload to hosting/CDN
  ```bash
  # Example for static hosting
  npm run deploy
  # or manually upload dist/ folder
  ```

- [ ] **Verify Frontend Deployment**: Check main app loads

---

## TESTING CHECKLIST

### 1. Authentication & Permissions Testing

#### Admin User
- [ ] Can access Recovery Dashboard (`/recovery`)
- [ ] Can see all recovery accounts
- [ ] Can create new recovery account
- [ ] Can import accounts from CSV
- [ ] Can assign accounts to officers
- [ ] Can log activities
- [ ] Can record payments
- [ ] Can verify payments
- [ ] Can create promises
- [ ] Can record expenses
- [ ] Can delete accounts

#### Operations Manager
- [ ] Can access Recovery Dashboard
- [ ] Can see all recovery accounts (cross-branch)
- [ ] Can import accounts
- [ ] Can assign accounts
- [ ] Can perform all recovery operations
- [ ] **Cannot** delete accounts

#### Accounting Head
- [ ] Can access Recovery Dashboard
- [ ] Can see all recovery accounts
- [ ] Can view payments
- [ ] **Can verify/reject payments** (critical feature)
- [ ] Can view reports
- [ ] **Cannot** delete accounts
- [ ] **Cannot** import accounts

#### Loan Officer
- [ ] Can access "My Recovery Accounts" page
- [ ] **Can only see** accounts assigned to them
- [ ] Can log activities
- [ ] Can record payments (pending verification)
- [ ] Can create promises
- [ ] Can record expenses
- [ ] **Cannot** see other officers' accounts
- [ ] **Cannot** verify payments
- [ ] **Cannot** delete accounts
- [ ] **Cannot** import accounts

#### Managing Director
- [ ] Can access Recovery Dashboard
- [ ] Can see all metrics and reports
- [ ] Can view all accounts
- [ ] **Read-only access** to most features

### 2. Functional Testing

#### Recovery Account Management
- [ ] **Create Legacy Account**
  - Source: LEGACY
  - All required fields populated
  - Account number auto-generated (REC-000001, etc.)
  - Status: PENDING_VERIFICATION
  
- [ ] **Create VCLOP Defaulted Account**
  - Source: VCLOP
  - Link to existing loan
  - Customer auto-populated from loan
  
- [ ] **Update Account**
  - Change status
  - Change priority
  - Update contact information
  - Update outstanding balance
  
- [ ] **Assign Account to Officer**
  - Assignment date auto-set
  - Officer can see in "My Accounts"
  
- [ ] **Search Functionality**
  - Search by customer name
  - Search by phone number
  - Search by account number

#### Activity Logging
- [ ] **Log Phone Call**
  - Activity type: PHONE_CALL
  - Contact method: PHONE
  - Contact outcome recorded
  - Notes saved
  - Next followup date set
  
- [ ] **Log Field Visit**
  - Activity type: FIELD_VISIT
  - GPS coordinates (optional)
  - Visit address recorded
  - Outcome documented
  
- [ ] **Activity History**
  - All activities visible
  - Sorted by date (newest first)
  - Shows officer who logged it

#### Payment Recording & Verification
- [ ] **Officer Records Payment**
  - Amount, date, method entered
  - Payment reference recorded
  - Status: PENDING_VERIFICATION
  - Officer name recorded
  
- [ ] **Accounting Head Verifies Payment**
  - See payment in verification queue
  - View account context
  - Add verification notes
  - **Verify**: Account balance updates
  - **Verify**: Payment status = VERIFIED
  - **Verify**: Account recoveredAmount increases
  - **Verify**: Account outstandingBalance decreases
  - **Verify**: netRecovery recalculated
  
- [ ] **Accounting Head Rejects Payment**
  - Provide rejection reason (required)
  - Payment status = REJECTED
  - Account balances unchanged
  - Rejection reason visible to officer

#### Repayment Promises
- [ ] **Create Promise**
  - Promised amount
  - Promised date
  - Notes recorded
  - Status: ACTIVE
  
- [ ] **Update Promise Status**
  - Mark as KEPT (with actual payment)
  - Mark as PARTIAL (with partial payment)
  - Mark as BROKEN
  - Mark as CANCELLED
  
- [ ] **Promise in Dashboard**
  - Active promises count shown
  - Account status shows PROMISE_ACTIVE

#### Expenses Tracking
- [ ] **Record Fuel Expense**
  - Expense type: FUEL
  - Amount entered
  - Date recorded
  - Description added
  
- [ ] **Record Legal Fees**
  - Expense type: LEGAL_FEES
  - Amount entered
  
- [ ] **Auto-Calculation**
  - Account totalExpenses increases
  - Account netRecovery decreases (recovered - expenses)
  
- [ ] **Expense History**
  - All expenses visible
  - Shows officer who recorded

#### Dashboard Metrics
- [ ] **Summary Cards**
  - Total Accounts (count)
  - Total Outstanding (sum)
  - Total Recovered (sum)
  - Total Expenses (sum)
  - Net Recovery (recovered - expenses)
  - Recovery Rate (percentage)
  
- [ ] **Accounts by Status**
  - Breakdown chart/list
  - Click navigates to filtered list
  
- [ ] **Accounts by Source**
  - LEGACY vs VCLOP counts
  - Percentage visualization
  
- [ ] **Recent Payments**
  - Last 30 days
  - Only verified payments shown
  - Sorted by date (newest first)
  
- [ ] **Upcoming Followups**
  - Next 7 days
  - Shows customer name, phone, account
  - Click navigates to account detail

#### Import Functionality
- [ ] **Download CSV Template**
  - Template file downloads
  - Contains example data
  - Headers match expected format
  
- [ ] **Upload Valid CSV**
  - File uploads successfully
  - Parse without errors
  - Preview shows correct data
  
- [ ] **Upload Invalid CSV**
  - Missing required fields → Error shown
  - Invalid data types → Error shown
  - Row-level errors highlighted
  
- [ ] **Import Accounts**
  - All accounts created successfully
  - Account numbers auto-generated
  - Status: PENDING_VERIFICATION
  - Source: LEGACY
  - Redirect to accounts list

### 3. Integration Testing

- [ ] **VCLOP Loan to Recovery**
  - Create VCLOP recovery account linked to defaulted loan
  - Customer data auto-populated
  - Original principal matches loan amount
  - Outstanding balance calculated
  
- [ ] **Customer Link**
  - Recovery account links to existing customer
  - Customer details clickable
  - Navigation to customer profile works
  
- [ ] **Branch Filtering**
  - Branch managers see only their branch accounts
  - Admin sees all accounts
  
- [ ] **Officer Assignment**
  - Assigned officer sees in "My Accounts"
  - Other officers don't see it
  - Assignment date recorded

### 4. Edge Cases & Error Handling

- [ ] **Payment Verification Edge Cases**
  - Verify payment larger than outstanding balance → Should work (overpayment)
  - Reject already verified payment → Should fail
  - Verify already rejected payment → Should fail
  
- [ ] **Account Creation Validation**
  - Missing required fields → Validation error
  - Negative amounts → Validation error
  - Invalid date format → Validation error
  - Duplicate phone numbers → Allowed (same customer, multiple loans)
  
- [ ] **Permission Boundaries**
  - User without permission tries to access → 403/redirect
  - Officer tries to see other's accounts → Filtered out
  - LO tries to verify payment → Button hidden/403
  
- [ ] **Network Errors**
  - API down → Error message shown
  - Timeout → Loading state handled
  - Retry functionality works

### 5. Performance Testing

- [ ] **Dashboard Load Time**
  - With 100 accounts: < 2 seconds
  - With 1000 accounts: < 5 seconds
  
- [ ] **Accounts List**
  - Pagination works correctly
  - Filters apply without full reload
  - Search is responsive
  
- [ ] **Account Detail Page**
  - Loads quickly even with many activities
  - Tab switching is instant
  
- [ ] **Import Performance**
  - 100 accounts: < 10 seconds
  - 500 accounts: < 30 seconds
  - Progress indication shown

---

## POST-DEPLOYMENT VERIFICATION

### 1. Smoke Tests (Production)
- [ ] Login as Admin → Dashboard loads
- [ ] Navigate to Recovery → Dashboard shows
- [ ] Create one test recovery account
- [ ] Log one activity
- [ ] Record one payment
- [ ] Verify payment as Accounting Head
- [ ] Check account balance updated
- [ ] Delete test account

### 2. User Acceptance Testing (UAT)
- [ ] **Present to Recovery Team**
  - Demo all features
  - Collect feedback
  - Note any change requests
  
- [ ] **Train Users**
  - Admin/Ops Manager: Full system walkthrough
  - Accounting Head: Payment verification focus
  - Loan Officers: My Accounts workspace focus
  - Recovery Officers: Activity logging, payment recording

### 3. Monitoring
- [ ] **Set Up Monitoring**
  - API response times
  - Error rates
  - Database query performance
  - User activity logs
  
- [ ] **Create Alerts**
  - Failed payment verifications
  - High error rates
  - Slow queries
  
- [ ] **Analytics**
  - Track feature usage
  - Monitor recovery metrics
  - Identify bottlenecks

---

## ROLLBACK PLAN

### If Issues Found After Deployment

1. **Rollback Database** (if schema issues)
   ```sql
   -- Drop recovery tables
   DROP TABLE IF EXISTS recovery_expenses;
   DROP TABLE IF EXISTS recovery_documents;
   DROP TABLE IF EXISTS repayment_promises;
   DROP TABLE IF EXISTS recovery_payments;
   DROP TABLE IF EXISTS recovery_activities;
   DROP TABLE IF EXISTS recovery_accounts;
   
   -- Remove permissions
   DELETE FROM role_permissions WHERE permissionId IN (
     SELECT id FROM permissions WHERE code LIKE 'recovery:%'
   );
   DELETE FROM permissions WHERE code LIKE 'recovery:%';
   ```

2. **Rollback Backend**
   ```bash
   git revert <commit-hash>
   git push origin main
   pm2 restart vclop-backend
   ```

3. **Rollback Frontend**
   ```bash
   # Remove routes from AppRouter.tsx
   # Remove navigation menu items
   # Rebuild and redeploy
   npm run build
   npm run deploy
   ```

---

## SUCCESS CRITERIA

The deployment is considered successful when:

✅ All database tables created without errors  
✅ All permissions assigned correctly to roles  
✅ All 6 frontend pages accessible and functional  
✅ Role-based access control working as expected  
✅ Payment verification workflow complete end-to-end  
✅ Dashboard metrics calculating correctly  
✅ CSV import working for bulk account creation  
✅ No critical bugs or errors reported  
✅ All user roles can perform their designated tasks  
✅ Recovery team provides positive feedback  

---

## SUPPORT & DOCUMENTATION

### User Documentation
- [ ] Create user guide for each role
- [ ] Record video tutorials
- [ ] Prepare FAQ document

### Technical Documentation
- [ ] API documentation (Swagger)
- [ ] Database schema diagram
- [ ] Permission matrix
- [ ] Troubleshooting guide

### Handover
- [ ] Brief system admin on monitoring
- [ ] Train support team on common issues
- [ ] Document known limitations
- [ ] Plan for future enhancements

---

## FUTURE ENHANCEMENTS (Post-MVP)

- [ ] Recovery reports and analytics dashboard
- [ ] SMS/Email notifications for followups
- [ ] Document upload for recovery evidence
- [ ] Legal action workflow integration
- [ ] Recovery performance metrics by officer
- [ ] Customer payment portal
- [ ] Mobile app for field officers
- [ ] Integration with credit bureaus
- [ ] Automated payment reminders
- [ ] Recovery case escalation workflow

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Approved By**: _______________  
**Status**: [ ] Success  [ ] Partial  [ ] Failed  

**Notes**:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
