/**
 * Rate limiter utility
 * Prevents abuse and spam attacks
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const RATE_LIMIT_COLLECTION = "rate_limits";

export interface RateLimitData {
  key: string; // IP address or email
  count: number;
  windowStart: Timestamp;
  blockedUntil?: Timestamp;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMinutes: number; // Time window in minutes
  blockDurationMinutes?: number; // Block duration after exceeding limit
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMinutes: 15,
  blockDurationMinutes: 30,
};

/**
 * Check and enforce rate limit
 * Returns { allowed: true } if request is allowed, { allowed: false, message } if blocked
 */
export async function checkRateLimit(
  key: string, // IP address or email
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; message?: string; retryAfter?: number }> {
  const db = admin.firestore();
  const now = Timestamp.now();
  const docId = `rate_limit_${key}`;

  const rateLimitDoc = await db
    .collection(RATE_LIMIT_COLLECTION)
    .doc(docId)
    .get();

  let rateLimitData: RateLimitData | null = null;

  if (rateLimitDoc.exists) {
    rateLimitData = rateLimitDoc.data() as RateLimitData;
  }

  // Check if currently blocked
  if (rateLimitData?.blockedUntil) {
    const blockedUntilMillis = rateLimitData.blockedUntil.toMillis();
    const nowMillis = now.toMillis();

    if (nowMillis < blockedUntilMillis) {
      const minutesRemaining = Math.ceil(
        (blockedUntilMillis - nowMillis) / 60000
      );
      return {
        allowed: false,
        message: `Rate limit exceeded. Please try again in ${minutesRemaining} minute(s).`,
        retryAfter: minutesRemaining * 60,
      };
    } else {
      // Block expired, reset
      rateLimitData = null;
    }
  }

  // Check if within current window
  if (rateLimitData) {
    const windowStartMillis = rateLimitData.windowStart.toMillis();
    const windowEndMillis =
      windowStartMillis + config.windowMinutes * 60 * 1000;
    const nowMillis = now.toMillis();

    if (nowMillis < windowEndMillis) {
      // Still within window
      if (rateLimitData.count >= config.maxRequests) {
        // Exceeded limit, block
        const blockDurationMillis =
          (config.blockDurationMinutes || 30) * 60 * 1000;
        const blockedUntil = Timestamp.fromMillis(
          nowMillis + blockDurationMillis
        );

        await db.collection(RATE_LIMIT_COLLECTION).doc(docId).set(
          {
            key,
            count: rateLimitData.count,
            windowStart: rateLimitData.windowStart,
            blockedUntil,
          },
          { merge: true }
        );

        return {
          allowed: false,
          message: `Rate limit exceeded. Too many requests. Please try again in ${
            config.blockDurationMinutes || 30
          } minutes.`,
          retryAfter: (config.blockDurationMinutes || 30) * 60,
        };
      } else {
        // Increment count
        await db
          .collection(RATE_LIMIT_COLLECTION)
          .doc(docId)
          .update({
            count: admin.firestore.FieldValue.increment(1),
          });
      }
    } else {
      // Window expired, start new window
      await db.collection(RATE_LIMIT_COLLECTION).doc(docId).set({
        key,
        count: 1,
        windowStart: now,
      });
    }
  } else {
    // First request, create new record
    await db.collection(RATE_LIMIT_COLLECTION).doc(docId).set({
      key,
      count: 1,
      windowStart: now,
    });
  }

  return { allowed: true };
}

/**
 * Get IP address from request
 */
export function getIPAddress(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.ip ||
    "unknown"
  );
}
