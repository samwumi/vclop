// ── User ──────────────────────────────────────────────────────────────────────
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'LOCKED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  id: string;
  employeeId: string | null;
  email: string;
  phone: string | null;
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  avatarPath: string | null;
  status: UserStatus;
  branchId: string | null;
  departmentId: string | null;
  supervisorId: string | null;
  jobTitle: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string } | null;
  department?: { id: string; name: string; code: string } | null;
  roles?: Array<{ id: string; name: string; code: string }>;
}

// ── Role ──────────────────────────────────────────────────────────────────────
export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  rolePermissions?: Array<{ permission: Permission }>;
  _count?: { userRoles: number; rolePermissions: number };
}

// ── Permission ────────────────────────────────────────────────────────────────
export type PermissionCategory =
  | 'USER_MANAGEMENT' | 'ROLE_MANAGEMENT' | 'PERMISSION_MANAGEMENT'
  | 'BRANCH_MANAGEMENT' | 'DEPARTMENT_MANAGEMENT' | 'SETTINGS_MANAGEMENT'
  | 'AUDIT_MANAGEMENT' | 'DASHBOARD_MANAGEMENT' | 'REPORT_MANAGEMENT'
  | 'NOTIFICATION_MANAGEMENT' | 'SYSTEM_ADMINISTRATION';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: PermissionCategory;
  module: string;
  action: string;
  isSystem: boolean;
  isActive: boolean;
}

// ── Branch ────────────────────────────────────────────────────────────────────
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  managerName: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { users: number };
}

// ── Department ────────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  parent?: { id: string; name: string; code: string } | null;
  children?: Array<{ id: string; name: string; code: string }>;
  _count?: { users: number };
}

// ── Setting ───────────────────────────────────────────────────────────────────
export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE' | 'EMAIL' | 'URL' | 'PHONE' | 'COLOR' | 'TEXTAREA';
export type SettingScope = 'SYSTEM' | 'BRANCH' | 'USER';

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  defaultValue: string | null;
  type: SettingType;
  scope: SettingScope;
  label: string;
  description: string | null;
  group: string;
  isPublic: boolean;
  isReadonly: boolean;
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  action: string;
  module: string;
  subModule: string | null;
  entityId: string | null;
  entityType: string | null;
  description: string | null;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  isSuccess: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string; avatarPath: string | null } | null;
}

// ── Dashboard / Widget ────────────────────────────────────────────────────────
export type WidgetType = 'STAT_CARD' | 'LINE_CHART' | 'BAR_CHART' | 'PIE_CHART' | 'DONUT_CHART' | 'TABLE' | 'LIST' | 'CALENDAR' | 'MAP' | 'CUSTOM';
export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'WIDE' | 'FULL';

export interface Widget {
  id: string;
  code: string;
  name: string;
  type: WidgetType;
  size: WidgetSize;
  component: string;
  dataEndpoint: string | null;
  refreshInterval: number | null;
  requiredPermission: string | null;
  defaultConfig: unknown;
  isActive: boolean;
}

export interface DashboardLayoutItem {
  id: string;
  widgetId: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  config: unknown;
  widget: Widget;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  items: DashboardLayoutItem[];
}

// =============================================================================
// PHASE 2 TYPES
// =============================================================================

export type CustomerStatus = 'PROSPECT' | 'REGISTERED' | 'KYC_PENDING' | 'KYC_VERIFIED' | 'ELIGIBLE' | 'INELIGIBLE' | 'BLACKLISTED';
export type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'MANUAL_REVIEW';

export interface CustomerType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { customers: number };
}

export interface Customer {
  id: string;
  customerNumber: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  status: CustomerStatus;
  firstName: string;
  lastName: string;
  middleName: string | null;
  businessName: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  bvn: string | null;
  nin: string | null;
  residentialAddress: string | null;
  businessAddress: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  branchId: string | null;
  assignedOfficerId: string | null;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  documentTypeId: string;
  fileKey: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  rejectionReason: string | null;
  expiryDate: string | null;
  uploadedById: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  createdAt: string;
  documentType?: { id: string; code: string; name: string };
}

export interface CustomerTimelineEntry {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface Customer360 {
  profile: Customer;
  documents: CustomerDocument[];
  formData: { id: string; isComplete: boolean; values: Record<string, unknown> } | null;
  timeline: CustomerTimelineEntry[];
}

export type LoanApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'COMPLIANCE_REVIEW' | 'AWAITING_INFORMATION' | 'INTERNAL_CONTROL_REVIEW' | 'ACCOUNTING_REVIEW' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED' | 'DISBURSED' | 'CANCELLED';
export type LoanStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'WRITTEN_OFF';
export type InstallmentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type InterestType = 'FLAT' | 'REDUCING_BALANCE';
export type RepaymentFrequencyType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  minAmount: number;
  maxAmount: number;
  minTenureDays: number;
  maxTenureDays: number;
  interestType: InterestType;
  interestRate: number;
  repaymentFrequency: RepaymentFrequencyType;
  gracePeriodDays: number;
  lateFeeAmount: number;
  penaltyRate: number;
  processingFeeRate: number;
  insuranceRate: number;
  requiresGuarantor: boolean;
  requiresCollateral: boolean;
  isActive: boolean;
  documentRequirements?: { id: string; documentTypeId: string; isRequired: boolean; documentType?: { id: string; name: string } }[];
}

export interface Guarantor {
  id: string;
  loanApplicationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  relationship: string | null;
  createdAt: string;
}

export interface Collateral {
  id: string;
  loanApplicationId: string;
  description: string;
  estimatedValue: number | null;
  createdAt: string;
}

export interface RepaymentInstallment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  amountPaid: number;
  status: InstallmentStatus;
  paidAt: string | null;
}

export interface RepaymentTransaction {
  id: string;
  loanId: string;
  receiptNumber: string | null;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export type VirtualAccountProviderType = 'LOCAL' | 'PAYSTACK' | 'PROVIDUS' | 'MONNIFY' | 'FLUTTERWAVE' | 'WEMA';
export type VirtualAccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type VirtualAccountTransactionStatus = 'MATCHED' | 'UNMATCHED' | 'RECONCILED';

export interface VirtualAccountTransaction {
  id: string;
  virtualAccountId: string | null;
  targetAccountNumber: string;
  provider: VirtualAccountProviderType;
  providerReference: string;
  amount: number;
  currency: string;
  payerName: string | null;
  payerAccountNumber: string | null;
  narration: string | null;
  status: VirtualAccountTransactionStatus;
  repaymentTransactionId: string | null;
  receivedAt: string;
  createdAt: string;
}

export interface VirtualAccount {
  id: string;
  loanId: string;
  customerId: string;
  provider: VirtualAccountProviderType;
  accountNumber: string;
  accountName: string;
  bankName: string;
  status: VirtualAccountStatus;
  createdAt: string;
  transactions?: VirtualAccountTransaction[];
  loan?: { loanNumber: string; status: LoanStatus; loanApplicationId: string };
}

export interface Loan {
  id: string;
  loanNumber: string;
  loanApplicationId: string;
  customerId: string;
  loanProductId: string;
  principal: number;
  interestRate: number;
  interestType: InterestType;
  tenureDays: number;
  totalRepayable: number;
  status: LoanStatus;
  disbursedAt: string;
  completedAt: string | null;
  installments: RepaymentInstallment[];
  transactions: RepaymentTransaction[];
}

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  customerId: string;
  loanProductId: string;
  amount: number;
  tenureDays: number;
  purpose: string | null;
  status: LoanApplicationStatus;
  submittedById: string | null;
  submittedAt: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<Customer, 'id' | 'customerNumber' | 'firstName' | 'lastName' | 'phone' | 'status'>;
  loanProduct?: Pick<LoanProduct, 'id' | 'code' | 'name' | 'interestType' | 'interestRate'>;
  guarantors?: Guarantor[];
  collaterals?: Collateral[];
  loan?: Loan | null;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  stages: WorkflowStage[];
}

export interface WorkflowStage {
  id: string;
  workflowId: string;
  code: string;
  name: string;
  stageType: string;
  sortOrder: number;
  assignedRoleCode: string | null;
  isFinal: boolean;
  notifyOnEntry: boolean;
  requiredPermission: string | null;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  hasExpiryDate: boolean;
  allowedFileTypes: string[] | null;
  maxFileSizeMb: number;
  requiresVerification: boolean;
  isActive: boolean;
  sortOrder: number;
}
