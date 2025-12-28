/**
 * User model
 * Handles all user-related database operations
 */

import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { PruductId } from "../utils/constants";

const USERS_COLLECTION = "users";

export type UserModel = {
  email: string;
  code: string;
  products: PruductId[];
  status: "active" | "inactive";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type IUserData = Omit<
  UserModel,
  "createdAt" | "updatedAt" | "status"
> & {
  status?: "active" | "inactive";
};

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserModel | null> {
  const db = admin.firestore();
  const emailLower = email.toLowerCase();
  const userDoc = await db.collection(USERS_COLLECTION).doc(emailLower).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as UserModel;
}

/**
 * Create a new user
 */
export async function createUser(userData: IUserData): Promise<UserModel> {
  const db = admin.firestore();
  const emailLower = userData.email.toLowerCase();
  const now = Timestamp.now();

  const user: UserModel = {
    email: emailLower,
    code: userData.code,
    products: userData.products,
    status: userData.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(USERS_COLLECTION).doc(emailLower).set(user);

  return user;
}

/**
 * Update user code and products
 */
export async function updateUser(
  email: string,
  userData: Partial<IUserData>
): Promise<void> {
  const db = admin.firestore();
  const emailLower = email.toLowerCase();

  const updateData: {
    updatedAt: FieldValue;
    code?: string;
    products?: PruductId[];
    status?: "active" | "inactive";
  } = {
    updatedAt: Timestamp.now(),
  };

  if (userData.code !== undefined) {
    updateData.code = userData.code;
  }

  if (userData.products !== undefined) {
    updateData.products = userData.products;
  }

  if (userData.status !== undefined) {
    updateData.status = userData.status;
  }

  await db.collection(USERS_COLLECTION).doc(emailLower).update(updateData);
}

/**
 * Add productId to existing user's products array (if not already exists)
 * Does not update code
 */
export async function addProductToUser(
  email: string,
  productId: PruductId
): Promise<UserModel> {
  const db = admin.firestore();
  const emailLower = email.toLowerCase();
  const user = await getUserByEmail(emailLower);

  if (!user) {
    throw new Error(`User ${emailLower} not found`);
  }

  // Check if productId already exists
  if (user.products.includes(productId)) {
    return user; // Already has this product
  }

  // Add productId to products array
  const updatedProducts = [...user.products, productId];

  await db.collection(USERS_COLLECTION).doc(emailLower).update({
    products: updatedProducts,
    updatedAt: Timestamp.now(),
  });

  return (await getUserByEmail(emailLower)) as UserModel;
}

/**
 * Create or update user (upsert)
 */
export async function upsertUser(userData: IUserData): Promise<UserModel> {
  const existingUser = await getUserByEmail(userData.email);

  if (existingUser) {
    await updateUser(userData.email, userData);
    return (await getUserByEmail(userData.email)) as UserModel;
  } else {
    return await createUser(userData);
  }
}

/**
 * Verify user email and code
 */
export async function verifyUserCode(
  email: string,
  code: string
): Promise<boolean> {
  const user = await getUserByEmail(email);

  if (!user) {
    return false;
  }

  return user.code === code;
}

/**
 * Verify user has access to productId
 */
export async function verifyUserProduct(
  email: string,
  productId: string
): Promise<boolean> {
  const user = await getUserByEmail(email);

  if (!user || user.status !== "active") {
    return false;
  }

  return user.products.includes(productId as PruductId);
}

/**
 * Verify user email, code and productId
 */
export async function verifyUserCodeAndProduct(
  email: string,
  code: string,
  productId: string
): Promise<boolean> {
  const user = await getUserByEmail(email);

  if (!user || user.status !== "active") {
    return false;
  }

  if (user.code !== code) {
    return false;
  }

  return user.products.includes(productId as PruductId);
}
