/**
 * Verify payment webhook handler
 * Receives webhook from bank, verifies payment code and amount,
 * then creates/updates user with product access
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initHandler, handleError } from "../utils/handler";
import { extractUuidFromPaymentCode } from "../utils/validator";
import { getPayCodeByUuid, markPayCodeAsUsed } from "../models/PayCode";
import { grantProductAccess } from "../services/userService";

export const verifyPay = onRequest({}, async (req, res) => {
  if (
    !initHandler(req, res, {
      allowedMethods: ["POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      requireAuthenticationApiKey: true,
    })
  ) {
    return;
  }

  try {
    // Extract code and amount from webhook body
    const { code, transferAmount } = req.body;

    if (!code || typeof code !== "string") {
      res.status(400).json({
        error: "Missing or invalid payment code",
      });
      return;
    }

    if (
      !transferAmount ||
      typeof transferAmount !== "number" ||
      transferAmount <= 0
    ) {
      res.status(400).json({
        error: "Missing or invalid transfer amount",
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

    // Get PayCode from Firestore
    const payCode = await getPayCodeByUuid(uuid);
    if (!payCode) {
      res.status(404).json({
        error: "Payment code not found",
      });
      logger.warn(`Payment code not found: ${uuid}`);
      return;
    }

    // Check if PayCode has already been used
    if (payCode.used) {
      res.status(400).json({
        error: "Payment code has already been used",
      });
      logger.warn(`Payment code already used: ${uuid}`);
      return;
    }

    // Verify amount matches
    if (Number(transferAmount) < Number(payCode.amount)) {
      res.status(400).json({
        error: "Transfer amount does not match expected amount",
        expected: payCode.amount,
        received: transferAmount,
      });
      logger.warn(
        `Amount mismatch for payment code ${uuid}: expected ${payCode.amount}, received ${transferAmount}`
      );
      return;
    }

    // Amount matches - create/update user with product access
    const emailLower = payCode.email.toLowerCase();
    const productId = payCode.productId;

    const result = await grantProductAccess(emailLower, productId);

    logger.info(
      `User ${emailLower} ${result.status} with product ${productId} via payment code ${uuid}`
    );

    // Mark PayCode as used
    await markPayCodeAsUsed(uuid);

    logger.info(`Payment verified and processed successfully: ${uuid}`);

    res.status(200).json({
      success: true,
      paymentCode: uuid,
      email: emailLower,
      productId: productId,
    });
  } catch (error) {
    logger.error("Error in verifyPay:", error);
    handleError(error, res, "Internal server error");
  }
});
