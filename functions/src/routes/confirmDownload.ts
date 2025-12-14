/**
 * Confirm download handler
 * Validates OTP and returns file download
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { validateRequest, isValidEmail, isValidOTP } from "../utils/validator";
import { validateOTP } from "../models/OTP";
import { PruductId } from "../utils/constants";
import { initHandler, handleError } from "../utils/handler";
import { getFilePath, sendFile } from "../utils/fileDownload";

export const confirmDownload = onRequest(
  {
    region: "asia-southeast1", // Singapore - gần Việt Nam nhất
    maxInstances: 10,
    memory: "512MiB", // Medium memory: reads 3.1MB HTML file into memory
    cpu: 0.5,
    timeoutSeconds: 60, // 1 minute: default timeout sufficient
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
        "otp",
        "productId",
      ]);
      if (!validation.valid) {
        res.status(400).json({
          error: "Missing required fields",
          missingFields: validation.missingFields,
        });
        return;
      }

      const { email, otp, productId } = req.body;

      // Validate email format
      if (!isValidEmail(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Validate OTP format
      if (!isValidOTP(otp)) {
        res
          .status(400)
          .json({ error: "Sai định dạng mã OTP. Mã OTP phải là 6 chữ số" });
        return;
      }

      // Validate productId
      if (!productId || !Object.values(PruductId).includes(productId)) {
        res.status(400).json({ error: "Invalid productId" });
        return;
      }

      // Get IP address for rate limiting
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        (req.headers["x-real-ip"] as string) ||
        req.ip ||
        "unknown";

      // Validate OTP (with rate limiting)
      const otpValidation = await validateOTP(email, otp, productId, ipAddress);
      if (!otpValidation.valid) {
        const statusCode = otpValidation.message?.includes("Too many")
          ? 429
          : 401;
        res.status(statusCode).json({
          error: otpValidation.message || "Sai mã OTP. Vui lòng thử lại.",
        });
        return;
      }

      logger.info(
        `OTP validated for ${email}, product ${productId}, file download authorized`
      );

      // Get file path and send file for download with email replacement
      const filePath = getFilePath(productId as PruductId);
      await sendFile(res, filePath, productId as PruductId, email);
    } catch (error) {
      logger.error("Error in confirmDownload:", error);
      handleError(error, res, "Internal server error");
    }
  }
);
