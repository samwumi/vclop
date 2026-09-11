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
  { code: 'system:admin',            name: 'System Administration',   category: PermissionCategory.SYSTEM_ADMINISTRATION, module: 'system',      action: 'admin' },
  { code: 'system:health',           name: 'View System Health',      category: PermissionCategory.SYSTEM_ADMINISTRATION, module: 'system',      action: 'health' },
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
  { key: 'system.timezone',  value: 'Asia/Manila', type: SettingType.STRING, group: 'system', label: 'System Timezone', isPublic: true },
  { key: 'system.locale',    value: 'en-PH',       type: SettingType.STRING, group: 'system', label: 'System Locale',   isPublic: true },
  { key: 'system.currency',  value: 'PHP',         type: SettingType.STRING, group: 'system', label: 'Currency Code',   isPublic: true },
  { key: 'system.date_format',value: 'MM/DD/YYYY', type: SettingType.STRING, group: 'system', label: 'Date Format',     isPublic: true },
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
      country: 'Philippines',
      isActive: true,
    },
  });
  console.log(`✔  Branch: ${headOffice.name}`);

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
    'settings:read',
    'customers:read', 'documents:read',
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

  // ── 5. Super Admin User ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vclop.local' },
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
    where: { code: 'loan-application-production' }, update: {},
    create: { code: 'loan-application-production', name: 'Production Loan Application Workflow', entityType: 'LOAN_APPLICATION',
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

  // ── 11. Email Notification Templates ─────────────────────────────────────────────
  const EMAIL_TEMPLATES = [
    {
      code: 'email-verification',
      name: 'Email Verification',
      event: 'auth.email_verification',
      channel: 'EMAIL' as const,
      subject: 'Verify your VCLOP account',
      bodyHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">VCLOP</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Lending made simple</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome, {{firstName}}!</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Thank you for registering with VCLOP. To complete your account setup and start using our services, please verify your email address by clicking the button below.
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="{{verifyLink}}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #f8f8f8; border-radius: 4px; word-break: break-all;">
                <a href="{{verifyLink}}" style="color: #667eea; text-decoration: none; font-size: 13px;">{{verifyLink}}</a>
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  <strong>Note:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
                <p style="margin: 12px 0 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  If you didn't create an account with VCLOP, please ignore this email or contact our support team.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #8a8a8a; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Hi {{firstName}},

Thank you for registering with VCLOP. Please verify your email address by clicking the link below:

{{verifyLink}}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with VCLOP, please ignore this email.

Best regards,
VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.`,
      variables: { firstName: 'User first name', verifyLink: 'Email verification URL', year: 'Current year' },
    },
    {
      code: 'password-reset',
      name: 'Password Reset',
      event: 'auth.password_reset',
      channel: 'EMAIL' as const,
      subject: 'Reset your VCLOP password',
      bodyHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">VCLOP</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Lending made simple</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your VCLOP account. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="{{resetLink}}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Reset Password</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #f8f8f8; border-radius: 4px; word-break: break-all;">
                <a href="{{resetLink}}" style="color: #667eea; text-decoration: none; font-size: 13px;">{{resetLink}}</a>
              </p>
              
              <div style="margin-top: 32px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⏱ Important:</strong> This password reset link will expire in {{expiresIn}}.
                </p>
              </div>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  <strong>Didn't request a password reset?</strong>
                </p>
                <p style="margin: 8px 0 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged. For security concerns, please contact our support team immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #8a8a8a; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Hi {{firstName}},

We received a request to reset your password for your VCLOP account.

To reset your password, click the link below:

{{resetLink}}

⏱ This password reset link will expire in {{expiresIn}}.

DIDN'T REQUEST A PASSWORD RESET?
If you didn't request this password reset, please ignore this email. Your password will remain unchanged. For security concerns, please contact our support team immediately.

Best regards,
VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.`,
      variables: { firstName: 'User first name', resetLink: 'Password reset URL', expiresIn: 'Link expiry duration', year: 'Current year' },
    },
    {
      code: 'password-change-otp',
      name: 'Password Change OTP',
      event: 'auth.password_change_otp',
      channel: 'EMAIL' as const,
      subject: 'Your VCLOP Password Change OTP',
      bodyHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Change OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">VCLOP</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Lending made simple</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Password Change OTP</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                You requested to change your password. Use this One-Time Password (OTP) to complete the process:
              </p>
              
              <!-- OTP Display -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="display: inline-block; padding: 30px 60px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border: 3px dashed #667eea;">
                      <p style="margin: 0; font-size: 48px; font-weight: 700; color: #667eea; letter-spacing: 12px; font-family: 'Courier New', monospace;">{{otp}}</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 32px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⏱ Important:</strong> This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.
                </p>
              </div>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  <strong>Didn't request a password change?</strong>
                </p>
                <p style="margin: 8px 0 0; color: #6b6b6b; font-size: 13px; line-height: 1.6;">
                  If you didn't initiate this request, please ignore this email and ensure your account is secure. Consider changing your password if you suspect unauthorized access.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #8a8a8a; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Hi {{firstName}},

You requested to change your password. Use this One-Time Password (OTP) to complete the process:

OTP: {{otp}}

⏱ This OTP is valid for {{expiresIn}} only. Do not share this code with anyone.

DIDN'T REQUEST A PASSWORD CHANGE?
If you didn't initiate this request, please ignore this email and ensure your account is secure. Consider changing your password if you suspect unauthorized access.

Best regards,
VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.`,
      variables: { firstName: 'User first name', otp: '6-digit OTP code', expiresIn: 'OTP expiry duration', year: 'Current year' },
    },
    {
      code: 'password-changed-notification',
      name: 'Password Changed Notification',
      event: 'auth.password_changed_notification',
      channel: 'EMAIL' as const,
      subject: 'Your VCLOP password was changed',
      bodyHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">VCLOP</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Lending made simple</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background-color: #d4edda; border-radius: 50%; padding: 12px;">
                  <span style="font-size: 40px;">✓</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">Password Changed Successfully</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                This is to confirm that your VCLOP account password was successfully changed on <strong>{{changedAt}}</strong>.
              </p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Security Notice:</strong> All active sessions on other devices have been logged out. You'll need to log in again with your new password.
                </p>
              </div>
              
              <div style="margin-top: 32px; padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; border-radius: 4px;">
                <p style="margin: 0; color: #721c24; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Didn't make this change?</strong>
                </p>
                <p style="margin: 8px 0 0; color: #721c24; font-size: 13px; line-height: 1.6;">
                  If you did not change your password, please contact our support team immediately to secure your account.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #8a8a8a; font-size: 13px;">
                © {{year}} Vertical Capital. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #8a8a8a; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      bodyText: `Hi {{firstName}},

This is to confirm that your VCLOP account password was successfully changed on {{changedAt}}.

🔒 SECURITY NOTICE:
All active sessions on other devices have been logged out. You'll need to log in again with your new password.

⚠️ DIDN'T MAKE THIS CHANGE?
If you did not change your password, please contact our support team immediately to secure your account.

Best regards,
VCLOP Team

© {{year}} Vertical Capital. All rights reserved.
This is an automated message, please do not reply to this email.`,
      variables: { firstName: 'User first name', changedAt: 'Timestamp of password change', ipAddress: 'IP address (optional)', year: 'Current year' },
    },
  ];

  console.log(`   Seeding ${EMAIL_TEMPLATES.length} email templates...`);
  for (const template of EMAIL_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        event: template.event,
        channel: template.channel,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
        isActive: true,
      },
      create: {
        code: template.code,
        name: template.name,
        event: template.event,
        channel: template.channel,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        variables: template.variables,
        isActive: true,
      },
    });
  }
  console.log(`✔  Email templates seeded`);

  // ── 12. Loan Product Document Requirements ───────────────────────────────────────
  console.log('   Seeding loan product document requirements...');
  
  // Fetch loan products and document types
  const quickCashProduct = await prisma.loanProduct.findUnique({ where: { code: 'quick-cash-30' } });
  const businessGrowthProduct = await prisma.loanProduct.findUnique({ where: { code: 'business-growth-90' } });
  
  const passportPhotoDoc = await prisma.documentType.findUnique({ where: { code: 'passport_photo' } });
  const selfieDoc = await prisma.documentType.findUnique({ where: { code: 'selfie' } });
  const ninSlipDoc = await prisma.documentType.findUnique({ where: { code: 'nin_slip' } });
  const utilityBillDoc = await prisma.documentType.findUnique({ where: { code: 'utility_bill' } });
  const cacCertDoc = await prisma.documentType.findUnique({ where: { code: 'cac_certificate' } });

  if (quickCashProduct && passportPhotoDoc && selfieDoc && ninSlipDoc) {
    // Quick Cash (30 Days) - Basic Requirements
    const quickCashRequirements = [
      { loanProductId: quickCashProduct.id, documentTypeId: ninSlipDoc.id, isRequired: true },
      { loanProductId: quickCashProduct.id, documentTypeId: passportPhotoDoc.id, isRequired: true },
      { loanProductId: quickCashProduct.id, documentTypeId: selfieDoc.id, isRequired: true },
    ];

    for (const req of quickCashRequirements) {
      await prisma.loanProductDocumentRequirement.upsert({
        where: { loanProductId_documentTypeId: { loanProductId: req.loanProductId, documentTypeId: req.documentTypeId } },
        update: { isRequired: req.isRequired },
        create: req,
      });
    }
    console.log(`✔  Quick Cash: 3 required documents configured`);
  }

  if (businessGrowthProduct && passportPhotoDoc && selfieDoc && ninSlipDoc && utilityBillDoc && cacCertDoc) {
    // Business Growth Loan (90 Days) - Stricter Requirements
    const businessGrowthRequirements = [
      { loanProductId: businessGrowthProduct.id, documentTypeId: ninSlipDoc.id, isRequired: true },
      { loanProductId: businessGrowthProduct.id, documentTypeId: cacCertDoc.id, isRequired: true },
      { loanProductId: businessGrowthProduct.id, documentTypeId: passportPhotoDoc.id, isRequired: true },
      { loanProductId: businessGrowthProduct.id, documentTypeId: utilityBillDoc.id, isRequired: true },
      { loanProductId: businessGrowthProduct.id, documentTypeId: selfieDoc.id, isRequired: true },
    ];

    for (const req of businessGrowthRequirements) {
      await prisma.loanProductDocumentRequirement.upsert({
        where: { loanProductId_documentTypeId: { loanProductId: req.loanProductId, documentTypeId: req.documentTypeId } },
        update: { isRequired: req.isRequired },
        create: req,
      });
    }
    console.log(`✔  Business Growth: 5 required documents configured`);
  }

  console.log(`✔  Loan product document requirements seeded`);

  console.log('\n✅ VCLOP seed complete.\n');
  console.log('   Admin login:');
  console.log(`   Email    : admin@vclop.local`);
  console.log(`   Password : ${process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345!'}`);
  console.log('   ⚠  Change this password immediately after first login.\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
