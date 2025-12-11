/**
 * Request download handler
 * Validates email and product access, sends OTP to email
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { validateRequest, isValidEmail } from "../utils/validator";
import { generateOTP, storeOTP, resetOTPAttempts } from "../models/OTP";
import { sendOTPEmail } from "../services/mailer";
import { verifyUserProduct } from "../models/User";
import { PruductId } from "../utils/constants";
import { initHandler, handleError } from "../utils/handler";
import { checkRateLimit, getIPAddress } from "../utils/rateLimiter";

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
      const validation = validateRequest(req.body, ["email", "productId"]);
      if (!validation.valid) {
        res.status(400).json({
          error: "Missing required fields",
          missingFields: validation.missingFields,
        });
        return;
      }

      const { email, productId } = req.body;

      // Validate email format
      if (!isValidEmail(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Validate productId
      if (!productId || !Object.values(PruductId).includes(productId)) {
        res.status(400).json({ error: "Invalid productId" });
        return;
      }

      // Rate limiting: Check IP and email limits
      const ipAddress = getIPAddress(req);
      const emailLower = email.toLowerCase();

      // Rate limit by IP: max 10 requests per 15 minutes
      const ipRateLimit = await checkRateLimit(ipAddress, {
        maxRequests: 10,
        windowMinutes: 15,
        blockDurationMinutes: 30,
      });

      if (!ipRateLimit.allowed) {
        res.status(429).json({
          error:
            ipRateLimit.message || "Too many requests. Please try again later.",
        });
        logger.warn(`Rate limit exceeded for IP: ${ipAddress}`);
        return;
      }

      // Rate limit by email: max 5 requests per 15 minutes (prevent email spam)
      const emailRateLimit = await checkRateLimit(`email_${emailLower}`, {
        maxRequests: 5,
        windowMinutes: 15,
        blockDurationMinutes: 30,
      });

      if (!emailRateLimit.allowed) {
        res.status(429).json({
          error:
            emailRateLimit.message ||
            "Too many OTP requests for this email. Please try again later.",
        });
        logger.warn(`Rate limit exceeded for email: ${emailLower}`);
        return;
      }

      // Verify user email has access to productId
      const hasAccess = await verifyUserProduct(emailLower, productId);

      if (!hasAccess) {
        res.status(403).json({
          error:
            "Email not found or you don't have access to this product",
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
