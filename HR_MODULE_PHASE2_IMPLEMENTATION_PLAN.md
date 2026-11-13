# HR Module Phase 2 - Backend Implementation Plan

**Status:** IN PROGRESS  
**Date:** October 28, 2026

---

## Overview

This document outlines the complete backend implementation for the HR & Employee Self-Service Module.

---

## Module Structure Created ✅

```
src/modules/hr/
├── hr.module.ts                    ✅ Created
├── employment/
│   ├── employment.module.ts        ✅ Created
│   ├── employment.service.ts       ✅ Created
│   ├── employment.controller.ts    ✅ Created
│   └── dto/                        ⏳ Pending
├── leaves/
│   ├── leaves.module.ts            ⏳ Next
│   ├── leaves.service.ts           ⏳ Next
│   ├── leave-balance.service.ts    ⏳ Next
│   ├── leave-approval.service.ts   ⏳ Next
│   ├── leaves.controller.ts        ⏳ Next
│   └── dto/                        ⏳ Pending
├── staff-loans/
│   ├── staff-loans.module.ts       ⏳ Pending
│   ├── staff-loans.service.ts      ⏳ Pending
│   ├── repayment.service.ts        ⏳ Pending
│   ├── payment.service.ts          ⏳ Pending
│   ├── staff-loans.controller.ts   ⏳ Pending
│   └── dto/                        ⏳ Pending
├── resources/
│   ├── resources.module.ts         ⏳ Pending
│   ├── ownership.service.ts        ⏳ Pending
│   ├── delegation.service.ts       ⏳ Pending
│   ├── resources.controller.ts     ⏳ Pending
│   └── dto/                        ⏳ Pending
├── offboarding/
│   ├── offboarding.module.ts       ⏳ Pending
│   ├── offboarding.service.ts      ⏳ Pending
│   ├── offboarding.controller.ts   ⏳ Pending
│   └── dto/                        ⏳ Pending
└── approvals/
    ├── approvals.module.ts         ⏳ Pending
    ├── approval-engine.service.ts  ⏳ Pending
    ├── approval-policy.service.ts  ⏳ Pending
    └── dto/                        ⏳ Pending
```

---

## Employment Module ✅ COMPLETE

### Files Created:
1. `employment.module.ts` - Module definition
2. `employment.service.ts` - Business logic
3. `employment.controller.ts` - REST endpoints

### Features Implemented:
- ✅ Get employment history
- ✅ Get current employment
- ✅ Create employment period
- ✅ Update salary
- ✅ Transfer employee (branch/department)
- ✅ Check rehire eligibility
- ✅ Rehire employee

### API Endpoints:
```
GET    /hr/employees/:id/employment-history
GET    /hr/employees/:id/current-employment
POST   /hr/employees/:id/employment
PUT    /hr/employees/:id/salary
PUT    /hr/employees/:id/transfer
GET    /hr/employees/:id/rehire-eligibility
POST   /hr/employees/:id/rehire
```

---

## Leaves Module ⏳ NEXT

### Required Files:
1. `leaves.module.ts`
2. `leaves.service.ts` - CRUD operations
3. `leave-balance.service.ts` - Balance calculations (critical)
4. `leave-approval.service.ts` - Approval workflow
5. `leaves.controller.ts` - REST endpoints
6. DTOs for validation

### Key Business Logic to Implement:

**1. Leave Balance Calculation (No Stored Fields):**
```typescript
async calculateLeaveBalance(
  userId: string,
  leaveTypeId: string,
  year: number
): Promise<LeaveBalance> {
  // 1. Get entitlement
  const entitlement = await prisma.leaveEntitlement.findUnique({...});
  
  const totalEntitled = 
    entitlement.allocatedDays + 
    entitlement.carryForwardDays + 
    entitlement.adjustmentDays;
  
  // 2. Calculate used (APPROVED, ACTIVE, COMPLETED)
  const usedApplications = await prisma.leaveApplication.findMany({
    where: {
      userId,
      leaveTypeId,
      primaryEntitlementYear: year,
      status: { in: ['APPROVED', 'ACTIVE', 'COMPLETED'] }
    }
  });
  
  const daysUsed = usedApplications.reduce((sum, app) => 
    sum + (app.daysFromPrimaryYear || app.businessDaysRequested), 0
  );
  
  // 3. Calculate pending (DRAFT, PENDING_APPROVAL)
  const pendingApplications = await prisma.leaveApplication.findMany({
    where: {
      userId,
      leaveTypeId,
      primaryEntitlementYear: year,
      status: { in: ['DRAFT', 'PENDING_APPROVAL'] }
    }
  });
  
  const daysPending = pendingApplications.reduce((sum, app) => 
    sum + (app.daysFromPrimaryYear || app.businessDaysRequested), 0
  );
  
  // 4. Available = entitled - used - pending
  const daysAvailable = totalEntitled - daysUsed - daysPending;
  
  return { totalEntitled, daysUsed, daysPending, daysAvailable };
}
```

**2. Business Days Calculation:**
```typescript
async calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  startDayType: DayType,
  endDayType: DayType,
  userId: string,
  leaveTypeId: string
): Promise<number> {
  // Consider:
  // - Branch workweek configuration
  // - Public holidays (branch-specific)
  // - LeaveType settings (countWeekendsAsLeave, countHolidaysAsLeave)
  // - Half-day support
}
```

**3. Concurrency-Safe Submission:**
```typescript
async submitLeaveApplication(applicationId: string) {
  return await prisma.$transaction(async (tx) => {
    // Lock entitlement
    const balance = await calculateLeaveBalance(...); // Within transaction
    
    // Validate sufficient balance
    if (balance.daysAvailable < app.businessDaysRequested) {
      throw new Error('Insufficient leave balance');
    }
    
    // Update status (reserves entitlement)
    await tx.leaveApplication.update({
      where: { id: applicationId },
      data: { status: 'PENDING_APPROVAL', submittedAt: new Date() }
    });
  }, {
    isolationLevel: 'Serializable' // Prevent concurrent submissions
  });
}
```

**4. Leave Spanning Multiple Years:**
```typescript
// If leave crosses year boundary, split allocation
if (startYear !== endYear) {
  const yearEnd = new Date(startYear, 11, 31);
  const daysInFirstYear = await calculateBusinessDays(startDate, yearEnd, ...);
  const daysInSecondYear = totalDays - daysInFirstYear;
  
  // Store both allocations
  daysFromPrimaryYear = daysInFirstYear;
  daysFromSecondaryYear = daysInSecondYear;
}
```

### API Endpoints Required:
```
POST   /hr/leaves/apply
GET    /hr/leaves/my-applications
GET    /hr/leaves/my-balance/:year/:leaveTypeId
GET    /hr/leaves/team-calendar
POST   /hr/leaves/:id/submit
POST   /hr/leaves/:id/cancel
GET    /hr/leaves/pending-approvals
POST   /hr/leave-approvals/:id/decide
GET    /hr/leave-types
POST   /hr/leave-entitlements/adjust
GET    /hr/public-holidays
POST   /hr/public-holidays
```

---

## Staff Loans Module ⏳ PENDING

### Required Files:
1. `staff-loans.module.ts`
2. `staff-loans.service.ts` - Loan lifecycle
3. `repayment.service.ts` - Schedule generation
4. `payment.service.ts` - Payment/reversal logic
5. `staff-loans.controller.ts`

### Key Business Logic:

**1. Flat Interest Schedule Generation:**
```typescript
function calculateFlatInterestSchedule(
  principal: number,
  annualRate: number,  // 0.12 for 12%
  tenureMonths: number,
  disbursementDate: Date
): Installment[] {
  const totalInterest = principal * annualRate * (tenureMonths / 12);
  const totalRepayable = principal + totalInterest;
  const monthlyInstallment = totalRepayable / tenureMonths;
  
  const principalPerInstallment = principal / tenureMonths;
  const interestPerInstallment = totalInterest / tenureMonths;
  
  const schedule: Installment[] = [];
  let runningBalance = principal;
  
  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = addMonths(disbursementDate, i);
    
    schedule.push({
      installmentNumber: i,
      dueDate,
      principalDue: round(principalPerInstallment, 2),
      interestDue: round(interestPerInstallment, 2),
      totalDue: round(monthlyInstallment, 2),
      principalBalanceBefore: round(runningBalance, 2),
      principalBalanceAfter: round(runningBalance - principalPerInstallment, 2)
    });
    
    runningBalance -= principalPerInstallment;
  }
  
  return schedule;
}
```

**2. Payment Recording (Immutable):**
```typescript
async recordPayment(data: PaymentData) {
  // Create immutable payment record
  const payment = await prisma.staffLoanPayment.create({
    data: {
      paymentNumber: await generatePaymentNumber(),
      staffLoanId: data.loanId,
      installmentId: data.installmentId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.method,
      principalPaid: allocation.principal,
      interestPaid: allocation.interest,
      transactionReference: data.reference,
      isVerified: false,  // Requires verification
      recordedById: data.recordedById
    }
  });
  
  return payment;
}
```

**3. Payment Reversal (Separate Record):**
```typescript
async reversePayment(paymentId: string, reason: string, approverId: string) {
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
        reversalDate: new Date(),
        reason,
        reasonCategory: determineCategory(reason),
        approvedById: approverId
      }
    });
    
    // Mark original payment as reversed (UPDATE isReversed flag only)
    await tx.staffLoanPayment.update({
      where: { id: paymentId },
      data: { isReversed: true, reversalId: reversal.id }
    });
    
    return reversal;
  });
}
```

**4. Outstanding Balance Calculation:**
```typescript
async calculateOutstandingBalance(loanId: string): Promise<Balance> {
  // From schedule
  const installments = await prisma.staffLoanInstallment.findMany({
    where: { staffLoanId: loanId }
  });
  
  const totalDue = installments.reduce((sum, i) => sum + i.totalDue, 0);
  
  // Verified, non-reversed payments only
  const payments = await prisma.staffLoanPayment.findMany({
    where: {
      staffLoanId: loanId,
      isVerified: true,
      isReversed: false
    }
  });
  
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Adjustments (waivers reduce balance, penalties increase)
  const adjustments = await prisma.staffLoanAdjustment.findMany({
    where: { staffLoanId: loanId }
  });
  
  const adjustmentTotal = adjustments.reduce((sum, a) => {
    return a.adjustmentType === 'INTEREST_WAIVER' ? sum - a.amount :
           a.adjustmentType === 'PENALTY_CHARGE' ? sum + a.amount : sum;
  }, 0);
  
  return {
    totalDue,
    totalPaid,
    outstandingTotal: totalDue - totalPaid + adjustmentTotal
  };
}
```

### API Endpoints Required:
```
POST   /hr/staff-loans/apply
GET    /hr/staff-loans/my-loans
GET    /hr/staff-loans/:id
GET    /hr/staff-loans/:id/schedule
GET    /hr/staff-loans/:id/balance
POST   /hr/staff-loans/:id/approve
POST   /hr/staff-loans/:id/disburse
POST   /hr/staff-loans/:id/payments
POST   /hr/staff-loan-payments/:id/verify
POST   /hr/staff-loan-payments/:id/reverse
```

---

## Resources Module ⏳ PENDING

### Key Services:

**1. Get Effective Handler:**
```typescript
async getEffectiveHandler(
  resourceType: ResourceType,
  resourceId: string
): Promise<EffectiveHandler> {
  // 1. Check for active delegation first
  const delegation = await prisma.resourceDelegation.findFirst({
    where: {
      resourceType,
      [getResourceIdField(resourceType)]: resourceId,
      status: 'ACTIVE',
      effectiveFrom: { lte: new Date() },
      effectiveTo: { gte: new Date() }
    }
  });
  
  if (delegation) {
    return {
      userId: delegation.delegatedTo,
      isDelegated: true,
      permissions: {
        canApproveLoans: delegation.canApproveLoans,
        canDisburseFunds: delegation.canDisburseFunds,
        canModifyCustomer: delegation.canModifyCustomer
      }
    };
  }
  
  // 2. Fall back to permanent owner
  const ownership = await prisma.resourceOwnership.findFirst({
    where: {
      resourceType,
      [getResourceIdField(resourceType)]: resourceId,
      effectiveTo: null  // Current owner
    }
  });
  
  return {
    userId: ownership.ownerId,
    isDelegated: false,
    permissions: null  // Full permissions
  };
}
```

**2. Create Temporary Delegation (for Leave):**
```typescript
async delegateResourcesForLeave(
  userId: string,
  leaveId: string,
  delegateUserId: string,
  leaveStart: Date,
  leaveEnd: Date
) {
  // Find all current ownerships
  const ownerships = await prisma.resourceOwnership.findMany({
    where: {
      ownerId: userId,
      effectiveTo: null
    }
  });
  
  // Create delegation for each
  for (const ownership of ownerships) {
    await prisma.resourceDelegation.create({
      data: {
        resourceType: ownership.resourceType,
        [`${ownership.resourceType.toLowerCase()}Id`]: ownership[...],
        delegatedFrom: userId,
        delegatedTo: delegateUserId,
        effectiveFrom: leaveStart,
        effectiveTo: leaveEnd,
        delegationReason: 'ANNUAL_LEAVE',
        relatedLeaveId: leaveId,
        status: 'PENDING_ACCEPTANCE',
        canModifyCustomer: true,
        canApproveLoans: false,  // Configurable
        createdById: userId
      }
    });
  }
}
```

**3. Permanent Reassignment (Employee Exit):**
```typescript
async permanentlyReassignResources(
  fromUserId: string,
  toUserId: string,
  offboardingId: string
) {
  const now = new Date();
  
  // Close current ownerships
  const currentOwnerships = await prisma.resourceOwnership.findMany({
    where: { ownerId: fromUserId, effectiveTo: null }
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
        [...],
        ownerId: toUserId,
        effectiveFrom: now,
        changeReason: 'EMPLOYEE_EXIT',
        assignedById: currentUserId
      }
    });
  }
  
  // Cancel active delegations
  await prisma.resourceDelegation.updateMany({
    where: {
      OR: [
        { delegatedFrom: fromUserId, status: 'ACTIVE' },
        { delegatedTo: fromUserId, status: 'ACTIVE' }
      ]
    },
    data: { status: 'REVOKED' }
  });
}
```

### API Endpoints Required:
```
GET    /hr/resources/my-assignments
GET    /hr/resources/delegated-to-me
POST   /hr/delegations/:id/accept
POST   /hr/delegations/:id/reject
GET    /hr/delegations/history
GET    /customers/:id/effective-handler
```

---

## Offboarding Module ⏳ PENDING

### Key Features:

**1. Initiate Offboarding:**
- Create OffboardingCase
- Create/close EmploymentPeriod
- Count resources assigned
- Set clearance statuses to PENDING

**2. IT Access Revocation (Independent & Immediate):**
```typescript
async revokeITAccess(offboardingId: string, revokedById: string) {
  return await prisma.$transaction(async (tx) => {
    const offboarding = await tx.offboardingCase.findUnique({...});
    
    // 1. Update offboarding
    await tx.offboardingCase.update({
      where: { id: offboardingId },
      data: {
        itAccessStatus: 'CLEARED',
        itAccessRevokedAt: new Date(),
        itAccessRevokedById: revokedById,
        accountSuspended: true,
        accountSuspendedAt: new Date()
      }
    });
    
    // 2. Suspend user account
    await tx.user.update({
      where: { id: offboarding.userId },
      data: { status: 'SUSPENDED' }
    });
    
    // 3. Expire tokens
    await tx.token.updateMany({
      where: { userId: offboarding.userId, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() }
    });
  });
}
```

**3. Finance Clearance (Check Staff Loans):**
```typescript
async clearFinance(offboardingId: string, clearedById: string) {
  const offboarding = await prisma.offboardingCase.findUnique({...});
  
  // Check outstanding loans
  const outstandingLoans = await prisma.staffLoan.findMany({
    where: {
      userId: offboarding.userId,
      status: { in: ['ACTIVE', 'DISBURSED'] }
    }
  });
  
  let totalOutstanding = 0;
  for (const loan of outstandingLoans) {
    const balance = await calculateOutstandingBalance(loan.id);
    totalOutstanding += balance.outstandingTotal;
  }
  
  if (totalOutstanding > 0) {
    throw new Error(
      `Cannot clear finance: ${outstandingLoans.length} outstanding loans totaling ${totalOutstanding}`
    );
  }
  
  await prisma.offboardingCase.update({
    where: { id: offboardingId },
    data: {
      financeStatus: 'CLEARED',
      financeClearedAt: new Date(),
      financeClearedById: clearedById,
      outstandingStaffLoans: 0
    }
  });
}
```

### API Endpoints Required:
```
POST   /hr/offboarding/initiate
GET    /hr/offboarding/:id
POST   /hr/offboarding/:id/revoke-it-access
POST   /hr/offboarding/:id/clear-finance
POST   /hr/offboarding/:id/clear-assets
POST   /hr/offboarding/:id/clear-hr
GET    /hr/offboarding/:id/resource-handover-status
POST   /hr/offboarding/:id/complete
```

---

## Approvals Module ⏳ PENDING

### Approval Engine Logic:

**1. Determine Approval Levels:**
```typescript
async determineApprovalLevels(applicationId: string): Promise<Level[]> {
  const application = await prisma.leaveApplication.findUnique({...});
  
  // Get current policy
  const policy = await prisma.approvalPolicy.findFirst({
    where: {
      entityType: 'LEAVE_APPLICATION',
      effectiveFrom: { lte: new Date() },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }]
    },
    orderBy: { version: 'desc' }
  });
  
  const policyLevels = JSON.parse(policy.levels);
  const days = application.businessDaysRequested;
  
  // Filter applicable levels based on days
  return policyLevels.levels.filter(level => {
    const meetsMin = !level.conditions.minDays || days >= level.conditions.minDays;
    const meetsMax = !level.conditions.maxDays || days <= level.conditions.maxDays;
    return meetsMin && meetsMax;
  });
}
```

**2. Select Approver:**
```typescript
async selectApprover(levelConfig: any, application: any): Promise<string> {
  switch (levelConfig.selectionCriteria.type) {
    case 'SUPERVISOR':
      const supervisor = await prisma.user.findUnique({
        where: { id: application.user.supervisorId }
      });
      const hasPermission = await checkUserPermission(
        supervisor.id,
        levelConfig.selectionCriteria.requirePermission
      );
      if (!hasPermission) throw new Error('Supervisor lacks permission');
      return await getEffectiveApprover(supervisor.id);  // Check delegation
      
    case 'DEPARTMENT_HEAD':
      const deptHead = await prisma.user.findFirst({
        where: {
          departmentId: application.user.departmentId,
          userRoles: { some: { role: { code: 'DEPARTMENT_HEAD' } } }
        }
      });
      return await getEffectiveApprover(deptHead.id);
      
    case 'ROLE':
      const roleUsers = await prisma.user.findMany({
        where: {
          userRoles: { some: { role: { name: levelConfig.requiredRole } } }
        }
      });
      return await getEffectiveApprover(roleUsers[0].id);
  }
}
```

**3. Create Approval Requests:**
```typescript
async createApprovalRequests(applicationId: string) {
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
```

### API Endpoints Required:
```
GET    /hr/approvals/pending
POST   /hr/approvals/:id/decide
GET    /hr/approval-policies
POST   /hr/approval-policies
```

---

## Scheduled Jobs Required

### 1. Daily Leave Status Updates
```typescript
@Cron('0 1 * * *')  // Daily at 01:00
async updateLeaveStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // APPROVED → ACTIVE
  await prisma.leaveApplication.updateMany({
    where: { status: 'APPROVED', startDate: { lte: today } },
    data: { status: 'ACTIVE' }
  });
  
  // ACTIVE → COMPLETED
  await prisma.leaveApplication.updateMany({
    where: { status: 'ACTIVE', endDate: { lt: today } },
    data: { status: 'COMPLETED' }
  });
}
```

### 2. Hourly Delegation Expiration
```typescript
@Cron('0 * * * *')  // Every hour
async processDelegationExpiration() {
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

### 3. Daily Installment Overdue Marking
```typescript
@Cron('0 2 * * *')  // Daily at 02:00
async markOverdueInstallments() {
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

### 4. 6-Hourly Approval Escalation
```typescript
@Cron('0 */6 * * *')  // Every 6 hours
async escalateOverdueApprovals() {
  const now = new Date();
  
  const overdue = await prisma.leaveApproval.findMany({
    where: { status: 'PENDING', dueAt: { lt: now } },
    include: { approver: true, leaveApplication: true }
  });
  
  for (const approval of overdue) {
    const nextApprover = await getEscalationApprover(approval.approverId);
    
    await prisma.leaveApproval.update({
      where: { id: approval.id },
      data: { status: 'ESCALATED', approverId: nextApprover }
    });
  }
}
```

---

## Integration with Existing Modules

### App Module Registration
```typescript
// src/app.module.ts
import { HrModule } from './modules/hr/hr.module';

@Module({
  imports: [
    // ... existing modules
    HrModule,  // Add here
  ],
})
export class AppModule {}
```

### Permissions to Add
```sql
INSERT INTO permissions (id, code, name, category, module, action) VALUES
(UUID(), 'leaves:apply', 'Apply for Leave', 'HR', 'HR', 'create'),
(UUID(), 'leaves:approve_team', 'Approve Team Leave', 'HR', 'HR', 'approve'),
(UUID(), 'leaves:approve_department', 'Approve Department Leave', 'HR', 'HR', 'approve'),
(UUID(), 'leaves:approve_all', 'Approve All Leave', 'HR', 'HR', 'approve'),
(UUID(), 'staff_loans:apply', 'Apply for Staff Loan', 'HR', 'HR', 'create'),
(UUID(), 'staff_loans:approve', 'Approve Staff Loans', 'HR', 'HR', 'approve'),
(UUID(), 'staff_loans:disburse', 'Disburse Staff Loans', 'HR', 'HR', 'execute'),
(UUID(), 'employees:view_salary', 'View Employee Salary', 'HR', 'HR', 'read'),
(UUID(), 'employees:update_salary', 'Update Employee Salary', 'HR', 'HR', 'update'),
(UUID(), 'employees:transfer', 'Transfer Employee', 'HR', 'HR', 'update'),
(UUID(), 'employees:rehire', 'Rehire Employee', 'HR', 'HR', 'create'),
(UUID(), 'offboarding:initiate', 'Initiate Offboarding', 'HR', 'HR', 'create'),
(UUID(), 'offboarding:revoke_access', 'Revoke IT Access', 'HR', 'HR', 'execute'),
(UUID(), 'offboarding:clear_finance', 'Clear Finance', 'HR', 'HR', 'approve'),
(UUID(), 'offboarding:clear_assets', 'Clear Assets', 'HR', 'HR', 'approve'),
(UUID(), 'offboarding:clear_hr', 'Clear HR', 'HR', 'HR', 'approve');
```

---

## Testing Strategy

### Unit Tests
- Service methods in isolation
- Balance calculation logic
- Schedule generation
- Interest calculation

### Integration Tests
- Full approval workflow
- Leave submission with concurrency
- Payment reversal flow
- Offboarding process

### E2E Tests
- Employee applies for leave → approved → becomes active
- Staff loan application → disbursement → payment → completion
- Resource delegation → acceptance → expiration
- Employee offboarding → all clearances → completion

---

## Next Steps

**Immediate (Continue Phase 2):**
1. ✅ Employment module complete
2. ⏳ Create Leaves module (next)
3. ⏳ Create Staff Loans module
4. ⏳ Create Resources module
5. ⏳ Create Offboarding module
6. ⏳ Create Approvals module
7. ⏳ Create scheduled jobs
8. ⏳ Add permissions
9. ⏳ Register HR module in app.module.ts

**Then Phase 3: Frontend**
- React components
- Forms with validation
- Dashboard widgets
- Approval queues
- Calendar views

**Then Phase 4: Testing & Deployment**
- Unit/integration tests
- Database migration execution
- Production deployment

Would you like me to:
1. **Continue with Leaves module** (most complex)
2. **Create all remaining modules** (faster, less detailed)
3. **Focus on specific module** (your choice)
4. **Move to scheduled jobs first**

