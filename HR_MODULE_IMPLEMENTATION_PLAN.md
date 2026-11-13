# HR & Employee Self-Service Module - Implementation Plan

## Executive Summary

This document outlines the comprehensive plan for integrating an HR & Employee Self-Service Module into VCLOP. The module will handle leave management, staff loans, responsibility management, and employee handovers while maintaining full integration with existing VCLOP operations.

---

## 1. Current Architecture Analysis

### 1.1 Existing Infrastructure
- **Database**: MySQL/MariaDB with Prisma ORM
- **Backend**: NestJS with modular architecture
- **Frontend**: React with TypeScript, React Query, React Router
- **Authentication**: JWT-based with role/permission system
- **UI Components**: Reusable ModulePage, forms, tables, badges
- **Existing Modules**: 26 modules including users, branches, departments, audit, workflows

### 1.2 Existing User Management
✅ User table with:
- Employee ID, personal details, department, branch, supervisor
- Status management (ACTIVE, INACTIVE, SUSPENDED, etc.)
- Role and permission system
- Branch and department assignments
- Supervisor hierarchy

### 1.3 Key Integration Points
- **User accounts**: Reuse existing User model
- **Audit system**: Existing AuditLog for tracking
- **Permissions**: Extend existing Permission system
- **Workflows**: Potentially leverage existing workflow engine
- **Notifications**: Existing notification system

---

## 2. Database Schema Design

### 2.1 New Tables

#### A. Leave Management

```prisma
model LeaveType {
  id                  String              @id @default(uuid())
  code                String              @unique // ANNUAL, SICK, MATERNITY, etc.
  name                String              // "Annual Leave", "Sick Leave"
  description         String?
  defaultDaysPerYear  Int                 // Default entitlement
  requiresApproval    Boolean             @default(true)
  requiresDocument    Boolean             @default(false) // Medical cert, etc.
  maxConsecutiveDays  Int?                // Max days in a row
  canBeCarriedOver    Boolean             @default(false)
  isActive            Boolean             @default(true)
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  leaveEntitlements   LeaveEntitlement[]
  leaveApplications   LeaveApplication[]
  
  @@map("leave_types")
}

model LeaveEntitlement {
  id               String    @id @default(uuid())
  userId           String
  leaveTypeId      String
  year             Int       // Fiscal year
  totalDays        Decimal   @db.Decimal(5, 2) // Support half days
  usedDays         Decimal   @default(0) @db.Decimal(5, 2)
  pendingDays      Decimal   @default(0) @db.Decimal(5, 2)
  remainingDays    Decimal   @db.Decimal(5, 2) // Computed field
  carriedOverDays  Decimal   @default(0) @db.Decimal(5, 2)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  user             User      @relation(fields: [userId], references: [id])
  leaveType        LeaveType @relation(fields: [leaveTypeId], references: [id])
  
  @@unique([userId, leaveTypeId, year])
  @@index([userId])
  @@index([leaveTypeId])
  @@index([year])
  @@map("leave_entitlements")
}

model LeaveApplication {
  id                  String                    @id @default(uuid())
  applicationNumber   String                    @unique
  userId              String                    // Employee applying
  leaveTypeId         String
  startDate           DateTime                  @db.Date
  endDate             DateTime                  @db.Date
  totalDays           Decimal                   @db.Decimal(5, 2)
  reason              String?                   @db.Text
  emergencyContact    String?                   // Phone during leave
  status              LeaveApplicationStatus    @default(PENDING)
  submittedAt         DateTime                  @default(now())
  reviewedAt          DateTime?
  reviewedById        String?
  reviewerComment     String?                   @db.Text
  rejectionReason     String?                   @db.Text
  cancelledAt         DateTime?
  cancelledById       String?
  cancellationReason  String?                   @db.Text
  documentPath        String?                   // Supporting docs
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt
  user                User                      @relation("LeaveApplicant", fields: [userId], references: [id])
  leaveType           LeaveType                 @relation(fields: [leaveTypeId], references: [id])
  reviewer            User?                     @relation("LeaveReviewer", fields: [reviewedById], references: [id])
  canceller           User?                     @relation("LeaveCanceller", fields: [cancelledById], references: [id])
  handovers           ResponsibilityHandover[]
  
  @@index([userId])
  @@index([leaveTypeId])
  @@index([status])
  @@index([startDate])
  @@index([endDate])
  @@map("leave_applications")
}

enum LeaveApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  COMPLETED // After return date
}

#### B. Staff Loans

```prisma
model StaffLoanType {
  id                  String          @id @default(uuid())
  code                String          @unique // EMERGENCY, SALARY_ADVANCE, etc.
  name                String
  description         String?
  maxAmount           Decimal         @db.Decimal(15, 2)
  interestRate        Decimal         @db.Decimal(5, 2) // Annual %
  maxTenureMonths     Int
  requiresGuarantor   Boolean         @default(false)
  isActive            Boolean         @default(true)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  staffLoanApplications StaffLoanApplication[]
  
  @@map("staff_loan_types")
}

model StaffLoanApplication {
  id                  String                    @id @default(uuid())
  applicationNumber   String                    @unique
  userId              String                    // Employee applying
  loanTypeId          String
  requestedAmount     Decimal                   @db.Decimal(15, 2)
  approvedAmount      Decimal?                  @db.Decimal(15, 2)
  tenureMonths        Int
  purpose             String                    @db.Text
  guarantorName       String?
  guarantorPhone      String?
  guarantorRelation   String?
  status              StaffLoanStatus           @default(PENDING)
  submittedAt         DateTime                  @default(now())
  reviewedAt          DateTime?
  reviewedById        String?
  reviewerComment     String?                   @db.Text
  rejectionReason     String?                   @db.Text
  disbursedAt         DateTime?
  disbursedById       String?
  disbursementMethod  String?                   // BANK_TRANSFER, CASH, CHEQUE
  disbursementRef     String?
  monthlyRepayment    Decimal?                  @db.Decimal(15, 2)
  totalRepayable      Decimal?                  @db.Decimal(15, 2)
  totalRepaid         Decimal                   @default(0) @db.Decimal(15, 2)
  outstandingBalance  Decimal?                  @db.Decimal(15, 2)
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt
  user                User                      @relation("StaffLoanApplicant", fields: [userId], references: [id])
  loanType            StaffLoanType             @relation(fields: [loanTypeId], references: [id])
  reviewer            User?                     @relation("StaffLoanReviewer", fields: [reviewedById], references: [id])
  disburser           User?                     @relation("StaffLoanDisburser", fields: [disbursedById], references: [id])
  repayments          StaffLoanRepayment[]
  
  @@index([userId])
  @@index([loanTypeId])
  @@index([status])
  @@map("staff_loan_applications")
}

enum StaffLoanStatus {
  PENDING
  APPROVED
  REJECTED
  DISBURSED
  ACTIVE // Being repaid
  FULLY_REPAID
  DEFAULTED
  WRITTEN_OFF
}

model StaffLoanRepayment {
  id              String                @id @default(uuid())
  loanId          String
  amount          Decimal               @db.Decimal(15, 2)
  paymentDate     DateTime              @db.Date
  paymentMethod   String                // SALARY_DEDUCTION, BANK_TRANSFER
  reference       String?
  notes           String?               @db.Text
  recordedById    String
  createdAt       DateTime              @default(now())
  loan            StaffLoanApplication  @relation(fields: [loanId], references: [id])
  recordedBy      User                  @relation("RepaymentRecorder", fields: [recordedById], references: [id])
  
  @@index([loanId])
  @@index([paymentDate])
  @@map("staff_loan_repayments")
}

#### C. Responsibility Management

```prisma
model EmployeeResponsibility {
  id                String                  @id @default(uuid())
  userId            String
  responsibilityType ResponsibilityType
  resourceType      String                  // CUSTOMER, LOAN_APPLICATION, RECOVERY_ACCOUNT
  resourceId        String
  assignedAt        DateTime                @default(now())
  assignedById      String?
  notes             String?                 @db.Text
  isActive          Boolean                 @default(true)
  deactivatedAt     DateTime?
  deactivatedById   String?
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
  user              User                    @relation("ResponsibilityHolder", fields: [userId], references: [id])
  assigner          User?                   @relation("ResponsibilityAssigner", fields: [assignedById], references: [id])
  deactivator       User?                   @relation("ResponsibilityDeactivator", fields: [deactivatedById], references: [id])
  handovers         ResponsibilityHandover[]
  
  @@unique([userId, resourceType, resourceId, isActive])
  @@index([userId])
  @@index([resourceType])
  @@index([resourceId])
  @@index([isActive])
  @@map("employee_responsibilities")
}

enum ResponsibilityType {
  PRIMARY // Main owner
  BACKUP  // Backup/support
  TEMPORARY // During handover
}

model ResponsibilityHandover {
  id                    String                  @id @default(uuid())
  fromUserId            String                  // Original owner
  toUserId              String                  // Temporary/new owner
  responsibilityId      String?                 // Specific responsibility
  handoverType          HandoverType
  reason                String                  // LEAVE, RESIGNATION, TERMINATION, REALLOCATION
  startDate             DateTime                @db.Date
  endDate               DateTime?               @db.Date // Null for permanent
  leaveApplicationId    String?                 // If due to leave
  status                HandoverStatus          @default(PENDING)
  handoverNotes         String?                 @db.Text // Handover details
  acceptedAt            DateTime?
  acceptedById          String?
  rejectedAt            DateTime?
  rejectedById          String?
  rejectionReason       String?                 @db.Text
  completedAt           DateTime?
  returnNotes           String?                 @db.Text // Notes on return
  createdAt             DateTime                @default(now())
  updatedAt             DateTime                @updatedAt
  fromUser              User                    @relation("HandoverFrom", fields: [fromUserId], references: [id])
  toUser                User                    @relation("HandoverTo", fields: [toUserId], references: [id])
  responsibility        EmployeeResponsibility? @relation(fields: [responsibilityId], references: [id])
  leaveApplication      LeaveApplication?       @relation(fields: [leaveApplicationId], references: [id])
  acceptor              User?                   @relation("HandoverAcceptor", fields: [acceptedById], references: [id])
  rejector              User?                   @relation("HandoverRejector", fields: [rejectedById], references: [id])
  
  @@index([fromUserId])
  @@index([toUserId])
  @@index([status])
  @@index([startDate])
  @@index([endDate])
  @@map("responsibility_handovers")
}

enum HandoverType {
  TEMPORARY // Leave
  PERMANENT // Resignation/termination/reallocation
}

enum HandoverStatus {
  PENDING
  ACCEPTED
  REJECTED
  ACTIVE
  COMPLETED
  REVERTED // If employee returns early
}

#### D. Employee Offboarding

```prisma
model EmployeeOffboarding {
  id                    String              @id @default(uuid())
  userId                String              @unique
  offboardingType       OffboardingType     // RESIGNATION, TERMINATION, RETIREMENT
  initiatedAt           DateTime            @default(now())
  initiatedById         String
  effectiveDate         DateTime            @db.Date // Last working day
  reason                String?             @db.Text
  exitInterviewDate     DateTime?           @db.Date
  exitInterviewNotes    String?             @db.Text
  clearanceStatus       ClearanceStatus     @default(PENDING)
  assetsClearedAt       DateTime?
  documentsClearedAt    DateTime?
  financialClearedAt    DateTime?
  itAccessRevokedAt     DateTime?
  finalSettlementPaid   Boolean             @default(false)
  finalSettlementAmount Decimal?            @db.Decimal(15, 2)
  completedAt           DateTime?
  completedById         String?
  notes                 String?             @db.Text
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  user                  User                @relation("OffboardingEmployee", fields: [userId], references: [id])
  initiator             User                @relation("OffboardingInitiator", fields: [initiatedById], references: [id])
  completer             User?               @relation("OffboardingCompleter", fields: [completedById], references: [id])
  
  @@index([userId])
  @@index([clearanceStatus])
  @@index([effectiveDate])
  @@map("employee_offboardings")
}

enum OffboardingType {
  RESIGNATION
  TERMINATION
  RETIREMENT
  CONTRACT_END
}

enum ClearanceStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}
```

### 2.2 Required User Relations

Add to existing User model:
```prisma
// Leave Management
leaveApplications       LeaveApplication[]    @relation("LeaveApplicant")
leaveReviews            LeaveApplication[]    @relation("LeaveReviewer")
leaveCancellations      LeaveApplication[]    @relation("LeaveCanceller")
leaveEntitlements       LeaveEntitlement[]

// Staff Loans
staffLoanApplications   StaffLoanApplication[] @relation("StaffLoanApplicant")
staffLoanReviews        StaffLoanApplication[] @relation("StaffLoanReviewer")
staffLoanDisbursements  StaffLoanApplication[] @relation("StaffLoanDisburser")
staffLoanRepayments     StaffLoanRepayment[]   @relation("RepaymentRecorder")

// Responsibilities
responsibilities        EmployeeResponsibility[] @relation("ResponsibilityHolder")
responsibilitiesAssigned EmployeeResponsibility[] @relation("ResponsibilityAssigner")
responsibilitiesDeactivated EmployeeResponsibility[] @relation("ResponsibilityDeactivator")

// Handovers
handoversFrom           ResponsibilityHandover[] @relation("HandoverFrom")
handoversTo             ResponsibilityHandover[] @relation("HandoverTo")
handoversAccepted       ResponsibilityHandover[] @relation("HandoverAcceptor")
handoversRejected       ResponsibilityHandover[] @relation("HandoverRejector")

// Offboarding
offboarding             EmployeeOffboarding?    @relation("OffboardingEmployee")
offboardingsInitiated   EmployeeOffboarding[]   @relation("OffboardingInitiator")
offboardingsCompleted   EmployeeOffboarding[]   @relation("OffboardingCompleter")
```

### 2.3 Permission Categories

Add to PermissionCategory enum:
```prisma
LEAVE_MANAGEMENT
STAFF_LOAN_MANAGEMENT
HR_MANAGEMENT
RESPONSIBILITY_MANAGEMENT
```

---

## 3. Backend Implementation

### 3.1 New Modules Structure

```
src/modules/
├── hr/
│   ├── hr.module.ts
│   ├── hr.controller.ts
│   ├── hr.service.ts
│   └── dto/
│       ├── create-leave-type.dto.ts
│       ├── update-leave-type.dto.ts
│       └── query-leave-types.dto.ts
├── leave/
│   ├── leave.module.ts
│   ├── leave.controller.ts
│   ├── leave.service.ts
│   └── dto/
│       ├── create-leave-application.dto.ts
│       ├── review-leave-application.dto.ts
│       └── query-leave-applications.dto.ts
├── staff-loans/
│   ├── staff-loans.module.ts
│   ├── staff-loans.controller.ts
│   ├── staff-loans.service.ts
│   └── dto/
│       ├── create-staff-loan-application.dto.ts
│       ├── review-staff-loan.dto.ts
│       └── disburse-staff-loan.dto.ts
├── responsibilities/
│   ├── responsibilities.module.ts
│   ├── responsibilities.controller.ts
│   ├── responsibilities.service.ts
│   └── dto/
│       ├── assign-responsibility.dto.ts
│       ├── create-handover.dto.ts
│       └── review-handover.dto.ts
└── offboarding/
    ├── offboarding.module.ts
    ├── offboarding.controller.ts
    ├── offboarding.service.ts
    └── dto/
        ├── initiate-offboarding.dto.ts
        └── update-clearance.dto.ts
```

### 3.2 Key Service Methods

#### LeaveService
- `applyForLeave()` - Employee submits leave
- `reviewLeaveApplication()` - Manager/HR approves/rejects
- `cancelLeaveApplication()` - Employee cancels
- `getMyLeaveApplications()` - Employee view
- `getPendingLeaveApplications()` - Manager/HR view
- `getLeaveBalance()` - Check entitlement
- `updateLeaveEntitlement()` - HR adjusts entitlement

#### StaffLoansService
- `applyForStaffLoan()` - Employee submits
- `reviewStaffLoanApplication()` - HR/Finance review
- `disburseStaffLoan()` - Finance disburses
- `recordRepayment()` - Record monthly deduction
- `getMyStaffLoans()` - Employee view
- `getPendingStaffLoans()` - HR view
- `getActiveStaffLoans()` - Finance view

#### ResponsibilitiesService
- `assignResponsibility()` - Assign resource to employee
- `getMyResponsibilities()` - Employee view
- `createHandover()` - Initiate handover (leave/exit)
- `acceptHandover()` - Receiver accepts
- `rejectHandover()` - Receiver rejects
- `completeHandover()` - Mark as completed
- `revertHandover()` - Employee returns early
- `getMyHandovers()` - View handovers
- `identifyOrphanedResponsibilities()` - Find unassigned work

#### OffboardingService
- `initiateOffboarding()` - Start offboarding process
- `updateClearanceStatus()` - Update clearance checklist
- `revokeSystemAccess()` - Disable VCLOP account
- `processFinalsettlement()` - Calculate final pay
- `completeOffboarding()` - Mark complete

### 3.3 Integration Points

#### With Customers Module
- Track customer assignments as responsibilities
- Handover customer portfolios
- Update `assignedOfficerId` when reassigning

#### With Loan Applications Module
- Track loan officer assignments
- Handover loan pipeline
- Update `assignedToId` when reassigning

#### With Recovery Module
- Track recovery account assignments
- Handover recovery accounts
- Update `assignedOfficerId` when reassigning

#### With Workflows Module
- Potentially create approval workflows for:
  - Leave applications
  - Staff loans
  - Handover acceptance

---

## 4. Frontend Implementation

### 4.1 New Pages

```
src/pages/
├── hr/
│   ├── HRDashboardPage.tsx
│   ├── LeaveTypesPage.tsx
│   ├── NewLeaveTypePage.tsx
│   ├── LeaveEntitlementsPage.tsx
│   ├── StaffLoanTypesPage.tsx
│   └── NewStaffLoanTypePage.tsx
├── leave/
│   ├── MyLeavePage.tsx // Employee view
│   ├── NewLeaveApplicationPage.tsx
│   ├── LeaveApplicationDetailPage.tsx
│   ├── LeaveReviewPage.tsx // Manager/HR view
│   └── LeaveCalendarPage.tsx // Team calendar
├── staff-loans/
│   ├── MyStaffLoansPage.tsx // Employee view
│   ├── NewStaffLoanApplicationPage.tsx
│   ├── StaffLoanDetailPage.tsx
│   ├── StaffLoanReviewPage.tsx // HR view
│   └── StaffLoanDisbursementPage.tsx // Finance view
├── responsibilities/
│   ├── MyResponsibilitiesPage.tsx
│   ├── ResponsibilityAssignmentPage.tsx // Manager/HR
│   ├── HandoversPage.tsx
│   ├── CreateHandoverPage.tsx
│   └── HandoverDetailPage.tsx
└── offboarding/
    ├── OffboardingListPage.tsx
    ├── InitiateOffboardingPage.tsx
    └── OffboardingDetailPage.tsx
```

### 4.2 Navigation Integration

Add to sidebar navigation:
```typescript
// For employees
{
  label: 'My Leave',
  icon: Calendar,
  path: '/leave/my',
  permission: 'leave:apply'
}
{
  label: 'My Staff Loans',
  icon: DollarSign,
  path: '/staff-loans/my',
  permission: 'staff_loans:apply'
}
{
  label: 'My Responsibilities',
  icon: Briefcase,
  path: '/responsibilities/my',
  permission: 'responsibilities:view_own'
}

// For HR/Managers
{
  label: 'HR',
  icon: Users,
  children: [
    { label: 'Dashboard', path: '/hr/dashboard', permission: 'hr:dashboard' },
    { label: 'Leave Requests', path: '/leave/review', permission: 'leave:review' },
    { label: 'Staff Loans', path: '/staff-loans/review', permission: 'staff_loans:review' },
    { label: 'Responsibilities', path: '/responsibilities', permission: 'responsibilities:manage' },
    { label: 'Offboarding', path: '/offboarding', permission: 'offboarding:manage' },
  ]
}
```

### 4.3 Reusable Components

Create:
- `LeaveApplicationCard` - Display leave info
- `LeaveBalanceWidget` - Show remaining days
- `StaffLoanCard` - Display loan info
- `ResponsibilityCard` - Display assignments
- `HandoverCard` - Display handover details
- `OffboardingChecklist` - Clearance checklist

### 4.4 Dashboard Widgets

Add to employee dashboard:
- **Leave Balance Summary** - Remaining days by type
- **Upcoming Leave** - Approved leave dates
- **Pending Applications** - Leave/loans awaiting review
- **Handovers** - Active handovers to/from user
- **My Responsibilities** - Quick count

Add to HR dashboard:
- **Pending Leave Requests** - Count and list
- **Pending Staff Loans** - Count and list
- **Upcoming Leave** - Team calendar view
- **Active Handovers** - Current handovers
- **Offboarding In Progress** - Count

---

## 5. Permissions Structure

### 5.1 Leave Management Permissions

```typescript
// Employee permissions
'leave:view_own' - View own leave applications
'leave:apply' - Apply for leave
'leave:cancel_own' - Cancel own pending application

// Manager permissions
'leave:view_team' - View team leave applications
'leave:review' - Approve/reject leave applications

// HR permissions
'leave:view_all' - View all leave applications
'leave:manage_types' - Manage leave types
'leave:manage_entitlements' - Adjust entitlements
'leave:override_balance' - Approve beyond entitlement
'leave:reports' - Generate leave reports
```

### 5.2 Staff Loan Permissions

```typescript
// Employee permissions
'staff_loans:view_own' - View own loans
'staff_loans:apply' - Apply for staff loan

// HR/Finance permissions
'staff_loans:view_all' - View all staff loans
'staff_loans:review' - Approve/reject applications
'staff_loans:disburse' - Disburse approved loans
'staff_loans:record_payment' - Record repayments
'staff_loans:manage_types' - Manage loan types
'staff_loans:reports' - Generate loan reports
```

### 5.3 Responsibility Management Permissions

```typescript
// Employee permissions
'responsibilities:view_own' - View own responsibilities
'responsibilities:accept_handover' - Accept handover
'responsibilities:reject_handover' - Reject handover

// Manager permissions
'responsibilities:view_team' - View team responsibilities
'responsibilities:assign' - Assign responsibilities
'responsibilities:create_handover' - Create handovers

// HR permissions
'responsibilities:view_all' - View all responsibilities
'responsibilities:manage' - Full management
'responsibilities:reassign' - Reassign from inactive users
```

### 5.4 Offboarding Permissions

```typescript
'offboarding:view' - View offboarding records
'offboarding:initiate' - Start offboarding process
'offboarding:manage' - Full offboarding management
'offboarding:clearance_assets' - Clear assets
'offboarding:clearance_documents' - Clear documents
'offboarding:clearance_financial' - Clear financial
'offboarding:clearance_it' - Revoke IT access
'offboarding:complete' - Mark offboarding complete
```

---

## 6. Workflows & Business Logic

### 6.1 Leave Application Workflow

```
1. Employee applies → PENDING
2. System checks leave balance
3. If balance sufficient:
   - Create application
   - Deduct from available balance (pending)
   - Notify manager/HR
4. Manager/HR reviews:
   - APPROVED → Deduct from entitlement, trigger handover
   - REJECTED → Restore pending balance
5. On approved leave:
   - Start date reached → status = ACTIVE
   - Create automatic handovers
6. On return:
   - End date passed → status = COMPLETED
   - Reverse handovers if temporary
```

### 6.2 Staff Loan Workflow

```
1. Employee applies → PENDING
2. HR reviews → APPROVED/REJECTED
3. If APPROVED:
   - Finance disburses → DISBURSED
   - Calculate repayment schedule
   - status = ACTIVE
4. Monthly repayments recorded
5. When fully repaid → FULLY_REPAID
```

### 6.3 Handover Workflow (Temporary - Leave)

```
1. Leave application approved
2. System identifies employee responsibilities
3. Create handover records:
   - Type = TEMPORARY
   - startDate = leave startDate
   - endDate = leave endDate
4. Assign to designated backup/manager
5. Backup accepts/rejects
6. If accepted → status = ACTIVE
7. During leave:
   - Backup performs duties using own account
   - All actions logged with backup's userId
8. On return:
   - status = COMPLETED
   - Responsibilities revert to original owner
```

### 6.4 Handover Workflow (Permanent - Exit)

```
1. Offboarding initiated
2. System identifies all responsibilities:
   - Customers assigned
   - Loan applications assigned
   - Recovery accounts assigned
   - Pending tasks/workflows
3. Create handover records:
   - Type = PERMANENT
   - No endDate
4. HR assigns to new owners
5. New owners accept
6. Responsibilities permanently reassigned
7. Update all resource assignments
8. Original user account deactivated
```

### 6.5 Automatic Responsibility Detection

When creating handovers, automatically detect:
```typescript
// Customers
SELECT * FROM customers WHERE assignedOfficerId = {departingUserId}

// Loan Applications
SELECT * FROM loan_applications WHERE assignedToId = {departingUserId} AND status NOT IN ('DISBURSED', 'REJECTED', 'CANCELLED')

// Recovery Accounts
SELECT * FROM recovery_accounts WHERE assignedOfficerId = {departingUserId} AND status NOT IN ('FULLY_RECOVERED', 'WRITTEN_OFF', 'CLOSED')

// Pending Workflows
SELECT * FROM workflow_instances WHERE assignedToUserId = {departingUserId} AND status IN ('PENDING', 'IN_PROGRESS')
```

---

## 7. Implementation Sequence

### Phase 1: Database & Core Backend (Week 1)
1. Create Prisma schema changes
2. Generate and test migrations
3. Create base modules (hr, leave, staff-loans, responsibilities, offboarding)
4. Implement basic CRUD services
5. Add permissions to database
6. Create seed data for leave types

### Phase 2: Leave Management (Week 2)
1. Implement leave application flow
2. Leave entitlement logic
3. Leave review endpoints
4. Leave balance calculations
5. Frontend: Employee leave pages
6. Frontend: Manager leave review
7. Testing & bug fixes

### Phase 3: Staff Loans (Week 3)
1. Implement staff loan application flow
2. Loan review & disbursement logic
3. Repayment recording
4. Frontend: Employee loan pages
5. Frontend: HR/Finance review pages
6. Testing & bug fixes

### Phase 4: Responsibility Management (Week 4)
1. Implement responsibility tracking
2. Automatic responsibility detection
3. Handover creation & management
4. Integration with customer/loan/recovery modules
5. Frontend: Responsibility pages
6. Frontend: Handover management
7. Testing & bug fixes

### Phase 5: Offboarding & Integration (Week 5)
1. Implement offboarding process
2. Clearance checklist
3. Access revocation logic
4. Integration testing across all modules
5. Frontend: Offboarding pages
6. HR dashboard with all widgets
7. Employee dashboard widgets

### Phase 6: Testing & Documentation (Week 6)
1. End-to-end testing
2. Performance testing
3. User acceptance testing
4. Documentation
5. Training materials
6. Deployment preparation

---

## 8. Key Technical Considerations

### 8.1 Data Integrity

- **Cascading deletes**: Prevent deletion of users with active responsibilities
- **Soft deletes**: Use soft deletes for employees (set `deletedAt`)
- **Audit trails**: Log all HR actions (leave approvals, loan disbursements, handovers)
- **Balance calculations**: Ensure leave balances always consistent
- **Repayment tracking**: Ensure loan repayments balance correctly

### 8.2 Performance

- **Indexes**: Add indexes on frequently queried fields (userId, status, dates)
- **Pagination**: Implement pagination for all list views
- **Caching**: Cache leave balances, loan summaries
- **Eager loading**: Include relations strategically to avoid N+1 queries

### 8.3 Security

- **Authorization**: Strict permission checks on all endpoints
- **Data isolation**: Employees can only see own data unless manager/HR
- **Audit logging**: Log all sensitive operations
- **Document uploads**: Validate and scan uploaded files
- **Access revocation**: Immediate access revocation on offboarding

### 8.4 User Experience

- **Notifications**: Email/in-app notifications for:
  - Leave application submitted/approved/rejected
  - Staff loan status changes
  - Handover assignments
  - Upcoming leave reminders
- **Responsive design**: Mobile-friendly for field staff
- **Clear status indicators**: Badges for application statuses
- **Helpful error messages**: Guide users on validation errors
- **Dashboard widgets**: Quick access to key information

### 8.5 Integration Gotchas

- **Existing assignments**: Handle existing customer/loan assignments
- **Workflow compatibility**: Ensure handovers work with workflow system
- **Permission inheritance**: Consider supervisor permissions
- **Branch/department filtering**: Apply existing location filters
- **Backward compatibility**: Don't break existing features

---

## 9. Migration Strategy

### 9.1 Database Migration

```sql
-- Run Prisma migration
npx prisma migrate dev --name add_hr_module

-- Seed initial data
- Leave types (Annual, Sick, Maternity, Paternity, etc.)
- Staff loan types (Emergency, Salary Advance, etc.)
- Permissions
- Default entitlements for active employees
```

### 9.2 Data Backfill

```sql
-- Create leave entitlements for existing employees
INSERT INTO leave_entitlements (userId, leaveTypeId, year, totalDays, usedDays)
SELECT u.id, lt.id, YEAR(NOW()), lt.defaultDaysPerYear, 0
FROM users u
CROSS JOIN leave_types lt
WHERE u.status = 'ACTIVE' AND u.deletedAt IS NULL;

-- Create responsibility records for existing assignments
INSERT INTO employee_responsibilities (userId, responsibilityType, resourceType, resourceId)
SELECT assignedOfficerId, 'PRIMARY', 'CUSTOMER', id
FROM customers
WHERE assignedOfficerId IS NOT NULL AND deletedAt IS NULL;
```

### 9.3 Rollout Plan

1. **Deploy to staging** - Full testing
2. **User training** - HR staff first, then employees
3. **Deploy to production** - Off-peak hours
4. **Monitor** - Watch for errors/issues
5. **Gather feedback** - Iterate based on usage
6. **Announce** - Internal communication

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Service methods for business logic
- DTO validation
- Permission checks
- Balance calculations
- Handover logic

### 10.2 Integration Tests

- API endpoints
- Database operations
- Workflow integration
- Module interaction

### 10.3 E2E Tests

- Employee leave application flow
- Manager leave approval flow
- Staff loan application & disbursement
- Handover creation & acceptance
- Offboarding process

### 10.4 User Acceptance Testing

- HR staff test all HR functions
- Employees test self-service features
- Managers test approval flows
- Test with real-world scenarios

---

## 11. Success Metrics

### 11.1 Adoption Metrics

- % of employees using self-service
- % of leave applications submitted online
- % of staff loans managed through system
- Time to process leave application
- Time to complete offboarding

### 11.2 Operational Metrics

- Leave balance accuracy
- Staff loan repayment rate
- Handover completion rate
- Offboarding clearance time
- System uptime

### 11.3 User Satisfaction

- User feedback surveys
- Support ticket volume
- Feature usage analytics
- Error rate tracking

---

## 12. Future Enhancements (Post-MVP)

1. **Leave Calendar Integration** - Sync with Google Calendar
2. **Automated Leave Reminders** - Unused leave alerts
3. **Loan Guarantor Module** - Digital guarantor approval
4. **Performance Reviews** - Annual performance tracking
5. **Training & Development** - Course enrollment
6. **Payroll Integration** - Salary deductions
7. **Exit Interview Forms** - Digital exit questionnaires
8. **Bulk Operations** - Batch leave approvals
9. **Reports & Analytics** - Advanced HR analytics
10. **Mobile App** - Native mobile experience

---

## 13. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration issues | High | Extensive testing, rollback plan |
| Permission conflicts | Medium | Thorough permission design review |
| Performance degradation | Medium | Load testing, optimization |
| User adoption resistance | Medium | Training, change management |
| Integration bugs | High | Comprehensive integration testing |
| Audit trail gaps | High | Thorough audit logging implementation |

---

## 14. Required Resources

### 14.1 Development Team

- 1 Backend Developer (NestJS/Prisma)
- 1 Frontend Developer (React/TypeScript)
- 1 QA Engineer
- 1 DevOps Engineer (deployment)
- 1 Product Manager (requirements, UAT)

### 14.2 Timeline

- **Total Duration**: 6-8 weeks
- **Development**: 5 weeks
- **Testing**: 1 week
- **Deployment & Stabilization**: 1-2 weeks

### 14.3 Infrastructure

- Database capacity planning (additional tables)
- Storage for leave/loan documents
- Email service for notifications
- Monitoring & logging

---

## 15. Conclusion

This implementation plan provides a comprehensive roadmap for integrating the HR & Employee Self-Service Module into VCLOP. The modular approach ensures:

✅ **Full integration** with existing VCLOP architecture
✅ **Zero disruption** to existing functionality
✅ **Scalable design** for future enhancements
✅ **Audit-compliant** operation tracking
✅ **User-friendly** self-service experience
✅ **Secure** role-based access control

The phased implementation allows for iterative development and testing, ensuring a stable rollout.

**Next Steps**:
1. Review and approve this plan
2. Allocate development resources
3. Begin Phase 1: Database & Core Backend
4. Set up project tracking and communication channels
5. Schedule stakeholder demos at end of each phase

---

**Document Version**: 1.0  
**Date**: October 28, 2026  
**Author**: Kiro AI Development Assistant  
**Status**: Awaiting Review & Approval
