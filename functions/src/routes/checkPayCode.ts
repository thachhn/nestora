/**
 * Check payment code handler
 * Public endpoint to check if a payment code exists and its status
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { extractUuidFromPaymentCode } from "../utils/validator";
import { checkPayCodeStatus } from "../models/PayCode";
import { initHandler, handleError } from "../utils/handler";

export const checkPayCode = onRequest({}, async (req, res) => {
  // Initialize handler (CORS, method validation) - Public endpoint
  if (
    !initHandler(req, res, {
      allowedMethods: ["POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  ) {
    return;
  }

  try {
    // Get code from request body (POST) or query params (GET)
    const code = req.body?.code;

    if (!code || typeof code !== "string") {
      res.status(400).json({
        error: "Missing or invalid payment code",
      });
      return;
    }

    // Extract UUID from payment code (remove "NE" prefix)
    const uuid = extractUuidFromPaymentCode(code);
    if (!uuid) {
      res.status(400).json({
        error: "Invalid payment code format",
      });
      logger.warn(`Invalid payment code format: ${code}`);
      return;
    }

    // Check code status
    const status = await checkPayCodeStatus(uuid);

    if (!status || !status.exists) {
      res.status(404).json({
        success: false,
        exists: false,
        message: "Payment code not found",
      });
      return;
    }

    // Code exists - return status and basic details
    res.status(200).json({
      success: true,
      exists: true,
      used: status.used,
    });
  } catch (error) {
    logger.error("Error in checkPayCode:", error);
    handleError(error, res, "Internal server error");
  }
});
