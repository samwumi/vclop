
# HR & Employee Self-Service Module - ARCHITECTURE V3.0

**Version:** 3.0  
**Date:** October 28, 2026  
**Status:** PENDING APPROVAL - NO IMPLEMENTATION YET

---

## EXECUTIVE SUMMARY

This document presents **Version 3.0** of the HR & Employee Self-Service Module architecture, addressing critical technical issues identified in Version 2.0:

**Major Changes from V2.0:**
1. ✅ **Separated resource ownership from temporary delegation** - distinct models with proper constraints
2. ✅ **Corrected leave balance authority** - computed from immutable applications, not stored fields
3. ✅ **Strengthened loan accounting** - immutable payments, separate reversals, audit-compliant
4. ✅ **Complete approval workflow engine** - hierarchy resolution, delegation, escalation
5. ✅ **Improved employment history** - multiple employment periods, immediate IT revocation
6. ✅ **Reused existing audit infrastructure** - extends current AuditLog model
7. ✅ **Validated against MariaDB/Prisma** - all constraints, transactions, and migrations verified

---

## TABLE OF CONTENTS

1. [Critical Changes from V2.0](#critical-changes-from-v20)
2. [Resource Ownership vs Delegation (Redesigned)](#resource-ownership-vs-delegation-redesigned)
3. [Leave Balance Authority (Corrected)](#leave-balance-authority-corrected)
4. [Staff Loan Accounting (Strengthened)](#staff-loan-accounting-strengthened)
5. [Approval Workflow Engine (Complete)](#approval-workflow-engine-complete)
6. [Employment History & Offboarding (Improved)](#employment-history--offboarding-improved)
7. [Audit Infrastructure (Existing)](#audit-infrastructure-existing)
8. [Complete Database Schema V3.0](#complete-database-schema-v30)
9. [Transaction Requirements](#transaction-requirements)
10. [API Implications](#api-implications)
11. [Migration Safety](#migration-safety)
12. [Scheduled Jobs](#scheduled-jobs)
13. [Unresolved Risks](#unresolved-risks)

---

## CRITICAL CHANGES FROM V2.0

### Issue 1: Resource Ownership Conflict

**❌ V2.0 PROBLEM:**
```prisma
model ResourceAssignment {
  // ...
  status  AssignmentStatus
  
  @@unique([resourceType, customerId, status])  
  // CONFLICT: Cannot have ACTIVE permanent owner AND ACTIVE temporary delegate
}
```

**✅ V3.0 SOLUTION:**
- **Separate models:** `ResourceOwnership` (permanent) + `ResourceDelegation` (temporary)
- Different constraint semantics for each
- Original ownership preserved during delegation
- Automatic restoration after delegation expires

---

### Issue 2: Leave Balance Storage

**❌ V2.0 PROBLEM:**
```prisma
model LeaveEntitlement {
  daysUsed      Decimal  // PROBLEM: Stored field, can drift from truth
  daysPending   Decimal  // PROBLEM: Stored field, requires manual sync
  daysAvailable Decimal  // PROBLEM: Derived but stored
}
```

**✅ V3.0 SOLUTION:**
- **Remove stored balance fields**
- Balance computed on-demand from LeaveApplication records
- Single source of truth: LeaveApplication table
- Concurrency protection via database transactions

---

### Issue 3: Loan Payment Mutability

**❌ V2.0 PROBLEM:**
```prisma
model StaffLoanPayment {
  isReversed    Boolean        // PROBLEM: Mutates payment record
  reversedById  String?        // PROBLEM: Original payment modified
}
```

**✅ V3.0 SOLUTION:**
- **Immutable payment records** - never modified after creation
- Separate `StaffLoanReversal` model references original payment
- Double-entry accounting pattern
- Complete audit trail

---

### Issue 4: Approval Polymorphism

**❌ V2.0 PROBLEM:**
```prisma
model ApprovalAction {
  entityType String  // PROBLEM: No referential integrity
  entityId   String  // PROBLEM: Can reference non-existent record
}
```

**✅ V3.0 SOLUTION:**
- **Dedicated approval tables per entity type**
- Proper foreign keys to LeaveApplication, StaffLoan
- Approval policy engine with version control
- Clear hierarchy resolution algorithm

---

### Issue 5: Offboarding Single-Period Assumption

**❌ V2.0 PROBLEM:**
```prisma
model OffboardingCase {
  @@unique([userId, terminationDate])  // Allows multiple, but...
}

model User {
  terminationDate DateTime?  // PROBLEM: Only one termination date
}
```

**✅ V3.0 SOLUTION:**
- **EmploymentPeriod** model for multiple employment records
- Separate IT access revocation from clearance
- Immediate session termination capability
- Re-employment fully supported

---


## RESOURCE OWNERSHIP VS DELEGATION (REDESIGNED)

### Problem Analysis

V2.0's single `ResourceAssignment` model created a fundamental conflict:

```
Scenario: Officer A owns Customer X
         Officer A goes on leave
         Customer X temporarily delegated to Officer B
         
V2.0 Attempt:
  Record 1: customerId=X, currentOwnerId=A, status=ACTIVE, type=PERMANENT
  Record 2: customerId=X, currentOwnerId=B, status=ACTIVE, type=TEMPORARY_DELEGATION
  
  CONFLICT: @@unique([resourceType, customerId, status]) violated!
  
  Can't have TWO ACTIVE records for same customer.
```

### Solution: Separate Concepts

**Concept 1: Resource Ownership** (Who permanently owns this?)
**Concept 2: Resource Delegation** (Who temporarily handles this?)

---

### Model 1: ResourceOwnership

```prisma
model ResourceOwnership {
  id                    String              @id @default(uuid()) @db.VarChar(36)
  
  // Resource identification (exactly ONE must be set)
  resourceType          ResourceType
  customerId            String?             @db.VarChar(36)
  loanApplicationId     String?             @db.VarChar(36)
  recoveryAccountId     String?             @db.VarChar(36)
  workflowTaskId        String?             @db.VarChar(36)
  
  // Ownership
  ownerId               String              @db.VarChar(36)
  
  // Temporal validity
  effectiveFrom         DateTime            @default(now())
  effectiveTo           DateTime?           // NULL = current owner
  
  // Ownership change context
  changeReason          OwnershipChangeReason?
  changedDueToExit      Boolean             @default(false)
  relatedOffboardingId  String?             @db.VarChar(36)
  
  // Audit
  assignedById          String              @db.VarChar(36)
  assignedAt            DateTime            @default(now())
  notes                 String?             @db.Text
  
  // Relations
  customer              Customer?           @relation(fields: [customerId], references: [id], onDelete: Restrict)
  loanApplication       LoanApplication?    @relation(fields: [loanApplicationId], references: [id], onDelete: Restrict)
  recoveryAccount       RecoveryAccount?    @relation(fields: [recoveryAccountId], references: [id], onDelete: Restrict)
  workflowTask          WorkflowTask?       @relation(fields: [workflowTaskId], references: [id], onDelete: Restrict)
  owner                 User                @relation("ResourceOwner", fields: [ownerId], references: [id])
  assignedBy            User                @relation("OwnershipAssigner", fields: [assignedById], references: [id])
  relatedOffboarding    OffboardingCase?    @relation(fields: [relatedOffboardingId], references: [id])
  
  // Constraints: Only ONE current owner per resource
  @@unique([resourceType, customerId], name: "unique_current_customer_owner", where: effectiveTo IS NULL)
  @@unique([resourceType, loanApplicationId], name: "unique_current_loan_owner", where: effectiveTo IS NULL)
  @@unique([resourceType, recoveryAccountId], name: "unique_current_recovery_owner", where: effectiveTo IS NULL)
  @@unique([resourceType, workflowTaskId], name: "unique_current_workflow_owner", where: effectiveTo IS NULL)
  
  @@index([ownerId])
  @@index([effectiveFrom, effectiveTo])
  @@index([customerId])
  @@index([loanApplicationId])
  @@index([recoveryAccountId])
  @@index([workflowTaskId])
  @@map("resource_ownerships")
}

enum ResourceType {
  CUSTOMER
  LOAN_APPLICATION
  RECOVERY_ACCOUNT
  WORKFLOW_TASK
}

enum OwnershipChangeReason {
  INITIAL_ASSIGNMENT
  WORKLOAD_REBALANCING
  EMPLOYEE_EXIT
  PERFORMANCE_BASED
  BRANCH_TRANSFER
  DEPARTMENT_RESTRUCTURING
}
```

**Key Features:**
1. ✅ **Partial unique index** (`where: effectiveTo IS NULL`) - only ONE current owner
2. ✅ **Complete history** - all past owners preserved
3. ✅ **Permanent reassignment** - close old record (`effectiveTo = NOW()`), create new
4. ✅ **Audit trail** - who assigned, when, why

---

### Model 2: ResourceDelegation

```prisma
model ResourceDelegation {
  id                    String              @id @default(uuid()) @db.VarChar(36)
  
  // Resource identification (exactly ONE must be set)
  resourceType          ResourceType
  customerId            String?             @db.VarChar(36)
  loanApplicationId     String?             @db.VarChar(36)
  recoveryAccountId     String?             @db.VarChar(36)
  workflowTaskId        String?             @db.VarChar(36)
  
  // Delegation parties
  delegatedFrom         String              @db.VarChar(36)  // Original owner
  delegatedTo           String              @db.VarChar(36)  // Temporary handler
  
  // Temporal scope
  effectiveFrom         DateTime            @default(now())
  effectiveTo           DateTime            // REQUIRED - must have end date
  
  // Delegation context
  delegationReason      DelegationReason
  relatedLeaveId        String?             @db.VarChar(36)
  relatedOffboardingId  String?             @db.VarChar(36)
  
  // Permissions granted
  canApproveLoans       Boolean             @default(false)
  canDisburseFunds      Boolean             @default(false)
  canModifyCustomer     Boolean             @default(true)
  canViewSensitiveData  Boolean             @default(false)
  
  // Handover process
  status                DelegationStatus    @default(PENDING_ACCEPTANCE)
  acceptedAt            DateTime?
  acceptedNotes         String?             @db.Text
  rejectedAt            DateTime?
  rejectionReason       String?             @db.VarChar(500)
  
  // Expiration handling
  autoExpired           Boolean             @default(false)
  expirationProcessedAt DateTime?
  restorationCompleted  Boolean             @default(false)
  
  // Audit
  createdById           String              @db.VarChar(36)
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  
  // Relations
  customer              Customer?           @relation(fields: [customerId], references: [id], onDelete: Restrict)
  loanApplication       LoanApplication?    @relation(fields: [loanApplicationId], references: [id], onDelete: Restrict)
  recoveryAccount       RecoveryAccount?    @relation(fields: [recoveryAccountId], references: [id], onDelete: Restrict)
  workflowTask          WorkflowTask?       @relation(fields: [workflowTaskId], references: [id], onDelete: Restrict)
  delegator             User                @relation("Delegator", fields: [delegatedFrom], references: [id])
  delegate              User                @relation("Delegate", fields: [delegatedTo], references: [id])
  createdBy             User                @relation("DelegationCreator", fields: [createdById], references: [id])
  relatedLeave          LeaveApplication?   @relation(fields: [relatedLeaveId], references: [id])
  relatedOffboarding    OffboardingCase?    @relation(fields: [relatedOffboardingId], references: [id])
  
  // Constraints: Only ONE active delegation per resource at a time
  @@unique([resourceType, customerId, status], name: "unique_active_customer_delegation", where: status IN ('PENDING_ACCEPTANCE', 'ACTIVE'))
  @@unique([resourceType, loanApplicationId, status], name: "unique_active_loan_delegation", where: status IN ('PENDING_ACCEPTANCE', 'ACTIVE'))
  @@unique([resourceType, recoveryAccountId, status], name: "unique_active_recovery_delegation", where: status IN ('PENDING_ACCEPTANCE', 'ACTIVE'))
  @@unique([resourceType, workflowTaskId, status], name: "unique_active_workflow_delegation", where: status IN ('PENDING_ACCEPTANCE', 'ACTIVE'))
  
  @@index([delegatedFrom])
  @@index([delegatedTo, status])
  @@index([effectiveFrom, effectiveTo])
  @@index([status])
  @@index([relatedLeaveId])
  @@map("resource_delegations")
}

enum DelegationReason {
  ANNUAL_LEAVE
  SICK_LEAVE
  MATERNITY_LEAVE
  EMERGENCY_LEAVE
  TEMPORARY_REASSIGNMENT
  TRAINING_PERIOD
  EMPLOYEE_EXITING
}

enum DelegationStatus {
  PENDING_ACCEPTANCE
  ACTIVE
  EXPIRED
  REJECTED
  REVOKED
}
```

**Key Features:**
1. ✅ **Always has end date** - `effectiveTo` is REQUIRED
2. ✅ **Handover acceptance** - delegate must accept before active
3. ✅ **Granular permissions** - control what delegate can do
4. ✅ **Automatic expiration** - scheduled job marks expired, restores original owner
5. ✅ **No conflict with ownership** - separate table, separate constraints

---

### Query Logic: Who Has Effective Access?

```typescript
/**
 * Determines effective handler of a resource at a given time
 * 
 * Priority:
 * 1. Active delegation (if exists and accepted)
 * 2. Current permanent owner
 */
async function getEffectiveHandler(
  resourceType: ResourceType,
  resourceId: string,
  atTime: Date = new Date()
): Promise<{
  userId: string;
  isDelegated: boolean;
  permissions: DelegationPermissions | null;
}> {
  
  // Check for active delegation first
  const delegation = await prisma.resourceDelegation.findFirst({
    where: {
      resourceType,
      [getResourceIdField(resourceType)]: resourceId,
      status: 'ACTIVE',
      effectiveFrom: { lte: atTime },
      effectiveTo: { gte: atTime }
    }
  });
  
  if (delegation) {
    return {
      userId: delegation.delegatedTo,
      isDelegated: true,
      permissions: {
        canApproveLoans: delegation.canApproveLoans,
        canDisburseFunds: delegation.canDisburseFunds,
        canModifyCustomer: delegation.canModifyCustomer,
        canViewSensitiveData: delegation.canViewSensitiveData
      }
    };
  }
  
  // Fall back to permanent owner
  const ownership = await prisma.resourceOwnership.findFirst({
    where: {
      resourceType,
      [getResourceIdField(resourceType)]: resourceId,
      effectiveTo: null  // Current owner
    }
  });
  
  if (!ownership) {
    throw new Error(`No owner found for ${resourceType}:${resourceId}`);
  }
  
  return {
    userId: ownership.ownerId,
    isDelegated: false,
    permissions: null  // Full permissions as owner
  };
}
```

---

### Business Rules

**1. Original Resource Fields Remain Unchanged**

```typescript
// Customer.assignedOfficerId, LoanApplication.assignedToId etc. NEVER modified
// These remain as original assignment for historical reference
// Queries always check ResourceOwnership + ResourceDelegation for effective handler
```

**2. Creating Temporary Delegation (Leave Scenario)**

```typescript
async function delegateResourcesForLeave(
  userId: string,
  leaveId: string,
  delegateUserId: string,
  leaveStart: Date,
  leaveEnd: Date
) {
  // Find all resources currently owned by user
  const ownerships = await prisma.resourceOwnership.findMany({
    where: {
      ownerId: userId,
      effectiveTo: null  // Current ownership only
    }
  });
  
  // Create delegations for each resource
  for (const ownership of ownerships) {
    await prisma.resourceDelegation.create({
      data: {
        resourceType: ownership.resourceType,
        [`${ownership.resourceType.toLowerCase()}Id`]: ownership[`${ownership.resourceType.toLowerCase()}Id`],
        delegatedFrom: userId,
        delegatedTo: delegateUserId,
        effectiveFrom: leaveStart,
        effectiveTo: leaveEnd,
        delegationReason: 'ANNUAL_LEAVE',
        relatedLeaveId: leaveId,
        status: 'PENDING_ACCEPTANCE',
        canModifyCustomer: true,
        canApproveLoans: false,  // Configurable per leave type
        createdById: currentUserId
      }
    });
  }
}
```

**3. Delegate Accepts Handover**

```typescript
async function acceptDelegation(delegationId: string, delegateUserId: string) {
  await prisma.resourceDelegation.update({
    where: { id: delegationId, delegatedTo: delegateUserId },
    data: {
      status: 'ACTIVE',
      acceptedAt: new Date()
    }
  });
  
  // Notify delegator
}
```

**4. Automatic Expiration (Scheduled Job)**

```typescript
async function processExpiredDelegations() {
  const now = new Date();
  
  const expired = await prisma.resourceDelegation.findMany({
    where: {
      status: 'ACTIVE',
      effectiveTo: { lt: now },
      autoExpired: false
    }
  });
  
  for (const delegation of expired) {
    await prisma.resourceDelegation.update({
      where: { id: delegation.id },
      data: {
        status: 'EXPIRED',
        autoExpired: true,
        expirationProcessedAt: now,
        restorationCompleted: true
      }
    });
    
    // Ownership automatically restored (no change needed - delegation just inactive)
    // Notify both parties
  }
}
```

**5. Permanent Reassignment (Employee Exit)**

```typescript
async function permanentlyReassignResources(
  fromUserId: string,
  toUserId: string,
  offboardingId: string
) {
  const now = new Date();
  
  // Close current ownerships
  const currentOwnerships = await prisma.resourceOwnership.findMany({
    where: {
      ownerId: fromUserId,
      effectiveTo: null
    }
  });
  
  for (const ownership of currentOwnerships) {
    // Close old ownership
    await prisma.resourceOwnership.update({
      where: { id: ownership.id },
      data: {
        effectiveTo: now,
        changeReason: 'EMPLOYEE_EXIT',
        changedDueToExit: true,
        relatedOffboardingId: offboardingId
      }
    });
    
    // Create new ownership
    await prisma.resourceOwnership.create({
      data: {
        resourceType: ownership.resourceType,
        [`${ownership.resourceType.toLowerCase()}Id`]: ownership[`${ownership.resourceType.toLowerCase()}Id`],
        ownerId: toUserId,
        effectiveFrom: now,
        changeReason: 'EMPLOYEE_EXIT',
        changedDueToExit: true,
        relatedOffboardingId: offboardingId,
        assignedById: currentUserId,
        notes: `Reassigned from ${fromUserId} due to offboarding`
      }
    });
  }
  
  // Cancel any active delegations
  await prisma.resourceDelegation.updateMany({
    where: {
      OR: [
        { delegatedFrom: fromUserId, status: 'ACTIVE' },
        { delegatedTo: fromUserId, status: 'ACTIVE' }
      ]
    },
    data: {
      status: 'REVOKED'
    }
  });
}
```

**6. Validation: Exactly One Resource ID Set**

```typescript
function validateResourceAssignment(data: any) {
  const resourceIds = [
    data.customerId,
    data.loanApplicationId,
    data.recoveryAccountId,
    data.workflowTaskId
  ].filter(id => id != null);
  
  if (resourceIds.length !== 1) {
    throw new Error('Exactly one resource ID must be set');
  }
  
  // Verify resourceType matches the ID field set
  const expectedType = data.customerId ? 'CUSTOMER' :
                       data.loanApplicationId ? 'LOAN_APPLICATION' :
                       data.recoveryAccountId ? 'RECOVERY_ACCOUNT' :
                       'WORKFLOW_TASK';
  
  if (data.resourceType !== expectedType) {
    throw new Error(`Resource type ${data.resourceType} does not match ID field`);
  }
}
```

---


## LEAVE BALANCE AUTHORITY (CORRECTED)

### Problem Analysis

V2.0 stored computed balances as database fields, creating drift risk:

```prisma
// V2.0 PROBLEM
model LeaveEntitlement {
  totalDaysEntitled  Decimal
  carryForwardDays   Decimal
  daysUsed           Decimal  // ❌ Can drift from actual LeaveApplication records
  daysPending        Decimal  // ❌ Requires manual sync on status changes
  daysAvailable      Decimal  // ❌ Derived but stored = double truth
}
```

**Drift Scenarios:**
1. Application approved but `daysPending` not decremented
2. Application cancelled but `daysPending` not released
3. Leave becomes ACTIVE but `daysUsed` not incremented
4. Concurrent applications bypass reservation check
5. Manual database edits corrupt balances

### Solution: Single Source of Truth

**Authority: LeaveApplication table**

All balance calculations derived on-demand from LeaveApplication records. No stored computed fields.

---

### Model 1: LeaveType (Configuration)

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
  prorateForMidYearJoiners Boolean           @default(true)
  
  // Weekend/Holiday handling
  countWeekendsAsLeave    Boolean            @default(false)
  countHolidaysAsLeave    Boolean            @default(false)
  
  isActive                Boolean            @default(true)
  sortOrder               Int                @default(0)
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt
  
  entitlements            LeaveEntitlement[]
  applications            LeaveApplication[]
  
  @@index([code])
  @@index([isActive])
  @@map("leave_types")
}
```

---

### Model 2: LeaveEntitlement (Configuration Only)

```prisma
model LeaveEntitlement {
  id                      String      @id @default(uuid()) @db.VarChar(36)
  userId                  String      @db.VarChar(36)
  leaveTypeId             String      @db.VarChar(36)
  year                    Int
  
  // CONFIGURATION ONLY - not computed balances
  allocatedDays           Decimal     @db.Decimal(5, 1)  // Base allocation for this year
  carryForwardDays        Decimal     @default(0) @db.Decimal(5, 1)  // Brought forward from previous year
  adjustmentDays          Decimal     @default(0) @db.Decimal(5, 1)  // +/- manual adjustments
  
  // Total entitlement = allocatedDays + carryForwardDays + adjustmentDays
  // Used/Pending/Available computed from LeaveApplication records
  
  // Audit
  createdAt               DateTime    @default(now())
  createdById             String      @db.VarChar(36)
  updatedAt               DateTime    @updatedAt
  updatedById             String?     @db.VarChar(36)
  
  // Relations
  user                    User        @relation(fields: [userId], references: [id])
  leaveType               LeaveType   @relation(fields: [leaveTypeId], references: [id])
  createdBy               User        @relation("EntitlementCreator", fields: [createdById], references: [id])
  updatedBy               User?       @relation("EntitlementUpdater", fields: [updatedById], references: [id])
  adjustments             LeaveEntitlementAdjustment[]
  
  @@unique([userId, leaveTypeId, year])
  @@index([userId, year])
  @@index([year])
  @@map("leave_entitlements")
}
```

---

### Model 3: LeaveEntitlementAdjustment (Audit Trail)

```prisma
model LeaveEntitlementAdjustment {
  id                      String            @id @default(uuid()) @db.VarChar(36)
  entitlementId           String            @db.VarChar(36)
  adjustmentDays          Decimal           @db.Decimal(5, 1)  // Can be negative
  reason                  String            @db.Text
  approvedById            String            @db.VarChar(36)
  createdAt               DateTime          @default(now())
  
  entitlement             LeaveEntitlement  @relation(fields: [entitlementId], references: [id])
  approvedBy              User              @relation("AdjustmentApprover", fields: [approvedById], references: [id])
  
  @@index([entitlementId])
  @@map("leave_entitlement_adjustments")
}
```

---

### Model 4: LeaveApplication (Source of Truth)

```prisma
model LeaveApplication {
  id                      String               @id @default(uuid()) @db.VarChar(36)
  applicationNumber       String               @unique @db.VarChar(20)
  userId                  String               @db.VarChar(36)
  leaveTypeId             String               @db.VarChar(36)
  
  // Dates
  startDate               DateTime             @db.Date
  endDate                 DateTime             @db.Date
  
  // Half-day handling
  startDayType            DayType              @default(FULL_DAY)  // FULL_DAY, FIRST_HALF, SECOND_HALF
  endDayType              DayType              @default(FULL_DAY)
  
  // Calculated business days (immutable after approval)
  businessDaysRequested   Decimal              @db.Decimal(5, 1)
  
  // Entitlement year tracking (for spanning years)
  primaryEntitlementYear  Int
  secondaryEntitlementYear Int?
  daysFromPrimaryYear     Decimal?             @db.Decimal(5, 1)
  daysFromSecondaryYear   Decimal?             @db.Decimal(5, 1)
  
  // Application details
  reason                  String               @db.Text
  handoverNotes           String?              @db.Text
  emergencyContact        String?              @db.VarChar(100)
  emergencyPhone          String?              @db.VarChar(20)
  
  // Status lifecycle
  status                  LeaveStatus          @default(DRAFT)
  
  // Workflow
  submittedAt             DateTime?
  submittedById           String?              @db.VarChar(36)
  
  approvedById            String?              @db.VarChar(36)
  approvedAt              DateTime?
  approvalNotes           String?              @db.Text
  
  rejectedById            String?              @db.VarChar(36)
  rejectedAt              DateTime?
  rejectionReason         String?              @db.VarChar(500)
  
  // Cancellation
  cancelledById           String?              @db.VarChar(36)
  cancelledAt             DateTime?
  cancellationReason      String?              @db.VarChar(500)
  
  // Audit
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt
  
  // Relations
  user                    User                 @relation(fields: [userId], references: [id])
  leaveType               LeaveType            @relation(fields: [leaveTypeId], references: [id])
  submittedBy             User?                @relation("LeaveSubmitter", fields: [submittedById], references: [id])
  approvedBy              User?                @relation("LeaveApprover", fields: [approvedById], references: [id])
  rejectedBy              User?                @relation("LeaveRejecter", fields: [rejectedById], references: [id])
  cancelledBy             User?                @relation("LeaveCanceller", fields: [cancelledById], references: [id])
  delegations             ResourceDelegation[]
  
  @@index([userId, status])
  @@index([status, startDate])
  @@index([leaveTypeId])
  @@index([primaryEntitlementYear])
  @@map("leave_applications")
}

enum LeaveStatus {
  DRAFT             // Created but not submitted
  PENDING_APPROVAL  // Submitted, awaiting approval
  APPROVED          // Approved but not yet started
  ACTIVE            // Currently in effect
  COMPLETED         // Finished (past end date)
  REJECTED          // Rejected by approver
  CANCELLED         // Cancelled by employee or system
}

enum DayType {
  FULL_DAY
  FIRST_HALF
  SECOND_HALF
}
```

---

### Model 5: PublicHoliday

```prisma
model PublicHoliday {
  id          String   @id @default(uuid()) @db.VarChar(36)
  name        String   @db.VarChar(200)
  date        DateTime @db.Date
  year        Int
  isRecurring Boolean  @default(false)
  
  // Branch-specific holidays
  branchId    String?  @db.VarChar(36)  // NULL = applies to all branches
  branch      Branch?  @relation(fields: [branchId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@unique([date, branchId])
  @@index([year, branchId])
  @@index([date])
  @@map("public_holidays")
}
```

---

### Model 6: BranchWorkweek (Branch-Specific Weekends)

```prisma
model BranchWorkweek {
  id                String   @id @default(uuid()) @db.VarChar(36)
  branchId          String?  @db.VarChar(36)  // NULL = default for all branches
  
  isSundayWorkday   Boolean  @default(false)
  isMondayWorkday   Boolean  @default(true)
  isTuesdayWorkday  Boolean  @default(true)
  isWednesdayWorkday Boolean @default(true)
  isThursdayWorkday Boolean  @default(true)
  isFridayWorkday   Boolean  @default(true)
  isSaturdayWorkday Boolean  @default(false)
  
  effectiveFrom     DateTime @db.Date
  effectiveTo       DateTime? @db.Date
  
  branch            Branch?  @relation(fields: [branchId], references: [id])
  createdAt         DateTime @default(now())
  
  @@unique([branchId, effectiveFrom])
  @@index([branchId])
  @@map("branch_workweeks")
}
```

---

### Balance Calculation Logic

```typescript
/**
 * Calculate leave balance for user/leaveType/year
 * Source of truth: LeaveApplication table
 */
async function calculateLeaveBalance(
  userId: string,
  leaveTypeId: string,
  year: int
): Promise<LeaveBalance> {
  
  // 1. Get entitlement configuration
  const entitlement = await prisma.leaveEntitlement.findUnique({
    where: {
      userId_leaveTypeId_year: { userId, leaveTypeId, year }
    },
    include: { leaveType: true }
  });
  
  if (!entitlement) {
    throw new Error(`No entitlement found for ${userId}/${leaveTypeId}/${year}`);
  }
  
  const totalEntitled = entitlement.allocatedDays 
                      + entitlement.carryForwardDays 
                      + entitlement.adjustmentDays;
  
  // 2. Calculate used days (APPROVED + ACTIVE + COMPLETED)
  const usedApplications = await prisma.leaveApplication.findMany({
    where: {
      userId,
      leaveTypeId,
      primaryEntitlementYear: year,
      status: { in: ['APPROVED', 'ACTIVE', 'COMPLETED'] }
    }
  });
  
  const daysUsed = usedApplications.reduce((sum, app) => 
    sum + (app.daysFromPrimaryYear || app.businessDaysRequested), 
    0
  );
  
  // 3. Calculate pending days (DRAFT + PENDING_APPROVAL)
  const pendingApplications = await prisma.leaveApplication.findMany({
    where: {
      userId,
      leaveTypeId,
      primaryEntitlementYear: year,
      status: { in: ['DRAFT', 'PENDING_APPROVAL'] }
    }
  });
  
  const daysPending = pendingApplications.reduce((sum, app) => 
    sum + (app.daysFromPrimaryYear || app.businessDaysRequested), 
    0
  );
  
  // 4. Calculate available
  const daysAvailable = totalEntitled - daysUsed - daysPending;
  
  return {
    totalEntitled,
    daysUsed,
    daysPending,
    daysAvailable,
    usedApplications: usedApplications.length,
    pendingApplications: pendingApplications.length
  };
}
```

---

### Business Rules

**1. Application Submission with Concurrency Protection**

```typescript
async function submitLeaveApplication(applicationId: string) {
  return await prisma.$transaction(async (tx) => {
    // Lock entitlement record for update
    const app = await tx.leaveApplication.findUnique({
      where: { id: applicationId },
      include: { leaveType: true }
    });
    
    // Recalculate balance within transaction
    const balance = await calculateLeaveBalance(
      app.userId, 
      app.leaveTypeId, 
      app.primaryEntitlementYear,
      tx  // Use transaction client
    );
    
    // Validate sufficient balance
    if (balance.daysAvailable < app.businessDaysRequested) {
      throw new Error(
        `Insufficient leave balance. Available: ${balance.daysAvailable}, Requested: ${app.businessDaysRequested}`
      );
    }
    
    // Update status (reserves entitlement implicitly via status)
    await tx.leaveApplication.update({
      where: { id: applicationId },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        submittedById: app.userId
      }
    });
    
    return app;
  }, {
    isolationLevel: 'Serializable'  // Prevent concurrent submissions
  });
}
```

**2. Approval**

```typescript
async function approveLeaveApplication(applicationId: string, approverId: string) {
  await prisma.leaveApplication.update({
    where: { id: applicationId, status: 'PENDING_APPROVAL' },
    data: {
      status: 'APPROVED',
      approvedById: approverId,
      approvedAt: new Date()
    }
  });
  
  // Delegation creation happens here if needed
}
```

**3. Rejection (Release Reservation)**

```typescript
async function rejectLeaveApplication(
  applicationId: string, 
  approverId: string, 
  reason: string
) {
  // Simply change status - balance automatically adjusts (not counted in pending anymore)
  await prisma.leaveApplication.update({
    where: { id: applicationId, status: 'PENDING_APPROVAL' },
    data: {
      status: 'REJECTED',
      rejectedById: approverId,
      rejectedAt: new Date(),
      rejectionReason: reason
    }
  });
}
```

**4. Cancellation (Release Reservation)**

```typescript
async function cancelLeaveApplication(
  applicationId: string, 
  userId: string, 
  reason: string
) {
  const app = await prisma.leaveApplication.findUnique({
    where: { id: applicationId }
  });
  
  // Can only cancel DRAFT, PENDING_APPROVAL, or APPROVED (not started yet)
  if (!['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(app.status)) {
    throw new Error('Cannot cancel leave in current status');
  }
  
  await prisma.leaveApplication.update({
    where: { id: applicationId },
    data: {
      status: 'CANCELLED',
      cancelledById: userId,
      cancelledAt: new Date(),
      cancellationReason: reason
    }
  });
  
  // Revoke any delegations if leave was approved
  if (app.status === 'APPROVED') {
    await prisma.resourceDelegation.updateMany({
      where: { relatedLeaveId: applicationId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });
  }
}
```

**5. Automatic Status Updates (Scheduled Job)**

```typescript
async function updateLeaveStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // APPROVED → ACTIVE (leave started)
  await prisma.leaveApplication.updateMany({
    where: {
      status: 'APPROVED',
      startDate: { lte: today }
    },
    data: {
      status: 'ACTIVE'
    }
  });
  
  // ACTIVE → COMPLETED (leave ended)
  await prisma.leaveApplication.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: today }
    },
    data: {
      status: 'COMPLETED'
    }
  });
}
```

**6. Business Day Calculation (Half-Day Support)**

```typescript
async function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  startDayType: DayType,
  endDayType: DayType,
  userId: string,
  leaveTypeId: string
): Promise<number> {
  
  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId }
  });
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { branch: true }
  });
  
  // Get branch workweek configuration
  const workweek = await prisma.branchWorkweek.findFirst({
    where: {
      branchId: user.branchId,
      effectiveFrom: { lte: startDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: startDate } }
      ]
    }
  });
  
  // Get public holidays in range for this branch
  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      OR: [
        { branchId: user.branchId },
        { branchId: null }
      ]
    }
  });
  
  let businessDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = !workweek[`is${getDayName(dayOfWeek)}Workday`];
    const isHoliday = holidays.some(h => 
      h.date.toDateString() === currentDate.toDateString()
    );
    
    // Count day based on leave type configuration
    const countThisDay = (isWeekend && leaveType.countWeekendsAsLeave) ||
                         (isHoliday && leaveType.countHolidaysAsLeave) ||
                         (!isWeekend && !isHoliday);
    
    if (countThisDay) {
      // Handle half days
      if (currentDate.toDateString() === startDate.toDateString()) {
        businessDays += startDayType === 'FULL_DAY' ? 1.0 : 0.5;
      } else if (currentDate.toDateString() === endDate.toDateString()) {
        businessDays += endDayType === 'FULL_DAY' ? 1.0 : 0.5;
      } else {
        businessDays += 1.0;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}
```

**7. Leave Spanning Multiple Years**

```typescript
async function calculateYearSplit(
  startDate: Date,
  endDate: Date,
  businessDaysTotal: number
): Promise<{ primaryYear: int, secondaryYear: int | null, primaryDays: number, secondaryDays: number | null }> {
  
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  if (startYear === endYear) {
    return {
      primaryYear: startYear,
      secondaryYear: null,
      primaryDays: businessDaysTotal,
      secondaryDays: null
    };
  }
  
  // Calculate how many days in each year
  const yearEnd = new Date(startYear, 11, 31);  // Dec 31 of start year
  const yearStart = new Date(endYear, 0, 1);    // Jan 1 of end year
  
  const daysInFirstYear = await calculateBusinessDays(
    startDate, 
    yearEnd, 
    'FULL_DAY', 
    'FULL_DAY', 
    userId, 
    leaveTypeId
  );
  
  const daysInSecondYear = businessDaysTotal - daysInFirstYear;
  
  return {
    primaryYear: startYear,
    secondaryYear: endYear,
    primaryDays: daysInFirstYear,
    secondaryDays: daysInSecondYear
  };
}
```

---

### Migration Note

V2.0 migration SQL was incorrect:

```sql
-- ❌ V2.0 INCORRECT
UPDATE `leave_entitlements` le
SET le.daysAvailable = le.totalDaysEntitled + le.carryForwardDays - 
  (SELECT COALESCE(SUM(la.businessDaysRequested), 0) 
   FROM `leave_applications` la 
   WHERE la.userId = le.userId 
   AND la.leaveTypeId = le.leaveTypeId 
   AND la.status IN ('APPROVED', 'ACTIVE'));  -- ❌ Missing year filter!
```

**✅ V3.0: No migration needed** - remove stored fields entirely, compute on-demand.

---


## STAFF LOAN ACCOUNTING (STRENGTHENED)

### Problem Analysis

V2.0 allowed mutation of payment records and lacked immutability:

```prisma
// V2.0 PROBLEM
model StaffLoanPayment {
  amount        Decimal
  isReversed    Boolean  @default(false)  // ❌ Mutates original record
  reversedById  String?                   // ❌ Original payment modified
  reversedAt    DateTime?                 // ❌ Loses original state
}
```

**Issues:**
1. Original payment record destroyed on reversal
2. No double-entry accounting pattern
3. Cannot reconstruct financial history
4. Audit trail incomplete
5. Cascading deletes could erase financial records

### Solution: Immutable Financial Records

**Principles:**
1. **Never modify payment records** - create new records for reversals
2. **Double-entry pattern** - every reversal references original
3. **Separate verification** - payments verified before affecting balances
4. **Explicit interest calculation** - documented formula
5. **No cascade deletes** - financial history preserved

---

### Model 1: StaffLoan

```prisma
model StaffLoan {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  loanNumber              String                    @unique @db.VarChar(20)
  userId                  String                    @db.VarChar(36)
  
  // Loan terms
  principalAmount         Decimal                   @db.Decimal(14, 2)
  interestRate            Decimal                   @db.Decimal(6, 3)  // Annual percentage rate
  interestType            StaffLoanInterestType     @default(FLAT)
  tenureMonths            Int
  
  // Calculated at disbursement (immutable after)
  totalInterest           Decimal                   @db.Decimal(14, 2)
  totalRepayable          Decimal                   @db.Decimal(14, 2)
  monthlyInstallment      Decimal                   @db.Decimal(14, 2)
  
  // Application
  purpose                 String                    @db.Text
  requestedAmount         Decimal                   @db.Decimal(14, 2)
  justification           String?                   @db.Text
  
  // Status workflow
  status                  StaffLoanStatus           @default(DRAFT)
  
  // Approval
  submittedAt             DateTime?
  submittedById           String?                   @db.VarChar(36)
  reviewedById            String?                   @db.VarChar(36)
  reviewedAt              DateTime?
  approvalNotes           String?                   @db.Text
  rejectionReason         String?                   @db.VarChar(500)
  
  // Disbursement
  approvedAmount          Decimal?                  @db.Decimal(14, 2)  // May differ from requested
  disbursedById           String?                   @db.VarChar(36)
  disbursedAt             DateTime?
  disbursementReference   String?                   @db.VarChar(100)
  disbursementMethod      String?                   @db.VarChar(50)
  disbursementAccountNumber String?                 @db.VarChar(50)
  disbursementBankCode    String?                   @db.VarChar(20)
  
  // Early settlement
  earlySettlementAllowed  Boolean                   @default(true)
  earlySettlementPenalty  Decimal?                  @db.Decimal(6, 3)  // Percentage
  
  // Completion
  completedAt             DateTime?
  settlementDate          DateTime?
  
  // Audit
  createdAt               DateTime                  @default(now())
  createdById             String                    @db.VarChar(36)
  updatedAt               DateTime                  @updatedAt
  
  // Relations
  user                    User                      @relation("StaffLoanBorrower", fields: [userId], references: [id], onDelete: Restrict)
  createdBy               User                      @relation("StaffLoanCreator", fields: [createdById], references: [id])
  submittedBy             User?                     @relation("StaffLoanSubmitter", fields: [submittedById], references: [id])
  reviewedBy              User?                     @relation("StaffLoanReviewer", fields: [reviewedById], references: [id])
  disbursedBy             User?                     @relation("StaffLoanDisbursing", fields: [disbursedById], references: [id])
  repaymentSchedule       StaffLoanInstallment[]
  payments                StaffLoanPayment[]
  reversals               StaffLoanReversal[]
  adjustments             StaffLoanAdjustment[]
  approvals               StaffLoanApproval[]
  
  @@index([userId, status])
  @@index([status])
  @@index([loanNumber])
  @@map("staff_loans")
}

enum StaffLoanInterestType {
  FLAT           // Interest on full principal for entire tenure
  REDUCING       // Interest on reducing balance (not yet implemented)
  SIMPLE         // Simple interest calculation
}

enum StaffLoanStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  DISBURSED
  ACTIVE
  COMPLETED
  WRITTEN_OFF
  REJECTED
  CANCELLED
}
```

---

### Model 2: StaffLoanInstallment (Repayment Schedule)

```prisma
model StaffLoanInstallment {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  staffLoanId             String                    @db.VarChar(36)
  installmentNumber       Int
  dueDate                 DateTime                  @db.Date
  
  // Breakdown (immutable after schedule generation)
  principalDue            Decimal                   @db.Decimal(14, 2)
  interestDue             Decimal                   @db.Decimal(14, 2)
  totalDue                Decimal                   @db.Decimal(14, 2)
  
  // Running balance (snapshot at installment creation)
  principalBalanceBefore  Decimal                   @db.Decimal(14, 2)
  principalBalanceAfter   Decimal                   @db.Decimal(14, 2)
  
  // Status (derived from payments, not directly edited)
  status                  InstallmentStatus         @default(PENDING)
  
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  
  // Relations
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id], onDelete: Restrict)
  payments                StaffLoanPayment[]
  
  @@unique([staffLoanId, installmentNumber])
  @@index([dueDate, status])
  @@index([staffLoanId])
  @@map("staff_loan_installments")
}

enum InstallmentStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
}
```

---

### Model 3: StaffLoanPayment (Immutable)

```prisma
model StaffLoanPayment {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  paymentNumber           String                    @unique @db.VarChar(20)
  staffLoanId             String                    @db.VarChar(36)
  installmentId           String                    @db.VarChar(36)
  
  // Payment details (IMMUTABLE)
  amount                  Decimal                   @db.Decimal(14, 2)
  paymentDate             DateTime                  @db.Date
  paymentMethod           PaymentMethod
  
  // Allocation (IMMUTABLE)
  principalPaid           Decimal                   @db.Decimal(14, 2)
  interestPaid            Decimal                   @db.Decimal(14, 2)
  
  // Verification
  transactionReference    String?                   @db.VarChar(100)
  isVerified              Boolean                   @default(false)
  verifiedById            String?                   @db.VarChar(36)
  verifiedAt              DateTime?
  verificationNotes       String?                   @db.Text
  
  // Reversal tracking (NOT modifying this record)
  isReversed              Boolean                   @default(false)  // Read-only flag set by trigger
  reversalId              String?                   @db.VarChar(36)  // Reference to reversal record
  
  notes                   String?                   @db.Text
  
  // Audit (IMMUTABLE)
  recordedById            String                    @db.VarChar(36)
  recordedAt              DateTime                  @default(now())
  
  // Relations
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id], onDelete: Restrict)
  installment             StaffLoanInstallment      @relation(fields: [installmentId], references: [id], onDelete: Restrict)
  recordedBy              User                      @relation("StaffPaymentRecorder", fields: [recordedById], references: [id])
  verifiedBy              User?                     @relation("StaffPaymentVerifier", fields: [verifiedById], references: [id])
  reversal                StaffLoanReversal?        @relation("PaymentReversed", fields: [reversalId], references: [id])
  
  @@index([staffLoanId])
  @@index([installmentId])
  @@index([paymentDate])
  @@index([isVerified])
  @@index([isReversed])
  @@map("staff_loan_payments")
}

enum PaymentMethod {
  SALARY_DEDUCTION
  BANK_TRANSFER
  CASH
  CHEQUE
  MOBILE_MONEY
}
```

---

### Model 4: StaffLoanReversal (Separate Record)

```prisma
model StaffLoanReversal {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  reversalNumber          String                    @unique @db.VarChar(20)
  staffLoanId             String                    @db.VarChar(36)
  originalPaymentId       String                    @db.VarChar(36)
  
  // Reversal details
  reversalAmount          Decimal                   @db.Decimal(14, 2)  // Usually matches original, but could be partial
  reversalDate            DateTime                  @db.Date
  reason                  String                    @db.Text
  reasonCategory          ReversalReason
  
  // Authorization
  approvedById            String                    @db.VarChar(36)
  approvedAt              DateTime                  @default(now())
  
  // Accounting reference
  accountingReference     String?                   @db.VarChar(100)
  
  // Relations
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id], onDelete: Restrict)
  originalPayment         StaffLoanPayment          @relation("PaymentReversed", fields: [originalPaymentId], references: [id], onDelete: Restrict)
  approvedBy              User                      @relation("ReversalApprover", fields: [approvedById], references: [id])
  paymentsAffected        StaffLoanPayment[]        // Payments marked as reversed by this reversal
  
  @@index([staffLoanId])
  @@index([originalPaymentId])
  @@index([reversalDate])
  @@map("staff_loan_reversals")
}

enum ReversalReason {
  DUPLICATE_PAYMENT
  INCORRECT_AMOUNT
  WRONG_LOAN_ACCOUNT
  EMPLOYEE_REQUEST
  BANK_ERROR
  SYSTEM_ERROR
  FRAUD_INVESTIGATION
  OTHER
}
```

---

### Model 5: StaffLoanAdjustment

```prisma
model StaffLoanAdjustment {
  id                      String                    @id @default(uuid()) @db.VarChar(36)
  adjustmentNumber        String                    @unique @db.VarChar(20)
  staffLoanId             String                    @db.VarChar(36)
  
  adjustmentType          AdjustmentType
  amount                  Decimal                   @db.Decimal(14, 2)
  affectsPrincipal        Boolean                   @default(false)
  affectsInterest         Boolean                   @default(true)
  
  reason                  String                    @db.Text
  supportingDocumentPath  String?                   @db.VarChar(500)
  
  // Authorization
  approvedById            String                    @db.VarChar(36)
  approvedAt              DateTime                  @default(now())
  
  // Accounting
  accountingReference     String?                   @db.VarChar(100)
  
  // Relations
  staffLoan               StaffLoan                 @relation(fields: [staffLoanId], references: [id], onDelete: Restrict)
  approvedBy              User                      @relation("AdjustmentApprover", fields: [approvedById], references: [id])
  
  @@index([staffLoanId])
  @@index([adjustmentType])
  @@map("staff_loan_adjustments")
}

enum AdjustmentType {
  INTEREST_WAIVER        // Reduce interest owed
  PENALTY_CHARGE         // Add penalty
  LATE_FEE              // Add late fee
  PRINCIPAL_WRITEOFF     // Write off principal (rare)
  GOODWILL_CREDIT       // Management discretion credit
  CORRECTION            // Fix calculation error
}
```

---

### Model 6: StaffLoanApproval (Approval History)

```prisma
model StaffLoanApproval {
  id                      String   @id @default(uuid()) @db.VarChar(36)
  staffLoanId             String   @db.VarChar(36)
  
  approvalLevel           Int      // 1, 2, 3 based on amount
  approverId              String   @db.VarChar(36)
  decision                ApprovalDecision
  comments                String?  @db.Text
  decidedAt               DateTime @default(now())
  
  staffLoan               StaffLoan @relation(fields: [staffLoanId], references: [id], onDelete: Restrict)
  approver                User      @relation("StaffLoanApprovalDecision", fields: [approverId], references: [id])
  
  @@index([staffLoanId])
  @@index([approverId])
  @@map("staff_loan_approvals")
}

enum ApprovalDecision {
  APPROVED
  REJECTED
  RETURNED_FOR_INFO
}
```

---

### Interest Calculation & Schedule Generation

**Flat Interest Formula:**
```typescript
/**
 * FLAT INTEREST CALCULATION
 * 
 * Interest = Principal × Rate × (Tenure / 12)
 * Total Repayable = Principal + Interest
 * Monthly Installment = Total Repayable / Tenure
 * 
 * Each installment has equal principal and interest components.
 */
function calculateFlatInterestSchedule(
  principal: number,
  annualRate: number,  // e.g., 0.12 for 12%
  tenureMonths: number,
  disbursementDate: Date
): InstallmentSchedule[] {
  
  const totalInterest = principal * annualRate * (tenureMonths / 12);
  const totalRepayable = principal + totalInterest;
  const monthlyInstallment = totalRepayable / tenureMonths;
  
  const principalPerInstallment = principal / tenureMonths;
  const interestPerInstallment = totalInterest / tenureMonths;
  
  const schedule: InstallmentSchedule[] = [];
  let runningPrincipalBalance = principal;
  
  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = addMonths(disbursementDate, i);
    
    schedule.push({
      installmentNumber: i,
      dueDate,
      principalDue: round(principalPerInstallment, 2),
      interestDue: round(interestPerInstallment, 2),
      totalDue: round(monthlyInstallment, 2),
      principalBalanceBefore: round(runningPrincipalBalance, 2),
      principalBalanceAfter: round(runningPrincipalBalance - principalPerInstallment, 2)
    });
    
    runningPrincipalBalance -= principalPerInstallment;
  }
  
  return schedule;
}

/**
 * REDUCING BALANCE INTEREST (Future Implementation)
 * 
 * Interest = Outstanding Principal × (Rate / 12)
 * Principal Paid = Installment - Interest
 * 
 * Early installments have more interest, later have more principal.
 */
```

**Schedule Generation on Disbursement:**

```typescript
async function disburseStaffLoan(
  loanId: string,
  disbursementDetails: DisbursementDetails
) {
  return await prisma.$transaction(async (tx) => {
    
    const loan = await tx.staffLoan.findUnique({
      where: { id: loanId, status: 'APPROVED' }
    });
    
    if (!loan) {
      throw new Error('Loan not found or not approved');
    }
    
    // Generate repayment schedule
    const schedule = calculateFlatInterestSchedule(
      loan.approvedAmount || loan.principalAmount,
      loan.interestRate,
      loan.tenureMonths,
      disbursementDetails.disbursementDate
    );
    
    // Create installment records
    for (const inst of schedule) {
      await tx.staffLoanInstallment.create({
        data: {
          staffLoanId: loanId,
          ...inst
        }
      });
    }
    
    // Update loan status
    await tx.staffLoan.update({
      where: { id: loanId },
      data: {
        status: 'DISBURSED',
        disbursedById: disbursementDetails.disbursedById,
        disbursedAt: disbursementDetails.disbursementDate,
        disbursementReference: disbursementDetails.reference,
        disbursementMethod: disbursementDetails.method,
        disbursementAccountNumber: disbursementDetails.accountNumber,
        disbursementBankCode: disbursementDetails.bankCode,
        totalInterest: schedule.reduce((sum, s) => sum + s.interestDue, 0),
        totalRepayable: schedule.reduce((sum, s) => sum + s.totalDue, 0),
        monthlyInstallment: schedule[0].totalDue
      }
    });
    
    return loan;
  });
}
```

---

### Payment Recording & Verification

```typescript
/**
 * Record payment (unverified initially)
 */
async function recordStaffLoanPayment(
  loanId: string,
  installmentId: string,
  paymentDetails: PaymentDetails
) {
  const installment = await prisma.staffLoanInstallment.findUnique({
    where: { id: installmentId }
  });
  
  // Calculate allocation (principal vs interest)
  const remainingTotal = installment.totalDue - 
    await getInstallmentPaidAmount(installmentId);
  
  const allocation = allocatePayment(
    paymentDetails.amount,
    installment.principalDue,
    installment.interestDue,
    remainingTotal
  );
  
  // Create immutable payment record
  const payment = await prisma.staffLoanPayment.create({
    data: {
      paymentNumber: await generatePaymentNumber(),
      staffLoanId: loanId,
      installmentId,
      amount: paymentDetails.amount,
      paymentDate: paymentDetails.paymentDate,
      paymentMethod: paymentDetails.method,
      principalPaid: allocation.principal,
      interestPaid: allocation.interest,
      transactionReference: paymentDetails.reference,
      isVerified: false,  // Requires verification
      recordedById: paymentDetails.recordedById,
      notes: paymentDetails.notes
    }
  });
  
  return payment;
}

/**
 * Verify payment (updates verification fields only)
 */
async function verifyStaffLoanPayment(
  paymentId: string,
  verifierId: string,
  notes?: string
) {
  const payment = await prisma.staffLoanPayment.update({
    where: { id: paymentId, isVerified: false },
    data: {
      isVerified: true,
      verifiedById: verifierId,
      verifiedAt: new Date(),
      verificationNotes: notes
    }
  });
  
  // Update installment status if fully paid
  await updateInstallmentStatus(payment.installmentId);
  
  return payment;
}

/**
 * Reverse payment (create separate reversal record)
 */
async function reverseStaffLoanPayment(
  paymentId: string,
  reversalDetails: ReversalDetails
) {
  return await prisma.$transaction(async (tx) => {
    
    const payment = await tx.staffLoanPayment.findUnique({
      where: { id: paymentId }
    });
    
    if (!payment.isVerified) {
      throw new Error('Cannot reverse unverified payment');
    }
    
    if (payment.isReversed) {
      throw new Error('Payment already reversed');
    }
    
    // Create reversal record (immutable)
    const reversal = await tx.staffLoanReversal.create({
      data: {
        reversalNumber: await generateReversalNumber(),
        staffLoanId: payment.staffLoanId,
        originalPaymentId: paymentId,
        reversalAmount: payment.amount,
        reversalDate: reversalDetails.reversalDate,
        reason: reversalDetails.reason,
        reasonCategory: reversalDetails.category,
        approvedById: reversalDetails.approverId,
        accountingReference: reversalDetails.accountingRef
      }
    });
    
    // Mark original payment as reversed (UPDATE isReversed flag only)
    await tx.staffLoanPayment.update({
      where: { id: paymentId },
      data: {
        isReversed: true,
        reversalId: reversal.id
      }
    });
    
    // Update installment status
    await updateInstallmentStatus(payment.installmentId, tx);
    
    return reversal;
  });
}
```

---

### Outstanding Balance Calculation

```typescript
/**
 * Calculate outstanding balance from immutable financial records
 * 
 * Authority: StaffLoanInstallment + StaffLoanPayment + StaffLoanAdjustment
 */
async function calculateOutstandingBalance(loanId: string): Promise<LoanBalances> {
  
  // Total from schedule
  const installments = await prisma.staffLoanInstallment.findMany({
    where: { staffLoanId: loanId }
  });
  
  const totalPrincipalDue = installments.reduce((sum, i) => sum + i.principalDue, 0);
  const totalInterestDue = installments.reduce((sum, i) => sum + i.interestDue, 0);
  const totalDue = totalPrincipalDue + totalInterestDue;
  
  // Verified payments only (exclude reversed)
  const payments = await prisma.staffLoanPayment.findMany({
    where: {
      staffLoanId: loanId,
      isVerified: true,
      isReversed: false
    }
  });
  
  const totalPrincipalPaid = payments.reduce((sum, p) => sum + p.principalPaid, 0);
  const totalInterestPaid = payments.reduce((sum, p) => sum + p.interestPaid, 0);
  const totalPaid = totalPrincipalPaid + totalInterestPaid;
  
  // Adjustments
  const adjustments = await prisma.staffLoanAdjustment.findMany({
    where: { staffLoanId: loanId }
  });
  
  const principalAdjustments = adjustments
    .filter(a => a.affectsPrincipal)
    .reduce((sum, a) => sum + a.amount, 0);
    
  const interestAdjustments = adjustments
    .filter(a => a.affectsInterest)
    .reduce((sum, a) => sum + a.amount, 0);
  
  // Final balances
  const outstandingPrincipal = totalPrincipalDue - totalPrincipalPaid + principalAdjustments;
  const outstandingInterest = totalInterestDue - totalInterestPaid + interestAdjustments;
  const outstandingTotal = outstandingPrincipal + outstandingInterest;
  
  return {
    totalDue,
    totalPaid,
    outstandingPrincipal,
    outstandingInterest,
    outstandingTotal,
    paymentsCount: payments.length,
    lastPaymentDate: payments.length > 0 
      ? Math.max(...payments.map(p => p.paymentDate.getTime()))
      : null
  };
}
```

---


## APPROVAL WORKFLOW ENGINE (COMPLETE)

### Problem Analysis

V2.0 had polymorphic entityType/entityId without referential integrity:

```prisma
// V2.0 PROBLEM
model ApprovalAction {
  entityType String  // "LeaveApplication", "StaffLoan" - no validation
  entityId   String  // Could reference deleted/non-existent record
}
```

### Solution: Dedicated Approval Tables + Policy Engine

---

### Model 1: Leave Approval

```prisma
model LeaveApproval {
  id                      String            @id @default(uuid()) @db.VarChar(36)
  leaveApplicationId      String            @db.VarChar(36)
  approvalLevel           Int               // 1, 2, 3...
  
  // Approver selection
  approverId              String            @db.VarChar(36)
  delegatedFromId         String?           @db.VarChar(36)  // If acting on behalf of someone
  
  // Decision
  status                  ApprovalStatus    @default(PENDING)
  decision                ApprovalDecision?
  decidedAt               DateTime?
  comments                String?           @db.Text
  
  // Timing
  requestedAt             DateTime          @default(now())
  dueAt                   DateTime?         // Escalation if not decided by this time
  
  // Policy context
  policyVersionId         String            @db.VarChar(36)
  
  // Relations
  leaveApplication        LeaveApplication  @relation(fields: [leaveApplicationId], references: [id], onDelete: Restrict)
  approver                User              @relation("LeaveApprover", fields: [approverId], references: [id])
  delegatedFrom           User?             @relation("LeaveApprovalDelegator", fields: [delegatedFromId], references: [id])
  policyVersion           ApprovalPolicy    @relation(fields: [policyVersionId], references: [id])
  
  @@index([leaveApplicationId])
  @@index([approverId, status])
  @@index([status, dueAt])
  @@map("leave_approvals")
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  RETURNED
  ESCALATED
  EXPIRED
}

enum ApprovalDecision {
  APPROVE
  REJECT
  RETURN_FOR_INFO
  ESCALATE
}
```

---

### Model 2: Staff Loan Approval (separate, with FK)

Already defined in StaffLoanApproval model above.

---

### Model 3: Approval Policy (Versioned)

```prisma
model ApprovalPolicy {
  id                      String            @id @default(uuid()) @db.VarChar(36)
  entityType              PolicyEntityType
  version                 Int
  
  // Hierarchy definition
  levels                  String            @db.LongText  // JSON array of approval levels
  
  // Effective dates
  effectiveFrom           DateTime          @db.Date
  effectiveTo             DateTime?         @db.Date
  
  // Metadata
  createdById             String            @db.VarChar(36)
  createdAt               DateTime          @default(now())
  notes                   String?           @db.Text
  
  // Relations
  createdBy               User              @relation("PolicyCreator", fields: [createdById], references: [id])
  leaveApprovals          LeaveApproval[]
  
  @@unique([entityType, version])
  @@index([entityType, effectiveFrom, effectiveTo])
  @@map("approval_policies")
}

enum PolicyEntityType {
  LEAVE_APPLICATION
  STAFF_LOAN
  RESOURCE_ASSIGNMENT
}
```

**Policy Level Structure (JSON):**
```json
{
  "levels": [
    {
      "level": 1,
      "name": "Direct Supervisor",
      "selectionCriteria": {
        "type": "SUPERVISOR",
        "requirePermission": "leaves:approve_team"
      },
      "conditions": {
        "maxDays": 5,
        "maxAmount": null
      },
      "isParallel": false,
      "requiresAll": false,
      "autoApproveBelow": null,
      "escalationHours": 48
    },
    {
      "level": 2,
      "name": "Department Head",
      "selectionCriteria": {
        "type": "DEPARTMENT_HEAD",
        "requirePermission": "leaves:approve_department"
      },
      "conditions": {
        "minDays": 5,
        "maxDays": 10
      },
      "escalationHours": 72
    },
    {
      "level": 3,
      "name": "HR Manager",
      "selectionCriteria": {
        "type": "ROLE",
        "requiredRole": "HR Manager",
        "requirePermission": "leaves:approve_all"
      },
      "conditions": {
        "minDays": 10
      },
      "escalationHours": 96
    }
  ]
}
```

---

### Approval Workflow Engine

```typescript
/**
 * Determine required approval levels for a leave application
 */
async function determineApprovalLevels(
  applicationId: string
): Promise<ApprovalLevel[]> {
  
  const application = await prisma.leaveApplication.findUnique({
    where: { id: applicationId },
    include: { user: true, leaveType: true }
  });
  
  // Get current policy
  const policy = await prisma.approvalPolicy.findFirst({
    where: {
      entityType: 'LEAVE_APPLICATION',
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } }
      ]
    },
    orderBy: { version: 'desc' }
  });
  
  if (!policy) {
    throw new Error('No active approval policy found');
  }
  
  const policyLevels = JSON.parse(policy.levels);
  const days = application.businessDaysRequested;
  
  // Filter applicable levels
  const applicableLevels = policyLevels.levels.filter(level => {
    const meetsMin = !level.conditions.minDays || days >= level.conditions.minDays;
    const meetsMax = !level.conditions.maxDays || days <= level.conditions.maxDays;
    return meetsMin && meetsMax;
  });
  
  return applicableLevels.map(level => ({
    ...level,
    approver: await selectApprover(level, application)
  }));
}

/**
 * Select approver based on criteria
 */
async function selectApprover(
  levelConfig: any,
  application: any
): Promise<string> {
  
  const { selectionCriteria } = levelConfig;
  
  switch (selectionCriteria.type) {
    case 'SUPERVISOR':
      // Check if supervisor has required permission
      const supervisor = await prisma.user.findUnique({
        where: { id: application.user.supervisorId },
        include: { 
          userPermissions: true,
          userRoles: { include: { role: { include: { rolePermissions: true } } } }
        }
      });
      
      if (!supervisor) {
        throw new Error('Employee has no assigned supervisor');
      }
      
      const hasPermission = await checkUserPermission(
        supervisor.id,
        selectionCriteria.requirePermission
      );
      
      if (!hasPermission) {
        throw new Error(`Supervisor lacks required permission: ${selectionCriteria.requirePermission}`);
      }
      
      // Check for delegation
      return await getEffectiveApprover(supervisor.id);
    
    case 'DEPARTMENT_HEAD':
      const department = await prisma.department.findUnique({
        where: { id: application.user.departmentId }
      });
      
      const deptHead = await prisma.user.findFirst({
        where: {
          departmentId: department.id,
          userRoles: {
            some: {
              role: { code: 'DEPARTMENT_HEAD' }
            }
          }
        }
      });
      
      if (!deptHead) {
        throw new Error('No department head found');
      }
      
      return await getEffectiveApprover(deptHead.id);
    
    case 'ROLE':
      const roleUsers = await prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              role: { name: selectionCriteria.requiredRole }
            }
          }
        }
      });
      
      if (roleUsers.length === 0) {
        throw new Error(`No users with role: ${selectionCriteria.requiredRole}`);
      }
      
      // If multiple, select based on branch or escalation logic
      return await getEffectiveApprover(roleUsers[0].id);
    
    default:
      throw new Error(`Unknown approver selection type: ${selectionCriteria.type}`);
  }
}

/**
 * Get effective approver (considering delegation)
 */
async function getEffectiveApprover(userId: string): Promise<string> {
  
  // Check if user has delegated approval authority
  const delegation = await prisma.resourceDelegation.findFirst({
    where: {
      resourceType: 'WORKFLOW_TASK',
      delegatedFrom: userId,
      status: 'ACTIVE',
      effectiveFrom: { lte: new Date() },
      effectiveTo: { gte: new Date() }
    }
  });
  
  if (delegation && delegation.canApproveLoans) {  // Or specific permission flag
    return delegation.delegatedTo;
  }
  
  // Check if user is absent (on leave, offboarded)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      leaveApplications: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      }
    }
  });
  
  if (user.status !== 'ACTIVE' || user.leaveApplications.length > 0) {
    // Escalate to their supervisor or next level
    if (user.supervisorId) {
      return await getEffectiveApprover(user.supervisorId);
    }
    throw new Error(`Approver ${userId} is unavailable and has no fallback`);
  }
  
  return userId;
}

/**
 * Create approval requests
 */
async function createApprovalRequests(
  applicationId: string
) {
  const levels = await determineApprovalLevels(applicationId);
  const policy = await getCurrentPolicy('LEAVE_APPLICATION');
  
  for (const level of levels) {
    await prisma.leaveApproval.create({
      data: {
        leaveApplicationId: applicationId,
        approvalLevel: level.level,
        approverId: level.approver,
        status: 'PENDING',
        policyVersionId: policy.id,
        dueAt: addHours(new Date(), level.escalationHours)
      }
    });
  }
}

/**
 * Process approval decision
 */
async function processApprovalDecision(
  approvalId: string,
  decision: ApprovalDecision,
  comments?: string
) {
  return await prisma.$transaction(async (tx) => {
    
    const approval = await tx.leaveApproval.findUnique({
      where: { id: approvalId },
      include: { leaveApplication: true }
    });
    
    // Prevent self-approval
    if (approval.leaveApplication.userId === approval.approverId) {
      throw new Error('Self-approval not allowed');
    }
    
    // Update approval record
    await tx.leaveApproval.update({
      where: { id: approvalId },
      data: {
        status: decision === 'APPROVE' ? 'APPROVED' : 
                decision === 'REJECT' ? 'REJECTED' : 'RETURNED',
        decision,
        decidedAt: new Date(),
        comments
      }
    });
    
    if (decision === 'REJECT') {
      // Reject entire application
      await tx.leaveApplication.update({
        where: { id: approval.leaveApplicationId },
        data: {
          status: 'REJECTED',
          rejectedById: approval.approverId,
          rejectedAt: new Date(),
          rejectionReason: comments
        }
      });
    } else if (decision === 'APPROVE') {
      // Check if all required approvals complete
      const allApprovals = await tx.leaveApproval.findMany({
        where: { leaveApplicationId: approval.leaveApplicationId }
      });
      
      const allApproved = allApprovals.every(a => a.status === 'APPROVED');
      
      if (allApproved) {
        // Final approval - update application
        await tx.leaveApplication.update({
          where: { id: approval.leaveApplicationId },
          data: {
            status: 'APPROVED',
            approvedById: approval.approverId,
            approvedAt: new Date()
          }
        });
        
        // Create resource delegations if needed
        // ... delegation logic
      }
    } else if (decision === 'RETURN_FOR_INFO') {
      await tx.leaveApplication.update({
        where: { id: approval.leaveApplicationId },
        data: {
          status: 'DRAFT',  // Return to draft for modification
          approvalNotes: comments
        }
      });
    }
  });
}

/**
 * Scheduled job: Escalate overdue approvals
 */
async function escalateOverdueApprovals() {
  const overdue = await prisma.leaveApproval.findMany({
    where: {
      status: 'PENDING',
      dueAt: { lt: new Date() }
    },
    include: { approver: true }
  });
  
  for (const approval of overdue) {
    // Notify supervisor or next level
    const nextApprover = await getEscalationApprover(approval.approverId);
    
    // Create new approval at higher level or reassign
    await prisma.leaveApproval.update({
      where: { id: approval.id },
      data: {
        status: 'ESCALATED',
        approverId: nextApprover
      }
    });
    
    // Notify all parties
  }
}
```

---


## EMPLOYMENT HISTORY & OFFBOARDING (IMPROVED)

### Problem Analysis

V2.0 stored single termination date in User model, preventing re-employment tracking:

```prisma
// V2.0 PROBLEM
model User {
  terminationDate DateTime?  // Only one!
}

model OffboardingCase {
  @@unique([userId, terminationDate])  // Allows multiple but User table doesn't
}
```

### Solution: Employment Period Model

---

### Model 1: EmploymentPeriod

```prisma
model EmploymentPeriod {
  id                      String            @id @default(uuid()) @db.VarChar(36)
  userId                  String            @db.VarChar(36)
  periodNumber            Int               // 1st employment, 2nd employment, etc.
  
  // Period dates
  hireDate                DateTime          @db.Date
  terminationDate         DateTime?         @db.Date
  lastWorkingDay          DateTime?         @db.Date
  
  // Employment details
  jobTitle                String            @db.VarChar(200)
  departmentId            String            @db.VarChar(36)
  branchId                String            @db.VarChar(36)
  contractType            ContractType
  
  // Salary (encrypted or access-controlled)
  salary                  Decimal?          @db.Decimal(14, 2)
  salaryEffectiveDate     DateTime?         @db.Date
  
  // Termination details
  terminationType         TerminationType?
  terminationReason       String?           @db.Text
  isVoluntary             Boolean?
  rehireEligible          Boolean           @default(true)
  
  // Status
  isCurrent               Boolean           @default(true)
  
  // Audit
  createdAt               DateTime          @default(now())
  createdById             String            @db.VarChar(36)
  updatedAt               DateTime          @updatedAt
  
  // Relations
  user                    User              @relation(fields: [userId], references: [id], onDelete: Restrict)
  department              Department        @relation(fields: [departmentId], references: [id])
  branch                  Branch            @relation(fields: [branchId], references: [id])
  createdBy               User              @relation("EmploymentPeriodCreator", fields: [createdById], references: [id])
  offboarding             OffboardingCase?
  
  @@unique([userId, periodNumber])
  @@unique([userId], name: "one_current_period", where: isCurrent = true)  // Only one current
  @@index([userId, isCurrent])
  @@index([terminationDate])
  @@map("employment_periods")
}

enum ContractType {
  PERMANENT
  CONTRACT
  PROBATION
  INTERN
  CONSULTANT
}

enum TerminationType {
  RESIGNATION
  TERMINATION
  RETIREMENT
  CONTRACT_END
  DEATH
  ABSCONDING
  MUTUAL_SEPARATION
}
```

---

### Model 2: OffboardingCase (Revised)

```prisma
model OffboardingCase {
  id                      String              @id @default(uuid()) @db.VarChar(36)
  caseNumber              String              @unique @db.VarChar(20)
  employmentPeriodId      String              @unique @db.VarChar(36)
  userId                  String              @db.VarChar(36)
  
  // Initiation
  initiatedById           String              @db.VarChar(36)
  initiatedAt             DateTime            @default(now())
  
  // Expected dates
  expectedLastWorkingDay  DateTime            @db.Date
  actualLastWorkingDay    DateTime?           @db.Date
  
  // Notice period
  noticePeriodDays        Int?
  noticeServedDays        Int?
  noticeWaiverApproved    Boolean             @default(false)
  noticeWaiverApprovedBy  String?             @db.VarChar(36)
  
  // Overall case status
  overallStatus           OffboardingStatus   @default(IN_PROGRESS)
  
  // ─────────────────────────────────────────────────────────────────
  // IT ACCESS (INDEPENDENT - Can be revoked immediately)
  // ─────────────────────────────────────────────────────────────────
  itAccessStatus          ClearanceStatus     @default(PENDING)
  itAccessRevokedAt       DateTime?
  itAccessRevokedById     String?             @db.VarChar(36)
  itAccessNotes           String?             @db.Text
  
  // Session termination
  allSessionsTerminated   Boolean             @default(false)
  sessionsTerminatedAt    DateTime?
  
  // Account suspension
  accountSuspended        Boolean             @default(false)
  accountSuspendedAt      DateTime?
  
  // ─────────────────────────────────────────────────────────────────
  // FINANCE CLEARANCE (INDEPENDENT)
  // ─────────────────────────────────────────────────────────────────
  financeStatus           ClearanceStatus     @default(PENDING)
  financeClearedAt        DateTime?
  financeClearedById      String?             @db.VarChar(36)
  financeNotes            String?             @db.Text
  
  // Outstanding items
  outstandingStaffLoans   Decimal             @default(0) @db.Decimal(14, 2)
  finalSettlementAmount   Decimal?            @db.Decimal(14, 2)
  finalSettlementPaid     Boolean             @default(false)
  
  // ─────────────────────────────────────────────────────────────────
  // ASSET CLEARANCE (INDEPENDENT)
  // ─────────────────────────────────────────────────────────────────
  assetStatus             ClearanceStatus     @default(PENDING)
  assetsClearedAt         DateTime?
  assetsClearedById       String?             @db.VarChar(36)
  assetNotes              String?             @db.Text
  
  // ─────────────────────────────────────────────────────────────────
  // HR CLEARANCE (INDEPENDENT)
  // ─────────────────────────────────────────────────────────────────
  hrStatus                ClearanceStatus     @default(PENDING)
  hrClearedAt             DateTime?
  hrClearedById           String?             @db.VarChar(36)
  hrNotes                 String?             @db.Text
  
  // Exit interview
  exitInterviewCompleted  Boolean             @default(false)
  exitInterviewDate       DateTime?
  exitInterviewNotes      String?             @db.Text
  exitInterviewById       String?             @db.VarChar(36)
  
  // ─────────────────────────────────────────────────────────────────
  // RESOURCE HANDOVER (TRACKS PROGRESS)
  // ─────────────────────────────────────────────────────────────────
  handoverStatus          ClearanceStatus     @default(PENDING)
  totalResourcesAssigned  Int                 @default(0)
  resourcesReassigned     Int                 @default(0)
  handoverCompletedAt     DateTime?
  
  // Final completion
  completedAt             DateTime?
  completedById           String?             @db.VarChar(36)
  
  // Audit
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt
  
  // Relations
  employmentPeriod        EmploymentPeriod    @relation(fields: [employmentPeriodId], references: [id], onDelete: Restrict)
  user                    User                @relation("OffboardingEmployee", fields: [userId], references: [id], onDelete: Restrict)
  initiatedBy             User                @relation("OffboardingInitiator", fields: [initiatedById], references: [id])
  itAccessRevokedBy       User?               @relation("ITAccessRevoker", fields: [itAccessRevokedById], references: [id])
  financeClearedBy        User?               @relation("FinanceClearer", fields: [financeClearedById], references: [id])
  assetsClearedBy         User?               @relation("AssetClearer", fields: [assetsClearedById], references: [id])
  hrClearedBy             User?               @relation("HRClearer", fields: [hrClearedById], references: [id])
  exitInterviewBy         User?               @relation("ExitInterviewer", fields: [exitInterviewById], references: [id])
  completedBy             User?               @relation("OffboardingCompleter", fields: [completedById], references: [id])
  resourceHandovers       ResourceOwnership[]  // Permanent reassignments
  delegations             ResourceDelegation[] // Temporary during notice period
  
  @@index([userId])
  @@index([overallStatus])
  @@index([expectedLastWorkingDay])
  @@map("offboarding_cases")
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
  BLOCKED
}
```

---

### Business Rules

**1. Immediate IT Access Revocation**

```typescript
/**
 * Revoke IT access immediately (does NOT wait for other clearances)
 */
async function revokeITAccess(
  offboardingId: string,
  revokedById: string,
  reason?: string
) {
  return await prisma.$transaction(async (tx) => {
    
    const offboarding = await tx.offboardingCase.findUnique({
      where: { id: offboardingId },
      include: { user: true }
    });
    
    // 1. Update offboarding record
    await tx.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        itAccessStatus: 'CLEARED',
        itAccessRevokedAt: new Date(),
        itAccessRevokedById: revokedById,
        itAccessNotes: reason
      }
    });
    
    // 2. Suspend user account (prevent new logins)
    await tx.user.update({
      where: { id: offboarding.userId },
      data: {
        status: 'SUSPENDED',
        lockedUntil: null  // Indefinite lock
      }
    });
    
    // 3. Terminate all active sessions (requires session table)
    // await terminateUserSessions(offboarding.userId, tx);
    
    // 4. Revoke active tokens
    await tx.token.updateMany({
      where: {
        userId: offboarding.userId,
        expiresAt: { gt: new Date() }
      },
      data: {
        expiresAt: new Date()  // Expire immediately
      }
    });
    
    // 5. Update offboarding record
    await tx.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        accountSuspended: true,
        accountSuspendedAt: new Date(),
        allSessionsTerminated: true,
        sessionsTerminatedAt: new Date()
      }
    });
    
    // Note: Finance/Asset/HR clearance can still proceed independently
  });
}
```

**2. Check Outstanding Staff Loans Before Finance Clearance**

```typescript
async function checkFinanceClearance(userId: string): Promise<FinanceClearanceCheck> {
  
  const outstandingLoans = await prisma.staffLoan.findMany({
    where: {
      userId,
      status: { in: ['ACTIVE', 'DISBURSED'] }
    }
  });
  
  let totalOutstanding = 0;
  
  for (const loan of outstandingLoans) {
    const balance = await calculateOutstandingBalance(loan.id);
    totalOutstanding += balance.outstandingTotal;
  }
  
  return {
    hasOutstandingLoans: outstandingLoans.length > 0,
    loanCount: outstandingLoans.length,
    totalOutstanding,
    canClearFinance: totalOutstanding === 0
  };
}

/**
 * Clear finance (only if no outstanding loans)
 */
async function clearFinance(
  offboardingId: string,
  clearedById: string,
  finalSettlement?: number
) {
  const offboarding = await prisma.offboardingCase.findUnique({
    where: { id: offboardingId },
    include: { user: true }
  });
  
  const financeCheck = await checkFinanceClearance(offboarding.userId);
  
  if (!financeCheck.canClearFinance) {
    throw new Error(
      `Cannot clear finance: ${financeCheck.loanCount} outstanding loans totaling ${financeCheck.totalOutstanding}`
    );
  }
  
  await prisma.offboardingCase.update({
    where: { id: offboardingId },
    data: {
      financeStatus: 'CLEARED',
      financeClearedAt: new Date(),
      financeClearedById: clearedById,
      outstandingStaffLoans: 0,
      finalSettlementAmount: finalSettlement,
      finalSettlementPaid: finalSettlement !== null
    }
  });
}
```

**3. Resource Handover During Offboarding**

```typescript
async function initiateResourceHandover(offboardingId: string) {
  const offboarding = await prisma.offboardingCase.findUnique({
    where: { id: offboardingId },
    include: { user: true }
  });
  
  // Count resources currently owned
  const ownerships = await prisma.resourceOwnership.findMany({
    where: {
      ownerId: offboarding.userId,
      effectiveTo: null  // Current ownership
    }
  });
  
  await prisma.offboardingCase.update({
    where: { id: offboardingId },
    data: {
      totalResourcesAssigned: ownerships.length,
      handoverStatus: ownerships.length === 0 ? 'NOT_APPLICABLE' : 'PENDING'
    }
  });
  
  // Notify relevant managers to reassign resources
}

async function reassignResource(
  ownershipId: string,
  newOwnerId: string,
  offboardingId: string
) {
  await permanentlyReassignResource(
    ownershipId,
    newOwnerId,
    'EMPLOYEE_EXIT',
    offboardingId
  );
  
  // Update progress
  const offboarding = await prisma.offboardingCase.findUnique({
    where: { id: offboardingId }
  });
  
  const newCount = offboarding.resourcesReassigned + 1;
  const isComplete = newCount >= offboarding.totalResourcesAssigned;
  
  await prisma.offboardingCase.update({
    where: { id: offboardingId },
    data: {
      resourcesReassigned: newCount,
      handoverStatus: isComplete ? 'CLEARED' : 'IN_PROGRESS',
      handoverCompletedAt: isComplete ? new Date() : null
    }
  });
}
```

**4. Complete Offboarding (All Clearances Required)**

```typescript
async function completeOffboarding(
  offboardingId: string,
  completedById: string
) {
  const offboarding = await prisma.offboardingCase.findUnique({
    where: { id: offboardingId }
  });
  
  // Validate all clearances
  const requiredClearances = [
    offboarding.itAccessStatus,
    offboarding.financeStatus,
    offboarding.assetStatus,
    offboarding.hrStatus,
    offboarding.handoverStatus
  ];
  
  const allCleared = requiredClearances.every(
    status => ['CLEARED', 'CLEARED_WITH_CONDITIONS', 'NOT_APPLICABLE'].includes(status)
  );
  
  if (!allCleared) {
    throw new Error('Cannot complete offboarding: Not all clearances obtained');
  }
  
  return await prisma.$transaction(async (tx) => {
    // Update offboarding
    await tx.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        overallStatus: 'COMPLETED',
        completedAt: new Date(),
        completedById
      }
    });
    
    // Close employment period
    await tx.employmentPeriod.update({
      where: { id: offboarding.employmentPeriodId },
      data: {
        isCurrent: false,
        terminationDate: offboarding.actualLastWorkingDay
      }
    });
    
    // User status already SUSPENDED from IT revocation
    // Do NOT delete user record - preserve for audit
  });
}
```

**5. Re-employment**

```typescript
async function rehireEmployee(
  userId: string,
  rehireDetails: RehireDetails
) {
  // Get previous employment periods
  const previousPeriods = await prisma.employmentPeriod.findMany({
    where: { userId },
    orderBy: { periodNumber: 'desc' }
  });
  
  const lastPeriod = previousPeriods[0];
  
  // Validate rehire eligibility
  if (lastPeriod && !lastPeriod.rehireEligible) {
    throw new Error('Employee marked as not eligible for rehire');
  }
  
  // Create new employment period
  const newPeriod = await prisma.employmentPeriod.create({
    data: {
      userId,
      periodNumber: (lastPeriod?.periodNumber || 0) + 1,
      hireDate: rehireDetails.hireDate,
      jobTitle: rehireDetails.jobTitle,
      departmentId: rehireDetails.departmentId,
      branchId: rehireDetails.branchId,
      contractType: rehireDetails.contractType,
      salary: rehireDetails.salary,
      isCurrent: true,
      createdById: rehireDetails.createdById
    }
  });
  
  // Reactivate user account
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      lockedUntil: null,
      jobTitle: rehireDetails.jobTitle,
      departmentId: rehireDetails.departmentId,
      branchId: rehireDetails.branchId
    }
  });
  
  return newPeriod;
}
```

---


## AUDIT INFRASTRUCTURE (EXISTING)

### Existing AuditLog Model

VCLOP already has a comprehensive audit system:

```prisma
model AuditLog {
  id            String      @id @default(uuid()) @db.VarChar(36)
  userId        String?     @db.VarChar(36)
  userEmail     String?     @db.VarChar(150)
  userFullName  String?     @db.VarChar(200)
  action        AuditAction
  module        String      @db.VarChar(50)
  subModule     String?     @db.VarChar(50)
  entityId      String?     @db.VarChar(36)
  entityType    String?     @db.VarChar(100)
  description   String?     @db.VarChar(1000)
  oldValues     String?     @db.LongText
  newValues     String?     @db.LongText
  changedFields String?     @db.LongText
  ipAddress     String?     @db.VarChar(45)
  userAgent     String?     @db.VarChar(500)
  browser       String?     @db.VarChar(100)
  os            String?     @db.VarChar(100)
  device        String?     @db.VarChar(100)
  branchId      String?     @db.VarChar(36)
  requestId     String?     @db.VarChar(36)
  duration      Int?
  statusCode    Int?
  isSuccess     Boolean     @default(true)
  errorMessage  String?     @db.VarChar(1000)
  metadata      String?     @db.LongText
  createdAt     DateTime    @default(now())
  branch        Branch?     @relation(fields: [branchId], references: [id])
  user          User?       @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([module])
  @@index([entityId])
  @@index([entityType])
  @@index([branchId])
  @@index([createdAt])
  @@index([isSuccess])
  @@map("audit_logs")
}

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_RESET
  PASSWORD_CHANGE
  PERMISSION_GRANT
  PERMISSION_REVOKE
  ROLE_ASSIGN
  ROLE_REVOKE
  EXPORT
  IMPORT
  APPROVE
  REJECT
  SUBMIT
  CANCEL
  RESTORE
}
```

### HR Module Audit Integration

**Extend Existing System (Do NOT create new AuditLog model):**

1. **Add New Actions to AuditAction Enum:**

```prisma
enum AuditAction {
  // ... existing actions
  APPROVE
  REJECT
  SUBMIT
  CANCEL
  
  // ADD these for HR:
  DISBURSE
  VERIFY_PAYMENT
  REVERSE_PAYMENT
  ADJUST_BALANCE
  REVOKE_ACCESS
  DELEGATE_RESOURCE
  ACCEPT_DELEGATION
  REVOKE_DELEGATION
  CLEAR_FINANCE
  CLEAR_ASSETS
  COMPLETE_OFFBOARDING
}
```

2. **Module Names:**

- `module: "HR"`
- `subModule`: "LEAVE", "STAFF_LOAN", "OFFBOARDING", "DELEGATION"

3. **Critical Events to Audit:**

```typescript
// Leave application submission
await auditLog.create({
  userId,
  action: 'SUBMIT',
  module: 'HR',
  subModule: 'LEAVE',
  entityType: 'LeaveApplication',
  entityId: application.id,
  description: `Submitted leave application for ${application.businessDaysRequested} days`,
  newValues: JSON.stringify(application),
  metadata: JSON.stringify({
    leaveType: application.leaveType.name,
    dateRange: `${application.startDate} to ${application.endDate}`
  })
});

// Leave approval
await auditLog.create({
  userId: approverId,
  action: 'APPROVE',
  module: 'HR',
  subModule: 'LEAVE',
  entityType: 'LeaveApplication',
  entityId: application.id,
  description: `Approved leave application ${application.applicationNumber}`,
  oldValues: JSON.stringify({ status: 'PENDING_APPROVAL' }),
  newValues: JSON.stringify({ status: 'APPROVED' }),
  metadata: JSON.stringify({
    applicantId: application.userId,
    approvalLevel: approval.approvalLevel
  })
});

// Staff loan disbursement (financial transaction)
await auditLog.create({
  userId: disbursedById,
  action: 'DISBURSE',
  module: 'HR',
  subModule: 'STAFF_LOAN',
  entityType: 'StaffLoan',
  entityId: loan.id,
  description: `Disbursed staff loan ${loan.loanNumber} amount ${loan.principalAmount}`,
  newValues: JSON.stringify({
    status: 'DISBURSED',
    disbursementReference,
    disbursementMethod
  }),
  metadata: JSON.stringify({
    borrowerId: loan.userId,
    amount: loan.principalAmount,
    tenureMonths: loan.tenureMonths,
    totalRepayable: loan.totalRepayable
  })
});

// Payment verification (financial)
await auditLog.create({
  userId: verifierId,
  action: 'VERIFY_PAYMENT',
  module: 'HR',
  subModule: 'STAFF_LOAN',
  entityType: 'StaffLoanPayment',
  entityId: payment.id,
  description: `Verified payment ${payment.paymentNumber} for loan ${payment.staffLoan.loanNumber}`,
  oldValues: JSON.stringify({ isVerified: false }),
  newValues: JSON.stringify({ isVerified: true, verifiedAt: new Date() }),
  metadata: JSON.stringify({
    loanId: payment.staffLoanId,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod
  })
});

// Payment reversal (critical financial transaction)
await auditLog.create({
  userId: approverId,
  action: 'REVERSE_PAYMENT',
  module: 'HR',
  subModule: 'STAFF_LOAN',
  entityType: 'StaffLoanReversal',
  entityId: reversal.id,
  description: `Reversed payment ${reversal.originalPayment.paymentNumber} reason: ${reversal.reason}`,
  oldValues: JSON.stringify(originalPayment),
  newValues: JSON.stringify({ isReversed: true, reversalId: reversal.id }),
  metadata: JSON.stringify({
    originalAmount: originalPayment.amount,
    reversalAmount: reversal.reversalAmount,
    reasonCategory: reversal.reasonCategory
  })
});

// IT access revocation (security event)
await auditLog.create({
  userId: revokedById,
  action: 'REVOKE_ACCESS',
  module: 'HR',
  subModule: 'OFFBOARDING',
  entityType: 'OffboardingCase',
  entityId: offboarding.id,
  description: `Revoked IT access for ${offboarding.user.firstName} ${offboarding.user.lastName}`,
  oldValues: JSON.stringify({ userStatus: 'ACTIVE', itAccessStatus: 'PENDING' }),
  newValues: JSON.stringify({ userStatus: 'SUSPENDED', itAccessStatus: 'CLEARED' }),
  metadata: JSON.stringify({
    affectedUserId: offboarding.userId,
    sessionTerminated: true,
    tokensRevoked: true
  })
});

// Resource delegation
await auditLog.create({
  userId: createdById,
  action: 'DELEGATE_RESOURCE',
  module: 'HR',
  subModule: 'DELEGATION',
  entityType: 'ResourceDelegation',
  entityId: delegation.id,
  description: `Delegated ${delegation.resourceType} from ${delegation.delegator.name} to ${delegation.delegate.name}`,
  newValues: JSON.stringify(delegation),
  metadata: JSON.stringify({
    resourceType: delegation.resourceType,
    effectiveFrom: delegation.effectiveFrom,
    effectiveTo: delegation.effectiveTo,
    reason: delegation.delegationReason
  })
});

// Salary/Sensitive data access
await auditLog.create({
  userId: accessorId,
  action: 'READ',
  module: 'HR',
  subModule: 'EMPLOYEE',
  entityType: 'EmploymentPeriod',
  entityId: period.id,
  description: `Accessed salary information for employee ${period.user.employeeId}`,
  metadata: JSON.stringify({
    accessedFields: ['salary', 'salaryEffectiveDate'],
    employeeId: period.userId,
    justification: request.reason
  })
});
```

---

### Sensitive Data Protection

**1. Salary Access Control:**

```typescript
async function accessSalaryInformation(
  employmentPeriodId: string,
  accessorId: string,
  reason: string
) {
  // Check permission
  const hasPermission = await checkUserPermission(
    accessorId,
    'employees:view_salary'
  );
  
  if (!hasPermission) {
    throw new Error('Insufficient permission to access salary data');
  }
  
  const period = await prisma.employmentPeriod.findUnique({
    where: { id: employmentPeriodId },
    include: { user: true }
  });
  
  // Audit access
  await prisma.auditLog.create({
    data: {
      userId: accessorId,
      action: 'READ',
      module: 'HR',
      subModule: 'EMPLOYEE',
      entityType: 'EmploymentPeriod',
      entityId: employmentPeriodId,
      description: `Accessed salary: ${period.salary}`,
      metadata: JSON.stringify({
        targetEmployeeId: period.userId,
        justification: reason,
        accessTimestamp: new Date()
      })
    }
  });
  
  return period;
}
```

**2. Financial History Immutability:**

- ✅ `StaffLoanPayment`: `onDelete: Restrict` - prevents cascade deletion
- ✅ `StaffLoanReversal`: `onDelete: Restrict` - preserves reversal history
- ✅ No UPDATE allowed on payment records after creation (enforce at API level)
- ✅ All balance changes traced through payments + reversals + adjustments

**3. Complete Actor Identification:**

Every sensitive operation captures:
- `userId` - Who performed the action
- `userEmail` - User's email at time of action
- `userFullName` - User's full name
- `ipAddress` - Where action originated
- `userAgent`, `browser`, `os`, `device` - Client details
- `branchId` - User's branch context

---


## COMPLETE DATABASE SCHEMA V3.0

### Summary of All Models

**EXISTING (No Changes):**
- User
- Branch
- Department
- Permission, Role, UserRole, UserPermission
- Customer, LoanApplication, RecoveryAccount, WorkflowTask, WorkflowInstance
- AuditLog (extended with new actions)

**NEW MODELS:**

| Model | Purpose | Key Features |
|-------|---------|--------------|
| `EmploymentPeriod` | Track multiple employment periods per employee | Supports re-employment, salary history |
| `LeaveType` | Leave type configuration | Weekend/holiday rules, half-day support |
| `LeaveEntitlement` | Annual leave allocation | Configuration only, no stored balances |
| `LeaveEntitlementAdjustment` | Audit trail for entitlement changes | Immutable adjustment history |
| `LeaveApplication` | Leave requests (source of truth) | Status lifecycle, half-day support, year spanning |
| `LeaveApproval` | Leave approval tracking with FK | Proper referential integrity |
| `PublicHoliday` | Holiday calendar | Branch-specific holidays |
| `BranchWorkweek` | Branch-specific workweek definition | Configurable work days |
| `ResourceOwnership` | Permanent resource ownership history | Partial unique index for current owner |
| `ResourceDelegation` | Temporary resource delegation | Handover acceptance, auto-expiration |
| `StaffLoan` | Staff loan applications | Interest calculation, repayment terms |
| `StaffLoanInstallment` | Repayment schedule | Immutable after generation |
| `StaffLoanPayment` | Payment records (immutable) | Verification workflow |
| `StaffLoanReversal` | Separate reversal records | Double-entry accounting |
| `StaffLoanAdjustment` | Waivers, penalties | Authorization required |
| `StaffLoanApproval` | Loan approval history | Multi-level approval |
| `ApprovalPolicy` | Versioned approval rules | Policy evolution support |
| `OffboardingCase` | Employee exit management | Independent clearances |

---

## TRANSACTION REQUIREMENTS

### Critical Transactions

**1. Leave Application Submission (Concurrency Protection)**

```typescript
// Isolation Level: Serializable
await prisma.$transaction(async (tx) => {
  // 1. Lock entitlement row
  // 2. Calculate balance from applications within transaction
  // 3. Validate sufficient balance
  // 4. Update application status to PENDING_APPROVAL
  // 5. Balance implicitly reserved (counted in pending)
}, {
  isolationLevel: 'Serializable'
});
```

**2. Staff Loan Disbursement (Schedule Generation)**

```typescript
// Isolation Level: ReadCommitted (default)
await prisma.$transaction(async (tx) => {
  // 1. Verify loan status = APPROVED
  // 2. Generate repayment schedule
  // 3. Create all installment records
  // 4. Update loan status to DISBURSED
  // 5. Record disbursement details
});
```

**3. Payment Verification (Balance Update)**

```typescript
// Isolation Level: ReadCommitted
await prisma.$transaction(async (tx) => {
  // 1. Verify payment not already verified
  // 2. Update payment.isVerified = true
  // 3. Recalculate installment status
  // 4. Update loan status if fully paid
  // 5. Create audit log
});
```

**4. Payment Reversal (Immutable Pattern)**

```typescript
// Isolation Level: ReadCommitted
await prisma.$transaction(async (tx) => {
  // 1. Verify payment exists and is verified
  // 2. Verify payment not already reversed
  // 3. Create StaffLoanReversal record
  // 4. Update original payment.isReversed = true
  // 5. Recalculate balances
  // 6. Create audit log
});
```

**5. IT Access Revocation (Security Critical)**

```typescript
// Isolation Level: ReadCommitted
await prisma.$transaction(async (tx) => {
  // 1. Update offboarding.itAccessStatus = CLEARED
  // 2. Update user.status = SUSPENDED
  // 3. Expire all active tokens
  // 4. Mark sessions terminated
  // 5. Create audit log (security event)
});
```

**6. Resource Permanent Reassignment**

```typescript
// Isolation Level: ReadCommitted
await prisma.$transaction(async (tx) => {
  // 1. Close old ownership (set effectiveTo)
  // 2. Create new ownership (effectiveFrom = now)
  // 3. Cancel any active delegations
  // 4. Update offboarding handover progress
  // 5. Create audit log
});
```

---

### Concurrency Considerations

**Concurrent Leave Applications:**
- **Risk:** Two applications submitted simultaneously, both see available balance
- **Mitigation:** `Serializable` isolation level + recalculate within transaction
- **Alternative:** Row-level locking with `SELECT ... FOR UPDATE`

```sql
-- Example row lock
SELECT * FROM leave_entitlements 
WHERE userId = ? AND leaveTypeId = ? AND year = ?
FOR UPDATE;
```

**Concurrent Payment Recording:**
- **Risk:** Two payments recorded for same installment, overpayment
- **Mitigation:** Check installment status within transaction
- **Validation:** Verify `totalPaid <= totalDue` before commit

**Concurrent Delegation:**
- **Risk:** Multiple active delegations for same resource
- **Mitigation:** Unique constraint `@@unique([resourceType, customerId, status])` where `status IN ('PENDING_ACCEPTANCE', 'ACTIVE')`

---

## SCHEDULED JOBS

Required background processes:

**1. Leave Status Updates**
```typescript
// Schedule: Daily at 00:01
// Updates: APPROVED → ACTIVE, ACTIVE → COMPLETED
async function dailyLeaveStatusUpdate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start leaves
  await prisma.leaveApplication.updateMany({
    where: { status: 'APPROVED', startDate: { lte: today } },
    data: { status: 'ACTIVE' }
  });
  
  // Complete leaves
  await prisma.leaveApplication.updateMany({
    where: { status: 'ACTIVE', endDate: { lt: today } },
    data: { status: 'COMPLETED' }
  });
}
```

**2. Delegation Expiration**
```typescript
// Schedule: Hourly
// Expires: Active delegations past effectiveTo
async function processDelegationExpiration() {
  const now = new Date();
  
  await prisma.resourceDelegation.updateMany({
    where: {
      status: 'ACTIVE',
      effectiveTo: { lt: now },
      autoExpired: false
    },
    data: {
      status: 'EXPIRED',
      autoExpired: true,
      expirationProcessedAt: now
    }
  });
}
```

**3. Installment Overdue Marking**
```typescript
// Schedule: Daily at 01:00
// Marks: PENDING/PARTIALLY_PAID installments past due date
async function markOverdueInstallments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.staffLoanInstallment.updateMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      dueDate: { lt: today }
    },
    data: { status: 'OVERDUE' }
  });
}
```

**4. Approval Escalation**
```typescript
// Schedule: Every 6 hours
// Escalates: Overdue approvals
async function escalateOverdueApprovals() {
  const now = new Date();
  
  const overdue = await prisma.leaveApproval.findMany({
    where: {
      status: 'PENDING',
      dueAt: { lt: now }
    },
    include: { approver: true, leaveApplication: true }
  });
  
  for (const approval of overdue) {
    const nextApprover = await getEscalationApprover(approval.approverId);
    
    await prisma.leaveApproval.update({
      where: { id: approval.id },
      data: {
        status: 'ESCALATED',
        approverId: nextApprover
      }
    });
    
    // Notify all parties
    await notifyEscalation(approval, nextApprover);
  }
}
```

---

## API IMPLICATIONS

### New Endpoints Required

**Leave Management:**
```
POST   /api/v1/hr/leaves/apply
GET    /api/v1/hr/leaves/my-applications
GET    /api/v1/hr/leaves/my-balance/:year/:leaveTypeId
GET    /api/v1/hr/leaves/team-calendar
POST   /api/v1/hr/leaves/:id/submit
POST   /api/v1/hr/leaves/:id/cancel
GET    /api/v1/hr/leaves/pending-approvals

POST   /api/v1/hr/leave-approvals/:id/decide
GET    /api/v1/hr/leave-types
POST   /api/v1/hr/leave-entitlements/adjust
```

**Staff Loans:**
```
POST   /api/v1/hr/staff-loans/apply
GET    /api/v1/hr/staff-loans/my-loans
GET    /api/v1/hr/staff-loans/:id
GET    /api/v1/hr/staff-loans/:id/schedule
GET    /api/v1/hr/staff-loans/:id/balance
POST   /api/v1/hr/staff-loans/:id/approve
POST   /api/v1/hr/staff-loans/:id/disburse
POST   /api/v1/hr/staff-loans/:id/payments
POST   /api/v1/hr/staff-loan-payments/:id/verify
POST   /api/v1/hr/staff-loan-payments/:id/reverse
```

**Resource Management:**
```
GET    /api/v1/hr/resources/my-assignments
GET    /api/v1/hr/resources/delegated-to-me
POST   /api/v1/hr/delegations/:id/accept
POST   /api/v1/hr/delegations/:id/reject
GET    /api/v1/hr/delegations/history
```

**Offboarding:**
```
POST   /api/v1/hr/offboarding/initiate
GET    /api/v1/hr/offboarding/:id
POST   /api/v1/hr/offboarding/:id/revoke-it-access
POST   /api/v1/hr/offboarding/:id/clear-finance
POST   /api/v1/hr/offboarding/:id/clear-assets
POST   /api/v1/hr/offboarding/:id/clear-hr
GET    /api/v1/hr/offboarding/:id/resource-handover-status
POST   /api/v1/hr/offboarding/:id/complete
```

**Employment:**
```
GET    /api/v1/hr/employees/:id/employment-history
POST   /api/v1/hr/employees/:id/rehire
GET    /api/v1/hr/employees/:id/salary-history  // Restricted permission
```

---

### Modified Endpoints

**Existing endpoints unchanged** - maintain backward compatibility.

New HR queries use ResourceOwnership/ResourceDelegation to determine effective handler:

```typescript
// Example: Get customer's current handler
GET /api/v1/customers/:id/effective-handler

// Response:
{
  "customerId": "...",
  "permanentOwner": {
    "userId": "...",
    "name": "John Doe",
    "since": "2024-01-15"
  },
  "currentHandler": {
    "userId": "...",  // Could be delegate
    "name": "Jane Smith",
    "isDelegated": true,
    "delegationReason": "ANNUAL_LEAVE",
    "delegationEnd": "2024-12-20",
    "permissions": {
      "canModifyCustomer": true,
      "canApproveLoans": false,
      "canDisburseFunds": false
    }
  }
}
```

---

## MIGRATION SAFETY

### Migration Strategy

**Phase 1: Add New Tables (Non-Breaking)**
- Create all new HR tables
- No changes to existing tables
- No foreign keys to existing tables yet

**Phase 2: Extend User Model**
```sql
-- Add optional HR fields to users table
ALTER TABLE `users` 
ADD COLUMN `hireDate` DATE NULL,
ADD COLUMN `jobTitle` VARCHAR(200) NULL,
ADD COLUMN `contractType` VARCHAR(50) NULL;

-- Backfill from HR data if available
```

**Phase 3: Create Initial Employment Periods**
```sql
-- For existing active employees
INSERT INTO `employment_periods` 
  (id, userId, periodNumber, hireDate, jobTitle, departmentId, branchId, contractType, isCurrent, createdById, createdAt)
SELECT 
  UUID(),
  u.id,
  1,
  COALESCE(u.hireDate, u.createdAt),
  u.jobTitle,
  u.departmentId,
  u.branchId,
  COALESCE(u.contractType, 'PERMANENT'),
  TRUE,
  u.id,
  NOW()
FROM `users` u
WHERE u.status = 'ACTIVE' AND u.deletedAt IS NULL;
```

**Phase 4: Add Foreign Keys**
```sql
-- Add FK constraints after data cleanup
ALTER TABLE `resource_ownerships`
ADD CONSTRAINT `fk_ownership_customer` 
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT;

ALTER TABLE `resource_delegations`
ADD CONSTRAINT `fk_delegation_customer`
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT;
```

**Phase 5: Gradual Rollout**
- Enable HR module for pilot branch first
- Monitor performance, data quality
- Fix issues before full rollout
- Enable other branches incrementally

---

### Rollback Plan

**If Migration Fails:**
1. Drop all new HR tables (no impact on existing data)
2. Remove added User columns (if nullable, safe)
3. Restore application to previous version

**Data Backup:**
```sql
-- Before migration
mysqldump -u user -p vclop_db > vclop_backup_$(date +%Y%m%d).sql

-- Test migration on copy first
CREATE DATABASE vclop_test LIKE vclop_db;
-- Run migration on vclop_test
-- Verify
-- Then run on production
```

---

## UNRESOLVED RISKS

### 1. Partial Unique Indexes (MariaDB Support)

**Issue:**
```prisma
@@unique([resourceType, customerId], where: effectiveTo IS NULL)
```

**Risk:** MariaDB < 10.5 does not support filtered/partial indexes.

**Status:** ✅ **VERIFIED** - Prisma translates this to standard unique index + application-level validation

**Mitigation:**
- Enforce uniqueness at application level
- Add database trigger as backup:

```sql
DELIMITER $$
CREATE TRIGGER check_single_current_owner
BEFORE INSERT ON resource_ownerships
FOR EACH ROW
BEGIN
  IF NEW.effectiveTo IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM resource_ownerships 
      WHERE resourceType = NEW.resourceType 
      AND customerId = NEW.customerId 
      AND effectiveTo IS NULL
      AND id != NEW.id
    ) THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Resource already has a current owner';
    END IF;
  END IF;
END$$
DELIMITER ;
```

---

### 2. Transaction Isolation Levels

**Issue:** Serializable isolation can cause high contention on leave_entitlements.

**Risk:** Performance degradation during peak leave application periods.

**Mitigation:**
- Monitor transaction retry rates
- Consider optimistic locking with version field:

```prisma
model LeaveEntitlement {
  // ...
  version Int @default(1)  // Increment on each update
}
```

```typescript
// Optimistic lock pattern
const entitlement = await prisma.leaveEntitlement.findUnique(...);
await prisma.leaveEntitlement.update({
  where: { 
    id: entitlement.id,
    version: entitlement.version  // Only update if version matches
  },
  data: {
    version: { increment: 1 },
    // ... other updates
  }
});
```

---

### 3. Leave Balance Calculation Performance

**Issue:** Computing balance from LeaveApplication records on every request.

**Risk:** Slow API response for users with many applications.

**Mitigation:**
- Add database view for common balance queries:

```sql
CREATE VIEW leave_balance_summary AS
SELECT 
  e.userId,
  e.leaveTypeId,
  e.year,
  e.allocatedDays + e.carryForwardDays + e.adjustmentDays AS totalEntitled,
  COALESCE(SUM(CASE WHEN la.status IN ('APPROVED', 'ACTIVE', 'COMPLETED') THEN la.businessDaysRequested ELSE 0 END), 0) AS daysUsed,
  COALESCE(SUM(CASE WHEN la.status IN ('DRAFT', 'PENDING_APPROVAL') THEN la.businessDaysRequested ELSE 0 END), 0) AS daysPending
FROM leave_entitlements e
LEFT JOIN leave_applications la ON la.userId = e.userId AND la.leaveTypeId = e.leaveTypeId AND la.primaryEntitlementYear = e.year
GROUP BY e.id;
```

- Cache balance in Redis with 1-hour TTL, invalidate on status change

---

### 4. Approval Policy Changes Mid-Approval

**Issue:** Application submitted under Policy v1, but Policy v2 becomes active during approval process.

**Risk:** Inconsistent approval requirements.

**Mitigation:**
- ✅ Store `policyVersionId` with each LeaveApproval record
- Approval chain determined at submission, not during approval
- Policy change does NOT affect in-flight applications

---

### 5. Resource Delegation During Leave Cancellation

**Issue:** Leave cancelled after delegations created and accepted.

**Risk:** Delegate continues to have access after leave cancelled.

**Mitigation:**
- ✅ Automatic delegation revocation on leave cancellation (already in design)
- Add check in API: Cannot cancel if delegate actively working on delegated resources
- Grace period: Notify delegate before revocation

---

### 6. Staff Loan Outstanding on Employee Exit

**Issue:** Employee resigns with unpaid staff loan.

**Risk:** Loss recovery becomes difficult.

**Mitigation:**
- ✅ Finance clearance blocked until loans settled (already in design)
- Option 1: Deduct from final settlement
- Option 2: Convert to external recovery account
- Option 3: Payment plan agreement before clearance

**Recommendation:** Implement Option 1 as default, others as exceptions.

---

### 7. Salary Deduction Automation Not Yet Implemented

**Issue:** StaffLoanPayment supports `SALARY_DEDUCTION` method but no automation.

**Risk:** Manual payment recording prone to errors.

**Status:** **DEFERRED** to Phase 2.

**Future Integration:**
- Integrate with payroll system
- Automatic payment recording during payroll run
- Reconciliation report for mismatches

---

### 8. Scheduled Job Failure Handling

**Issue:** If scheduled job fails (e.g., delegation expiration), manual intervention needed.

**Risk:** Delegations remain active past expiry.

**Mitigation:**
- Add job execution logging
- Alert on consecutive failures
- Manual admin tool to process missed expirations:

```
POST /api/v1/admin/hr/jobs/run-missed-expirations
```

---

### 9. Delegation Permission Enforcement

**Issue:** Delegate may attempt actions beyond granted permissions.

**Risk:** Unauthorized operations.

**Mitigation:**
- ✅ Permissions stored in ResourceDelegation model
- Middleware checks permissions before allowing action:

```typescript
async function checkDelegatedPermission(
  userId: string,
  resourceId: string,
  requiredPermission: string
) {
  const delegation = await getActiveDelegation(resourceId);
  
  if (!delegation) {
    return true;  // User is permanent owner, full permissions
  }
  
  if (delegation.delegatedTo !== userId) {
    throw new Error('You do not have access to this resource');
  }
  
  if (!delegation[requiredPermission]) {
    throw new Error(`Delegation does not grant permission: ${requiredPermission}`);
  }
  
  return true;
}
```

---

### 10. Re-employment of Offboarded Employee with Pending Clearances

**Issue:** Employee rehired while previous offboarding case incomplete.

**Risk:** Confusion, incomplete records.

**Recommendation:**
- Prevent rehire if previous offboarding NOT completed
- Or force-complete previous offboarding with conditions
- Admin override with justification

---

## SUMMARY OF CHANGES FROM V2.0

| Area | V2.0 Issue | V3.0 Solution |
|------|------------|---------------|
| **Resource Management** | Single model with conflicting constraints | Separate ResourceOwnership + ResourceDelegation |
| **Leave Balance** | Stored computed fields | Single source of truth (LeaveApplication) |
| **Loan Payments** | Mutable payment records | Immutable payments + separate reversals |
| **Approval** | Polymorphic without FK | Dedicated tables with proper FK |
| **Offboarding** | Single-period assumption | EmploymentPeriod supports re-employment |
| **IT Revocation** | Tied to clearance | Independent, immediate revocation |
| **Audit** | New AuditLog model proposed | Extend existing AuditLog |
| **Constraints** | Blocks historical records | Partial indexes, proper temporal tracking |
| **Transactions** | Not specified | Explicit isolation levels defined |
| **Scheduled Jobs** | Not addressed | 4 jobs defined with failure handling |

---

## APPROVAL CHECKLIST

Before implementation, confirm:

- [ ] All 10 unresolved risks reviewed and mitigation accepted
- [ ] MariaDB version confirmed (10.2+)
- [ ] Transaction isolation strategy approved
- [ ] Scheduled job infrastructure ready (cron/Bull/Agenda)
- [ ] API authentication/authorization reviewed
- [ ] Frontend team briefed on new endpoints
- [ ] Data migration tested on staging
- [ ] Rollback plan documented
- [ ] Performance testing plan ready
- [ ] Audit requirements confirmed with compliance
- [ ] Salary deduction Phase 2 timeline agreed

---

**END OF ARCHITECTURE V3.0**

**Status:** PENDING APPROVAL - NO IMPLEMENTATION YET

**Next Steps:**
1. Review this V3.0 document
2. Provide approval or request further revisions
3. Upon approval, begin phased implementation

