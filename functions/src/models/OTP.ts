/**
 * OTP model
 * Handles all OTP-related database operations
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const OTP_COLLECTION = "otps";
const OTP_ATTEMPTS_COLLECTION = "otp_attempts";
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS_PER_OTP = 5; // Maximum failed attempts per OTP
const LOCKOUT_DURATION_MINUTES = 15; // Lockout duration after max attempts

export interface OTPData {
  email: string;
  productId: string;
  otp: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
}

export interface OTPAttemptData {
  email: string;
  productId: string;
  attempts: number;
  lastAttemptAt: Timestamp;
  lockedUntil?: Timestamp;
  ipAddress?: string;
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in Firestore
 */
export async function storeOTP(
  email: string,
  otp: string,
  productId: string
): Promise<void> {
  const db = admin.firestore();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  // Use email and productId as document ID to support multiple OTPs per user
  const docId = `${email.toLowerCase()}_${productId}`;

  const otpData: OTPData = {
    email: email.toLowerCase(),
    productId,
    otp,
    createdAt: now,
    expiresAt,
    used: false,
  };

  await db.collection(OTP_COLLECTION).doc(docId).set(otpData);
}

/**
 * Get OTP by email and productId
 */
export async function getOTPByEmailAndProduct(
  email: string,
  productId: string
): Promise<OTPData | null> {
  const db = admin.firestore();
  const docId = `${email.toLowerCase()}_${productId}`;
  const otpDoc = await db.collection(OTP_COLLECTION).doc(docId).get();

  if (!otpDoc.exists) {
    return null;
  }

  return otpDoc.data() as OTPData;
}

/**
 * Mark OTP as used
 */
export async function markOTPAsUsed(
  email: string,
  productId: string
): Promise<void> {
  const db = admin.firestore();
  const docId = `${email.toLowerCase()}_${productId}`;

  await db.collection(OTP_COLLECTION).doc(docId).update({ used: true });
}

/**
 * Get or create OTP attempt tracking
 */
async function getOTPAttempts(
  email: string,
  productId: string
): Promise<OTPAttemptData | null> {
  const db = admin.firestore();
  const docId = `${email.toLowerCase()}_${productId}`;
  const attemptDoc = await db
    .collection(OTP_ATTEMPTS_COLLECTION)
    .doc(docId)
    .get();

  if (!attemptDoc.exists) {
    return null;
  }

  return attemptDoc.data() as OTPAttemptData;
}

/**
 * Create or update OTP attempt tracking
 */
async function recordOTPAttempt(
  email: string,
  productId: string,
  ipAddress?: string
): Promise<OTPAttemptData> {
  const db = admin.firestore();
  const docId = `${email.toLowerCase()}_${productId}`;
  const now = Timestamp.now();

  const existing = await getOTPAttempts(email, productId);
  const attempts = existing ? existing.attempts + 1 : 1;

  const attemptData: OTPAttemptData = {
    email: email.toLowerCase(),
    productId,
    attempts,
    lastAttemptAt: now,
    ipAddress: ipAddress || existing?.ipAddress,
    ...(attempts >= MAX_ATTEMPTS_PER_OTP && {
      lockedUntil: Timestamp.fromMillis(
        now.toMillis() + LOCKOUT_DURATION_MINUTES * 60 * 1000
      ),
    }),
  };

  await db.collection(OTP_ATTEMPTS_COLLECTION).doc(docId).set(attemptData, {
    merge: true,
  });

  return attemptData;
}

/**
 * Reset OTP attempts (called when OTP is successfully validated or new OTP is generated)
 */
export async function resetOTPAttempts(
  email: string,
  productId: string
): Promise<void> {
  const db = admin.firestore();
  const docId = `${email.toLowerCase()}_${productId}`;
  await db.collection(OTP_ATTEMPTS_COLLECTION).doc(docId).delete();
}

/**
 * Check if OTP attempts are locked
 */
async function isOTPLocked(
  email: string,
  productId: string
): Promise<{ locked: boolean; message?: string }> {
  const attemptData = await getOTPAttempts(email, productId);

  if (!attemptData || !attemptData.lockedUntil) {
    return { locked: false };
  }

  const now = Timestamp.now();
  if (now.toMillis() < attemptData.lockedUntil.toMillis()) {
    const minutesRemaining = Math.ceil(
      (attemptData.lockedUntil.toMillis() - now.toMillis()) / 60000
    );
    return {
      locked: true,
      message: `Too many failed attempts. Please try again in ${minutesRemaining} minute(s) or request a new OTP.`,
    };
  }

  // Lockout expired, reset attempts
  const db = admin.firestore();
  const docId = `${email.toLowerCase()}_${productId}`;
  await db
    .collection(OTP_ATTEMPTS_COLLECTION)
    .doc(docId)
    .update({ attempts: 0, lockedUntil: null });

  return { locked: false };
}

/**
 * Validate OTP with rate limiting and attempt tracking
 */
export async function validateOTP(
  email: string,
  otp: string,
  productId: string,
  ipAddress?: string
): Promise<{ valid: boolean; message?: string; otpData?: OTPData }> {
  // Check if OTP is locked due to too many attempts
  const lockCheck = await isOTPLocked(email, productId);
  if (lockCheck.locked) {
    return { valid: false, message: lockCheck.message };
  }

  const otpData = await getOTPByEmailAndProduct(email, productId);

  if (!otpData) {
    // Record failed attempt even if OTP doesn't exist
    await recordOTPAttempt(email, productId, ipAddress);
    return { valid: false, message: "OTP not found or expired" };
  }

  const now = Timestamp.now();

  if (otpData.used) {
    await recordOTPAttempt(email, productId, ipAddress);
    return { valid: false, message: "OTP has already been used" };
  }

  if (now.toMillis() > otpData.expiresAt.toMillis()) {
    await recordOTPAttempt(email, productId, ipAddress);
    return { valid: false, message: "OTP has expired" };
  }

  if (otpData.productId !== productId) {
    await recordOTPAttempt(email, productId, ipAddress);
    return { valid: false, message: "Product ID mismatch" };
  }

  // Check OTP value
  if (otpData.otp !== otp) {
    // Record failed attempt
    await recordOTPAttempt(email, productId, ipAddress);
    return { valid: false, message: "Invalid OTP" };
  }

  // OTP is valid - reset attempts and mark as used
  await resetOTPAttempts(email, productId);
  await markOTPAsUsed(email, productId);
  return { valid: true, otpData };
}
