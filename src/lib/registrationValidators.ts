/**
 * Validation utilities for Business / Store Registration System
 */

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const BUSINESS_TYPES = [
  'Retailer',
  'Wholesaler',
  'Distributor',
  'Manufacturer',
  'Other',
] as const;

export type BusinessType = typeof BUSINESS_TYPES[number];

export function validateIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '');
  return INDIAN_PHONE_REGEX.test(cleaned);
}

export function cleanIndianPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, '');
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function validateGSTIN(gstin: string): boolean {
  if (!gstin || !gstin.trim()) return false;
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  rules: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  const errors: string[] = [];
  if (!rules.minLength) errors.push('Minimum 8 characters required');
  if (!rules.hasUppercase) errors.push('At least one uppercase letter required');
  if (!rules.hasLowercase) errors.push('At least one lowercase letter required');
  if (!rules.hasNumber) errors.push('At least one number required');
  if (!rules.hasSpecial) errors.push('At least one special character required');

  return {
    valid: errors.length === 0,
    errors,
    rules,
  };
}

/**
 * Generates a compliant secure temporary password meeting all complexity requirements:
 * at least 1 uppercase, 1 lowercase, 1 number, 1 special character, min 10 chars.
 */
export function generateCompliantTemporaryPassword(length = 12): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const specials = '!@#$%&*';

  const randomIndex = (max: number) => {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] % max;
  };
  let pwd = '';
  pwd += uppers.charAt(randomIndex(uppers.length));
  pwd += lowers.charAt(randomIndex(lowers.length));
  pwd += numbers.charAt(randomIndex(numbers.length));
  pwd += specials.charAt(randomIndex(specials.length));

  const allChars = uppers + lowers + numbers + specials;
  for (let i = pwd.length; i < length; i++) {
    pwd += allChars.charAt(randomIndex(allChars.length));
  }

  return pwd.split('').sort(() => randomIndex(3) - 1).join('');
}
