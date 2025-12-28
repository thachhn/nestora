/**
 * Add user handler
 * Adds email and product access to Firestore (protected by API key)
 * Note: Code is generated and stored but not sent via email
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { validateRequest, isValidEmail } from "../utils/validator";
import { PruductId } from "../utils/constants";
import { initHandler, handleError } from "../utils/handler";
import { grantProductAccess } from "../services/userService";

export const addUser = onRequest({}, async (req, res) => {
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
    const results = [];

    for (const email of emails) {
      const result = await grantProductAccess(email, productId as PruductId);
      results.push(result);
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
});
