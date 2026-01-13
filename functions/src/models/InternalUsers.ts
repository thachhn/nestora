/**
 * InternalUsers model
 * Handles internal user-related database operations (admin, collaborators)
 */

import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const INTERNAL_USERS_COLLECTION = "InternalUsers";

export type InternalUserRole = "admin" | "collaborators";

export type InternalUserModel = {
  email: string;
  password: string;
  refCode: string;
  role: InternalUserRole;
  refPercent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type IInternalUserData = Omit<
  InternalUserModel,
  "createdAt" | "updatedAt"
>;

export type IInternalUserUpdateData = Partial<Omit<IInternalUserData, "email">>;

/**
 * Get internal user by email
 */
export async function getInternalUserByEmail(
  email: string
): Promise<InternalUserModel | null> {
  const db = admin.firestore();
  const emailLower = email.toLowerCase();
  const userDoc = await db
    .collection(INTERNAL_USERS_COLLECTION)
    .doc(emailLower)
    .get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as InternalUserModel;
}

/**
 * Create a new internal user
 */
export async function createInternalUser(
  userData: IInternalUserData
): Promise<InternalUserModel> {
  const db = admin.firestore();
  const emailLower = userData.email.toLowerCase();
  const now = Timestamp.now();

  // Check if user already exists
  const existingUser = await getInternalUserByEmail(emailLower);
  if (existingUser) {
    throw new Error(`Internal user with email ${emailLower} already exists`);
  }

  const newRefCode = userData.refCode?.toUpperCase().replace(/\s/g, "") || "";

  // Check if refCode already exists
  const existingRefCode = await getInternalUserByRefCode(newRefCode);
  if (existingRefCode) {
    throw new Error(`RefCode ${newRefCode} is already in use`);
  }

  const user: InternalUserModel = {
    email: emailLower,
    password: userData.password,
    refCode: newRefCode,
    role: userData.role,
    refPercent: userData.refPercent,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(INTERNAL_USERS_COLLECTION).doc(emailLower).set(user);

  return user;
}

/**
 * Update internal user
 */
export async function updateInternalUser(
  email: string,
  userData: IInternalUserUpdateData
): Promise<void> {
  const db = admin.firestore();
  const emailLower = email.toLowerCase();

  // Get current user to check existing refCode
  const currentUser = await getInternalUserByEmail(emailLower);
  if (!currentUser) {
    throw new Error(`Internal user with email ${emailLower} not found`);
  }

  // Check if refCode is being updated and if it's duplicate
  const newRefCode = userData.refCode?.toUpperCase().replace(/\s/g, "") || "";
  const currentRefCode =
    currentUser.refCode?.toUpperCase().replace(/\s/g, "") || "";
  if (newRefCode && newRefCode !== currentRefCode) {
    const existingRefCode = await getInternalUserByRefCode(newRefCode);
    if (existingRefCode && existingRefCode.email !== emailLower) {
      throw new Error(`RefCode ${newRefCode} is already in use`);
    }
  }

  const updateData: {
    updatedAt: FieldValue;
    password?: string;
    refCode?: string;
    role?: InternalUserRole;
    refPercent?: number;
  } = {
    updatedAt: Timestamp.now(),
  };

  if (userData.password !== undefined) {
    updateData.password = userData.password;
  }

  if (newRefCode) {
    updateData.refCode = newRefCode;
  }

  if (userData.role !== undefined) {
    updateData.role = userData.role;
  }

  if (userData.refPercent !== undefined) {
    updateData.refPercent = userData.refPercent;
  }

  await db
    .collection(INTERNAL_USERS_COLLECTION)
    .doc(emailLower)
    .update(updateData);
}

/**
 * Delete internal user
 */
export async function deleteInternalUser(email: string): Promise<void> {
  const db = admin.firestore();
  const emailLower = email.toLowerCase();

  await db.collection(INTERNAL_USERS_COLLECTION).doc(emailLower).delete();
}

/**
 * Get internal user by refCode
 */
export async function getInternalUserByRefCode(
  refCode: string
): Promise<InternalUserModel | null> {
  const db = admin.firestore();
  const querySnapshot = await db
    .collection(INTERNAL_USERS_COLLECTION)
    .where("refCode", "==", refCode)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as InternalUserModel;
}

/**
 * Verify internal user password
 */
export async function verifyInternalUserPassword(
  email: string,
  password: string
): Promise<boolean> {
  const user = await getInternalUserByEmail(email);

  if (!user) {
    return false;
  }

  return user.password === password;
}
