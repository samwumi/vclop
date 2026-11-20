# Quick Start Guide - VCLOP Updates

## 🚀 What's New

### ✅ Staff Loans Module - Fixed & Enhanced
- Eligibility check working
- Submit for approval workflow
- HR approval dashboard
- Permission-based access

### ✅ Leave Management - Enhanced
- 7 leave categories (Annual, Sick, Compassionate, Education, Maternity, Paternity, Unpaid)
- Backdated leave applications
- Auto-calculated resumption dates

---

## ⚡ Quick Setup (1 Command)

To populate the leave types dropdown:

```bash
cd vclop/vclop-backend
npm run seed:leave-types
```

**That's it!** Refresh your browser and the leave type dropdown will show all 7 categories.

---

## 📋 What You Get

### Staff Loans:
- **Apply**: `/hr/staff-loans/my-loans` → "Apply for Loan"
- **View**: See all your loans and their status
- **Submit**: Draft loans can be submitted for approval
- **Approve**: HR users can approve/reject at `/hr/staff-loans`

### Leave Management:
- **Apply**: `/hr/leaves/my-applications` → "Apply for Leave"
- **Choose**: 7 leave categories in dropdown
- **Dates**: Can select past dates (for backdated applications)
- **See**: Automatic resumption date (when you return to work)

---

## 🔑 Key Routes

| Feature | Route | Permission |
|---------|-------|------------|
| My Staff Loans | `/hr/staff-loans/my-loans` | `staff_loans:read` |
| HR Loan Dashboard | `/hr/staff-loans` | `staff_loans:approve` |
| Apply for Loan | `/hr/staff-loans/apply` | `staff_loans:create` |
| My Leave Applications | `/hr/leaves/my-applications` | `leaves:read` |
| Apply for Leave | `/hr/leaves/apply` | `leaves:create` |

---

## 🎯 Test Scenarios

### Staff Loan:
1. Go to `/hr/staff-loans/apply`
2. Fill in: Amount, Tenure, Purpose, Justification
3. Click "Apply" (saves as DRAFT)
4. Open the loan and click "Submit for Approval"
5. HR user can approve at `/hr/staff-loans`

### Leave Application:
1. Go to `/hr/leaves/apply`
2. Select leave type from dropdown (7 options)
3. Choose dates (can be past dates!)
4. See resumption date auto-calculated
5. Enter reason and submit

---

## 📚 Documentation

- **Full Details**: `SESSION_SUMMARY.md`
- **Leave Enhancements**: `LEAVE_MANAGEMENT_ENHANCEMENTS.md`
- **Leave Seed Guide**: `SEED_LEAVE_TYPES.md`
- **Troubleshooting**: `LEAVE_DROPDOWN_FIX_INSTRUCTIONS.md`

---

## 🆘 Quick Fixes

### Leave dropdown empty?
```bash
cd vclop/vclop-backend
npm run seed:leave-types
```

### Staff loan "not eligible"?
Check your employment record exists and is active (`isCurrent = 1`)

### Approval buttons missing?
Ensure you have `staff_loans:approve` permission

---

## ✨ New Features Summary

### Staff Loans:
- ✅ Fixed eligibility checking
- ✅ Submit workflow (Draft → Pending → Approved)
- ✅ HR approval dashboard
- ✅ Permission-based access
- ✅ Self-approval allowed (for small teams)

### Leave Management:
- ✅ 7 leave categories (including Compassionate & Education)
- ✅ Backdated applications (for staff already on leave)
- ✅ Resumption date display
- ✅ Leave type dropdown working
- ✅ Easy database seeding with Prisma

---

**Everything is deployed and ready!** Just run the seed script for leave types. 🎉
