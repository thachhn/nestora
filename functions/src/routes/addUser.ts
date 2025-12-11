/**
 * Add user handler
 * Adds email and code to Firestore (protected by API key)
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  validateRequest,
  isValidEmail,
  generateUserCode,
} from "../utils/validator";
import { upsertUser, getUserByEmail, addProductToUser } from "../models/User";
import { PruductId } from "../utils/constants";
import { getTemplateByProductId } from "../utils/templates";
import { sendWelcomeEmail } from "../services/mailer";
import { initHandler, handleError } from "../utils/handler";

export const addUser = onRequest(
  {
    region: "asia-southeast1", // Singapore - gần Việt Nam nhất
    maxInstances: 3, // Limit concurrent instances (admin function)
    minInstances: 0, // Scale to zero when not in use
  },
  async (req, res) => {
    if (
      !initHandler(req, res, {
        allowedMethods: ["POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "x-api-key"],
        requireApiKey: true,
      })
    ) {
      return;
    }

    try {
      // Validate request body
      const validation = validateRequest(req.body, ["emails", "productId"]);
      if (!validation.valid) {
        res.status(400).json({
          error: "Missing required fields",
          missingFields: validation.missingFields,
        });
        return;
      }

      const { emails, productId } = req.body;

      // Validate emails is an array
      if (!Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({ error: "emails must be a non-empty array" });
        return;
      }

      // Validate all emails format
      const invalidEmails = emails.filter((email) => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        res.status(400).json({
          error: "Invalid email format",
          invalidEmails: invalidEmails,
        });
        return;
      }

      // Validate productId
      if (!productId || !Object.values(PruductId).includes(productId)) {
        res.status(400).json({ error: "Invalid productId" });
        return;
      }

      // Process each email
      const results: Array<{
        email: string;
        code?: string;
        status: "created" | "updated";
        message: string;
      }> = [];

      for (const email of emails) {
        const emailLower = email.toLowerCase();
        const existingUser = await getUserByEmail(emailLower);

        if (existingUser) {
          // User exists: only add productId, keep existing code
          await addProductToUser(emailLower, productId as PruductId);

          // Send welcome email with existing code
          const template = getTemplateByProductId(
            productId as PruductId,
            existingUser.code
          );
          await sendWelcomeEmail(
            emailLower,
            existingUser.code,
            productId,
            template
          );

          results.push({
            email: emailLower,
            status: "updated",
            message: "Product added to existing user",
          });
          logger.info(
            `User ${emailLower} updated: product ${productId} added, code unchanged`
          );
        } else {
          // User doesn't exist: create new user with new code
          const code = generateUserCode();
          await upsertUser({
            email: emailLower,
            code,
            products: [productId as PruductId],
          });

          // Send welcome email with new code
          const template = getTemplateByProductId(productId as PruductId, code);
          await sendWelcomeEmail(emailLower, code, productId, template);

          results.push({
            email: emailLower,
            code: code,
            status: "created",
            message: "User created with new code",
          });
          logger.info(
            `User ${emailLower} created with code ${code} and product ${productId}`
          );
        }
      }

      res.status(200).json({
        success: true,
        message: "Users processed successfully",
        results: results,
      });
    } catch (error) {
      logger.error("Error in addUser:", error);
      handleError(error, res, "Internal server error");
    }
  }
);
