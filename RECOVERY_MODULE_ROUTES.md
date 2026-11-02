# Recovery Module - Frontend Routes

## Routes to Add to AppRouter.tsx

```typescript
// Recovery Module Routes
import { RecoveryDashboardPage } from '@/pages/recovery/RecoveryDashboardPage';
import { RecoveryAccountsPage } from '@/pages/recovery/RecoveryAccountsPage';
import { RecoveryAccountDetailPage } from '@/pages/recovery/RecoveryAccountDetailPage';
import { MyRecoveryAccountsPage } from '@/pages/recovery/MyRecoveryAccountsPage';
import { PaymentVerificationPage } from '@/pages/recovery/PaymentVerificationPage';
import { ImportRecoveryAccountsPage } from '@/pages/recovery/ImportRecoveryAccountsPage';

// Add to routes array:
{
  path: '/recovery',
  element: <ProtectedRoute permission="recovery:dashboard_view"><RecoveryDashboardPage /></ProtectedRoute>,
},
{
  path: '/recovery/accounts',
  element: <ProtectedRoute permission="recovery:accounts_read"><RecoveryAccountsPage /></ProtectedRoute>,
},
{
  path: '/recovery/accounts/new',
  element: <ProtectedRoute permission="recovery:accounts_create"><ImportRecoveryAccountsPage /></ProtectedRoute>,
},
{
  path: '/recovery/accounts/import',
  element: <ProtectedRoute permission="recovery:accounts_import"><ImportRecoveryAccountsPage /></ProtectedRoute>,
},
{
  path: '/recovery/accounts/:id',
  element: <ProtectedRoute permission="recovery:accounts_read"><RecoveryAccountDetailPage /></ProtectedRoute>,
},
{
  path: '/recovery/my-accounts',
  element: <ProtectedRoute permission="recovery:accounts_read"><MyRecoveryAccountsPage /></ProtectedRoute>,
},
{
  path: '/recovery/payments/verify',
  element: <ProtectedRoute permission="recovery:payments_verify"><PaymentVerificationPage /></ProtectedRoute>,
},
```

## Navigation Menu Items to Add

### For Admin, Operations Manager, MD
```typescript
{
  label: 'Recovery',
  icon: HandCoins, // from lucide-react
  href: '/recovery',
  permission: 'recovery:dashboard_view',
  children: [
    {
      label: 'Dashboard',
      href: '/recovery',
      permission: 'recovery:dashboard_view',
    },
    {
      label: 'All Accounts',
      href: '/recovery/accounts',
      permission: 'recovery:accounts_all',
    },
    {
      label: 'Import Accounts',
      href: '/recovery/accounts/import',
      permission: 'recovery:accounts_import',
    },
  ],
},
```

### For Loan Officers (with recovery assignments)
```typescript
{
  label: 'My Recovery',
  icon: HandCoins,
  href: '/recovery/my-accounts',
  permission: 'recovery:accounts_read',
},
```

### For Accounting Head
```typescript
{
  label: 'Recovery',
  icon: HandCoins,
  href: '/recovery',
  permission: 'recovery:dashboard_view',
  children: [
    {
      label: 'Dashboard',
      href: '/recovery',
      permission: 'recovery:dashboard_view',
    },
    {
      label: 'All Accounts',
      href: '/recovery/accounts',
      permission: 'recovery:accounts_read',
    },
    {
      label: 'Verify Payments',
      href: '/recovery/payments/verify',
      permission: 'recovery:payments_verify',
    },
  ],
},
```

## Permission Codes

All recovery permissions should already be in the database from `ADD_RECOVERY_PERMISSIONS.sql`:

- `recovery:dashboard_view` - View recovery dashboard
- `recovery:accounts_create` - Create recovery accounts
- `recovery:accounts_read` - View recovery accounts
- `recovery:accounts_update` - Update recovery accounts
- `recovery:accounts_delete` - Delete recovery accounts
- `recovery:accounts_import` - Bulk import accounts
- `recovery:accounts_assign` - Assign accounts to officers
- `recovery:accounts_all` - View all accounts (bypass branch/officer filters)
- `recovery:activities_create` - Log recovery activities
- `recovery:activities_read` - View activities
- `recovery:payments_record` - Record payments
- `recovery:payments_verify` - Verify/approve payments
- `recovery:payments_read` - View payments
- `recovery:promises_create` - Create repayment promises
- `recovery:promises_read` - View promises
- `recovery:promises_update` - Update promise status
- `recovery:expenses_create` - Record expenses
- `recovery:expenses_read` - View expenses
- `recovery:documents_upload` - Upload documents
- `recovery:documents_read` - View documents
- `recovery:documents_delete` - Delete documents
- `recovery:reports_view` - View recovery reports
- `recovery:reports_export` - Export recovery data

## Page Descriptions

### RecoveryDashboardPage
- Summary metrics (total accounts, outstanding, recovered, expenses, net recovery, recovery rate)
- Accounts breakdown by status and source
- Active promises count
- Upcoming followups (7 days)
- Recent verified payments (30 days)

### RecoveryAccountsPage
- Searchable/filterable list of all recovery accounts
- Filters: status, source (LEGACY/VCLOP), priority
- Displays: account number, customer, outstanding balance, recovered amount, assigned officer

### RecoveryAccountDetailPage
- 5-tab interface: Overview, Activities, Payments, Promises, Expenses
- Each tab has inline forms for creating new records
- Full account information and history
- Real-time balance updates

### MyRecoveryAccountsPage
- Officer workspace showing only their assigned accounts
- "Needs Attention" section for urgent/high priority accounts
- Summary stats for officer's portfolio

### PaymentVerificationPage
- Accounting Head interface for payment verification
- List of all pending payments across all accounts
- Verify or reject with notes/reasons
- Shows account context for each payment

### ImportRecoveryAccountsPage
- CSV template download
- Drag-and-drop file upload
- Data validation and error reporting
- Preview before import
- Bulk import functionality
