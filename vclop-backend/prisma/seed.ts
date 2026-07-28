import { PrismaClient, PermissionCategory, SettingType, SettingScope, WidgetType, WidgetSize } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =============================================================================
// PERMISSION DEFINITIONS
// Every permission the system will ever need must live here.
// Format: <module>:<action>
// =============================================================================

const PERMISSIONS = [
  // ── User Management ─────────────────────────────────────────────────────────
  { code: 'users:read',              name: 'View Users',              category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'read' },
  { code: 'users:create',            name: 'Create Users',            category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'create' },
  { code: 'users:update',            name: 'Update Users',            category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'update' },
  { code: 'users:delete',            name: 'Delete Users',            category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'delete' },
  { code: 'users:restore',           name: 'Restore Users',           category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'restore' },
  { code: 'users:lock',              name: 'Lock / Unlock Users',     category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'lock' },
  { code: 'users:reset_password',    name: 'Reset User Password',     category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'reset_password' },
  { code: 'users:export',            name: 'Export Users',            category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'export' },
  { code: 'users:import',            name: 'Import Users',            category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'import' },
  { code: 'users:manage_permissions',name: 'Manage User Permissions', category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'manage_permissions' },
  { code: 'users:manage_roles',      name: 'Assign User Roles',       category: PermissionCategory.USER_MANAGEMENT,       module: 'users',       action: 'manage_roles' },

  // ── Role Management ──────────────────────────────────────────────────────────
  { code: 'roles:read',              name: 'View Roles',              category: PermissionCategory.ROLE_MANAGEMENT,       module: 'roles',       action: 'read' },
  { code: 'roles:create',            name: 'Create Roles',            category: PermissionCategory.ROLE_MANAGEMENT,       module: 'roles',       action: 'create' },
  { code: 'roles:update',            name: 'Update Roles',            category: PermissionCategory.ROLE_MANAGEMENT,       module: 'roles',       action: 'update' },
  { code: 'roles:delete',            name: 'Delete Roles',            category: PermissionCategory.ROLE_MANAGEMENT,       module: 'roles',       action: 'delete' },
  { code: 'roles:manage_permissions',name: 'Manage Role Permissions', category: PermissionCategory.ROLE_MANAGEMENT,       module: 'roles',       action: 'manage_permissions' },

  // ── Permission Management ─────────────────────────────────────────────────────
  { code: 'permissions:read',        name: 'View Permissions',        category: PermissionCategory.PERMISSION_MANAGEMENT, module: 'permissions', action: 'read' },
  { code: 'permissions:update',      name: 'Update Permissions',      category: PermissionCategory.PERMISSION_MANAGEMENT, module: 'permissions', action: 'update' },

  // ── Form Engine (VCLOP Phase 3) ─────────────────────────────────────────────────
  { code: 'forms:read',              name: 'View Form Templates',     category: PermissionCategory.FORMS_MANAGEMENT,      module: 'forms',       action: 'read' },
  { code: 'forms:create',            name: 'Create Form Templates',   category: PermissionCategory.FORMS_MANAGEMENT,      module: 'forms',       action: 'create' },
  { code: 'forms:update',            name: 'Edit Form Templates',     category: PermissionCategory.FORMS_MANAGEMENT,      module: 'forms',       action: 'update' },
  { code: 'forms:delete',            name: 'Delete Form Templates',   category: PermissionCategory.FORMS_MANAGEMENT,      module: 'forms',       action: 'delete' },
  { code: 'forms:submit',            name: 'Submit Form Data',        category: PermissionCategory.FORMS_MANAGEMENT,      module: 'forms',       action: 'submit' },

  // ── Customer Management (VCLOP Phase 3) ──────────────────────────────────────────
  { code: 'customers:read',          name: 'View Customers',          category: PermissionCategory.CUSTOMER_MANAGEMENT,   module: 'customers',   action: 'read' },
  { code: 'customers:create',        name: 'Register Customers',      category: PermissionCategory.CUSTOMER_MANAGEMENT,   module: 'customers',   action: 'create' },
  { code: 'customers:update',        name: 'Update Customers',        category: PermissionCategory.CUSTOMER_MANAGEMENT,   module: 'customers',   action: 'update' },
  { code: 'customers:delete',        name: 'Delete Customers',        category: PermissionCategory.CUSTOMER_MANAGEMENT,   module: 'customers',   action: 'delete' },
  { code: 'customers:manage',        name: 'Manage All Customers',    category: PermissionCategory.CUSTOMER_MANAGEMENT,   module: 'customers',   action: 'manage' },

  // ── Document Management (VCLOP Phase 3) ──────────────────────────────────────────
  { code: 'documents:read',          name: 'View Documents',          category: PermissionCategory.DOCUMENT_MANAGEMENT,   module: 'documents',   action: 'read' },
  { code: 'documents:upload',        name: 'Upload Documents',        category: PermissionCategory.DOCUMENT_MANAGEMENT,   module: 'documents',   action: 'upload' },
  { code: 'documents:verify',        name: 'Verify/Reject Documents', category: PermissionCategory.DOCUMENT_MANAGEMENT,   module: 'documents',   action: 'verify' },
  { code: 'documents:delete',        name: 'Delete Documents',        category: PermissionCategory.DOCUMENT_MANAGEMENT,   module: 'documents',   action: 'delete' },
  { code: 'documents:manage_types',  name: 'Manage Document Checklist', category: PermissionCategory.DOCUMENT_MANAGEMENT, module: 'documents',   action: 'manage_types' },

  // ── Loan Management (VCLOP Phase 4) ──────────────────────────────────────────────
  { code: 'loan_products:read',      name: 'View Loan Products',      category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-products', action: 'read' },
  { code: 'loan_products:create',    name: 'Create Loan Products',    category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-products', action: 'create' },
  { code: 'loan_products:update',    name: 'Update Loan Products',    category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-products', action: 'update' },
  { code: 'loan_products:delete',    name: 'Delete Loan Products',    category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-products', action: 'delete' },
  { code: 'loan_applications:read',            name: 'View Loan Applications',       category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'read' },
  { code: 'loan_applications:create',          name: 'Create Loan Applications',     category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'create' },
  { code: 'loan_applications:update',          name: 'Update Loan Applications',     category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'update' },
  { code: 'loan_applications:submit',          name: 'Submit Loan Applications',     category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'submit' },
  { code: 'loan_applications:review',          name: 'Approve/Reject Applications',  category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'review' },
  { code: 'loan_applications:compliance_review', name: 'Complete Compliance Review', category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'compliance_review' },
  { code: 'loan_applications:internal_control_approve', name: 'Approve Internal Control Review', category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'internal_control_approve' },
  { code: 'loan_applications:disburse',        name: 'Disburse Loans',               category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'disburse' },
  { code: 'loan_applications:record_repayment', name: 'Record Repayments',           category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'record_repayment' },

  // ── Virtual Accounts (VCLOP Phase 5) ─────────────────────────────────────────────
  { code: 'virtual_accounts:read',      name: 'View Virtual Accounts',        category: PermissionCategory.VIRTUAL_ACCOUNT_MANAGEMENT, module: 'virtual-accounts', action: 'read' },
  { code: 'virtual_accounts:reconcile', name: 'Resolve Unmatched Payments',   category: PermissionCategory.VIRTUAL_ACCOUNT_MANAGEMENT, module: 'virtual-accounts', action: 'reconcile' },
  { code: 'virtual_accounts:simulate',  name: 'Simulate Payments (Testing)',  category: PermissionCategory.VIRTUAL_ACCOUNT_MANAGEMENT, module: 'virtual-accounts', action: 'simulate' },

  // ── Branch Management ─────────────────────────────────────────────────────────
  { code: 'branches:read',           name: 'View Branches',           category: PermissionCategory.BRANCH_MANAGEMENT,     module: 'branches',    action: 'read' },
  { code: 'branches:create',         name: 'Create Branches',         category: PermissionCategory.BRANCH_MANAGEMENT,     module: 'branches',    action: 'create' },
  { code: 'branches:update',         name: 'Update Branches',         category: PermissionCategory.BRANCH_MANAGEMENT,     module: 'branches',    action: 'update' },
  { code: 'branches:delete',         name: 'Delete Branches',         category: PermissionCategory.BRANCH_MANAGEMENT,     module: 'branches',    action: 'delete' },

  // ── Department Management ─────────────────────────────────────────────────────
  { code: 'departments:read',        name: 'View Departments',        category: PermissionCategory.DEPARTMENT_MANAGEMENT, module: 'departments', action: 'read' },
  { code: 'departments:create',      name: 'Create Departments',      category: PermissionCategory.DEPARTMENT_MANAGEMENT, module: 'departments', action: 'create' },
  { code: 'departments:update',      name: 'Update Departments',      category: PermissionCategory.DEPARTMENT_MANAGEMENT, module: 'departments', action: 'update' },
  { code: 'departments:delete',      name: 'Delete Departments',      category: PermissionCategory.DEPARTMENT_MANAGEMENT, module: 'departments', action: 'delete' },

  // ── Settings ─────────────────────────────────────────────────────────────────
  { code: 'settings:read',           name: 'View Settings',           category: PermissionCategory.SETTINGS_MANAGEMENT,   module: 'settings',    action: 'read' },
  { code: 'settings:update',         name: 'Update Settings',         category: PermissionCategory.SETTINGS_MANAGEMENT,   module: 'settings',    action: 'update' },
  { code: 'settings:manage_system',  name: 'Manage System Settings',  category: PermissionCategory.SETTINGS_MANAGEMENT,   module: 'settings',    action: 'manage_system' },

  // ── Audit ─────────────────────────────────────────────────────────────────────
  { code: 'audit:read',              name: 'View Audit Logs',         category: PermissionCategory.AUDIT_MANAGEMENT,      module: 'audit',       action: 'read' },
  { code: 'audit:export',            name: 'Export Audit Logs',       category: PermissionCategory.AUDIT_MANAGEMENT,      module: 'audit',       action: 'export' },

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  { code: 'dashboard:read',          name: 'View Dashboard',          category: PermissionCategory.DASHBOARD_MANAGEMENT,  module: 'dashboard',   action: 'read' },
  { code: 'dashboard:customize',     name: 'Customize Dashboard',     category: PermissionCategory.DASHBOARD_MANAGEMENT,  module: 'dashboard',   action: 'customize' },
  { code: 'dashboard:manage_widgets',name: 'Manage Widgets',          category: PermissionCategory.DASHBOARD_MANAGEMENT,  module: 'dashboard',   action: 'manage_widgets' },

  // ── Reports ───────────────────────────────────────────────────────────────────
  { code: 'reports:read',            name: 'View Reports',            category: PermissionCategory.REPORT_MANAGEMENT,     module: 'reports',     action: 'read' },
  { code: 'reports:export',          name: 'Export Reports',          category: PermissionCategory.REPORT_MANAGEMENT,     module: 'reports',     action: 'export' },

  // ── Notifications ─────────────────────────────────────────────────────────────
  { code: 'notifications:read',      name: 'View Notifications',      category: PermissionCategory.NOTIFICATION_MANAGEMENT, module: 'notifications', action: 'read' },
  { code: 'notifications:manage_templates', name: 'Manage Notification Templates', category: PermissionCategory.NOTIFICATION_MANAGEMENT, module: 'notifications', action: 'manage_templates' },

  // ── System Administration ─────────────────────────────────────────────────────
  { code: 'system:admin',            name: 'System Administration',      category: PermissionCategory.SYSTEM_ADMINISTRATION, module: 'system',             action: 'admin' },
  { code: 'system:health',           name: 'View System Health',         category: PermissionCategory.SYSTEM_ADMINISTRATION, module: 'system',             action: 'health' },
  { code: 'transport:approve',       name: 'Approve Transport Requests', category: PermissionCategory.SYSTEM_ADMINISTRATION, module: 'transport',          action: 'approve' },
  { code: 'loan_applications:disburse_head', name: 'Disburse Loans (Accounting Head Only)', category: PermissionCategory.LOAN_MANAGEMENT, module: 'loan-applications', action: 'disburse_head' },
];

// =============================================================================
// SYSTEM SETTINGS
// =============================================================================

const SYSTEM_SETTINGS = [
  // Company
  { key: 'company.name',            value: 'Vertical Capital',           type: SettingType.STRING,  group: 'company',      label: 'Company Name',         isPublic: true },
  { key: 'company.legal_name',      value: 'Vertical Capital Inc.',      type: SettingType.STRING,  group: 'company',      label: 'Legal Name' },
  { key: 'company.tagline',         value: 'Lending made simple.',       type: SettingType.STRING,  group: 'company',      label: 'Tagline',              isPublic: true },
  { key: 'company.logo_path',       value: null,                         type: SettingType.URL,     group: 'company',      label: 'Logo URL',             isPublic: true },
  { key: 'company.address',         value: null,                         type: SettingType.TEXTAREA,group: 'company',      label: 'Address' },
  { key: 'company.phone',           value: null,                         type: SettingType.PHONE,   group: 'company',      label: 'Phone' },
  { key: 'company.email',           value: null,                         type: SettingType.EMAIL,   group: 'company',      label: 'Email' },
  { key: 'company.website',         value: null,                         type: SettingType.URL,     group: 'company',      label: 'Website',              isPublic: true },
  { key: 'company.tin',             value: null,                         type: SettingType.STRING,  group: 'company',      label: 'TIN' },
  { key: 'company.sec_number',      value: null,                         type: SettingType.STRING,  group: 'company',      label: 'SEC Number' },

  // Security
  { key: 'security.password_min_length',    value: '8',   type: SettingType.NUMBER,  group: 'security', label: 'Min Password Length' },
  { key: 'security.password_require_upper', value: 'true',type: SettingType.BOOLEAN, group: 'security', label: 'Require Uppercase' },
  { key: 'security.password_require_number',value: 'true',type: SettingType.BOOLEAN, group: 'security', label: 'Require Number' },
  { key: 'security.password_require_symbol',value: 'true',type: SettingType.BOOLEAN, group: 'security', label: 'Require Symbol' },
  { key: 'security.password_expire_days',   value: '90',  type: SettingType.NUMBER,  group: 'security', label: 'Password Expiry (days)' },
  { key: 'security.max_failed_logins',      value: '5',   type: SettingType.NUMBER,  group: 'security', label: 'Max Failed Login Attempts' },
  { key: 'security.lockout_minutes',        value: '30',  type: SettingType.NUMBER,  group: 'security', label: 'Lockout Duration (minutes)' },
  { key: 'security.session_timeout_minutes',value: '480', type: SettingType.NUMBER,  group: 'security', label: 'Session Timeout (minutes)' },
  { key: 'security.refresh_token_days',     value: '30',  type: SettingType.NUMBER,  group: 'security', label: 'Refresh Token Validity (days)' },
  { key: 'security.two_factor_required',    value: 'false',type: SettingType.BOOLEAN,group: 'security', label: 'Require 2FA' },

  // Pagination
  { key: 'pagination.default_limit', value: '25',  type: SettingType.NUMBER, group: 'system', label: 'Default Page Size' },
  { key: 'pagination.max_limit',     value: '200', type: SettingType.NUMBER, group: 'system', label: 'Max Page Size' },

  // Timezone / Locale
  { key: 'system.timezone',  value: 'Africa/Lagos', type: SettingType.STRING, group: 'system', label: 'System Timezone', isPublic: true },
  { key: 'system.locale',    value: 'en-NG',        type: SettingType.STRING, group: 'system', label: 'System Locale',   isPublic: true },
  { key: 'system.currency',  value: 'NGN',          type: SettingType.STRING, group: 'system', label: 'Currency Code',   isPublic: true },
  { key: 'system.date_format',value: 'DD/MM/YYYY',  type: SettingType.STRING, group: 'system', label: 'Date Format',     isPublic: true },

  // Performance
  { key: 'performance.weekly_allowance_per_million', value: '5000', type: SettingType.NUMBER, group: 'performance', label: 'Weekly Allowance per ₦1M Disbursed (₦)', isPublic: false },
];

// =============================================================================
// DEFAULT WIDGETS
// =============================================================================

const WIDGETS = [
  { code: 'active_users',        name: 'Active Users',          type: WidgetType.STAT_CARD,   size: WidgetSize.SMALL,  component: 'StatCard',       dataEndpoint: '/api/v1/dashboard/stats/active-users',    requiredPermission: 'users:read',    sortOrder: 1 },
  { code: 'total_branches',      name: 'Total Branches',        type: WidgetType.STAT_CARD,   size: WidgetSize.SMALL,  component: 'StatCard',       dataEndpoint: '/api/v1/dashboard/stats/total-branches',  requiredPermission: 'branches:read', sortOrder: 2 },
  { code: 'total_departments',   name: 'Total Departments',     type: WidgetType.STAT_CARD,   size: WidgetSize.SMALL,  component: 'StatCard',       dataEndpoint: '/api/v1/dashboard/stats/total-departments',requiredPermission: 'departments:read',sortOrder: 3 },
  { code: 'recent_audit_logs',   name: 'Recent Activity',       type: WidgetType.TABLE,       size: WidgetSize.WIDE,   component: 'AuditTable',     dataEndpoint: '/api/v1/dashboard/widgets/recent-audit',  requiredPermission: 'audit:read',    sortOrder: 4 },
  { code: 'user_status_chart',   name: 'User Status',           type: WidgetType.DONUT_CHART, size: WidgetSize.MEDIUM, component: 'DonutChart',     dataEndpoint: '/api/v1/dashboard/stats/user-status',     requiredPermission: 'users:read',    sortOrder: 5 },
  { code: 'login_activity_chart',name: 'Login Activity (7d)',   type: WidgetType.LINE_CHART,  size: WidgetSize.LARGE,  component: 'LineChart',      dataEndpoint: '/api/v1/dashboard/stats/login-activity',  requiredPermission: 'audit:read',    sortOrder: 6 },
  { code: 'system_health',       name: 'System Health',         type: WidgetType.STAT_CARD,   size: WidgetSize.MEDIUM, component: 'SystemHealth',   dataEndpoint: '/api/v1/dashboard/stats/health',          requiredPermission: 'system:health', sortOrder: 7 },
];

// =============================================================================
// SEED FUNCTION
// =============================================================================

async function main(): Promise<void> {
  console.log('🌱 Starting VCLOP seed...');

  // ── 1. Head Office Branch ───────────────────────────────────────────────────
  const headOffice = await prisma.branch.upsert({
    where: { code: 'HO-001' },
    update: {},
    create: {
      code: 'HO-001',
      name: 'Head Office',
      isHeadOffice: true,
      country: 'Nigeria',
      isActive: true,
    },
  });
  console.log(`✔  Branch: ${headOffice.name}`);

  // ── 1b. Operational Location Branches ──────────────────────────────────────
  const LOCATIONS = [
    { code: 'LOC-SURULERE',    name: 'Surulere' },
    { code: 'LOC-DALEMO',      name: 'Dalemo' },
    { code: 'LOC-OSHODI',      name: 'Oshodi' },
    { code: 'LOC-ISLAND1',     name: 'Island 1' },
    { code: 'LOC-ISLAND2',     name: 'Island 2' },
    { code: 'LOC-ISLAND3',     name: 'Island 3' },
    { code: 'LOC-OTA',         name: 'Ota' },
    { code: 'LOC-ORILE',       name: 'Orile / Ajegunle' },
  ];
  for (const loc of LOCATIONS) {
    await prisma.branch.upsert({
      where: { code: loc.code },
      update: { name: loc.name },
      create: { code: loc.code, name: loc.name, country: 'Nigeria', isActive: true, isHeadOffice: false },
    });
  }
  console.log(`✔  Location branches seeded (${LOCATIONS.length})`);

  // ── 2. Root Department ──────────────────────────────────────────────────────
  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      code: 'IT',
      name: 'Information Technology',
      description: 'Technology and Systems',
      isActive: true,
    },
  });
  console.log(`✔  Department: ${itDept.name}`);

  // ── 3. Permissions ──────────────────────────────────────────────────────────
  console.log(`   Seeding ${PERMISSIONS.length} permissions...`);
  for (const [i, perm] of PERMISSIONS.entries()) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category, module: perm.module, action: perm.action },
      create: { ...perm, isSystem: true, isActive: true, sortOrder: i + 1 },
    });
  }
  console.log(`✔  Permissions seeded`);

  // ── 4. System Administrator Role (all permissions) ──────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { code: 'SYSTEM_ADMIN' },
    update: {},
    create: {
      code: 'SYSTEM_ADMIN',
      name: 'System Administrator',
      description: 'Full system access — all permissions granted',
      isSystem: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  const allPermissions = await prisma.permission.findMany({ where: { isActive: true } });
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
  console.log(`✔  Role: ${adminRole.name} (${allPermissions.length} permissions)`);

  // ── Manager Role ─────────────────────────────────────────────────────────────
  const managerRole = await prisma.role.upsert({
    where: { code: 'MANAGER' },
    update: {},
    create: {
      code: 'MANAGER',
      name: 'Manager',
      description: 'Branch / Department manager with read-heavy access',
      isSystem: true,
      isActive: true,
      sortOrder: 2,
    },
  });

  const managerPermCodes = [
    'users:read', 'roles:read', 'permissions:read',
    'branches:read', 'departments:read',
    'settings:read', 'settings:update',
    'customers:read', 'customers:manage', 'documents:read',
    'forms:read',
    'loan_products:read', 'loan_applications:read',
    'audit:read', 'audit:export',
    'dashboard:read', 'dashboard:customize',
    'reports:read', 'reports:export',
    'notifications:read',
    'system:health',
  ];
  const managerPerms = await prisma.permission.findMany({ where: { code: { in: managerPermCodes } } });
  for (const perm of managerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: managerRole.id, permissionId: perm.id },
    });
  }
  console.log(`✔  Role: ${managerRole.name}`);

  // ── Staff Role ────────────────────────────────────────────────────────────────
  const staffRole = await prisma.role.upsert({
    where: { code: 'STAFF' },
    update: {},
    create: {
      code: 'STAFF',
      name: 'Staff',
      description: 'Standard staff with basic read access',
      isSystem: true,
      isActive: true,
      sortOrder: 3,
    },
  });

  const staffPermCodes = ['dashboard:read', 'notifications:read'];
  const staffPerms = await prisma.permission.findMany({ where: { code: { in: staffPermCodes } } });
  for (const perm of staffPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: staffRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: staffRole.id, permissionId: perm.id },
    });
  }
  console.log(`✔  Role: ${staffRole.name}`);

  // ── Operational Roles ────────────────────────────────────────────────────────
  const OPERATIONAL_ROLES: Array<{
    code: string; name: string; description: string; sortOrder: number; permCodes: string[];
  }> = [
    {
      code: 'LOAN_OFFICER',
      name: 'Loan Officer',
      description: 'Field staff who register customers and originate loan applications',
      sortOrder: 4,
      permCodes: [
        'dashboard:read', 'notifications:read',
        'customers:read', 'customers:create', 'customers:update',
        'documents:read', 'documents:upload',
        'forms:read', 'forms:submit',
        'loan_products:read',
        'loan_applications:read', 'loan_applications:create',
        'loan_applications:update', 'loan_applications:submit',
        'virtual_accounts:read',
        'reports:read',
      ],
    },
    {
      code: 'COMPLIANCE_OFFICER',
      name: 'Compliance Officer',
      description: 'Underwriter / Compliance — reviews applications, conducts field visits',
      sortOrder: 5,
      permCodes: [
        'dashboard:read', 'notifications:read',
        'customers:read', 'customers:update', 'customers:manage',
        'documents:read', 'documents:verify',
        'loan_products:read',
        'loan_applications:read', 'loan_applications:compliance_review',
        'virtual_accounts:read',
        'reports:read',
        'settings:read',
      ],
    },
    {
      code: 'INTERNAL_CONTROL',
      name: 'Internal Control',
      description: 'Internal control officer — second-level approval and transport request approval',
      sortOrder: 6,
      permCodes: [
        'dashboard:read', 'notifications:read',
        'customers:read', 'customers:manage',
        'documents:read',
        'loan_products:read',
        'loan_applications:read', 'loan_applications:internal_control_approve',
        'transport:approve',
        'audit:read',
        'reports:read',
      ],
    },
    {
      code: 'ACCOUNTANT',
      name: 'Accountant',
      description: 'Accounting staff — can view loans and virtual accounts but cannot disburse',
      sortOrder: 7,
      permCodes: [
        'dashboard:read', 'notifications:read',
        'customers:read',
        'loan_products:read',
        'loan_applications:read',
        'virtual_accounts:read', 'virtual_accounts:reconcile', 'virtual_accounts:simulate',
        'reports:read', 'reports:export',
      ],
    },
    {
      code: 'ACCOUNTING_HEAD',
      name: 'Accounting Head',
      description: 'Head of Accounting — only role that can disburse loans and pay transport allowances',
      sortOrder: 8,
      permCodes: [
        'dashboard:read', 'notifications:read',
        'customers:read',
        'loan_products:read',
        'loan_applications:read', 'loan_applications:disburse', 'loan_applications:disburse_head',
        'virtual_accounts:read', 'virtual_accounts:reconcile', 'virtual_accounts:simulate',
        'reports:read', 'reports:export',
        'audit:read',
      ],
    },
    {
      code: 'COLLECTIONS_OFFICER',
      name: 'Collections Officer',
      description: 'Collections — manages overdue loans and recovery activities',
      sortOrder: 9,
      permCodes: [
        'dashboard:read', 'notifications:read',
        'customers:read',
        'loan_applications:read', 'loan_applications:record_repayment',
        'virtual_accounts:read',
        'reports:read',
      ],
    },
  ];

  const operationalRoleMap: Record<string, string> = {};
  for (const roleDef of OPERATIONAL_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      update: { name: roleDef.name, description: roleDef.description },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
        isActive: true,
        sortOrder: roleDef.sortOrder,
      },
    });
    operationalRoleMap[roleDef.code] = role.id;
    const rolePerms = await prisma.permission.findMany({ where: { code: { in: roleDef.permCodes } } });
    for (const perm of rolePerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
    console.log(`✔  Role: ${role.name}`);
  }

  // ── Operational Departments ──────────────────────────────────────────────────
  const DEPARTMENTS = [
    { code: 'CREDIT',           name: 'Credit & Loans' },
    { code: 'COMPLIANCE',       name: 'Compliance & Underwriting' },
    { code: 'INTERNAL_CONTROL', name: 'Internal Control' },
    { code: 'ACCOUNTING',       name: 'Accounting & Finance' },
    { code: 'COLLECTIONS',      name: 'Collections & Recovery' },
    { code: 'OPERATIONS',       name: 'Operations' },
  ];
  const deptMap: Record<string, string> = {};
  for (const dept of DEPARTMENTS) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: { code: dept.code, name: dept.name, isActive: true },
    });
    deptMap[dept.code] = d.id;
  }
  console.log(`✔  Operational departments seeded`);

  const LOCATIONS_BY_CODE: Record<string, string> = {};
  const allBranches = await prisma.branch.findMany({ where: { deletedAt: null } });
  for (const b of allBranches) {
    LOCATIONS_BY_CODE[b.code] = b.id;
  }
  // Map demo users to their location branch (fall back to headOffice if not found)
  const DEMO_BRANCH_MAP: Record<string, string> = {
    'EMP-0002': LOCATIONS_BY_CODE['LOC-SURULERE'] ?? headOffice.id,   // Loan Officer
    'EMP-0003': LOCATIONS_BY_CODE['LOC-ISLAND1']  ?? headOffice.id,   // Compliance
    'EMP-0004': headOffice.id,                                          // IC — HQ
    'EMP-0005': LOCATIONS_BY_CODE['LOC-OSHODI']   ?? headOffice.id,   // Accountant
    'EMP-0006': headOffice.id,                                          // Accounting Head — HQ
    'EMP-0007': LOCATIONS_BY_CODE['LOC-SURULERE'] ?? headOffice.id,   // Collections
  };

  // ── Demo Users (one per operational role) ────────────────────────────────
  const demoPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345!', 12);

  const DEMO_USERS: Array<{
    employeeId: string; email: string; username: string;
    firstName: string; lastName: string; jobTitle: string;
    roleCode: string; deptCode: string;
  }> = [
    { employeeId: 'EMP-0002', email: 'officer@vclop.local',       username: 'officer',       firstName: 'John',    lastName: 'Okafor',   jobTitle: 'Loan Officer',             roleCode: 'LOAN_OFFICER',       deptCode: 'CREDIT' },
    { employeeId: 'EMP-0003', email: 'compliance@vclop.local',    username: 'compliance',    firstName: 'Amina',   lastName: 'Bello',    jobTitle: 'Compliance Officer',       roleCode: 'COMPLIANCE_OFFICER', deptCode: 'COMPLIANCE' },
    { employeeId: 'EMP-0004', email: 'control@vclop.local',       username: 'control',       firstName: 'Chukwudi',lastName: 'Nwosu',    jobTitle: 'Internal Control Officer', roleCode: 'INTERNAL_CONTROL',   deptCode: 'INTERNAL_CONTROL' },
    { employeeId: 'EMP-0005', email: 'accounting@vclop.local',    username: 'accounting',    firstName: 'Ngozi',   lastName: 'Eze',      jobTitle: 'Accountant',               roleCode: 'ACCOUNTANT',         deptCode: 'ACCOUNTING' },
    { employeeId: 'EMP-0006', email: 'accthead@vclop.local',      username: 'accthead',      firstName: 'Tunde',   lastName: 'Adeyemi',  jobTitle: 'Head of Accounting',       roleCode: 'ACCOUNTING_HEAD',    deptCode: 'ACCOUNTING' },
    { employeeId: 'EMP-0007', email: 'collections@vclop.local',   username: 'collections',   firstName: 'Emeka',   lastName: 'Obi',      jobTitle: 'Collections Officer',      roleCode: 'COLLECTIONS_OFFICER',deptCode: 'COLLECTIONS' },
  ];

  for (const u of DEMO_USERS) {
    const roleId = operationalRoleMap[u.roleCode]!;
    const deptId = deptMap[u.deptCode]!;
    const branchId = DEMO_BRANCH_MAP[u.employeeId] ?? headOffice.id;
    const user = await prisma.user.upsert({
      where: { employeeId: u.employeeId },
      update: {
        email: u.email,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        jobTitle: u.jobTitle,
        departmentId: deptId,
        branchId,
      },
      create: {
        employeeId: u.employeeId,
        email: u.email,
        username: u.username,
        passwordHash: demoPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        status: 'ACTIVE',
        departmentId: deptId,
        branchId,
        jobTitle: u.jobTitle,
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
    console.log(`✔  Demo user: ${u.email}  →  ${u.roleCode}`);

    // Seed a default monthly target for the loan officer
    if (u.roleCode === 'LOAN_OFFICER') {
      const targetKey = `performance.monthly_target.${user.id}`;
      const existingTarget = await prisma.setting.findFirst({ where: { key: targetKey, scope: SettingScope.SYSTEM, branchId: null } });
      if (!existingTarget) {
        await prisma.setting.create({
          data: {
            key: targetKey,
            value: '5000000',
            defaultValue: '5000000',
            type: SettingType.NUMBER,
            scope: SettingScope.SYSTEM,
            label: `Monthly disbursement target for ${u.firstName} ${u.lastName}`,
            group: 'performance',
            isPublic: false,
            isReadonly: false,
          },
        });
        console.log(`✔  Monthly target set for ${u.email}: ₦5,000,000`);
      }
    }
  }

  // ── 5. Super Admin User ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345!', 12);

  const adminUser = await prisma.user.upsert({
    where: { employeeId: 'EMP-0001' },
    update: {},
    create: {
      employeeId: 'EMP-0001',
      email: 'admin@vclop.local',
      username: 'admin',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      status: 'ACTIVE',
      departmentId: itDept.id,
      branchId: headOffice.id,
      jobTitle: 'System Administrator',
      emailVerifiedAt: new Date(),
      mustChangePassword: true,
    },
  });

  // Assign SYSTEM_ADMIN role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log(`✔  Admin user: ${adminUser.email}  (must change password on first login)`);

  // ── 6. System Settings ────────────────────────────────────────────────────────
  console.log(`   Seeding ${SYSTEM_SETTINGS.length} settings...`);
  for (const setting of SYSTEM_SETTINGS) {
  const existing = await prisma.setting.findFirst({
    where: {
      key: setting.key,
      scope: SettingScope.SYSTEM,
      branchId: null,
    },
  });

  if (existing) {
    await prisma.setting.update({
      where: { id: existing.id },
      data: {
        label: setting.label,
        value: setting.value ?? null,
        defaultValue: setting.value ?? null,
        type: setting.type,
        group: setting.group,
        isPublic: setting.isPublic ?? false,
      },
    });
  } else {
    await prisma.setting.create({
      data: {
        key: setting.key,
        value: setting.value ?? null,
        defaultValue: setting.value ?? null,
        type: setting.type,
        scope: SettingScope.SYSTEM,
        branchId: null,
        label: setting.label,
        group: setting.group,
        isPublic: setting.isPublic ?? false,
        isReadonly: false,
      },
    });
  }
}
  console.log(`✔  Settings seeded`);

  // ── 7. Default Widgets ────────────────────────────────────────────────────────
  console.log(`   Seeding ${WIDGETS.length} widgets...`);
  for (const widget of WIDGETS) {
    await prisma.widget.upsert({
      where: { code: widget.code },
      update: { name: widget.name },
      create: { ...widget, isSystem: true, isActive: true },
    });
  }
  console.log(`✔  Widgets seeded`);

  // ── 8. Default Customer Form Template (VCLOP Phase 3 Form Engine) ──────────────
  const existingCustomerForm = await prisma.formTemplate.findFirst({ where: { code: 'customer-onboarding-default' } });
  if (!existingCustomerForm) {
    await prisma.formTemplate.create({
      data: {
        entityType: 'CUSTOMER',
        code: 'customer-onboarding-default',
        name: 'Customer Onboarding — Additional Details',
        description: 'Collected after core registration: employment, income and next of kin.',
        isDefault: true,
        isActive: true,
        sections: {
          create: [
            {
              title: 'Employment & Income',
              sortOrder: 0,
              fields: {
                create: [
                  { code: 'employer_name', label: 'Employer Name', type: 'TEXT', sortOrder: 0 },
                  {
                    code: 'employment_type', label: 'Employment Type', type: 'DROPDOWN', sortOrder: 1,
                    options: [
                      { label: 'Employed', value: 'EMPLOYED' },
                      { label: 'Self-Employed', value: 'SELF_EMPLOYED' },
                      { label: 'Business Owner', value: 'BUSINESS_OWNER' },
                      { label: 'Unemployed', value: 'UNEMPLOYED' },
                    ],
                  },
                  { code: 'monthly_income', label: 'Monthly Income', type: 'MONEY', sortOrder: 2 },
                ],
              },
            },
            {
              title: 'Next of Kin',
              sortOrder: 1,
              fields: {
                create: [
                  { code: 'nok_name', label: 'Full Name', type: 'TEXT', isRequired: true, sortOrder: 0 },
                  { code: 'nok_relationship', label: 'Relationship', type: 'TEXT', isRequired: true, sortOrder: 1 },
                  { code: 'nok_phone', label: 'Phone Number', type: 'PHONE', isRequired: true, sortOrder: 2 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✔  Default Customer form template seeded');
  }

  // ── 9. Default Document Checklist ───────────────────────────────────────────────
  const DOCUMENT_TYPES = [
    { code: 'passport_photo', name: 'Passport Photograph', isRequiredDefault: true },
    { code: 'selfie', name: 'Selfie', isRequiredDefault: true },
    { code: 'nin_slip', name: 'NIN Slip', isRequiredDefault: true },
    { code: 'utility_bill', name: 'Utility Bill', isRequiredDefault: true, expiryApplicable: true },
    { code: 'cac_certificate', name: 'CAC Certificate', appliesTo: 'BUSINESS' as const, isRequiredDefault: false },
  ];
  for (const docType of DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { code: docType.code },
      update: {},
      create: docType,
    });
  }
  console.log(`✔  Document checklist seeded`);

  // ── 10. Default Loan Products (VCLOP Phase 4) ───────────────────────────────────
  const LOAN_PRODUCTS = [
    {
      code: 'quick-cash-30',
      name: 'Quick Cash (30 Days)',
      description: 'Short-term flat-rate loan for salaried customers.',
      minAmount: 10000,
      maxAmount: 300000,
      minTenureDays: 7,
      maxTenureDays: 30,
      interestType: 'FLAT' as const,
      interestRate: 10,
      repaymentFrequency: 'WEEKLY' as const,
      requiresGuarantor: false,
      requiresCollateral: false,
    },
    {
      code: 'business-growth-90',
      name: 'Business Growth Loan (90 Days)',
      description: 'Reducing-balance loan for registered business customers, requires a guarantor.',
      minAmount: 100000,
      maxAmount: 2000000,
      minTenureDays: 30,
      maxTenureDays: 90,
      interestType: 'REDUCING_BALANCE' as const,
      interestRate: 18,
      repaymentFrequency: 'MONTHLY' as const,
      requiresGuarantor: true,
      requiresCollateral: false,
    },
  ];
  for (const product of LOAN_PRODUCTS) {
    await prisma.loanProduct.upsert({ where: { code: product.code }, update: {}, create: product });
  }

  // Admins can edit this definition and every stage/transition without a deployment.
  const loanWorkflow = await prisma.workflowDefinition.upsert({
    where: { code: 'loan-application-production' }, update: { isActive: true },
    create: { code: 'loan-application-production', name: 'Production Loan Application Workflow', entityType: 'LOAN_APPLICATION', isActive: true,
      stages: { create: [
        { code: 'COMPLIANCE_REVIEW', name: 'Underwriter / Compliance Review', sortOrder: 1, isInitial: true, requiredPermission: 'loan_applications:compliance_review', departmentCode: 'COMPLIANCE', slaHours: 24 },
        { code: 'INTERNAL_CONTROL_REVIEW', name: 'Internal Control Review', sortOrder: 2, requiredPermission: 'loan_applications:internal_control_approve', departmentCode: 'INTERNAL_CONTROL', slaHours: 24 },
        { code: 'ACCOUNTING_REVIEW', name: 'Accounting Disbursement Review', sortOrder: 3, requiredPermission: 'loan_applications:disburse', departmentCode: 'ACCOUNTING', slaHours: 12 },
        { code: 'APPROVED', name: 'Approved for Disbursement', sortOrder: 4, isTerminal: true },
        { code: 'REJECTED', name: 'Rejected', sortOrder: 5, isTerminal: true },
      ] },
    }, include: { stages: true },
  });
  await Promise.all([
    ['COMPLIANCE_REVIEW', 'loan_applications:compliance_review'],
    ['INTERNAL_CONTROL_REVIEW', 'loan_applications:internal_control_approve'],
    ['ACCOUNTING_REVIEW', 'loan_applications:disburse'],
  ].map(([code, requiredPermission]) => prisma.workflowStage.updateMany({
    where: { workflowDefinitionId: loanWorkflow.id, code }, data: { requiredPermission },
  })));
  const stageId = Object.fromEntries(loanWorkflow.stages.map((stage) => [stage.code, stage.id]));
  const workflowTransitions: Array<[string, string, string, boolean]> = [
    ['COMPLIANCE_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'APPROVE', false], ['COMPLIANCE_REVIEW', 'REJECTED', 'REJECT', true],
    ['INTERNAL_CONTROL_REVIEW', 'ACCOUNTING_REVIEW', 'APPROVE', false], ['INTERNAL_CONTROL_REVIEW', 'REJECTED', 'REJECT', true], ['INTERNAL_CONTROL_REVIEW', 'COMPLIANCE_REVIEW', 'RETURN', true],
    ['ACCOUNTING_REVIEW', 'APPROVED', 'APPROVE', false], ['ACCOUNTING_REVIEW', 'REJECTED', 'REJECT', true], ['ACCOUNTING_REVIEW', 'INTERNAL_CONTROL_REVIEW', 'RETURN', true],
  ];
  await prisma.workflowTransition.createMany({ skipDuplicates: true, data: workflowTransitions.map(([from, to, action, requiresReason]) => ({ fromStageId: stageId[from]!, toStageId: stageId[to]!, action: action as any, requiresReason })) });
  console.log(`✔  Loan products seeded`);

  console.log('\n✅ VCLOP seed complete.\n');
  console.log('   ── Login credentials (all share the same password) ──────────────');
  console.log(`   Password for all: ${process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345!'}`);
  console.log('');
  console.log('   admin@vclop.local        →  System Administrator (full access)');
  console.log('   officer@vclop.local      →  Loan Officer');
  console.log('   compliance@vclop.local   →  Compliance Officer');
  console.log('   control@vclop.local      →  Internal Control Officer');
  console.log('   accounting@vclop.local   →  Accountant (view only, cannot disburse)');
  console.log('   accthead@vclop.local     →  Accounting Head (disburses loans + pays transport)');
  console.log('   collections@vclop.local  →  Collections Officer');
  console.log('');
  console.log('   ⚠  All users must change password on first login.\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
