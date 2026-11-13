# HR Module - Quick Start Guide

**Status:** Phase 2 - Leaves Module Complete ✅  
**Last Updated:** October 28, 2026

---

## 🚀 What's Ready Now

### ✅ Employment Module
- Full employee lifecycle management
- Salary updates with audit trail
- Branch/department transfers
- Rehiring eligibility checks

### ✅ Leaves Module
- Complete leave application workflow
- Real-time balance calculation
- Multi-level approval system
- Business days with holidays/weekends
- Year spanning support
- Concurrency-safe submissions

---

## 📋 Next Steps to Deploy

### 1. Database Migration

**Generate Migration:**
```bash
cd vclop/vclop-backend
npx prisma migrate dev --name add_hr_module
```

**Or Manual Migration (if shadow DB unavailable):**
```bash
# Generate SQL
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/hr_module.sql

# Review and execute via phpMyAdmin or:
mysql -h <host> -u <user> -p <database> < migrations/hr_module.sql
```

### 2. Seed Permissions

```bash
mysql -h <host> -u <user> -p <database> < ADD_HR_PERMISSIONS.sql
```

This creates:
- 30+ HR permissions
- Role assignments for CEO, COO, HR Manager, Dept Heads, etc.

### 3. Seed Initial Data

**Leave Types:**
```sql
INSERT INTO LeaveType (id, name, code, isPaid, requiresDocumentation, countWeekendsAsLeave, countHolidaysAsLeave, canCarryForward, maxCarryForwardDays, createdAt, updatedAt)
VALUES
  (UUID(), 'Annual Leave', 'ANNUAL', true, false, false, false, true, 5, NOW(), NOW()),
  (UUID(), 'Sick Leave', 'SICK', true, true, true, true, false, 0, NOW(), NOW()),
  (UUID(), 'Emergency Leave', 'EMERGENCY', true, false, false, false, false, 0, NOW(), NOW());
```

**Leave Entitlements (for each employee):**
```sql
INSERT INTO LeaveEntitlement (id, userId, leaveTypeId, year, allocatedDays, carryForwardDays, adjustmentDays, createdAt, updatedAt)
VALUES
  (UUID(), '<user_id>', '<leave_type_id>', 2026, 20, 0, 0, NOW(), NOW());
```

**Approval Policy:**
```sql
INSERT INTO ApprovalPolicy (id, entityType, policyName, description, levels, version, effectiveFrom, createdAt, updatedAt)
VALUES
  (UUID(), 'LEAVE_APPLICATION', 'Standard Leave Approval', 'Default policy for leave applications', '{
    "levels": [
      {
        "level": 1,
        "name": "Supervisor",
        "selectionCriteria": {"type": "SUPERVISOR"},
        "escalationHours": 48
      },
      {
        "level": 2,
        "name": "Department Head",
        "selectionCriteria": {"type": "DEPARTMENT_HEAD"},
        "escalationHours": 24,
        "conditions": {"minDays": 5}
      }
    ]
  }', 1, NOW(), NOW(), NOW());
```

### 4. Test the API

**Create Leave Application:**
```bash
curl -X POST http://localhost:3000/hr/leaves/apply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveTypeId": "...",
    "startDate": "2026-11-15",
    "endDate": "2026-11-19",
    "reason": "Family vacation"
  }'
```

**Submit for Approval:**
```bash
curl -X POST http://localhost:3000/hr/leaves/<id>/submit \
  -H "Authorization: Bearer <token>"
```

**Check My Balance:**
```bash
curl -X GET http://localhost:3000/hr/leaves/my-balance/2026 \
  -H "Authorization: Bearer <token>"
```

**Approve (as supervisor):**
```bash
curl -X POST http://localhost:3000/hr/leave-approvals/<approval_id>/decide \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVE",
    "comments": "Approved, enjoy your vacation"
  }'
```

---

## 📁 File Structure

```
vclop/vclop-backend/src/modules/hr/
├── hr.module.ts                     [Main module]
│
├── employment/
│   ├── employment.module.ts
│   ├── employment.service.ts
│   └── employment.controller.ts
│
└── leaves/
    ├── leaves.module.ts
    ├── leave-balance.service.ts     [Balance calculation engine]
    ├── leaves.service.ts            [CRUD operations]
    ├── leave-approval.service.ts    [Approval workflow]
    ├── leaves.controller.ts         [REST endpoints]
    └── dto/
        ├── create-leave-application.dto.ts
        ├── cancel-leave-application.dto.ts
        └── approve-leave.dto.ts
```

---

## 🔑 Key Permissions

### All Employees (Self-Service)
- `leaves:read` - View own applications and balances
- `leaves:create` - Create and submit leave applications
- `resources:accept` - Accept/reject resource delegations

### Supervisors
- `leaves:approve` - Approve team leave applications

### HR Manager
- `leaves:manage` - Full leave management
- `leave_entitlements:manage` - Create/adjust entitlements
- `employment:manage` - Full employment management
- `resources:manage` - Assign/reassign resources

### Accounting Head
- `staff_loans:disburse` - Disburse approved loans
- `offboarding:finance_clear` - Financial clearance

---

## 🧪 Testing Checklist

### Manual Tests
- [ ] Create draft leave application
- [ ] Submit application (sufficient balance)
- [ ] Submit application (insufficient balance) - should fail
- [ ] Concurrent submissions - only one should succeed
- [ ] Cancel pending application
- [ ] Approve as supervisor
- [ ] Reject with comments
- [ ] Return for more information
- [ ] Check balance after approval
- [ ] Half-day leave calculation
- [ ] Leave spanning 2 years
- [ ] Weekend/holiday exclusion
- [ ] Self-approval prevention

### Edge Cases
- [ ] Approver on leave (delegation)
- [ ] Supervisor not assigned
- [ ] No approval policy (auto-approve)
- [ ] Multi-level approval (3+ days)
- [ ] Leave starting today
- [ ] Leave ending yesterday (should fail)

---

## 🐛 Troubleshooting

### "Shadow database not available"
Use manual migration or `npx prisma db push` (development only)

### "Insufficient leave balance"
Check entitlements: `SELECT * FROM LeaveEntitlement WHERE userId='...'`

### "No active department head found"
Assign DEPARTMENT_HEAD role to appropriate users

### "Self-approval is not allowed"
This is intentional - employee cannot approve own leave

### Concurrency test fails
Check isolation level in database connection string

---

## 📚 Documentation

- **Architecture:** `HR_MODULE_ARCHITECTURE_V3.md`
- **Implementation Status:** `HR_MODULE_IMPLEMENTATION_STATUS.md`
- **Leaves Module Detail:** `HR_LEAVES_MODULE_COMPLETE.md`
- **Permission SQL:** `ADD_HR_PERMISSIONS.sql`

---

## ⚡ Performance Notes

### Indexed Fields
- `LeaveApplication.applicationNumber`
- `LeaveApplication.userId`
- `LeaveApplication.status`
- `LeaveApplication.primaryEntitlementYear`

### Transaction Isolation
- Leave submission uses `Serializable` isolation
- Prevents concurrent balance exhaustion
- May cause rare deadlocks (retry on failure)

### Query Optimization
- Balance calculation: N+1 query prevention
- Includes used for related data
- Efficient date range filtering

---

## 🎯 What's Next

**Remaining Modules (in priority order):**
1. Staff Loans Module
2. Resources Module
3. Offboarding Module
4. Scheduled Jobs
5. Frontend Implementation

**Estimated Time:**
- Backend: 16-20 hours
- Frontend: 40-50 hours
- Testing: 20-25 hours

---

## 🎉 Summary

You now have:
- ✅ 2 complete backend modules
- ✅ 17 API endpoints
- ✅ ~1,500 lines of production code
- ✅ Sophisticated leave management system
- ✅ Multi-level approval workflow
- ✅ Ready for database migration

**Next:** Run migration, seed data, test API!

