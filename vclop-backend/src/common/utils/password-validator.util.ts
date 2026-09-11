export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(
  password: string,
  policy: PasswordPolicy,
): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSymbol && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

export function getDefaultPasswordPolicy(): PasswordPolicy {
  return {
    minLength: parseInt(process.env.PWD_MIN_LENGTH ?? '8', 10),
    requireUppercase: process.env.PWD_REQUIRE_UPPER !== 'false',
    requireNumber: process.env.PWD_REQUIRE_NUMBER !== 'false',
    requireSymbol: process.env.PWD_REQUIRE_SYMBOL !== 'false',
  };
}
