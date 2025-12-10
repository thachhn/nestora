/**
 * OTP service
 * Re-exports OTP model functions for backward compatibility
 * @deprecated Use models/OTP instead
 */

export {
  generateOTP,
  storeOTP,
  validateOTP,
  type OTPData,
} from "../models/OTP";
