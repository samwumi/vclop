import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

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
import { InternalControlPage } from '@/pages/internal-control/InternalControlPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { LocationDrilldownPage } from '@/pages/reports/LocationDrilldownPage';

// Error pages
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── Public auth ───────────────────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
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
        <Route path="/transport"         element={<ProtectedRoute permission="loan_applications:read"><TransportPage /></ProtectedRoute>} />

        {/* Finance */}
        <Route path="/accounting"   element={<ProtectedRoute permission="loan_applications:disburse"><AccountingPage /></ProtectedRoute>} />
        <Route path="/reports"           element={<ProtectedRoute permission="reports:read"><ReportsPage /></ProtectedRoute>} />
        <Route path="/reports/location/:branchId" element={<ProtectedRoute permission="reports:read"><LocationDrilldownPage /></ProtectedRoute>} />
        <Route path="/performance"  element={<ProtectedRoute permission="dashboard:read"><PerformancePage /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

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
