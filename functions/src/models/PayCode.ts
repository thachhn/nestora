/**
 * PayCode model
 * Handles payment code-related database operations
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const PAYCODE_COLLECTION = "PayCode";

export type PayCodeModel = {
  email: string;
  productId: string;
  amount: number;
  metadata: string;
  refCode: string | null;
  used: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type IPayCodeData = Omit<
  PayCodeModel,
  "createdAt" | "updatedAt" | "used"
> & {
  used?: boolean;
};

/**
 * Create a new PayCode
 */
export async function createPayCode(
  uuid: string,
  payCodeData: IPayCodeData
): Promise<PayCodeModel> {
  const db = admin.firestore();
  const now = Timestamp.now();

  const payCode: PayCodeModel = {
    email: payCodeData.email.toLowerCase(),
    productId: payCodeData.productId,
    amount: payCodeData.amount,
    metadata: payCodeData.metadata,
    refCode: payCodeData.refCode || null,
    used: payCodeData.used || false,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(PAYCODE_COLLECTION).doc(uuid).set(payCode);

  return payCode;
}

/**
 * Get PayCode by UUID
 */
export async function getPayCodeByUuid(
  uuid: string
): Promise<PayCodeModel | null> {
  const db = admin.firestore();
  const payCodeDoc = await db.collection(PAYCODE_COLLECTION).doc(uuid).get();

  if (!payCodeDoc.exists) {
    return null;
  }

  return payCodeDoc.data() as PayCodeModel;
}

/**
 * Check if PayCode exists and is used, and get its details
 * Returns null if code doesn't exist
 */
export async function checkPayCodeStatus(uuid: string): Promise<{
  exists: boolean;
  used: boolean;
  details: PayCodeModel | null;
} | null> {
  const payCode = await getPayCodeByUuid(uuid);

  if (!payCode) {
    return {
      exists: false,
      used: false,
      details: null,
    };
  }

  return {
    exists: true,
    used: payCode.used,
    details: payCode,
  };
}

/**
 * Mark PayCode as used
 */
export async function markPayCodeAsUsed(uuid: string): Promise<void> {
  const db = admin.firestore();
  await db.collection(PAYCODE_COLLECTION).doc(uuid).update({
    used: true,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get PayCodes by refCode and date range
 */
export async function getPayCodesByRefCodeAndDateRange(
  refCode: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<PayCodeModel[]> {
  const db = admin.firestore();
  const querySnapshot = await db
    .collection(PAYCODE_COLLECTION)
    .where("refCode", "==", refCode)
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .get();

  return querySnapshot.docs.map((doc) => doc.data() as PayCodeModel);
}

export async function getPayCodesByDateRange(
  startDate: Timestamp,
  endDate: Timestamp
): Promise<PayCodeModel[]> {
  const db = admin.firestore();
  const querySnapshot = await db
    .collection(PAYCODE_COLLECTION)
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<=", endDate)
    .get();

  return querySnapshot.docs.map((doc) => doc.data() as PayCodeModel);
}
