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

/**
 * Generate payment code with timestamp
 * Format: NE + YYMMDDHHMM (10 chars) + 6 random characters
 * Total: 18 characters
 */
export function generatePaymentCode(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // YY
  const month = String(now.getMonth() + 1).padStart(2, "0"); // MM
  const day = String(now.getDate()).padStart(2, "0"); // DD
  const hours = String(now.getHours()).padStart(2, "0"); // HH
  const minutes = String(now.getMinutes()).padStart(2, "0"); // MM

  const timestamp = `${year}${month}${day}${hours}${minutes}`; // YYMMDDHHMM

  // Generate 6 random characters
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `NE${timestamp}${randomPart}`;
}

/**
 * Extract UUID from payment code (remove "NE" prefix)
 * Format: YYMMDDHHMM (10 chars) + 6 random characters = 16 characters
 */
export function extractUuidFromPaymentCode(code: string): string | null {
  if (!code.startsWith("NE") || code.length !== 18) {
    return null;
  }
  return code.substring(2); // Remove "NE" prefix, return 16 characters (timestamp + random)
}

export function validateRequest(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (
      !body[field] ||
      (typeof body[field] === "string" && !body[field].trim())
    ) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
