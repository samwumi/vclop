# Staff Loan Business Rules

## Overview
The VCLOP system provides **interest-free staff loans** to eligible employees with a maximum repayment period of 5 months.

---

## Business Rules

### 1. Repayment Period
- **Maximum tenure**: 5 months
- **Minimum tenure**: 1 month  
- **Default tenure**: 5 months

### 2. Interest Rate
- **Interest rate**: 0% (completely interest-free)
- **Interest type**: FLAT
- **Total interest charged**: ₦0

### 3. Salary Deduction Limits
- **Maximum monthly deduction**: 25% of gross salary
- Monthly installment amount cannot exceed 25% of the employee's monthly salary
- This ensures employees retain at least 75% of their salary for living expenses

### 4. Loan Amount Calculations

#### Maximum Eligible Loan Amount
```
Max Loan Amount = (Monthly Salary × 25%) × 5 months
```

**Example:**
- Monthly Salary: ₦200,000
- Max Monthly Deduction: ₦50,000 (25% of ₦200,000)
- Max Loan Amount: ₦250,000 (₦50,000 × 5 months)

#### Monthly Installment Calculation
```
Monthly Installment = Loan Amount ÷ Tenure (in months)
```

**Example:**
- Loan Amount: ₦100,000
- Tenure: 5 months
- Monthly Installment: ₦20,000

---

## Eligibility Criteria

An employee is eligible for a staff loan if **ALL** of the following conditions are met:

### ✅ **Must Have:**
1. **Active Employment Status**
   - Must be currently employed
   - Employment record must show `isCurrent = true`
   - No termination date set

2. **Active User Account**
   - User status must be `ACTIVE`
   - Suspended users cannot apply

3. **Valid Salary Information**
   - Must have a recorded monthly salary > ₦0
   - Salary is required to calculate maximum eligible loan amount

4. **No Active Loans**
   - Can only have ONE loan at a time
   - Previous loans must be fully repaid before applying for new one
   - Statuses that block new applications:
     - `PENDING_APPROVAL`
     - `APPROVED`
     - `DISBURSED`
     - `ACTIVE`

5. **No Overdue Payments**
   - Must not have any overdue installments on previous loans
   - All past due payments must be settled

### ❌ **Automatic Disqualifications:**
- Suspended employees
- Employees on termination notice
- Employees with overdue loan payments
- Employees without valid salary records
- Employees with existing active loans

---

## Application Process

### 1. **Employee Applies**
```typescript
{
  loanPurpose: string,        // Why they need the loan
  requestedAmount: number,    // Amount requested (validated against max eligible)
  proposedTenureMonths: number, // 1-5 months
  justification: string       // Detailed explanation
}
```

### 2. **System Validations**
The system automatically validates:
- ✅ Tenure is between 1-5 months
- ✅ Employee is eligible (active, employed, no active loans)
- ✅ Employee has valid salary information
- ✅ Requested amount ≤ Maximum eligible amount
- ✅ Requested amount ≥ Minimum loan amount (₦1,000)
- ✅ Monthly installment ≤ 25% of salary
- ✅ No overdue payments exist

### 3. **Approval Required**
- All loans require **manual approval** by authorized personnel
- No automatic approvals
- Approver cannot approve their own loan application (self-approval blocked)

### 4. **Disbursement**
Once approved, loan is disbursed with:
- Disbursement method (CASH, BANK_TRANSFER, etc.)
- Reference number
- Disbursement date
- Repayment schedule automatically generated

---

## Repayment

### Schedule Generation
When a loan is disbursed, the system automatically generates:
- **Number of installments**: Equal to tenure months
- **Due dates**: Monthly, starting from disbursement date
- **Principal per installment**: Loan amount ÷ tenure months
- **Interest per installment**: ₦0 (interest-free)
- **Total per installment**: Principal only

### Payment Methods
Staff can make payments through:
- `CASH` - Cash payment
- `BANK_TRANSFER` - Bank transfer
- `SALARY_DEDUCTION` - Auto-deduction from salary (recommended)
- `MOBILE_MONEY` - Mobile payment platforms
- `CHEQUE` - Cheque payment

### Payment Tracking
- Each payment is recorded with principal and interest amounts
- Installment status updates automatically:
  - `PENDING` → `PARTIALLY_PAID` → `PAID`
  - `OVERDUE` if payment not received by due date
- Loan status updates when all installments are paid: `ACTIVE` → `FULLY_PAID`

---

## Example Scenarios

### Scenario 1: Maximum Loan
**Employee Details:**
- Monthly Salary: ₦400,000
- Employment: Active, 2 years tenure

**Loan Eligibility:**
- Max Monthly Deduction: ₦100,000 (25% of ₦400,000)
- Max Eligible Loan: ₦500,000 (₦100,000 × 5 months)

**Application:**
- Requested Amount: ₦500,000
- Proposed Tenure: 5 months
- Monthly Installment: ₦100,000 (exactly 25% of salary) ✅

**Repayment Schedule:**
| Month | Principal Due | Interest | Total Due | Balance After |
|-------|--------------|----------|-----------|---------------|
| 1     | ₦100,000     | ₦0       | ₦100,000  | ₦400,000      |
| 2     | ₦100,000     | ₦0       | ₦100,000  | ₦300,000      |
| 3     | ₦100,000     | ₦0       | ₦100,000  | ₦200,000      |
| 4     | ₦100,000     | ₦0       | ₦100,000  | ₦100,000      |
| 5     | ₦100,000     | ₦0       | ₦100,000  | ₦0            |

---

### Scenario 2: Shorter Tenure
**Employee Details:**
- Monthly Salary: ₦150,000
- Employment: Active

**Loan Eligibility:**
- Max Monthly Deduction: ₦37,500 (25% of ₦150,000)
- Max Eligible Loan: ₦187,500 (₦37,500 × 5 months)

**Application:**
- Requested Amount: ₦60,000
- Proposed Tenure: 3 months (shorter than max)
- Monthly Installment: ₦20,000 (13.33% of salary) ✅

**Repayment Schedule:**
| Month | Principal Due | Interest | Total Due | Balance After |
|-------|--------------|----------|-----------|---------------|
| 1     | ₦20,000      | ₦0       | ₦20,000   | ₦40,000       |
| 2     | ₦20,000      | ₦0       | ₦20,000   | ₦20,000       |
| 3     | ₦20,000      | ₦0       | ₦20,000   | ₦0            |

---

### Scenario 3: Invalid Application (Exceeds Limit)
**Employee Details:**
- Monthly Salary: ₦100,000

**Application Attempt:**
- Requested Amount: ₦200,000
- Proposed Tenure: 5 months
- Monthly Installment: ₦40,000 (40% of salary) ❌

**Result:** **REJECTED**
- Reason: Monthly installment (40%) exceeds maximum allowed deduction of 25%
- Max Eligible: ₦125,000 (₦25,000 × 5 months)
- Suggestion: Reduce loan amount to ₦125,000 or less

---

## Configuration File

All business rules are centralized in:
```
vclop-backend/src/modules/hr/staff-loans/staff-loan-config.ts
```

### Configurable Parameters:
```typescript
{
  MAX_TENURE_MONTHS: 5,
  MIN_TENURE_MONTHS: 1,
  INTEREST_RATE: 0,
  MAX_SALARY_DEDUCTION_PERCENTAGE: 25,
  MIN_LOAN_AMOUNT: 1000,
  MAX_ACTIVE_LOANS: 0, // Only one at a time
  REQUIRE_JUSTIFICATION: true,
  AUTO_APPROVE_THRESHOLD: null, // Manual approval required
}
```

---

## API Endpoints

### Check Eligibility
```http
GET /api/hr/staff-loans/eligibility
Authorization: Bearer {token}
```

**Response:**
```json
{
  "eligible": true,
  "reasons": {
    "activeEmployment": true,
    "accountActive": true,
    "noActiveLoans": true,
    "noOverduePayments": true,
    "hasValidSalary": true
  },
  "loanLimits": {
    "monthlySalary": 200000,
    "maxEligibleAmount": 250000,
    "maxMonthlyDeduction": 50000,
    "maxTenureMonths": 5,
    "minLoanAmount": 1000
  },
  "businessRules": {
    "interestRate": "0%",
    "maxRepaymentPeriod": "5 months",
    "maxSalaryDeduction": "25%",
    "description": "Interest-free staff loans with maximum 5-month repayment period..."
  }
}
```

### Apply for Loan
```http
POST /api/hr/staff-loans/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "loanPurpose": "Medical expenses",
  "requestedAmount": 100000,
  "proposedTenureMonths": 5,
  "justification": "Emergency medical procedure for family member"
}
```

---

## Admin Dashboard Recommendations

### Loan Management View
Admins should be able to see:
1. **Pending Applications** - Awaiting approval
2. **Active Loans** - Currently being repaid
3. **Overdue Payments** - Past due installments
4. **Repayment History** - All payments made
5. **Loan Statistics**:
   - Total disbursed
   - Total recovered
   - Average loan amount
   - Default rate

### Approval Interface
When approving a loan, display:
- Employee details (name, ID, department, salary)
- Loan request details (amount, tenure, purpose, justification)
- Calculated installment amount and percentage of salary
- Employee's loan history
- Current employment status
- Recommendation (auto-calculated eligibility check)

---

## Benefits of Current Configuration

1. **Employee-Friendly**
   - No interest charges
   - Affordable monthly payments (max 25% of salary)
   - Quick 5-month repayment period

2. **Risk Management**
   - One loan at a time prevents over-indebtedness
   - Salary-based limits ensure affordability
   - Automatic eligibility checks reduce defaults

3. **Operational Efficiency**
   - Automated calculations and validations
   - Clear business rules in code
   - Easy to modify configuration if policies change

---

## Future Enhancements (Optional)

If needed, the system can be extended to support:
- Different loan tiers based on employment level
- Longer tenure for senior staff
- Emergency loan provisions
- Guarantor requirements
- Early settlement incentives
- Loan refinancing options

---

**Document Version:** 1.0  
**Last Updated:** November 2026  
**Configuration File:** `staff-loan-config.ts`
