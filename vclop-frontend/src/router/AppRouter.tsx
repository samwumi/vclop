import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Landing page
import { LandingPage } from '@/pages/landing/LandingPage';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';

// Phase 1 — app pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { RolesPage } from '@/pages/roles/RolesPage';
import { PermissionsPage } from '@/pages/permissions/PermissionsPage';
import { BranchesPage } from '@/pages/branches/BranchesPage';
import { DepartmentsPage } from '@/pages/departments/DepartmentsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AuditPage } from '@/pages/audit/AuditPage';
import { AuditCompliancePage } from '@/pages/audit/AuditCompliancePage';
import { CompliancePage } from '@/pages/compliance/CompliancePage';
import { CollectionsPage } from '@/pages/collections/CollectionsPage';
import { AccountingPage } from '@/pages/accounting/AccountingPage';
import { ReconciliationPage } from '@/pages/accounting/ReconciliationPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';

// Phase 2 — customers
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { NewCustomerPage } from '@/pages/customers/NewCustomerPage';
import { Customer360Page } from '@/pages/customers/Customer360Page';
import { CustomerEditPage } from '@/pages/customers/CustomerEditPage';

// Phase 2 — loans
import { LoansPage } from '@/pages/loans/LoansPage';
import { NewLoanPage } from '@/pages/loans/NewLoanPage';
import { LoanDetailPage } from '@/pages/loans/LoanDetailPage';

// Phase 2 — admin config
import { LoanProductsAdminPage } from '@/pages/admin/LoanProductsAdminPage';
import { WorkflowsAdminPage } from '@/pages/admin/WorkflowsAdminPage';
import { FormEngineAdminPage } from '@/pages/admin/FormEngineAdminPage';

// Phase 3 — transport + performance
import { TransportPage } from '@/pages/transport/TransportPage';
import { PerformancePage } from '@/pages/performance/PerformancePage';
import { OfficerTargetsPage } from '@/pages/officer-targets/OfficerTargetsPage';
import { InternalControlPage } from '@/pages/internal-control/InternalControlPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { LocationDrilldownPage } from '@/pages/reports/LocationDrilldownPage';
import MissingVirtualAccountsPage from '@/pages/virtual-accounts/MissingVirtualAccountsPage';

// Phase 6 — Recovery Module
import { RecoveryDashboardPage } from '@/pages/recovery/RecoveryDashboardPage';
import { RecoveryAccountsPage } from '@/pages/recovery/RecoveryAccountsPage';
import { NewRecoveryAccountPage } from '@/pages/recovery/NewRecoveryAccountPage';
import { RecoveryAccountDetailPage } from '@/pages/recovery/RecoveryAccountDetailPage';
import { MyRecoveryAccountsPage } from '@/pages/recovery/MyRecoveryAccountsPage';
import { PaymentVerificationPage } from '@/pages/recovery/PaymentVerificationPage';
import { ImportRecoveryAccountsPage } from '@/pages/recovery/ImportRecoveryAccountsPage';

// Phase 6 — Transactions
import { DailyTransactionsPage } from '@/pages/transactions/DailyTransactionsPage';

// Phase 7 — HR Module (Staff Loans, Leaves, Offboarding, Resources, Employees)
import {
  MyStaffLoansPage,
  StaffLoanApplicationPage,
  StaffLoanDetailsPage,
  StaffLoansManagementPage,
} from '@/pages/hr/staff-loans';
import {
  MyLeavesPage,
  LeaveApplicationPage,
  LeaveDetailsPage,
  LeavesManagementPage,
} from '@/pages/hr/leaves';
import {
  MyOffboardingPage,
  OffboardingDetailsPage,
  OffboardingManagementPage,
} from '@/pages/hr/offboarding';
import { MyResourcesPage } from '@/pages/hr/resources';
import { EmployeesListPage, EmployeeDetailsPage } from '@/pages/hr/employees';
import { MyEmploymentPage } from '@/pages/hr/MyEmploymentPage';
import { HRDashboardPage } from '@/pages/hr/HRDashboardPage';

// Error pages
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';

export function AppRouter() {
  return (
    <Routes>
      {/* ── Landing page ──────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Public auth ───────────────────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login"                element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/auth/login"           element={<Navigate to="/login" replace />} />
        <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/auth/reset-password"  element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/auth/verify-email"    element={<VerifyEmailPage />} />
      </Route>

      {/* ── Protected app ─────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

        <Route path="/dashboard" element={<ProtectedRoute permission="dashboard:read"><DashboardPage /></ProtectedRoute>} />

        {/* Customers */}
        <Route path="/customers"          element={<ProtectedRoute permission="customers:read"><CustomersPage /></ProtectedRoute>} />
        <Route path="/customers/new"      element={<ProtectedRoute permission="customers:create"><NewCustomerPage /></ProtectedRoute>} />
        <Route path="/customers/:id"      element={<ProtectedRoute permission="customers:read"><Customer360Page /></ProtectedRoute>} />
        <Route path="/customers/:id/edit" element={<ProtectedRoute permission="customers:update"><CustomerEditPage /></ProtectedRoute>} />

        {/* Loans */}
        <Route path="/loans"     element={<ProtectedRoute permission="loan_applications:read"><LoansPage /></ProtectedRoute>} />
        <Route path="/loans/new" element={<ProtectedRoute permission="loan_applications:create"><NewLoanPage /></ProtectedRoute>} />
        <Route path="/loans/:id" element={<ProtectedRoute permission="loan_applications:read"><LoanDetailPage /></ProtectedRoute>} />

        {/* Operations */}
        <Route path="/compliance"        element={<ProtectedRoute permission="loan_applications:compliance_review"><CompliancePage /></ProtectedRoute>} />
        <Route path="/internal-control"  element={<ProtectedRoute permission="loan_applications:internal_control_approve"><InternalControlPage /></ProtectedRoute>} />
        <Route path="/collections"       element={<ProtectedRoute permission="loan_applications:record_repayment"><CollectionsPage /></ProtectedRoute>} />
        <Route path="/transactions"      element={<ProtectedRoute permission="loan_applications:record_repayment"><DailyTransactionsPage /></ProtectedRoute>} />
        <Route path="/transport"         element={<ProtectedRoute permission="loan_applications:read"><TransportPage /></ProtectedRoute>} />

        {/* Finance */}
        <Route path="/accounting"   element={<ProtectedRoute permission="loan_applications:disburse"><AccountingPage /></ProtectedRoute>} />
        <Route path="/accounting/reconciliation" element={<ProtectedRoute permission="loan_applications:disburse"><ReconciliationPage /></ProtectedRoute>} />
        <Route path="/accounting/missing-virtual-accounts" element={<ProtectedRoute permission="loan_applications:disburse"><MissingVirtualAccountsPage /></ProtectedRoute>} />
        <Route path="/reports"           element={<ProtectedRoute permission="reports:read"><ReportsPage /></ProtectedRoute>} />
        <Route path="/reports/location/:branchId" element={<ProtectedRoute permission="reports:read"><LocationDrilldownPage /></ProtectedRoute>} />
        <Route path="/performance"  element={<ProtectedRoute permission="dashboard:read"><PerformancePage /></ProtectedRoute>} />
        <Route path="/officer-targets" element={<ProtectedRoute permission="reports:read"><OfficerTargetsPage /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Recovery */}
        <Route path="/recovery" element={<ProtectedRoute permission="recovery:dashboard_view"><RecoveryDashboardPage /></ProtectedRoute>} />
        <Route path="/recovery/accounts" element={<ProtectedRoute permission="recovery:accounts_read"><RecoveryAccountsPage /></ProtectedRoute>} />
        <Route path="/recovery/accounts/new" element={<ProtectedRoute permission="recovery:accounts_create"><NewRecoveryAccountPage /></ProtectedRoute>} />
        <Route path="/recovery/accounts/:id" element={<ProtectedRoute permission="recovery:accounts_read"><RecoveryAccountDetailPage /></ProtectedRoute>} />
        <Route path="/recovery/my-accounts" element={<ProtectedRoute permission="recovery:accounts_read"><MyRecoveryAccountsPage /></ProtectedRoute>} />
        <Route path="/recovery/payments/verify" element={<ProtectedRoute permission="recovery:payments_verify"><PaymentVerificationPage /></ProtectedRoute>} />
        <Route path="/recovery/import" element={<ProtectedRoute permission="recovery:accounts_import"><ImportRecoveryAccountsPage /></ProtectedRoute>} />

        {/* HR Module */}
        <Route path="/hr" element={<ProtectedRoute permission="dashboard:read"><HRDashboardPage /></ProtectedRoute>} />
        
        {/* HR - My Employment (Self-service) */}
        <Route path="/hr/my-employment" element={<ProtectedRoute permission="dashboard:read"><MyEmploymentPage /></ProtectedRoute>} />
        
        {/* HR - Employees (HR staff only) */}
        <Route path="/hr/employees" element={<ProtectedRoute permission="employees:read"><EmployeesListPage /></ProtectedRoute>} />
        <Route path="/hr/employees/:userId" element={<ProtectedRoute permission="employees:read"><EmployeeDetailsPage /></ProtectedRoute>} />
        
        {/* HR - Staff Loans */}
        <Route path="/hr/staff-loans/my-loans" element={<ProtectedRoute permission="staff_loans:read"><MyStaffLoansPage /></ProtectedRoute>} />
        <Route path="/hr/staff-loans/apply" element={<ProtectedRoute permission="staff_loans:create"><StaffLoanApplicationPage /></ProtectedRoute>} />
        <Route path="/hr/staff-loans/:loanId" element={<ProtectedRoute permission="staff_loans:read"><StaffLoanDetailsPage /></ProtectedRoute>} />
        <Route path="/hr/staff-loans/management" element={<ProtectedRoute permission="users:read"><StaffLoansManagementPage /></ProtectedRoute>} />

        {/* HR - Leaves */}
        <Route path="/hr/leaves/my-applications" element={<ProtectedRoute permission="leaves:read"><MyLeavesPage /></ProtectedRoute>} />
        <Route path="/hr/leaves/apply" element={<ProtectedRoute permission="leaves:create"><LeaveApplicationPage /></ProtectedRoute>} />
        <Route path="/hr/leaves/:leaveId" element={<ProtectedRoute permission="leaves:read"><LeaveDetailsPage /></ProtectedRoute>} />
        <Route path="/hr/leaves/management" element={<ProtectedRoute permission="users:read"><LeavesManagementPage /></ProtectedRoute>} />

        {/* HR - Offboarding */}
        <Route path="/hr/offboarding/my-status" element={<ProtectedRoute permission="dashboard:read"><MyOffboardingPage /></ProtectedRoute>} />
        <Route path="/hr/offboarding/:offboardingId" element={<ProtectedRoute permission="offboarding:read"><OffboardingDetailsPage /></ProtectedRoute>} />
        <Route path="/hr/offboarding" element={<ProtectedRoute permission="offboarding:read"><OffboardingManagementPage /></ProtectedRoute>} />

        {/* HR - Resources */}
        <Route path="/hr/resources/my-resources" element={<ProtectedRoute permission="resources:read"><MyResourcesPage /></ProtectedRoute>} />

        {/* Administration */}
        <Route path="/users"       element={<ProtectedRoute permission="users:read"><UsersPage /></ProtectedRoute>} />
        <Route path="/branches"    element={<ProtectedRoute permission="branches:read"><BranchesPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute permission="departments:read"><DepartmentsPage /></ProtectedRoute>} />
        <Route path="/roles"       element={<ProtectedRoute permission="roles:read"><RolesPage /></ProtectedRoute>} />
        <Route path="/permissions" element={<ProtectedRoute permission="permissions:read"><PermissionsPage /></ProtectedRoute>} />
        <Route path="/audit"       element={<ProtectedRoute permission="audit:read"><AuditPage /></ProtectedRoute>} />
        <Route path="/audit/compliance" element={<ProtectedRoute permission="audit:read"><AuditCompliancePage /></ProtectedRoute>} />
        <Route path="/settings"    element={<ProtectedRoute permission="settings:read"><SettingsPage /></ProtectedRoute>} />

        {/* Admin config */}
        <Route path="/admin/loan-products" element={<ProtectedRoute permission="loan_products:read"><LoanProductsAdminPage /></ProtectedRoute>} />
        <Route path="/admin/workflows"     element={<ProtectedRoute permission="dashboard:read"><WorkflowsAdminPage /></ProtectedRoute>} />
        <Route path="/admin/forms"         element={<ProtectedRoute permission="forms:read"><FormEngineAdminPage /></ProtectedRoute>} />
      </Route>

      {/* Error pages */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*"    element={<NotFoundPage />} />
    </Routes>
  );
}
