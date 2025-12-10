/**
 * Validation utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCode(code: string): boolean {
  // Code should be non-empty string
  return typeof code === "string" && code.trim().length > 0;
}

export function isValidOTP(otp: string): boolean {
  // OTP should be 6 digits
  return /^\d{6}$/.test(otp);
}

/**
 * Generate random 5 uppercase letters code
 */
export function generateUserCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

export function validateRequest(
  body: any,
  requiredFields: string[]
): {valid: boolean; missingFields: string[]} {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === "string" && !body[field].trim())) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
