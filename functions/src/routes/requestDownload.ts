/**
 * Request download handler
 * Validates email and code, sends OTP to email
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { validateRequest, isValidEmail, isValidCode } from "../utils/validator";
import { generateOTP, storeOTP, resetOTPAttempts } from "../models/OTP";
import { sendOTPEmail } from "../services/mailer";
import { verifyUserCodeAndProduct } from "../models/User";
import { PruductId } from "../utils/constants";
import { initHandler, handleError } from "../utils/handler";

export const requestDownload = onRequest(
  {
    region: "asia-southeast1", // Singapore - gần Việt Nam nhất
    maxInstances: 10,
  },
  async (req, res) => {
    // Initialize handler (CORS, method validation)
    if (
      !initHandler(req, res, {
        allowedMethods: ["POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
      })
    ) {
      return;
    }

    try {
      // Validate request body
      const validation = validateRequest(req.body, [
        "email",
        "code",
        "productId",
      ]);
      if (!validation.valid) {
        res.status(400).json({
          error: "Missing required fields",
          missingFields: validation.missingFields,
        });
        return;
      }

      const { email, code, productId } = req.body;

      // Validate email format
      if (!isValidEmail(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Validate code
      if (!isValidCode(code)) {
        res.status(400).json({ error: "Invalid code" });
        return;
      }

      // Validate productId
      if (!productId || !Object.values(PruductId).includes(productId)) {
        res.status(400).json({ error: "Invalid productId" });
        return;
      }

      // Verify user email, code and productId
      const emailLower = email.toLowerCase();
      const isValid = await verifyUserCodeAndProduct(
        emailLower,
        code,
        productId
      );

      if (!isValid) {
        res.status(401).json({
          error:
            "Invalid email, code, or you don't have access to this product",
        });
        return;
      }

      // Reset any previous failed attempts when generating new OTP
      await resetOTPAttempts(emailLower, productId);

      // Generate and store OTP
      const otp = generateOTP();
      await storeOTP(emailLower, otp, productId);

      // Send OTP email
      await sendOTPEmail(email, otp);

      logger.info(`OTP sent to ${email} for product ${productId}`);

      res.status(200).json({
        success: true,
        message: "OTP has been sent to your email",
      });
    } catch (error) {
      logger.error("Error in requestDownload:", error);
      handleError(error, res, "Internal server error");
    }
  }
);
