/**
 * User service
 * Handles user-related business logic
 */

import * as logger from "firebase-functions/logger";
import { getUserByEmail, addProductToUser, upsertUser } from "../models/User";
import { generateUserCode } from "../utils/validator";
import { getTemplateByProductId } from "../utils/templates";
import { sendWelcomeEmail } from "./mailer";

export type UserAccessResult = {
  email: string;
  code?: string;
  status: "created" | "updated";
  message: string;
};

/**
 * Grant product access to a user
 * If user exists, adds product to existing user
 * If user doesn't exist, creates new user with product
 * Sends welcome email in both cases
 */
export async function grantProductAccess(
  email: string,
  productId: string
): Promise<UserAccessResult> {
  const emailLower = email.toLowerCase();
  const existingUser = await getUserByEmail(emailLower);

  if (existingUser) {
    // User exists: only add productId, keep existing code
    await addProductToUser(emailLower, productId);

    // Send welcome email (notification only, no code)
    const template = getTemplateByProductId(productId);
    await sendWelcomeEmail(emailLower, productId, template);

    logger.info(`User ${emailLower} updated: product ${productId} added`);

    return {
      email: emailLower,
      status: "updated",
      message: "Product added to existing user",
    };
  } else {
    // User doesn't exist: create new user with new code
    // Note: Code is generated and stored but not sent via email
    const code = generateUserCode();
    await upsertUser({
      email: emailLower,
      code,
      products: [productId],
    });

    // Send welcome email (notification only, no code)
    const template = getTemplateByProductId(productId);
    await sendWelcomeEmail(emailLower, productId, template);

    logger.info(`User ${emailLower} created with product ${productId}`);

    return {
      email: emailLower,
      code: code,
      status: "created",
      message: "User created successfully",
    };
  }
}
