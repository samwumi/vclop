# Officer Targets Feature Guide

## Overview
The Officer Targets feature allows administrators to set monthly performance targets for loan officers and track their achievement in real-time.

## Setup

### 1. Run the SQL Migration
Execute the SQL file to create the `officer_targets` table:
```sql
-- Run this in phpMyAdmin on Hostinger
-- File: vclop-backend/CREATE_OFFICER_TARGETS_TABLE.sql
```

### 2. Generate Prisma Client
After the table is created, regenerate Prisma client:
```bash
cd vclop-backend
npx prisma generate
```

### 3. Deploy
Push the code and wait for Hostinger to build and deploy.

## How to Use

### Set Targets (Admin/Manager Only)

**API Endpoint:**
```
POST /api/v1/officer-targets
```

**Request Body:**
```json
{
  "userId": "officer-uuid",
  "targetMonth": "2026-10",
  "disbursementTarget": 5000000,
  "customerTarget": 20,
  "notes": "Q4 high season target"
}
```

### View Targets

**List all targets:**
```
GET /api/v1/officer-targets
GET /api/v1/officer-targets?month=2026-10
GET /api/v1/officer-targets?branchId=branch-uuid
GET /api/v1/officer-targets?userId=officer-uuid
```

**View specific target:**
```
GET /api/v1/officer-targets/{userId}/{month}
GET /api/v1/officer-targets/abc-123/2026-10
```

### Update Target

**API Endpoint:**
```
PATCH /api/v1/officer-targets/{userId}/{month}
```

**Request Body (all fields optional):**
```json
{
  "disbursementTarget": 6000000,
  "customerTarget": 25,
  "notes": "Increased target due to new product launch"
}
```

### Dashboard Summary

Get aggregated performance summary for current month:
```
GET /api/v1/officer-targets/dashboard/summary
```

**Response:**
```json
{
  "totalOfficers": 24,
  "totalDisbursementTarget": 120000000,
  "totalDisbursementAchieved": 85000000,
  "totalCustomerTarget": 480,
  "totalCustomerAchieved": 342,
  "officersMetDisbursementTarget": 15,
  "officersMetCustomerTarget": 18,
  "targets": [
    {
      "officer": "John Okafor",
      "email": "officer@vclop.local",
      "disbursementTarget": 5000000,
      "disbursementAchieved": 3500000,
      "disbursementRate": 70.00,
      "customerTarget": 20,
      "customerAchieved": 18,
      "customerRate": 90.00
    }
  ]
}
```

## Permissions

| Action | Required Permission |
|--------|-------------------|
| View targets | `reports:read` |
| Set/Update targets | `users:manage` |
| View dashboard summary | `dashboard:read` |

## Access Control

- **Admin**: Can view and set targets for all officers across all branches
- **Branch Manager** (with `users:manage`): Can view and set targets for officers in their branch
- **Loan Officer**: Can only view their own target

## Automatic Achievement Tracking

The system automatically calculates achievement metrics:

- **Disbursement Achievement**: Sum of all loans disbursed by the officer in the target month
- **Customer Achievement**: Count of customers registered by the officer in the target month
- **Achievement Rate**: (Achieved / Target) × 100

## Example: Setting October 2026 Targets

```sql
-- Set targets for all loan officers for October 2026
INSERT INTO officer_targets (id, userId, targetMonth, disbursementTarget, customerTarget, createdById)
SELECT 
  UUID(),
  u.id,
  '2026-10-01',
  5000000.00,  -- 5M disbursement target
  20,          -- 20 customer target
  'admin-user-id'
FROM users u
JOIN user_roles ur ON ur.userId = u.id
JOIN roles r ON r.id = ur.roleId
WHERE r.code = 'LOAN_OFFICER'
  AND u.deletedAt IS NULL;
```

## Tips

1. **Set realistic targets** based on historical performance
2. **Review monthly** and adjust targets based on market conditions
3. **Use notes field** to document target rationale
4. **Track trends** by comparing achievement rates across months
5. **Reward top performers** who consistently meet or exceed targets

## Future Enhancements

- Frontend UI for target management
- Automated target reminders
- Performance leaderboards
- Target vs achievement charts
- Bonus calculation integration
