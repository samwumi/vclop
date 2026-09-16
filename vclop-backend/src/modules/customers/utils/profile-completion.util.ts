/**
 * Calculate customer profile completion percentage
 * 
 * This utility calculates how complete a customer's profile is based on
 * required and optional fields. Used to encourage customers to fill in
 * all necessary information for loan applications.
 */

interface CustomerProfileData {
  // Basic Information (Required - 30%)
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  
  // Identification (Required for KYC - 25%)
  bvn?: string | null;
  nin?: string | null;
  
  // Bank Details (Required for disbursement - 15%)
  bankAccountNumber?: string | null;
  bankCode?: string | null;
  
  // Address (Important - 10%)
  residentialAddress?: string | null;
  businessAddress?: string | null;
  
  // Employment (Required for assessment - 15%)
  employerName?: string | null;
  employmentType?: string | null;
  monthlyIncome?: number | null;
  
  // Next of Kin (Important - 5%)
  nokName?: string | null;
  nokPhone?: string | null;
}

/**
 * Calculate profile completion percentage (0-100)
 */
export function calculateProfileCompletion(profile: CustomerProfileData): number {
  let score = 0;
  
  // ── Basic Information (30 points) ──────────────────────────────────────────
  // Required fields
  if (profile.firstName) score += 5;
  if (profile.lastName) score += 5;
  if (profile.phone) score += 5;
  // Important fields
  if (profile.email) score += 5;
  if (profile.dateOfBirth) score += 5;
  if (profile.gender) score += 5;
  
  // ── Identification (25 points) ─────────────────────────────────────────────
  // Critical for KYC verification
  if (profile.bvn) score += 15;
  if (profile.nin) score += 10;
  
  // ── Bank Details (15 points) ───────────────────────────────────────────────
  // Required for loan disbursement
  if (profile.bankAccountNumber) score += 8;
  if (profile.bankCode) score += 7;
  
  // ── Address (10 points) ────────────────────────────────────────────────────
  if (profile.residentialAddress) score += 5;
  if (profile.businessAddress) score += 5;
  
  // ── Employment (15 points) ─────────────────────────────────────────────────
  // Critical for creditworthiness assessment
  if (profile.employerName) score += 5;
  if (profile.employmentType) score += 5;
  if (profile.monthlyIncome) score += 5;
  
  // ── Next of Kin (5 points) ─────────────────────────────────────────────────
  if (profile.nokName) score += 3;
  if (profile.nokPhone) score += 2;
  
  return Math.min(score, 100);
}

/**
 * Get missing fields for profile completion
 */
export function getMissingProfileFields(profile: CustomerProfileData): string[] {
  const missing: string[] = [];
  
  // Critical fields (blocks loan application)
  if (!profile.email) missing.push('Email address');
  if (!profile.dateOfBirth) missing.push('Date of birth');
  if (!profile.gender) missing.push('Gender');
  if (!profile.bvn) missing.push('BVN (required for KYC verification)');
  if (!profile.nin) missing.push('NIN (National ID Number)');
  if (!profile.bankAccountNumber) missing.push('Bank account number (required for disbursement)');
  if (!profile.bankCode) missing.push('Bank (required for disbursement)');
  
  // Important fields
  if (!profile.residentialAddress) missing.push('Residential address');
  if (!profile.employerName) missing.push('Employer name');
  if (!profile.employmentType) missing.push('Employment type');
  if (!profile.monthlyIncome) missing.push('Monthly income');
  if (!profile.nokName) missing.push('Next of kin name');
  if (!profile.nokPhone) missing.push('Next of kin phone');
  
  return missing;
}

/**
 * Check if profile is complete enough for loan application
 */
export function isProfileReadyForLoan(profile: CustomerProfileData): boolean {
  // Must have at least 80% completion and all critical fields
  const completion = calculateProfileCompletion(profile);
  const hasCriticalFields = !!(
    profile.email &&
    profile.dateOfBirth &&
    profile.gender &&
    profile.bvn &&
    profile.nin &&
    profile.bankAccountNumber &&
    profile.bankCode &&
    profile.employerName &&
    profile.monthlyIncome
  );
  
  return completion >= 80 && hasCriticalFields;
}
