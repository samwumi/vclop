/**
 * Central route definition — single source of truth for sidebar + router.
 * Every entry declares the permission code needed to see it.
 * hidden=true means the route exists but is not shown in the sidebar.
 */

import {
  LayoutDashboard, Users, FileText, ShieldCheck, ShieldAlert, BookOpen,
  TrendingDown, BarChart2, Settings, GitBranch, Building2,
  Layers, Key, ScrollText, Package, GitMerge, Car, Target, HandCoins,
  DollarSign, Briefcase, ArrowDownUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RouteConfig {
  path: string;
  label: string;
  icon: LucideIcon;
  permission?: string;        // user must have this permission
  anyPermission?: string[];   // user must have ANY ONE of these permissions
  group?: string;
  hidden?: boolean;
}

export const APP_ROUTES: RouteConfig[] = [
  // ── Main ───────────────────────────────────────────────────────────────────
  { path: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, permission: 'dashboard:read',  group: 'Main' },

  // ── Operations ─────────────────────────────────────────────────────────────
  { path: '/customers',  label: 'Customers',   icon: Users,           permission: 'customers:read',  group: 'Operations' },
  { path: '/loans',      label: 'Loans',       icon: FileText,        permission: 'loan_applications:read', group: 'Operations' },
  { path: '/compliance',        label: 'Compliance',       icon: ShieldCheck,  permission: 'loan_applications:compliance_review',        group: 'Operations' },
  { path: '/internal-control',  label: 'Internal Control', icon: ShieldAlert,  permission: 'loan_applications:internal_control_approve', group: 'Operations' },
  { path: '/collections',       label: 'Collections',      icon: TrendingDown, permission: 'loan_applications:record_repayment',          group: 'Operations' },
  { path: '/transactions',      label: 'Daily Transactions', icon: ArrowDownUp,  permission: 'loan_applications:record_repayment',          group: 'Operations' },
  { path: '/transport',         label: 'Transport',        icon: Car,          anyPermission: ['loan_applications:compliance_review', 'transport:approve', 'loan_applications:disburse_head'], group: 'Operations' },
  { path: '/performance',       label: 'My Performance',   icon: Target,       permission: 'dashboard:read',                              group: 'Operations' },
  { path: '/officer-targets',   label: 'Officer Targets',  icon: Target,       permission: 'reports:read',                                group: 'Operations' },

  // ── HR & Staff ─────────────────────────────────────────────────────────────
  { path: '/hr/staff-loans/my-loans', label: 'My Loans', icon: DollarSign, permission: 'dashboard:read', group: 'HR & Staff' },
  
  // hidden staff loan sub-routes
  { path: '/hr/staff-loans/apply',      label: 'Apply for Loan',      icon: DollarSign, hidden: true },
  { path: '/hr/staff-loans/:loanId',    label: 'Loan Details',        icon: DollarSign, hidden: true },
  { path: '/hr/staff-loans/management', label: 'Staff Loans Admin',   icon: Briefcase,  permission: 'users:read', hidden: true },

  // hidden sub-routes — exist in router but not shown in sidebar
  { path: '/customers/new', label: 'New Customer', icon: Users,    hidden: true },
  { path: '/customers/:id', label: 'Customer 360', icon: Users,    hidden: true },
  { path: '/loans/new',     label: 'New Loan',     icon: FileText, hidden: true },
  { path: '/loans/:id',     label: 'Loan Detail',  icon: FileText, hidden: true },

  // ── Finance ────────────────────────────────────────────────────────────────
  { path: '/accounting', label: 'Accounting',  icon: BookOpen, permission: 'loan_applications:disburse', group: 'Finance' },
  { path: '/reports',    label: 'Reports',     icon: BarChart2, permission: 'reports:read', group: 'Finance' },

  // ── Recovery ───────────────────────────────────────────────────────────────
  { path: '/recovery',                label: 'Recovery',             icon: HandCoins, permission: 'recovery:dashboard_view',  group: 'Recovery' },
  { path: '/recovery/accounts',       label: 'Recovery Accounts',    icon: HandCoins, permission: 'recovery:accounts_read',   group: 'Recovery' },
  { path: '/recovery/my-accounts',    label: 'My Accounts',          icon: HandCoins, permission: 'recovery:accounts_read',   group: 'Recovery' },
  { path: '/recovery/payments/verify', label: 'Verify Payments',     icon: HandCoins, permission: 'recovery:payments_verify', group: 'Recovery' },
  { path: '/recovery/import',         label: 'Import Accounts',      icon: HandCoins, permission: 'recovery:accounts_import', group: 'Recovery' },
  
  // hidden recovery sub-routes
  { path: '/recovery/accounts/:id', label: 'Account Detail', icon: HandCoins, hidden: true },

  // ── Administration ─────────────────────────────────────────────────────────
  { path: '/users',       label: 'Users',        icon: Users,      permission: 'users:read',       group: 'Administration' },
  { path: '/branches',    label: 'Branches',     icon: GitBranch,  permission: 'branches:read',    group: 'Administration' },
  { path: '/departments', label: 'Departments',  icon: Building2,  permission: 'departments:read', group: 'Administration' },
  { path: '/roles',       label: 'Roles',        icon: Layers,     permission: 'roles:read',       group: 'Administration' },
  { path: '/permissions', label: 'Permissions',  icon: Key,        permission: 'permissions:read', group: 'Administration' },
  { path: '/audit',       label: 'Audit Logs',   icon: ScrollText, permission: 'audit:read',       group: 'Administration' },
  { path: '/settings',    label: 'Settings',     icon: Settings,   permission: 'settings:read',    group: 'Administration' },

  // ── Admin Config ───────────────────────────────────────────────────────────
  { path: '/admin/loan-products', label: 'Loan Products', icon: Package,   permission: 'loan_products:update', group: 'Admin Config' },
  { path: '/admin/workflows',     label: 'Workflows',     icon: GitMerge,  permission: 'settings:update',      group: 'Admin Config' },
  { path: '/admin/forms',         label: 'Form Engine',   icon: FileText,  permission: 'forms:update',         group: 'Admin Config' },
];
