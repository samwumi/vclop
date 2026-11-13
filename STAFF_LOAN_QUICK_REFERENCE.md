# Staff Loan - Quick Reference Card

## 🎯 Business Rules (Quick View)

| Rule | Value |
|------|-------|
| **Interest Rate** | 0% (Interest-free) |
| **Maximum Repayment Period** | 5 months |
| **Maximum Monthly Deduction** | 25% of gross salary |
| **Active Loans Allowed** | 1 at a time |
| **Minimum Loan Amount** | ₦1,000 |

---

## 💰 Maximum Loan Calculator

```
Max Loan = (Monthly Salary × 0.25) × 5
```

### Examples:
| Monthly Salary | Max Monthly Deduction (25%) | Max Loan Amount |
|----------------|----------------------------|-----------------|
| ₦50,000        | ₦12,500                    | ₦62,500         |
| ₦100,000       | ₦25,000                    | ₦125,000        |
| ₦200,000       | ₦50,000                    | ₦250,000        |
| ₦300,000       | ₦75,000                    | ₦375,000        |
| ₦500,000       | ₦125,000                   | ₦625,000        |

---

## ✅ Eligibility Checklist

Employee must have:
- [ ] Active employment status
- [ ] Active user account (not suspended)
- [ ] Valid salary record
- [ ] NO active loans currently
- [ ] NO overdue payments

---

## 📋 Application Fields

```typescript
{
  loanPurpose: string,           // Required
  requestedAmount: number,       // ≤ Max eligible amount
  proposedTenureMonths: number,  // 1-5 months
  justification: string          // Required, detailed explanation
}
```

---

## 🔄 Workflow States

```
DRAFT → PENDING_APPROVAL → APPROVED → DISBURSED → ACTIVE → FULLY_PAID
                              ↓
                          REJECTED
```

---

## 💳 Payment Methods

- `SALARY_DEDUCTION` (Recommended - auto-deducted)
- `CASH`
- `BANK_TRANSFER`
- `MOBILE_MONEY`
- `CHEQUE`

---

## 📊 Sample Loan Calculation

**Inputs:**
- Loan Amount: ₦100,000
- Tenure: 5 months
- Interest Rate: 0%

**Calculations:**
```
Total Interest = ₦0
Total Repayable = ₦100,000
Monthly Installment = ₦20,000
```

**Repayment Schedule:**
| Month | Amount Due | Balance After |
|-------|-----------|---------------|
| 1     | ₦20,000   | ₦80,000       |
| 2     | ₦20,000   | ₦60,000       |
| 3     | ₦20,000   | ₦40,000       |
| 4     | ₦20,000   | ₦20,000       |
| 5     | ₦20,000   | ₦0            |

---

## 🚫 Common Rejection Reasons

1. **Amount Exceeds Maximum**
   - Requested > (Salary × 0.25) × 5
   - Solution: Reduce requested amount

2. **Monthly Installment Too High**
   - Installment > 25% of salary
   - Solution: Extend tenure or reduce amount

3. **Already Has Active Loan**
   - Cannot have multiple loans
   - Solution: Fully repay existing loan first

4. **Overdue Payments Exist**
   - Previous loan has unpaid installments
   - Solution: Clear all overdue payments

5. **No Valid Salary**
   - Salary not recorded in system
   - Solution: Contact HR to update records

---

## 📱 API Endpoints (For Developers)

### Check Eligibility
```
GET /api/hr/staff-loans/eligibility
```

### Apply for Loan
```
POST /api/hr/staff-loans/apply
Body: { loanPurpose, requestedAmount, proposedTenureMonths, justification }
```

### View My Loans
```
GET /api/hr/staff-loans/my-loans?status=ACTIVE
```

### Get Loan Details
```
GET /api/hr/staff-loans/:loanId
```

---

## 🛠️ Configuration Location

All business rules are defined in:
```
src/modules/hr/staff-loans/staff-loan-config.ts
```

To modify rules (requires system admin):
- Change `MAX_TENURE_MONTHS` for different repayment period
- Change `INTEREST_RATE` to add interest
- Change `MAX_SALARY_DEDUCTION_PERCENTAGE` for different limits

---

## 📞 Support

For loan-related questions:
- **Technical Issues**: Contact IT Support
- **Eligibility Questions**: Contact HR Department
- **Approval Status**: Contact Finance/HR Manager
- **Payment Issues**: Contact Accounts Department

---

**Quick Tip:** Use the eligibility check endpoint BEFORE applying to see your maximum eligible amount and avoid rejection!
