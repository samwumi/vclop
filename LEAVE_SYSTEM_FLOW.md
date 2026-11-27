# Leave Management System - Complete Flow Diagram

## 🔄 Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        STAFF APPLIES FOR LEAVE                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  My Leaves Page         │
                    │  - View Balance         │
                    │  - Click "Apply"        │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Fill Application Form  │
                    │  - Leave Type           │
                    │  - Start/End Date       │
                    │  - Reason               │
                    │  - Reliever (optional)  │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  POST /api/hr/leaves    │
                    │  Status: PENDING        │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │  LeaveApplication│        │  HR Dashboard     │
        │  Created in DB   │        │  Shows Pending    │
        └──────────────────┘        │  Count            │
                                    └──────────────────┘
                                           │
┌──────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│                     MANAGER REVIEWS LEAVE                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Leave Approvals Page   │
                    │  - See All Pending      │
                    │  - Review Details       │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │   Click APPROVE  │        │   Click REJECT   │
        └──────────────────┘        └──────────────────┘
                    │                           │
                    ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │  PATCH /approve  │        │  PATCH /approve  │
        │  decision:       │        │  decision:       │
        │  APPROVE         │        │  REJECT          │
        └──────────────────┘        └──────────────────┘
                    │                           │
                    ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │  Auto-Deduction  │        │  No Deduction    │
        │  - Update        │        │  - Update Status │
        │    LeaveBalance  │        │  - Save Reason   │
        │  - usedDays++    │        └──────────────────┘
        │  - remaining--   │
        └──────────────────┘
                    │
                    ▼
        ┌──────────────────┐
        │  LeaveApproval   │
        │  Record Created  │
        └──────────────────┘
                    │
┌───────────────────┴───────────────────┐
▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STAFF SEES UPDATED STATUS                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  My Leaves Page         │
                    │  - Status: APPROVED or  │
                    │            REJECTED     │
                    │  - Updated Balance      │
                    │  - Approval Details     │
                    └─────────────────────────┘
```

---

## 🗄️ Database Flow

```
┌──────────────────┐         ┌──────────────────┐
│   User           │────────▶│  Employment      │
│   - id           │         │  - userId        │
│   - email        │         │  - employeeId    │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  LeaveBalance    │         │ LeaveApplication │
│  - employeeId    │◀────────│  - applicantId   │
│  - year: 2026    │         │  - status        │
│  - allocatedDays │         │  - businessDays  │
│  - usedDays      │         │  - startDate     │
│  - remaining     │         │  - endDate       │
└──────────────────┘         └──────────────────┘
                                      │
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  LeaveApproval   │
                             │  - applicationId │
                             │  - approverId    │
                             │  - decision      │
                             │  - approvedAt    │
                             └──────────────────┘
```

---

## 🔐 Permissions Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    User      │────────▶│   UserRole   │────────▶│    Role      │
│              │         │              │         │  - Staff     │
│              │         │              │         │  - Manager   │
│              │         │              │         │  - HR        │
└──────────────┘         └──────────────┘         └──────────────┘
                                                           │
                                                           │
                                                           ▼
                                                  ┌──────────────┐
                                                  │RolePermission│
                                                  └──────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────┐
                                                  │ Permission   │
                                                  │ leaves:read  │
                                                  │ leaves:create│
                                                  │ leaves:approve│
                                                  └──────────────┘
```

**Permission Assignment:**
- **leaves:read** → ALL roles (Staff, Manager, HR, Admin)
- **leaves:create** → ALL roles (Staff, Manager, HR, Admin)
- **leaves:approve** → ONLY Manager, Supervisor, HR, Admin

---

## 📊 UI Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        SIDEBAR MENU                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   HR & Staff    │
                    └─────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ HR Dashboard │  │My Employment │  │  My Loans    │
    │              │  │              │  │              │
    │ Permission:  │  │ Permission:  │  │ Permission:  │
    │ dashboard:   │  │ dashboard:   │  │ dashboard:   │
    │ read         │  │ read         │  │ read         │
    └──────────────┘  └──────────────┘  └──────────────┘
            │
            ▼
    ┌──────────────┐
    │  My Leaves   │◀───── ALL STAFF SEE THIS
    │              │
    │ Permission:  │
    │ leaves:read  │
    └──────────────┘
            │
            ▼
    ┌──────────────┐
    │Leave Approvals│◀───── ONLY MANAGERS SEE THIS
    │              │
    │ Permission:  │
    │ leaves:      │
    │ approve      │
    └──────────────┘
```

---

## 🔄 Data Transformation Flow

```
API Response Structure:
┌─────────────────────────────────────┐
│ response                            │
│   └── data                          │
│         └── success: true           │
│               statusCode: 200       │
│               data: [...]  ◀───┐   │
│                             │   │   │
└─────────────────────────────│───│───┘
                              │   │
                              │   │
Frontend Service Unwraps:     │   │
┌─────────────────────────────│───│───┐
│ let result =                │   │   │
│   response.data?.data?.data │   │   │
│   || response.data?.data ───┘   │   │
│   || response.data              │   │
│   || []                          │   │
│                                  │   │
│ if (result.data exists) ─────────┘   │
│   result = result.data               │
│                                      │
│ return Array.isArray(result)        │
│   ? result : []                     │
└─────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Clean Array    │
                    │  Ready for UI   │
                    └─────────────────┘
```

---

## 📈 Auto-Deduction Logic

```
When Manager Clicks APPROVE:
┌─────────────────────────────────────────────────────────────┐
│ 1. Get Application                                           │
│    - businessDaysRequested = 5                              │
│    - applicantId = "user-123"                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Find Leave Balances (Primary & Secondary)                │
│    Primary:   allocatedDays=20, usedDays=5, remaining=15   │
│    Secondary: carryForward=3, usedDays=0, remaining=3       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Calculate Deduction Strategy                             │
│    Need: 5 days                                             │
│    Primary remaining: 15 days ✓                             │
│    Use: 5 from primary, 0 from secondary                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Update Database                                          │
│    LeaveBalance (Primary):                                  │
│      usedDays: 5 → 10                                       │
│      remaining: 15 → 10                                     │
│                                                             │
│    LeaveApplication:                                        │
│      daysFromPrimaryYear: 5                                 │
│      daysFromSecondaryYear: 0                               │
│      status: APPROVED                                       │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2026-11-27  
**Status:** Complete Flow Documentation ✅
