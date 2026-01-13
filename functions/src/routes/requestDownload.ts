/**
 * Request download handler
 * Validates email and product access, sends OTP to email
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  validateRequest,
  isValidEmail,
  generatePaymentCode,
} from "../utils/validator";
import { generateOTP, storeOTP, resetOTPAttempts } from "../models/OTP";
import { sendOTPEmail } from "../services/mailer";
import { verifyUserProduct } from "../models/User";
import { createPayCode } from "../models/PayCode";
import { PruductId, PRODUCT_MAP } from "../utils/constants";
import { initHandler, handleError } from "../utils/handler";
import { checkRequestRateLimit } from "../utils/rateLimiter";

export const requestDownload = onRequest({}, async (req, res) => {
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

    const { email, productId, isPayment } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Sai định dạng email" });
      return;
    }

    // Validate productId
    if (!productId || !Object.values(PruductId).includes(productId)) {
      res.status(400).json({ error: "Sai định dạng sản phẩm" });
      return;
    }

    // Rate limiting: Check IP and email limits
    const emailLower = email.toLowerCase();

    // Rate limit by IP
    const isRateLimited = await checkRequestRateLimit(req, "request_download");

    if (isRateLimited) {
      res.status(429).json({
        error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      });
      return;
    }

    // Verify user email has access to productId
    const hasAccess = await verifyUserProduct(emailLower, productId);

    if (!hasAccess) {
      if (!isPayment) {
        res.status(400).json({
          error:
            "Email này chưa được đăng ký mua hàng. Vui lòng thanh toán trước.",
        });
        return;
      }
      // User doesn't have access - create payment code
      // Get product price from PRODUCT_MAP
      const productInfo = PRODUCT_MAP[productId as PruductId];
      if (!productInfo || !productInfo.price) {
        res.status(400).json({
          error: "Không tìm thấy thông tin sản phẩm",
        });
        return;
      }

      const amount = productInfo.price;
      const { metadata, refCode } = req.body;

      // Generate payment code:
      const paymentCode = generatePaymentCode();
      const uuid = paymentCode.substring(2); // Extract UUID (22 characters: timestamp + random)

      // Create PayCode record
      await createPayCode(uuid, {
        email: emailLower,
        productId: productId as PruductId,
        amount: amount,
        metadata: metadata || "",
        refCode: refCode || null,
      });

      logger.info(
        `Payment code created: ${paymentCode} for email ${emailLower}, product ${productId}, amount ${amount}`
      );

      // Return UUID to client
      res.status(200).json({
        success: true,
        paymentCode,
        amount,
        message: "Mã thanh toán đã được tạo",
      });
      return;
    } else {
      if (isPayment) {
        res.status(400).json({
          error:
            "Email này đã được đăng ký mua hàng. Không cần thanh toán nữa.",
        });
        return;
      }
    }

    // Reset any previous failed attempts when generating new OTP
    await resetOTPAttempts(emailLower, productId);

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(emailLower, otp, productId);

    const title = `Mã OTP để tải file là ${otp}`;
    // Send OTP email
    await sendOTPEmail(email, otp, title);

    logger.info(`OTP sent to ${email} for product ${productId}`);

    res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi vào email của bạn",
    });
  } catch (error) {
    logger.error("Error in requestDownload:", error);
    handleError(error, res, "Internal server error");
  }
});
