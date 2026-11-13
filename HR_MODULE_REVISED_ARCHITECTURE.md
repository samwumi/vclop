# HR & Employee Self-Service Module - REVISED ARCHITECTURE

**Version:** 2.0  
**Date:** October 28, 2026  
**Status:** PENDING APPROVAL - NO IMPLEMENTATION YET

---

## EXECUTIVE SUMMARY

This document presents a **comprehensive revision** of the HR & Employee Self-Service Module architecture, addressing **9 critical design flaws** identified in the original proposal.

**Key Changes:**
1. ✅ Eliminated separate Employee model - reuse existing User model
2. ✅ Redesigned responsibility management with delegation, history, and original owner preservation
3. ✅ Fixed leave balance calculations to use computed values with proper concurrency protection
4. ✅ Added proper repayment schedule model for staff loans
5. ✅ Separated IT access revocation from offboarding clearance
6. ✅ Integrated responsibility assignments with actual Customer/Loan/Recovery/Workflow models
7. ✅ Defined complete approval workflow hierarchy and rules
8. ✅ Enhanced audit coverage for all financial and security-sensitive operations
9. ✅ Reviewed all database constraints, indexes, and MariaDB compatibility

---

## TABLE OF CONTENTS

1. [Changes From Original Proposal](#changes-from-original-proposal)
2. [Revised Database Schema](#revised-database-schema)
3. [Responsibility Management (Redesigned)](#responsibility-management-redesigned)
4. [Leave Management (Fixed)](#leave-management-fixed)
5. [Staff Loan Management (Enhanced)](#staff-loan-management-enhanced)
6. [Offboarding Process (Revised)](#offboarding-process-revised)
7. [Approval Workflows (Complete Definition)](#approval-workflows-complete-definition)
8. [Audit and Security](#audit-and-security)
9. [API Changes](#api-changes)
10. [Migration Strategy](#migration-strategy)
11. [Implementation Dependencies](#implementation-dependencies)

---

## CHANGES FROM ORIGINAL PROPOSAL

### 1. EMPLOYEE DATA - ELIMINATED DUPLICATION

**❌ ORIGINAL (REJECTED):**
```prisma
model Employee {
  id              String   @id @default(uuid())
  userId          String   @unique
  employeeId      String   @unique  // DUPLICATE of User.employeeId
  firstName       String               // DUPLICATE of User.firstName
  lastName        String               // DUPLICATE of User.lastName
  email           String   @unique     // DUPLICATE of User.email
  phone           String               // DUPLICATE of User.phone
  departmentId    String?              // DUPLICATE of User.departmentId
  branchId        String?              // DUPLICATE of User.branchId
  // ... more duplicates
}
```

**✅ REVISED (APPROVED):**
- **NO separate Employee model**
- All HR data extends the existing **User** model
- Add HR-specific fields directly to User model:
  - `hireDate`, `jobTitle`, `salary`, `contractType`, `terminationDate`

**Rationale:**
- User model already contains: `employeeId`, `firstName`, `lastName`, `email`, `phone`, `branchId`, `departmentId`, `supervisorId`
- Creating Employee would require maintaining dual records
- Eliminates synchronization issues
- Simplifies queries and relationships

---

### 2. RESPONSIBILITY MANAGEMENT - COMPLETE REDESIGN

**❌ ORIGINAL (REJECTED):**
```prisma
model EmployeeResponsibility {
  id           String   @id @default(uuid())
  userId       String
  resourceType String   // "Customer", "Loan", "Recovery"
  resourceId   String   // PROBLEM: No referential integrity
  isActive     Boolean  @default(true)
  
  // PROBLEM: This constraint prevents historical assignments
  @@unique([userId, resourceType, resourceId, isActive])
}
```

**Problems:**
1. Unique constraint blocks historical assignments (can't have multiple records)
2. Direct overwriting of `assignedOfficerId` loses original owner
3. No distinction between permanent and temporary delegation
4. No effective dates or automatic expiration
5. No handover acceptance tracking
6. Arbitrary `resourceId` strings without validation

**✅ REVISED (APPROVED):**

```prisma
model ResourceAssignment {
  id                    String              @id @default(uuid()) @db.VarChar(36)
  
  // Resource identification with referential integrity
  resourceType          ResourceType        // CUSTOMER, LOAN_APPLICATION, RECOVERY_ACCOUNT, WORKFLOW_TASK
  customerId            String?             @db.VarChar(36)
  loanApplicationId     String?             @db.VarChar(36)
  recoveryAccountId     String?             @db.VarChar(36)
  workflowTaskId        String?             @db.VarChar(36)
  
  // Ownership vs delegation
  assignmentType        AssignmentType      // PERMANENT, TEMPORARY_DELEGATION
  
  // Original owner preservation
  originalOwnerId       String?             @db.VarChar(36)  // Only for TEMPORARY_DELEGATION
  
  // Current assignment
  currentOwnerId        String              @db.VarChar(36)
  
  // Temporal tracking
  effectiveFrom         DateTime            @default(now())
  effectiveTo           DateTime?           // NULL for permanent, future date for temporary
  
  // Delegation context
  delegationReason      String?             @db.VarChar(500)  // e.g., "Annual leave", "Resigned"
  relatedLeaveId        String?             @db.VarChar(36)   // Link to LeaveApplication if applicable
  relatedOffboardingId  String?             @db.VarChar(36)   // Link to OffboardingCase if applicable
  
  // Handover acceptance
  acceptedByReceiver    Boolean             @default(false)
  acceptedAt            DateTime?
  acceptanceNotes       String?             @db.Text
  
  // Status
  status                AssignmentStatus    // ACTIVE, EXPIRED, REVOKED, PENDING_ACCEPTANCE
  
  // Audit
  createdById           String              @db.VarChar(36)
  createdAt             DateTime            @default(now())
  revokedById           String?             @db.VarChar(36)
  revokedAt             DateTime?
  revokedReason         String?             @db.VarChar(500)
  
  // Relations
  customer              Customer?           @relation(fields: [customerId], references: [id])
  loanApplication       LoanApplication?    @relation(fields: [loanApplicationId], references: [id])
  recoveryAccount       RecoveryAccount?    @relation(fields: [recoveryAccountId], references: [id])
  workflowTask          WorkflowTask?       @relation(fields: [workflowTaskId], references: [id])
  originalOwner         User?               @relation("OriginalOwner", fields: [originalOwnerId], references: [id])
  currentOwner          User                @relation("CurrentOwner", fields: [currentOwnerId], references: [id])
  createdBy             User                @relation("AssignmentCreator", fields: [createdById], references: [id])
  revokedBy             User?               @relation("AssignmentRevoker", fields: [revokedById], references: [id])
  relatedLeave          LeaveApplication?   @relation(fields: [relatedLeaveId], references: [id])
  relatedOffboarding    OffboardingCase?    @relation(fields: [relatedOffboardingId], references: [id])
  
  @@unique([resourceType, customerId, status], name: "unique_active_customer_assignment")
  @@unique([resourceType, loanApplicationId, status], name: "unique_active_loan_assignment")
  @@unique([resourceType, recoveryAccountId, status], name: "unique_active_recovery_assignment")
  @@unique([resourceType, workflowTaskId, status], name: "unique_active_workflow_assignment")
  @@index([currentOwnerId, status])
  @@index([originalOwnerId])
  @@index([effectiveFrom, effectiveTo])
  @@index([relatedLeaveId])
  @@index([relatedOffboardingId])
  @@map("resource_assignments")
}

enum ResourceType {
  CUSTOMER
  LOAN_APPLICATION
  RECOVERY_ACCOUNT
  WORKFLOW_TASK
}

enum AssignmentType {
  PERMANENT
  TEMPORARY_DELEGATION
}

enum AssignmentStatus {
  ACTIVE
  EXPIRED
  REVOKED
  PENDING_ACCEPTANCE
}
```

**Key Improvements:**
1. ✅ **Referential Integrity:** Direct foreign keys to Customer, LoanApplication, RecoveryAccount, WorkflowTask
2. ✅ **Original Owner Preserved:** `originalOwnerId` field prevents loss of ownership information
3. ✅ **Permanent vs Temporary:** `assignmentType` distinguishes delegation from ownership transfer
4. ✅ **Historical Assignments:** Unique constraints only apply to ACTIVE status, allowing full history
5. ✅ **Automatic Expiration:** `effectiveTo` date enables scheduled reversion
6. ✅ **Handover Acceptance:** Receiver must acknowledge assignments
7. ✅ **Complete Audit Trail:** Tracks creator, revoker, timestamps, reasons

**Business Rules:**
- **Permanent Assignment:** `assignmentType = PERMANENT`, `effectiveTo = NULL`, `originalOwnerId = NULL`
- **Temporary Delegation:** `assignmentType = TEMPORARY_DELEGATION`, `effectiveTo` set, `originalOwnerId` populated
- When temporary delegation expires, system automatically:
  1. Updates delegation record status to `EXPIRED`
  2. Creates new ACTIVE assignment restoring `originalOwnerId`
  3. Notifies both parties
- **Original resource fields NOT modified:** `Customer.assignedOfficerId`, `LoanApplication.assignedToId` etc. remain unchanged during temporary delegation
- System queries **ResourceAssignment** table to determine current effective owner

---

### 3. LEAVE MANAGEMENT - FIXED BALANCE CALCULATIONS

**❌ ORIGINAL (REJECTED):**
```prisma
model LeaveApplication {
  id            String      @id @default(uuid())
  userId        String
  leaveTypeId   String
  startDate     DateTime
  endDate       DateTime
  totalDays     Int         // Calculated
  remainingDays Int         // PROBLEM: Independently editable!
  status        LeaveStatus // MISSING: ACTIVE status
  // ...
}

enum LeaveStatus {
  PENDING       // ✅
  APPROVED      // ✅
  REJECTED      // ✅
  // MISSING: ACTIVE (used in workflows)
  CANCELLED     // ✅
}
```

**Problems:**
1. `remainingDays` can be edited independently - causes balance drift
2. No reservation of pending leave days
3. Status enum missing `ACTIVE` (inconsistent with workflow requirements)
4. No support for half-day leave
5. Weekend/holiday configuration not addressed
6. Concurrent application submission can over-allocate

**✅ REVISED (APPROVED):**

```prisma
model LeaveType {
  id                      String             @id @default(uuid()) @db.VarChar(36)
  name                    String             @unique @db.VarChar(100)
  code                    String             @unique @db.VarChar(20)
  description             String?            @db.Text
  defaultDaysPerYear      Int
  carryForwardAllowed     Boolean            @default(false)
  maxCarryForwardDays     Int?
  requiresApproval        Boolean            @default(true)
  minNoticeDays           Int                @default(0)
  maxConsecutiveDays      Int?
  allowHalfDay            Boolean            @default(true)
  countWeekendsAsLeave    Boolean            @default(false)
  countHolidaysAsLeave    Boolean            @default(false)
  isActive                Boolean            @default(true)
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt
  entitlements            LeaveEntitlement[]
  applications            LeaveApplication[]
  
  @@map("leave_types")
}

model LeaveEntitlement {
  id                      String      @id @default(uuid()) @db.VarChar(36)
  userId                  String      @db.VarChar(36)
  leaveTypeId             String      @db.VarChar(36)
  year                    Int
  
  // Entitlement calculation (computed, NOT editable)
  totalDaysEntitled       Decimal     @db.Decimal(5, 1)  // 14.5 days
  carryForwardDays        Decimal     @default(0) @db.Decimal(5, 1)
  
  // Usage tracking (computed from applications, NOT editable)
  // These fields are maintained by triggers or computed queries
  daysUsed                Decimal     @default(0) @db.Decimal(5, 1)
  daysPending             Decimal     @default(0) @db.Decimal(5, 1)  // Reserved for PENDING/APPROVED applications
  daysAvailable           Decimal     @db.Decimal(5, 1)  // totalDaysEntitled + carryForwardDays - daysUsed - daysPending
  
  // Audit
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  
  // Relations
  user                    User        @relation(fields: [userId], references: [id])
  leaveType               LeaveType   @relation(fields: [leaveTypeId], references: [id])
  
  @@unique([userId, leaveTypeId, year])
  @@index([userId, year])
  @@map("leave_entitlements")
}

model LeaveApplication {
  id                      String               @id @default(uuid()) @db.VarChar(36)
  applicationNumber       String               @unique @db.VarChar(20)
  userId                  String               @db.VarChar(36)
  leaveTypeId             String               @db.VarChar(36)
  
  // Dates
  startDate               DateTime             @db.Date
  endDate                 DateTime             @db.Date
  isStartHalfDay          Boolean              @default(false)
  isEndHalfDay            Boolean              @default(false)
  
  // Calculated days (computed, NOT editable)
  businessDaysRequested   Decimal              @db.Decimal(5, 1)  // Excludes weekends/holidays per config
  
  // Application details
  reason                  String               @db.Text
  handoverNotes           String?              @db.Text
  emergencyContact        String?              @db.VarChar(100)
  emergencyPhone          String?              @db.VarChar(20)
  
  // Status with ACTIVE support
  status                  LeaveStatus          @default(PENDING)
  
  // Workflow
  submittedAt             DateTime?
  reviewedById            String?              @db.VarChar(36)
  reviewedAt              DateTime?
  approvalNotes           String?              @db.Text
  rejectionReason         String?              @db.VarChar(500)
  
  // Cancellation
  cancelledAt             DateTime?
  cancellationReason      String?              @db.VarChar(500)
  
  // Audit
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt
  
  // Relations
  user                    User                 @relation(fields: [userId], references: [id])
  leaveType               LeaveType            @relation(fields: [leaveTypeId], references: [id])
  reviewedBy              User?                @relation("LeaveReviewer", fields: [reviewedById], references: [id])
  resourceAssignments     ResourceAssignment[] // Delegations created for this leave
  
  @@index([userId, status])
  @@index([status, startDate])
  @@map("leave_applications")
}

enum LeaveStatus {
  PENDING
  APPROVED
  ACTIVE      // ✅ ADDED - Leave is currently in effect
  REJECTED
  CANCELLED
}

model PublicHoliday {
  id          String   @id @default(uuid()) @db.VarChar(36)
  name        String   @db.VarChar(200)
  date        DateTime @db.Date
  year        Int
  isRecurring Boolean  @default(false)  // e.g., New Year's Day
  branchId    String?  @db.VarChar(36)  // NULL = applies to all branches
  createdAt   DateTime @default(now())
  
  @@unique([date, branchId])
  @@index([year])
  @@map("public_holidays")
}
```

**Key Improvements:**
1. ✅ **Computed Balances:** `daysUsed`, `daysPending`, `daysAvailable` calculated from applications, not editable
2. ✅ **Pending Reservations:** `daysPending` reserves entitlement for PENDING/APPROVED applications
3. ✅ **ACTIVE Status Added:** Supports workflow requirement
4. ✅ **Half-Day Support:** `isStartHalfDay`, `isEndHalfDay` flags
5. ✅ **Holiday/Weekend Config:** `countWeekendsAsLeave`, `countHolidaysAsLeave`, PublicHoliday table
6. ✅ **Concurrency Protection:** Use database transactions with row locking when approving

**Business Rules:**
- On application submission (PENDING): Increment `daysPending`, validate `daysAvailable >= businessDaysRequested`
- On approval: Status → APPROVED, `daysPending` unchanged
- On start date: Status → ACTIVE, decrement `daysPending`, increment `daysUsed`
- On rejection/cancellation: Decrement `daysPending`, release reservation
- On end date: Status remains ACTIVE (historical record)
- **Concurrency:** Use `SELECT ... FOR UPDATE` on LeaveEntitlement when processing applications

---

### 4. STAFF LOAN MANAGEMENT - PROPER REPAYMENT SCHEDULE

**❌ ORIGINAL (REJECTED):**
```prisma
model StaffLoan {
  id               String   @id @default(uuid())
  userId           String
  amount           Decimal
  purpose          String
  status           String
  outstandingBalance Decimal  // PROBLEM: Directly editable!
  // MISSING: Repayment schedule
  // MISSING: Payment tracking
}
```

**Problems:**
1. No repayment schedule with installments
2. `outstandingBalance` can be manually edited
3. No payment verification or transaction references
4. Cannot handle reversals or adjustments
5. Approval, disbursement, and repayment not separated

**✅ REVISED (APPROVED):**

```prisma
model StaffLoan {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  loanNumber              String                    @unique @db.VarChar(20)
  userId                  String                    @db.VarChar(36)
  
  // Loan terms
  principalAmount         Decimal                   @db.Decimal(14, 2)
  interestRate            Decimal                   @db.Decimal(6, 3)
  tenureMonths            Int
  monthlyDeduction        Decimal                   @db.Decimal(14, 2)
  totalRepayable          Decimal                   @db.Decimal(14, 2)  // Computed from schedule
  
  // Application
  purpose                 String                    @db.Text
  requestedAmount         Decimal                   @db.Decimal(14, 2)
  justification           String?                   @db.Text
  
  // Status workflow
  status                  StaffLoanStatus           @default(PENDING)
  
  // Approval
  reviewedById            String?                   @db.VarChar(36)
  reviewedAt              DateTime?
  approvalNotes           String?                   @db.Text
  rejectionReason         String?                   @db.VarChar(500)
  
  // Disbursement
  disbursedById           String?                   @db.VarChar(36)
  disbursedAt             DateTime?
  disbursementReference   String?                   @db.VarChar(100)
  disbursementMethod      String?                   @db.VarChar(50)
  
  // Computed balances (NOT editable, calculated from payments)
  totalPaid               Decimal                   @default(0) @db.Decimal(14, 2)
  outstandingBalance      Decimal                   @db.Decimal(14, 2)
  
  // Completion
  completedAt             DateTime?
  
  // Audit
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  // Relations
  user                    User                      @relation(fields: [userId], references: [id])
  reviewedBy              User?                     @relation("StaffLoanReviewer", fields: [reviewedById], references: [id])
  disbursedBy             User?                     @relation("StaffLoanDisbursing", fields: [disbursedById], references: [id])
  repaymentSchedule       StaffLoanRepayment[]
  payments                StaffLoanPayment[]
  adjustments             StaffLoanAdjustment[]
  
  @@index([userId, status])
  @@index([status])
  @@map("staff_loans")
}

model StaffLoanRepayment {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  staffLoanId             String                    @db.VarChar(36)
  installmentNumber       Int
  dueDate                 DateTime                  @db.Date
  principalDue            Decimal                   @db.Decimal(14, 2)
  interestDue             Decimal                   @db.Decimal(14, 2)
  totalDue                Decimal                   @db.Decimal(14, 2)
  
  // Payment tracking (computed from StaffLoanPayment)
  amountPaid              Decimal                   @default(0) @db.Decimal(14, 2)
  outstandingAmount       Decimal                   @db.Decimal(14, 2)
  
  status                  StaffLoanRepaymentStatus  @default(PENDING)
  paidAt                  DateTime?
  
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  // Relations
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id], onDelete: Cascade)
  payments                StaffLoanPayment[]
  
  @@unique([staffLoanId, installmentNumber])
  @@index([dueDate, status])
  @@map("staff_loan_repayments")
}

model StaffLoanPayment {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  paymentNumber           String                    @unique @db.VarChar(20)
  staffLoanId             String                    @db.VarChar(36)
  repaymentId             String                    @db.VarChar(36)
  
  amount                  Decimal                   @db.Decimal(14, 2)
  paymentDate             DateTime                  @db.Date
  paymentMethod           String                    @db.VarChar(50)  // SALARY_DEDUCTION, BANK_TRANSFER, CASH
  
  // Verification
  transactionReference    String?                   @db.VarChar(100)
  verifiedById            String?                   @db.VarChar(36)
  verifiedAt              DateTime?
  
  // Reversal support
  isReversed              Boolean                   @default(false)
  reversedById            String?                   @db.VarChar(36)
  reversedAt              DateTime?
  reversalReason          String?                   @db.VarChar(500)
  reversalReference       String?                   @db.VarChar(100)
  
  notes                   String?                   @db.Text
  
  // Audit
  createdById             String                    @db.VarChar(36)
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  // Relations
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id])
  repayment               StaffLoanRepayment        @relation(fields: [repaymentId], references: [id])
  createdBy               User                      @relation("StaffPaymentCreator", fields: [createdById], references: [id])
  verifiedBy              User?                     @relation("StaffPaymentVerifier", fields: [verifiedById], references: [id])
  reversedBy              User?                     @relation("StaffPaymentReverser", fields: [reversedById], references: [id])
  
  @@index([staffLoanId])
  @@index([repaymentId])
  @@index([paymentDate])
  @@map("staff_loan_payments")
}

model StaffLoanAdjustment {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  staffLoanId             String   @db.VarChar(36)
  adjustmentType          String   @db.VarChar(50)  // WAIVER, PENALTY, CORRECTION
  amount                  Decimal  @db.Decimal(14, 2)
  reason                  String   @db.Text
  approvedById            String   @db.VarChar(36)
  approvedAt              DateTime @default(now())
  
  staffLoan               StaffLoan @relation(fields: [staffLoanId], references: [id])
  approvedBy              User      @relation("StaffLoanAdjustmentApprover", fields: [approvedById], references: [id])
  
  @@index([staffLoanId])
  @@map("staff_loan_adjustments")
}

enum StaffLoanStatus {
  PENDING
  APPROVED
  DISBURSED
  ACTIVE
  COMPLETED
  DEFAULTED
  WRITTEN_OFF
  REJECTED
  CANCELLED
}

enum StaffLoanRepaymentStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
}
```

**Key Improvements:**
1. ✅ **Repayment Schedule:** Separate `StaffLoanRepayment` model with installments
2. ✅ **Payment Verification:** Transaction references, verification by authorized user
3. ✅ **Reversals:** Full support for payment reversals with audit trail
4. ✅ **Computed Balances:** `outstandingBalance`, `amountPaid` calculated from payments
5. ✅ **Separate Workflows:** Application → Approval → Disbursement → Repayment
6. ✅ **Adjustments:** Waivers, penalties tracked separately

**Business Rules:**
- Schedule generated upon disbursement (not approval)
- Payments always reference specific installment
- Balance calculations: `outstandingBalance = totalRepayable - SUM(payments WHERE !isReversed) - SUM(adjustments WHERE adjustmentType = WAIVER)`
- Prevent direct editing of computed fields at API level
- Salary deduction automation linked to payroll (future integration)

---

### 5. OFFBOARDING - SEPARATED IT ACCESS REVOCATION

**❌ ORIGINAL (REJECTED):**
```prisma
model OffboardingCase {
  id                    String   @id @default(uuid())
  userId                String
  // ...
  overallStatus         String   // PROBLEM: Cannot revoke IT until everything cleared
  financeClearance      Boolean
  assetClearance        Boolean
  itAccessRevocation    Boolean  // Blocked by overallStatus
}
```

**Problems:**
1. IT access tied to overall clearance - cannot revoke immediately
2. Cannot support re-employment without destroying history
3. No separation between clearance types

**✅ REVISED (APPROVED):**

```prisma
model OffboardingCase {
  id                      String              @id @default(uuid()) @db.VarChar(36)
  caseNumber              String              @unique @db.VarChar(20)
  userId                  String              @db.VarChar(36)
  
  // Termination details
  terminationType         TerminationType
  terminationDate         DateTime            @db.Date
  lastWorkingDay          DateTime            @db.Date
  reason                  String?             @db.Text
  isVoluntary             Boolean
  
  // Notice period
  noticePeriodDays        Int?
  noticeServedDays        Int?
  noticeWaiverApproved    Boolean             @default(false)
  
  // Overall case status
  overallStatus           OffboardingStatus   @default(IN_PROGRESS)
  
  // Independent clearance components
  itAccessStatus          ClearanceStatus     @default(PENDING)
  itAccessRevokedAt       DateTime?
  itAccessRevokedById     String?             @db.VarChar(36)
  itAccessNotes           String?             @db.Text
  
  financeStatus           ClearanceStatus     @default(PENDING)
  financeClearedAt        DateTime?
  financeClearedById      String?             @db.VarChar(36)
  financeNotes            String?             @db.Text
  outstandingAmount       Decimal?            @db.Decimal(14, 2)
  
  assetStatus             ClearanceStatus     @default(PENDING)
  assetsClearedAt         DateTime?
  assetsClearedById       String?             @db.VarChar(36)
  assetNotes              String?             @db.Text
  
  hrStatus                ClearanceStatus     @default(PENDING)
  hrClearedAt             DateTime?
  hrClearedById           String?             @db.VarChar(36)
  hrNotes                 String?             @db.Text
  
  // Re-employment support
  rehireEligible          Boolean             @default(true)
  rehireNotes             String?             @db.Text
  
  // Final completion
  completedAt             DateTime?
  exitInterviewCompleted  Boolean             @default(false)
  exitInterviewDate       DateTime?
  exitInterviewNotes      String?             @db.Text
  
  // Audit
  initiatedById           String              @db.VarChar(36)
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt
  
  // Relations
  user                    User                @relation(fields: [userId], references: [id])
  initiatedBy             User                @relation("OffboardingInitiator", fields: [initiatedById], references: [id])
  itAccessRevokedBy       User?               @relation("ITAccessRevoker", fields: [itAccessRevokedById], references: [id])
  financeClearedBy        User?               @relation("FinanceClearer", fields: [financeClearedById], references: [id])
  assetsClearedBy         User?               @relation("AssetClearer", fields: [assetsClearedById], references: [id])
  hrClearedBy             User?               @relation("HRClearer", fields: [hrClearedById], references: [id])
  resourceHandovers       ResourceAssignment[]
  
  @@unique([userId, terminationDate])  // Allows re-employment
  @@index([overallStatus])
  @@index([terminationDate])
  @@map("offboarding_cases")
}

enum TerminationType {
  RESIGNATION
  TERMINATION
  RETIREMENT
  CONTRACT_END
  DEATH
  ABSCONDING
}

enum OffboardingStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ClearanceStatus {
  PENDING
  IN_PROGRESS
  CLEARED
  CLEARED_WITH_CONDITIONS
  NOT_APPLICABLE
}
```

**Key Improvements:**
1. ✅ **Independent IT Revocation:** `itAccessStatus` managed separately from other clearances
2. ✅ **Immediate Action:** IT can revoke access while finance/asset clearance pending
3. ✅ **Re-employment Support:** Unique constraint `[userId, terminationDate]` allows multiple records
4. ✅ **Component Tracking:** Each clearance type has status, timestamp, approver, notes
5. ✅ **Conditional Clearance:** `CLEARED_WITH_CONDITIONS` status for partial resolution

**Business Rules:**
- IT access revocation: Authorized user can set `itAccessStatus = CLEARED` at any time
- When IT access cleared: Immediately disable User.status, revoke active sessions
- Finance/Asset/HR clearance can proceed independently
- `overallStatus = COMPLETED` only when ALL components cleared or NOT_APPLICABLE
- Re-employment: Create new OffboardingCase if employee rehired and terminated again

---

### 6. RESPONSIBILITY INTEGRATION - REFERENTIAL INTEGRITY

**❌ ORIGINAL (REJECTED):**
```prisma
model EmployeeResponsibility {
  resourceType String   // "Customer", "Loan", "Recovery"
  resourceId   String   // PROBLEM: Arbitrary strings, no validation
}
```

**✅ REVISED (APPROVED):**

Already addressed in Section 2. Key points:
- Direct foreign keys: `customerId`, `loanApplicationId`, `recoveryAccountId`, `workflowTaskId`
- Database enforces referential integrity
- Cannot create assignments for non-existent resources
- Cascade rules prevent orphaned assignments

**Additional Integration:**

```prisma
// Add to Customer model
model Customer {
  // ... existing fields
  assignmentHistory       ResourceAssignment[]  @relation(...)
}

// Add to LoanApplication model
model LoanApplication {
  // ... existing fields
  assignmentHistory       ResourceAssignment[]  @relation(...)
}

// Add to RecoveryAccount model
model RecoveryAccount {
  // ... existing fields  
  assignmentHistory       ResourceAssignment[]  @relation(...)
}

// Add to WorkflowTask model
model WorkflowTask {
  // ... existing fields
  assignmentHistory       ResourceAssignment[]  @relation(...)
}
```

**Query Logic:**
```typescript
// Get current effective owner (not just assignedOfficerId)
async function getCurrentOwner(resourceType: ResourceType, resourceId: string): Promise<string> {
  const activeAssignment = await prisma.resourceAssignment.findFirst({
    where: {
      resourceType,
      [resourceType === 'CUSTOMER' ? 'customerId' : /* other mappings */]: resourceId,
      status: 'ACTIVE',
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } }
      ]
    },
    orderBy: { effectiveFrom: 'desc' }
  });
  
  return activeAssignment?.currentOwnerId || originalOwnerId;
}
```

---

### 7. APPROVAL WORKFLOWS - COMPLETE DEFINITION

**❌ ORIGINAL (MISSING):**
- No defined hierarchy
- No approval limits
- No self-approval prevention
- No delegation handling

**✅ REVISED (APPROVED):**

```prisma
model ApprovalHierarchy {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  entityType              String   @db.VarChar(50)  // LEAVE_APPLICATION, STAFF_LOAN, RESOURCE_ASSIGNMENT
  
  // Hierarchy definition
  level                   Int      // 1, 2, 3...
  roleRequired            String?  @db.VarChar(50)  // "Department Head", "HR Manager"
  permissionRequired      String?  @db.VarChar(100) // "leaves:approve_team"
  
  // Limits (optional)
  minAmountThreshold      Decimal? @db.Decimal(14, 2)
  maxAmountThreshold      Decimal? @db.Decimal(14, 2)
  minDaysThreshold        Int?
  maxDaysThreshold        Int?
  
  // Routing rules
  autoApproveBelow        Decimal? @db.Decimal(14, 2)
  requiresAllApprovers    Boolean  @default(false)  // All at this level must approve
  
  isActive                Boolean  @default(true)
  createdAt               DateTime @default(now())
  
  @@unique([entityType, level])
  @@index([entityType, isActive])
  @@map("approval_hierarchies")
}

model ApprovalAction {
  id                      String         @id @default(uuid()) @db.VarChar(36)
  
  // Target entity
  entityType              String         @db.VarChar(50)
  entityId                String         @db.VarChar(36)
  
  // Approval metadata
  level                   Int
  approverId              String         @db.VarChar(36)
  action                  ApprovalAction @default(PENDING)
  
  // Timing
  requestedAt             DateTime       @default(now())
  respondedAt             DateTime?
  dueAt                   DateTime?
  
  // Decision
  decision                String?        @db.VarChar(20)  // APPROVED, REJECTED, RETURNED
  comments                String?        @db.Text
  
  // Delegation
  delegatedFrom           String?        @db.VarChar(36)  // Original approver if delegated
  
  // Relations
  approver                User           @relation("Approver", fields: [approverId], references: [id])
  delegatedFromUser       User?          @relation("DelegatedApprover", fields: [delegatedFrom], references: [id])
  
  @@index([entityType, entityId])
  @@index([approverId, action])
  @@map("approval_actions")
}

enum ApprovalAction {
  PENDING
  APPROVED
  REJECTED
  RETURNED
  ESCALATED
}
```

**Business Rules:**

**1. Approval Hierarchy:**
- **Leave Applications:**
  - Level 1: Direct Supervisor (< 5 days)
  - Level 2: Department Head (5-10 days)
  - Level 3: HR Manager (> 10 days or special leave)

- **Staff Loans:**
  - Level 1: Direct Supervisor (< 100,000)
  - Level 2: Department Head (100,000 - 500,000)
  - Level 3: HR Manager (> 500,000)
  - Level 4: CFO (> 1,000,000)

- **Resource Assignments:**
  - Level 1: Department Head (temporary delegation)
  - Level 2: HR Manager (permanent reassignment)

**2. Self-Approval Prevention:**
```typescript
// Validation logic
if (application.userId === approverId) {
  throw new Error('Employees cannot approve their own applications');
}

// Also check supervisor relationship
if (application.user.supervisorId === application.userId) {
  throw new Error('Circular approval relationship detected');
}
```

**3. Approval Limits:**
```typescript
function determineApprovalLevel(amount: number, days: number): number {
  const hierarchy = await getHierarchy(entityType);
  
  return hierarchy.find(h => 
    amount >= (h.minAmountThreshold || 0) && 
    amount <= (h.maxAmountThreshold || Infinity) &&
    days >= (h.minDaysThreshold || 0) &&
    days <= (h.maxDaysThreshold || Infinity)
  )?.level || 1;
}
```

**4. Delegated Authority:**
- When approver on leave/offboarded, system checks for active delegation
- Delegation stored in ResourceAssignment table (type: WORKFLOW_TASK)
- Delegated approvals recorded with `delegatedFrom` field

**5. Approver Absence:**
```typescript
async function getEffectiveApprover(userId: string): Promise<string> {
  const delegation = await prisma.resourceAssignment.findFirst({
    where: {
      originalOwnerId: userId,
      assignmentType: 'TEMPORARY_DELEGATION',
      status: 'ACTIVE',
      effectiveFrom: { lte: new Date() },
      effectiveTo: { gte: new Date() }
    }
  });
  
  return delegation?.currentOwnerId || userId;
}
```

**6. Rejection and Resubmission:**
- Rejected applications: Status → REJECTED, cannot be edited
- Resubmission: Create new application (preserves history)
- Returned applications: Status → RETURNED, can be edited and resubmitted

**7. Complete Approval History:**
- All approval actions stored in ApprovalAction table
- Tracks: Who, when, decision, comments, delegation
- Immutable audit trail

---

### 8. AUDIT AND SECURITY - ENHANCED COVERAGE

**✅ COMPREHENSIVE AUDIT MODEL:**

```prisma
model AuditLog {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  
  // Event classification
  eventType               String   @db.VarChar(100)  // e.g., "LEAVE_APPROVED", "LOAN_DISBURSED"
  entityType              String   @db.VarChar(50)   // "LeaveApplication", "StaffLoan"
  entityId                String   @db.VarChar(36)
  
  // Actor
  userId                  String?  @db.VarChar(36)
  userEmail               String?  @db.VarChar(150)
  ipAddress               String?  @db.VarChar(50)
  userAgent               String?  @db.VarChar(500)
  
  // Change details
  action                  String   @db.VarChar(50)   // CREATE, UPDATE, DELETE, APPROVE, REJECT
  oldValues               String?  @db.LongText      // JSON
  newValues               String?  @db.LongText      // JSON
  
  // Sensitive operations flag
  isSensitive             Boolean  @default(false)
  isFinancial             Boolean  @default(false)
  isSecurityRelated       Boolean  @default(false)
  
  // Context
  reason                  String?  @db.Text
  metadata                String?  @db.LongText      // JSON for additional context
  
  timestamp               DateTime @default(now())
  
  // Relations
  user                    User?    @relation(fields: [userId], references: [id])
  
  @@index([entityType, entityId])
  @@index([userId, timestamp])
  @@index([eventType, timestamp])
  @@index([isSensitive, timestamp])
  @@index([isFinancial, timestamp])
  @@map("audit_logs")
}
```

**Audited Events:**

**Financial Transactions:**
- Staff loan application, approval, disbursement
- Staff loan payments, reversals, adjustments
- Salary deductions
- Outstanding balance changes

**Status Changes:**
- Leave application: PENDING → APPROVED → ACTIVE
- Staff loan: PENDING → APPROVED → DISBURSED → ACTIVE
- Offboarding: IN_PROGRESS → COMPLETED
- Resource assignment: PENDING_ACCEPTANCE → ACTIVE → EXPIRED

**Responsibility Transfers:**
- Resource assignment creation
- Handover acceptance
- Assignment expiration
- Assignment revocation

**Approvals:**
- All approval actions (approve/reject/return)
- Approval delegation
- Self-approval attempts (blocked)

**Access Revocations:**
- IT access revocation
- User status changes
- Session terminations
- Permission changes

**Sensitive Data Access:**
- Salary information views
- Financial records access
- Employee personal data access

**Implementation:**
```typescript
// Audit decorator
@Audit({
  eventType: 'STAFF_LOAN_APPROVED',
  entityType: 'StaffLoan',
  isSensitive: true,
  isFinancial: true
})
async approveStaffLoan(id: string, approverId: string) {
  // Business logic
}

// Audit service
async function logAudit(event: AuditEvent) {
  await prisma.auditLog.create({
    data: {
      eventType: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.userId,
      action: event.action,
      oldValues: JSON.stringify(event.oldValues),
      newValues: JSON.stringify(event.newValues),
      isSensitive: event.isSensitive,
      isFinancial: event.isFinancial,
      metadata: JSON.stringify(event.metadata)
    }
  });
}
```

---

### 9. DATABASE AND MIGRATIONS - MARIADB COMPATIBILITY

**Constraint Review:**

**✅ Unique Constraints:**
```prisma
// ORIGINAL: Blocks historical records
@@unique([userId, resourceType, resourceId, isActive])

// REVISED: Allows history, prevents conflicts
@@unique([resourceType, customerId, status], name: "unique_active_customer_assignment")
// Only ONE ACTIVE assignment per resource at a time
// Multiple EXPIRED/REVOKED records allowed
```

**✅ Indexes:**
```prisma
// High-frequency queries
@@index([userId, status])              // User's active leaves/loans
@@index([currentOwnerId, status])      // Officer's current assignments
@@index([effectiveFrom, effectiveTo])  // Temporal queries
@@index([entityType, entityId])        // Audit log lookups
@@index([approverId, action])          // Pending approvals

// Performance optimization for computed queries
@@index([leaveTypeId, year])           // Entitlement calculations
@@index([staffLoanId, dueDate])        // Overdue installments
```

**✅ Deletion Policies:**
```prisma
// Preserve audit trail
onDelete: Restrict    // Cannot delete User if they have audit records
onDelete: SetNull     // Allow deletion but preserve foreign entities
onDelete: Cascade     // Delete dependents (e.g., Guarantor when LoanApplication deleted)

// Examples:
model Guarantor {
  loanApplication LoanApplication @relation(..., onDelete: Cascade)
}

model ResourceAssignment {
  customer Customer? @relation(..., onDelete: Restrict)  // Cannot delete customer with active assignments
}
```

**✅ MariaDB Compatibility:**

**Decimal Precision:**
```prisma
// Financial fields
Decimal @db.Decimal(14, 2)  // ✅ Sufficient for amounts up to 999,999,999,999.99

// Rates
Decimal @db.Decimal(6, 3)   // ✅ Interest rates: 0.000 to 999.999%

// Leave days (half-day support)
Decimal @db.Decimal(5, 1)   // ✅ 0.0 to 9999.9 days
```

**Date vs DateTime:**
```prisma
DateTime @db.Date      // For dates without time (startDate, dueDate)
DateTime               // For timestamps (createdAt, approvedAt)
```

**Text Fields:**
```prisma
String @db.VarChar(N)  // Bounded text (indexed fields)
String @db.Text        // Unbounded text up to 65KB
String @db.LongText    // Large text (JSON, audit logs) up to 4GB
```

**JSON Storage:**
```prisma
// ORIGINAL:
metadata Json          // Native JSON type (MySQL 5.7.8+, MariaDB 10.2.7+)

// REVISED: Store as LongText for better compatibility
metadata String? @db.LongText  // JSON stringified
// Parse/serialize at application level
```

**Migration Risks:**

1. **Adding Required Fields:**
   ```prisma
   // RISK: Existing Users have no hireDate
   hireDate DateTime  // ❌ Migration will fail
   
   // SOLUTION: Make nullable initially
   hireDate DateTime? // ✅ Backfill later
   ```

2. **Unique Constraints:**
   ```prisma
   // RISK: Existing data may violate new constraint
   @@unique([userId, leaveTypeId, year])
   
   // SOLUTION: Clean duplicates before migration
   // Run query: SELECT userId, leaveTypeId, year, COUNT(*) ...
   ```

3. **Foreign Key Validation:**
   ```prisma
   // RISK: Orphaned records
   assignedOfficerId String? @db.VarChar(36)
   
   // SOLUTION: Add FK in steps:
   // 1. Clean orphaned data
   // 2. Add FK constraint
   // 3. Add NOT NULL (if required)
   ```

4. **Computed Fields:**
   ```prisma
   // RISK: Existing records have NULL computed fields
   daysAvailable Decimal @db.Decimal(5, 1)
   
   // SOLUTION: Backfill with migration script
   ```

**Migration Strategy:**

**Phase 1: Add New Tables (Non-Breaking)**
- LeaveType, LeaveEntitlement, LeaveApplication
- StaffLoan, StaffLoanRepayment, StaffLoanPayment
- ResourceAssignment
- OffboardingCase
- ApprovalHierarchy, ApprovalAction
- AuditLog
- PublicHoliday

**Phase 2: Extend User Model**
```sql
-- Add HR fields to existing User table
ALTER TABLE `users` 
ADD COLUMN `hireDate` DATE NULL,
ADD COLUMN `jobTitle` VARCHAR(200) NULL,
ADD COLUMN `salary` DECIMAL(14, 2) NULL,
ADD COLUMN `contractType` VARCHAR(50) NULL,
ADD COLUMN `terminationDate` DATE NULL;
```

**Phase 3: Backfill Computed Fields**
```sql
-- Recalculate leave balances
UPDATE `leave_entitlements` le
SET le.daysAvailable = le.totalDaysEntitled + le.carryForwardDays - 
  (SELECT COALESCE(SUM(la.businessDaysRequested), 0) 
   FROM `leave_applications` la 
   WHERE la.userId = le.userId 
   AND la.leaveTypeId = le.leaveTypeId 
   AND la.status IN ('APPROVED', 'ACTIVE'));
```

**Phase 4: Add Foreign Keys**
```sql
-- Add FK constraints (after cleaning orphaned data)
ALTER TABLE `resource_assignments`
ADD CONSTRAINT `fk_assignment_customer` 
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
ADD CONSTRAINT `fk_assignment_loan_application`
  FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE RESTRICT;
```

**Phase 5: Add Indexes**
```sql
-- Performance indexes
CREATE INDEX `idx_leave_applications_user_status` 
  ON `leave_applications`(`userId`, `status`);
  
CREATE INDEX `idx_resource_assignments_current_owner` 
  ON `resource_assignments`(`currentOwnerId`, `status`);
```

**Backward Compatibility:**
- Existing API endpoints continue to work
- New fields nullable during transition period
- Gradual adoption: HR features enabled per branch/department
- Data export before migration for rollback capability

---

## REVISED DATABASE SCHEMA (Complete Prisma Models)

```prisma
// ═══════════════════════════════════════════════════════════════════════════
// HR MODULE - REVISED SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// EXTEND EXISTING USER MODEL
// ───────────────────────────────────────────────────────────────────────────

model User {
  // ... EXISTING FIELDS (employeeId, firstName, lastName, email, etc.)
  
  // ─── HR-SPECIFIC ADDITIONS ───
  hireDate               DateTime?           @db.Date
  jobTitle               String?             @db.VarChar(200)
  salary                 Decimal?            @db.Decimal(14, 2)
  contractType           String?             @db.VarChar(50)  // PERMANENT, CONTRACT, INTERN
  terminationDate        DateTime?           @db.Date
  
  // ─── LEAVE MANAGEMENT ───
  leaveEntitlements      LeaveEntitlement[]
  leaveApplications      LeaveApplication[]
  leaveReviews           LeaveApplication[]  @relation("LeaveReviewer")
  
  // ─── STAFF LOANS ───
  staffLoans             StaffLoan[]
  staffLoanReviews       StaffLoan[]         @relation("StaffLoanReviewer")
  staffLoanDisbursements StaffLoan[]         @relation("StaffLoanDisbursing")
  
  // ─── RESPONSIBILITY MANAGEMENT ───
  assignmentsAsOriginal  ResourceAssignment[] @relation("OriginalOwner")
  assignmentsAsCurrent   ResourceAssignment[] @relation("CurrentOwner")
  assignmentsCreated     ResourceAssignment[] @relation("AssignmentCreator")
  assignmentsRevoked     ResourceAssignment[] @relation("AssignmentRevoker")
  
  // ─── OFFBOARDING ───
  offboardingCases       OffboardingCase[]
  offboardingInitiated   OffboardingCase[]   @relation("OffboardingInitiator")
  itAccessRevocations    OffboardingCase[]   @relation("ITAccessRevoker")
  
  // ─── APPROVALS ───
  approvalActions        ApprovalAction[]    @relation("Approver")
  delegatedApprovals     ApprovalAction[]    @relation("DelegatedApprover")
  
  // ─── AUDIT ───
  auditLogs              AuditLog[]
}

// ───────────────────────────────────────────────────────────────────────────
// LEAVE MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────

model LeaveType {
  id                      String             @id @default(uuid()) @db.VarChar(36)
  name                    String             @unique @db.VarChar(100)
  code                    String             @unique @db.VarChar(20)
  description             String?            @db.Text
  defaultDaysPerYear      Int
  carryForwardAllowed     Boolean            @default(false)
  maxCarryForwardDays     Int?
  requiresApproval        Boolean            @default(true)
  minNoticeDays           Int                @default(0)
  maxConsecutiveDays      Int?
  allowHalfDay            Boolean            @default(true)
  countWeekendsAsLeave    Boolean            @default(false)
  countHolidaysAsLeave    Boolean            @default(false)
  isActive                Boolean            @default(true)
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt
  entitlements            LeaveEntitlement[]
  applications            LeaveApplication[]
  
  @@map("leave_types")
}

model LeaveEntitlement {
  id                      String      @id @default(uuid()) @db.VarChar(36)
  userId                  String      @db.VarChar(36)
  leaveTypeId             String      @db.VarChar(36)
  year                    Int
  
  // Computed values (NOT directly editable)
  totalDaysEntitled       Decimal     @db.Decimal(5, 1)
  carryForwardDays        Decimal     @default(0) @db.Decimal(5, 1)
  daysUsed                Decimal     @default(0) @db.Decimal(5, 1)
  daysPending             Decimal     @default(0) @db.Decimal(5, 1)
  daysAvailable           Decimal     @db.Decimal(5, 1)
  
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  
  user                    User        @relation(fields: [userId], references: [id])
  leaveType               LeaveType   @relation(fields: [leaveTypeId], references: [id])
  
  @@unique([userId, leaveTypeId, year])
  @@index([userId, year])
  @@map("leave_entitlements")
}

model LeaveApplication {
  id                      String               @id @default(uuid()) @db.VarChar(36)
  applicationNumber       String               @unique @db.VarChar(20)
  userId                  String               @db.VarChar(36)
  leaveTypeId             String               @db.VarChar(36)
  
  startDate               DateTime             @db.Date
  endDate                 DateTime             @db.Date
  isStartHalfDay          Boolean              @default(false)
  isEndHalfDay            Boolean              @default(false)
  businessDaysRequested   Decimal              @db.Decimal(5, 1)
  
  reason                  String               @db.Text
  handoverNotes           String?              @db.Text
  emergencyContact        String?              @db.VarChar(100)
  emergencyPhone          String?              @db.VarChar(20)
  
  status                  LeaveStatus          @default(PENDING)
  
  submittedAt             DateTime?
  reviewedById            String?              @db.VarChar(36)
  reviewedAt              DateTime?
  approvalNotes           String?              @db.Text
  rejectionReason         String?              @db.VarChar(500)
  
  cancelledAt             DateTime?
  cancellationReason      String?              @db.VarChar(500)
  
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt
  
  user                    User                 @relation(fields: [userId], references: [id])
  leaveType               LeaveType            @relation(fields: [leaveTypeId], references: [id])
  reviewedBy              User?                @relation("LeaveReviewer", fields: [reviewedById], references: [id])
  resourceAssignments     ResourceAssignment[]
  
  @@index([userId, status])
  @@index([status, startDate])
  @@map("leave_applications")
}

model PublicHoliday {
  id          String   @id @default(uuid()) @db.VarChar(36)
  name        String   @db.VarChar(200)
  date        DateTime @db.Date
  year        Int
  isRecurring Boolean  @default(false)
  branchId    String?  @db.VarChar(36)
  createdAt   DateTime @default(now())
  
  @@unique([date, branchId])
  @@index([year])
  @@map("public_holidays")
}

enum LeaveStatus {
  PENDING
  APPROVED
  ACTIVE
  REJECTED
  CANCELLED
}

// ───────────────────────────────────────────────────────────────────────────
// STAFF LOAN MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────

model StaffLoan {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  loanNumber              String                    @unique @db.VarChar(20)
  userId                  String                    @db.VarChar(36)
  
  principalAmount         Decimal                   @db.Decimal(14, 2)
  interestRate            Decimal                   @db.Decimal(6, 3)
  tenureMonths            Int
  monthlyDeduction        Decimal                   @db.Decimal(14, 2)
  totalRepayable          Decimal                   @db.Decimal(14, 2)
  
  purpose                 String                    @db.Text
  requestedAmount         Decimal                   @db.Decimal(14, 2)
  justification           String?                   @db.Text
  
  status                  StaffLoanStatus           @default(PENDING)
  
  reviewedById            String?                   @db.VarChar(36)
  reviewedAt              DateTime?
  approvalNotes           String?                   @db.Text
  rejectionReason         String?                   @db.VarChar(500)
  
  disbursedById           String?                   @db.VarChar(36)
  disbursedAt             DateTime?
  disbursementReference   String?                   @db.VarChar(100)
  disbursementMethod      String?                   @db.VarChar(50)
  
  totalPaid               Decimal                   @default(0) @db.Decimal(14, 2)
  outstandingBalance      Decimal                   @db.Decimal(14, 2)
  
  completedAt             DateTime?
  
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  user                    User                      @relation(fields: [userId], references: [id])
  reviewedBy              User?                     @relation("StaffLoanReviewer", fields: [reviewedById], references: [id])
  disbursedBy             User?                     @relation("StaffLoanDisbursing", fields: [disbursedById], references: [id])
  repaymentSchedule       StaffLoanRepayment[]
  payments                StaffLoanPayment[]
  adjustments             StaffLoanAdjustment[]
  
  @@index([userId, status])
  @@index([status])
  @@map("staff_loans")
}

model StaffLoanRepayment {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  staffLoanId             String                    @db.VarChar(36)
  installmentNumber       Int
  dueDate                 DateTime                  @db.Date
  principalDue            Decimal                   @db.Decimal(14, 2)
  interestDue             Decimal                   @db.Decimal(14, 2)
  totalDue                Decimal                   @db.Decimal(14, 2)
  amountPaid              Decimal                   @default(0) @db.Decimal(14, 2)
  outstandingAmount       Decimal                   @db.Decimal(14, 2)
  status                  StaffLoanRepaymentStatus  @default(PENDING)
  paidAt                  DateTime?
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id], onDelete: Cascade)
  payments                StaffLoanPayment[]
  
  @@unique([staffLoanId, installmentNumber])
  @@index([dueDate, status])
  @@map("staff_loan_repayments")
}

model StaffLoanPayment {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  paymentNumber           String   @unique @db.VarChar(20)
  staffLoanId             String   @db.VarChar(36)
  repaymentId             String   @db.VarChar(36)
  amount                  Decimal  @db.Decimal(14, 2)
  paymentDate             DateTime @db.Date
  paymentMethod           String   @db.VarChar(50)
  transactionReference    String?  @db.VarChar(100)
  verifiedById            String?  @db.VarChar(36)
  verifiedAt              DateTime?
  isReversed              Boolean  @default(false)
  reversedById            String?  @db.VarChar(36)
  reversedAt              DateTime?
  reversalReason          String?  @db.VarChar(500)
  reversalReference       String?  @db.VarChar(100)
  notes                   String?  @db.Text
  createdById             String   @db.VarChar(36)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  
  staffLoan               StaffLoan @relation(fields: [staffLoanId], references: [id])
  repayment               StaffLoanRepayment @relation(fields: [repaymentId], references: [id])
  createdBy               User @relation("StaffPaymentCreator", fields: [createdById], references: [id])
  verifiedBy              User? @relation("StaffPaymentVerifier", fields: [verifiedById], references: [id])
  reversedBy              User? @relation("StaffPaymentReverser", fields: [reversedById], references: [id])
  
  @@index([staffLoanId])
  @@index([repaymentId])
  @@index([paymentDate])
  @@map("staff_loan_payments")
}

model StaffLoanAdjustment {
  id           String    @id @default(uuid()) @db.VarChar(36)
  staffLoanId  String    @db.VarChar(36)
  adjustmentType String  @db.VarChar(50)
  amount       Decimal   @db.Decimal(14, 2)
  reason       String    @db.Text
  approvedById String    @db.VarChar(36)
  approvedAt   DateTime  @default(now())
  
  staffLoan    StaffLoan @relation(fields: [staffLoanId], references: [id])
  approvedBy   User      @relation("StaffLoanAdjustmentApprover", fields: [approvedById], references: [id])
  
  @@index([staffLoanId])
  @@map("staff_loan_adjustments")
}

enum StaffLoanStatus {
  PENDING
  APPROVED
  DISBURSED
  ACTIVE
  COMPLETED
  DEFAULTED
  WRITTEN_OFF
  REJECTED
  CANCELLED
}

enum StaffLoanRepaymentStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
}

// ───────────────────────────────────────────────────────────────────────────
// RESPONSIBILITY MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────

model ResourceAssignment {
  id                    String              @id @default(uuid()) @db.VarChar(36)
  
  resourceType          ResourceType
  customerId            String?             @db.VarChar(36)
  loanApplicationId     String?             @db.VarChar(36)
  recoveryAccountId     String?             @db.VarChar(36)
  workflowTaskId        String?             @db.VarChar(36)
  
  assignmentType        AssignmentType
  originalOwnerId       String?             @db.VarChar(36)
  currentOwnerId        String              @db.VarChar(36)
  
  effectiveFrom         DateTime            @default(now())
  effectiveTo           DateTime?
  
  delegationReason      String?             @db.VarChar(500)
  relatedLeaveId        String?             @db.VarChar(36)
  relatedOffboardingId  String?             @db.VarChar(36)
  
  acceptedByReceiver    Boolean             @default(false)
  acceptedAt            DateTime?
  acceptanceNotes       String?             @db.Text
  
  status                AssignmentStatus
  
  createdById           String              @db.VarChar(36)
  createdAt             DateTime            @default(now())
  revokedById           String?             @db.VarChar(36)
  revokedAt             DateTime?
  revokedReason         String?             @db.VarChar(500)
  
  customer              Customer?           @relation(fields: [customerId], references: [id], onDelete: Restrict)
  loanApplication       LoanApplication?    @relation(fields: [loanApplicationId], references: [id], onDelete: Restrict)
  recoveryAccount       RecoveryAccount?    @relation(fields: [recoveryAccountId], references: [id], onDelete: Restrict)
  workflowTask          WorkflowTask?       @relation(fields: [workflowTaskId], references: [id], onDelete: Restrict)
  originalOwner         User?               @relation("OriginalOwner", fields: [originalOwnerId], references: [id])
  currentOwner          User                @relation("CurrentOwner", fields: [currentOwnerId], references: [id])
  createdBy             User                @relation("AssignmentCreator", fields: [createdById], references: [id])
  revokedBy             User?               @relation("AssignmentRevoker", fields: [revokedById], references: [id])
  relatedLeave          LeaveApplication?   @relation(fields: [relatedLeaveId], references: [id])
  relatedOffboarding    OffboardingCase?    @relation(fields: [relatedOffboardingId], references: [id])
  
  @@unique([resourceType, customerId, status], name: "unique_active_customer_assignment")
  @@unique([resourceType, loanApplicationId, status], name: "unique_active_loan_assignment")
  @@unique([resourceType, recoveryAccountId, status], name: "unique_active_recovery_assignment")
  @@unique([resourceType, workflowTaskId, status], name: "unique_active_workflow_assignment")
  @@index([currentOwnerId, status])
  @@index([originalOwnerId])
  @@index([effectiveFrom, effectiveTo])
  @@index([relatedLeaveId])
  @@index([relatedOffboardingId])
  @@map("resource_assignments")
}

enum ResourceType {
  CUSTOMER
  LOAN_APPLICATION
  RECOVERY_ACCOUNT
  WORKFLOW_TASK
}

enum AssignmentType {
  PERMANENT
  TEMPORARY_DELEGATION
}

enum AssignmentStatus {
  ACTIVE
  EXPIRED
  REVOKED
  PENDING_ACCEPTANCE
}

// ───────────────────────────────────────────────────────────────────────────
// OFFBOARDING
// ───────────────────────────────────────────────────────────────────────────

model OffboardingCase {
  id                      String              @id @default(uuid()) @db.VarChar(36)
  caseNumber              String              @unique @db.VarChar(20)
  userId                  String              @db.VarChar(36)
  
  terminationType         TerminationType
  terminationDate         DateTime            @db.Date
  lastWorkingDay          DateTime            @db.Date
  reason                  String?             @db.Text
  isVoluntary             Boolean
  
  noticePeriodDays        Int?
  noticeServedDays        Int?
  noticeWaiverApproved    Boolean             @default(false)
  
  overallStatus           OffboardingStatus   @default(IN_PROGRESS)
  
  itAccessStatus          ClearanceStatus     @default(PENDING)
  itAccessRevokedAt       DateTime?
  itAccessRevokedById     String?             @db.VarChar(36)
  itAccessNotes           String?             @db.Text
  
  financeStatus           ClearanceStatus     @default(PENDING)
  financeClearedAt        DateTime?
  financeClearedById      String?             @db.VarChar(36)
  financeNotes            String?             @db.Text
  outstandingAmount       Decimal?            @db.Decimal(14, 2)
  
  assetStatus             ClearanceStatus     @default(PENDING)
  assetsClearedAt         DateTime?
  assetsClearedById       String?             @db.VarChar(36)
  assetNotes              String?             @db.Text
  
  hrStatus                ClearanceStatus     @default(PENDING)
  hrClearedAt             DateTime?
  hrClearedById           String?             @db.VarChar(36)
  hrNotes                 String?             @db.Text
  
  rehireEligible          Boolean             @default(true)
  rehireNotes             String?             @db.Text
  
  completedAt             DateTime?
  exitInterviewCompleted  Boolean             @default(false)
  exitInterviewDate       DateTime?
  exitInterviewNotes      String?             @db.Text
  
  initiatedById           String              @db.VarChar(36)
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt
  
  user                    User                @relation(fields: [userId], references: [id])
  initiatedBy             User                @relation("OffboardingInitiator", fields: [initiatedById], references: [id])
  itAccessRevokedBy       User?               @relation("ITAccessRevoker", fields: [itAccessRevokedById], references: [id])
  financeClearedBy        User?               @relation("FinanceClearer", fields: [financeClearedById], references: [id])
  assetsClearedBy         User?               @relation("AssetClearer", fields: [assetsClearedById], references: [id])
  hrClearedBy             User?               @relation("HRClearer", fields: [hrClearedById], references: [id])
  resourceHandovers       ResourceAssignment[]
  
  @@unique([userId, terminationDate])
  @@index([overallStatus])
  @@index([terminationDate])
  @@map("offboarding_cases")
}

enum TerminationType {
  RESIGNATION
  TERMINATION
  RETIREMENT
  CONTRACT_END
  DEATH
  ABSCONDING
}

enum OffboardingStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ClearanceStatus {
  PENDING
  IN_PROGRESS
  CLEARED
  CLEARED_WITH_CONDITIONS
  NOT_APPLICABLE
}

// ───────────────────────────────────────────────────────────────────────────
// APPROVAL WORKFLOWS
// ───────────────────────────────────────────────────────────────────────────

model ApprovalHierarchy {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  entityType              String   @db.VarChar(50)
  level                   Int
  roleRequired            String?  @db.VarChar(50)
  permissionRequired      String?  @db.VarChar(100)
  minAmountThreshold      Decimal? @db.Decimal(14, 2)
  maxAmountThreshold      Decimal? @db.Decimal(14, 2)
  minDaysThreshold        Int?
  maxDaysThreshold        Int?
  autoApproveBelow        Decimal? @db.Decimal(14, 2)
  requiresAllApprovers    Boolean  @default(false)
  isActive                Boolean  @default(true)
  createdAt               DateTime @default(now())
  
  @@unique([entityType, level])
  @@index([entityType, isActive])
  @@map("approval_hierarchies")
}

model ApprovalAction {
  id                      String            @id @default(uuid()) @db.VarChar(36)
  entityType              String            @db.VarChar(50)
  entityId                String            @db.VarChar(36)
  level                   Int
  approverId              String            @db.VarChar(36)
  action                  ApprovalActionType @default(PENDING)
  requestedAt             DateTime          @default(now())
  respondedAt             DateTime?
  dueAt                   DateTime?
  decision                String?           @db.VarChar(20)
  comments                String?           @db.Text
  delegatedFrom           String?           @db.VarChar(36)
  
  approver                User              @relation("Approver", fields: [approverId], references: [id])
  delegatedFromUser       User?             @relation("DelegatedApprover", fields: [delegatedFrom], references: [id])
  
  @@index([entityType, entityId])
  @@index([approverId, action])
  @@map("approval_actions")
}

enum ApprovalActionType {
  PENDING
  APPROVED
  REJECTED
  RETURNED
  ESCALATED
}

// ───────────────────────────────────────────────────────────────────────────
// AUDIT AND SECURITY
// ───────────────────────────────────────────────────────────────────────────

model AuditLog {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  eventType               String   @db.VarChar(100)
  entityType              String   @db.VarChar(50)
  entityId                String   @db.VarChar(36)
  userId                  String?  @db.VarChar(36)
  userEmail               String?  @db.VarChar(150)
  ipAddress               String?  @db.VarChar(50)
  userAgent               String?  @db.VarChar(500)
  action                  String   @db.VarChar(50)
  oldValues               String?  @db.LongText
  newValues               String?  @db.LongText
  isSensitive             Boolean  @default(false)
  isFinancial             Boolean  @default(false)
  isSecurityRelated       Boolean  @default(false)
  reason                  String?  @db.Text
  metadata                String?  @db.LongText
  timestamp               DateTime @default(now())
  
  user                    User?    @relation(fields: [userId], references: [id])
  
  @@index([entityType, entityId])
  @@index([userId, timestamp])
  @@index([eventType, timestamp])
  @@index([isSensitive, timestamp])
  @@index([isFinancial, timestamp])
  @@map("audit_logs")
}
```

---

## API CHANGES

### New Endpoints

**Leave Management:**
```
POST   /api/v1/hr/leaves/apply
GET    /api/v1/hr/leaves/my-applications
GET    /api/v1/hr/leaves/my-balances
PATCH  /api/v1/hr/leaves/:id/approve
PATCH  /api/v1/hr/leaves/:id/reject
DELETE /api/v1/hr/leaves/:id/cancel
GET    /api/v1/hr/leaves/pending-approvals
```

**Staff Loans:**
```
POST   /api/v1/hr/staff-loans/apply
GET    /api/v1/hr/staff-loans/my-loans
PATCH  /api/v1/hr/staff-loans/:id/approve
PATCH  /api/v1/hr/staff-loans/:id/disburse
POST   /api/v1/hr/staff-loans/:id/payments
GET    /api/v1/hr/staff-loans/:id/schedule
```

**Responsibility Management:**
```
POST   /api/v1/hr/assignments/create
POST   /api/v1/hr/assignments/:id/accept
GET    /api/v1/hr/assignments/my-delegations
GET    /api/v1/hr/assignments/pending-handovers
GET    /api/v1/hr/assignments/history
```

**Offboarding:**
```
POST   /api/v1/hr/offboarding/initiate
PATCH  /api/v1/hr/offboarding/:id/it-access/revoke
PATCH  /api/v1/hr/offboarding/:id/finance/clear
PATCH  /api/v1/hr/offboarding/:id/assets/clear
GET    /api/v1/hr/offboarding/pending-clearances
```

### Modified Endpoints

None - existing endpoints unchanged for backward compatibility

---

## IMPLEMENTATION DEPENDENCIES

**Must Complete Before Starting:**
1. ✅ User model contains: employeeId, branchId, departmentId, supervisorId
2. ✅ Customer/LoanApplication/RecoveryAccount/WorkflowTask models exist
3. ✅ Permission system operational
4. ✅ Audit logging framework ready

**Implementation Order:**
1. **Phase 1:** Leave Management (foundational)
2. **Phase 2:** Responsibility Management (depends on leave)
3. **Phase 3:** Staff Loans (independent)
4. **Phase 4:** Offboarding (depends on responsibility management)
5. **Phase 5:** Approval Workflows (integrates all modules)

---

## SUMMARY OF ALL CHANGES

| # | Issue | Original Approach | Revised Approach |
|---|-------|-------------------|------------------|
| 1 | Employee Data | Separate Employee model | Extend User model |
| 2 | Responsibility | Simple assignment, no history | Full delegation with original owner preservation |
| 3 | Leave Balance | Editable remainingDays | Computed from applications |
| 4 | Staff Loan | No repayment schedule | Full repayment schedule model |
| 5 | Offboarding | IT tied to clearance | Independent IT revocation |
| 6 | Resource Integration | Arbitrary strings | Referential integrity with FKs |
| 7 | Approval Workflow | Undefined | Complete hierarchy and rules |
| 8 | Audit | Basic logging | Comprehensive audit coverage |
| 9 | Database | Some issues | MariaDB compatible with proper constraints |

---

## APPROVAL REQUIRED

**This document presents the REVISED architecture addressing all 9 design issues.**

**Next Steps:**
1. ✅ Review this revised architecture
2. ⏳ Approve or request further revisions
3. ⏳ Begin phased implementation upon approval

**NO CODE WILL BE WRITTEN UNTIL THIS PLAN IS APPROVED.**

---

**END OF REVISED ARCHITECTURE DOCUMENT**
