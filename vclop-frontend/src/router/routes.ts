/**
 * Central route definition — single source of truth for sidebar + router.
 * Every entry declares the permission code needed to see it.
 * hidden=true means the route exists but is not shown in the sidebar.
 */

import {
  LayoutDashboard, Users, FileText, ShieldCheck, ShieldAlert, BookOpen,
  TrendingDown, BarChart2, Settings, GitBranch, Building2,
  Layers, Key, ScrollText, Package, GitMerge, Car, Target,
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
  { path: '/transport',         label: 'Transport',        icon: Car,          anyPermission: ['loan_applications:compliance_review', 'transport:approve', 'loan_applications:disburse_head'], group: 'Operations' },
  { path: '/performance',       label: 'My Performance',   icon: Target,       permission: 'dashboard:read',                              group: 'Operations' },

  // hidden sub-routes — exist in router but not shown in sidebar
  { path: '/customers/new', label: 'New Customer', icon: Users,    hidden: true },
  { path: '/customers/:id', label: 'Customer 360', icon: Users,    hidden: true },
  { path: '/loans/new',     label: 'New Loan',     icon: FileText, hidden: true },
  { path: '/loans/:id',     label: 'Loan Detail',  icon: FileText, hidden: true },

  // ── Finance ────────────────────────────────────────────────────────────────
  { path: '/accounting', label: 'Accounting',  icon: BookOpen, permission: 'loan_applications:disburse', group: 'Finance' },
  { path: '/reports',    label: 'Reports',     icon: BarChart2, permission: 'reports:read', group: 'Finance' },

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
