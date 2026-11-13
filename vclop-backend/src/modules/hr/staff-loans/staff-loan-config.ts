/**
 * Staff Loan Business Rules and Configuration
 * 
 * Business Rules:
 * - Maximum repayment period: 5 months
 * - Interest rate: 0% (no interest charged)
 * - Maximum monthly deduction: 25% of gross salary
 * - Interest type: FLAT (though rate is 0)
 */

export const STAFF_LOAN_CONFIG = {
  // Repayment period
  MAX_TENURE_MONTHS: 5,
  MIN_TENURE_MONTHS: 1,
  DEFAULT_TENURE_MONTHS: 5,

  // Interest configuration
  INTEREST_RATE: 0, // 0% interest
  INTEREST_TYPE: 'FLAT' as const,

  // Salary deduction limits
  MAX_SALARY_DEDUCTION_PERCENTAGE: 25, // 25% of gross salary
  
  // Loan limits (can be configured based on employment level)
  MIN_LOAN_AMOUNT: 1000, // Minimum loan amount
  // MAX_LOAN_AMOUNT calculated as: (monthly_salary * 0.25) * 5 months
  
  // Eligibility criteria
  MIN_MONTHS_EMPLOYED: 3, // Minimum 3 months employment required
  MAX_ACTIVE_LOANS: 0, // Can only have 1 loan at a time (0 means none active)
  ALLOW_WHILE_ON_NOTICE: false, // Cannot apply if on notice period
  
  // Application settings
  REQUIRE_JUSTIFICATION: true,
  AUTO_APPROVE_THRESHOLD: null, // No auto-approval, all loans require manual review
} as const;

/**
 * Calculate maximum eligible loan amount based on salary
 * Max loan = (Monthly salary * 25%) * 5 months
 */
export function calculateMaxLoanAmount(monthlySalary: number): number {
  const maxMonthlyDeduction = monthlySalary * (STAFF_LOAN_CONFIG.MAX_SALARY_DEDUCTION_PERCENTAGE / 100);
  return maxMonthlyDeduction * STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS;
}

/**
 * Calculate monthly installment amount
 * No interest, so just principal / tenure
 */
export function calculateMonthlyInstallment(
  principalAmount: number,
  tenureMonths: number,
): number {
  return principalAmount / tenureMonths;
}

/**
 * Validate if monthly deduction is within salary limits
 */
export function validateSalaryDeduction(
  monthlyInstallment: number,
  monthlySalary: number,
): { valid: boolean; message?: string; percentageOfSalary: number } {
  const percentageOfSalary = (monthlyInstallment / monthlySalary) * 100;
  const maxPercentage = STAFF_LOAN_CONFIG.MAX_SALARY_DEDUCTION_PERCENTAGE;

  if (percentageOfSalary > maxPercentage) {
    return {
      valid: false,
      percentageOfSalary,
      message: `Monthly installment (${percentageOfSalary.toFixed(2)}%) exceeds maximum allowed deduction of ${maxPercentage}% of salary`,
    };
  }

  return {
    valid: true,
    percentageOfSalary,
  };
}

/**
 * Validate loan tenure
 */
export function validateTenure(tenureMonths: number): { valid: boolean; message?: string } {
  if (tenureMonths < STAFF_LOAN_CONFIG.MIN_TENURE_MONTHS) {
    return {
      valid: false,
      message: `Tenure must be at least ${STAFF_LOAN_CONFIG.MIN_TENURE_MONTHS} month(s)`,
    };
  }

  if (tenureMonths > STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS) {
    return {
      valid: false,
      message: `Maximum repayment period is ${STAFF_LOAN_CONFIG.MAX_TENURE_MONTHS} months`,
    };
  }

  return { valid: true };
}

/**
 * Calculate loan details with business rules applied
 */
export function calculateLoanDetails(
  requestedAmount: number,
  tenureMonths: number = STAFF_LOAN_CONFIG.DEFAULT_TENURE_MONTHS,
) {
  const interestRate = STAFF_LOAN_CONFIG.INTEREST_RATE;
  const totalInterest = 0; // No interest
  const totalRepayable = requestedAmount; // Same as principal since no interest
  const monthlyInstallment = calculateMonthlyInstallment(requestedAmount, tenureMonths);

  return {
    principalAmount: requestedAmount,
    interestRate,
    interestType: STAFF_LOAN_CONFIG.INTEREST_TYPE,
    tenureMonths,
    totalInterest,
    totalRepayable,
    monthlyInstallment,
  };
}
