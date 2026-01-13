/**
 * Get PayCode by Collaborators handler
 * Authenticates collaborator and returns PayCodes filtered by refCode and month
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Timestamp } from "firebase-admin/firestore";
import {
  getInternalUserByEmail,
  verifyInternalUserPassword,
} from "../models/InternalUsers";
import {
  getPayCodesByDateRange,
  getPayCodesByRefCodeAndDateRange,
  PayCodeModel,
} from "../models/PayCode";
import { initHandler, handleError } from "../utils/handler";
import { checkRequestRateLimit } from "../utils/rateLimiter";

export const getPayCodeByCollaborators = onRequest({}, async (req, res) => {
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
    const { email, password, month } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({
        error: "Missing or invalid email",
      });
      return;
    }

    if (!password || typeof password !== "string") {
      res.status(400).json({
        error: "Missing or invalid password",
      });
      return;
    }

    if (!month || typeof month !== "string") {
      res.status(400).json({
        error: "Missing or invalid month (format: YY-MM)",
      });
      return;
    }

    // Validate month format (YY-MM)
    const monthRegex = /^(\d{2})-(\d{2})$/;
    const monthMatch = month.match(monthRegex);
    if (!monthMatch) {
      res.status(400).json({
        error: "Invalid month format. Expected format: YY-MM (e.g., 24-12)",
      });
      return;
    }

    // Rate limiting
    const isRateLimited = await checkRequestRateLimit(
      req,
      "get_paycode_by_collaborators"
    );

    if (isRateLimited) {
      res.status(429).json({
        error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      });
      return;
    }

    // Authenticate internal user
    const emailLower = email.toLowerCase();
    const internalUser = await getInternalUserByEmail(emailLower);

    if (!internalUser) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      logger.warn(`Failed authentication attempt for email: ${emailLower}`);
      return;
    }

    // Verify password
    const isPasswordValid = await verifyInternalUserPassword(
      emailLower,
      password
    );

    if (!isPasswordValid) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      logger.warn(`Failed password verification for email: ${emailLower}`);
      return;
    }

    // Get refCode from internal user
    const refCode = internalUser.refCode;

    // Parse month and create date range
    const [, yearStr, monthStr] = monthMatch;
    const year = 2000 + parseInt(yearStr, 10); // Convert YY to YYYY
    const monthNum = parseInt(monthStr, 10);

    if (monthNum < 1 || monthNum > 12) {
      res.status(400).json({
        error: "Invalid month. Month must be between 01 and 12",
      });
      return;
    }

    // Create start date (first day of month, 00:00:00)
    const startDate = Timestamp.fromDate(
      new Date(year, monthNum - 1, 1, 0, 0, 0, 0)
    );

    // Create end date (last day of month, 23:59:59.999)
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = Timestamp.fromDate(
      new Date(year, monthNum - 1, lastDay, 23, 59, 59, 999)
    );

    let payCodes: PayCodeModel[] = [];

    if (internalUser.role === "admin") {
      payCodes = await getPayCodesByDateRange(startDate, endDate);
    }

    if (internalUser.role === "collaborators" && refCode) {
      payCodes = await getPayCodesByRefCodeAndDateRange(
        refCode,
        startDate,
        endDate
      );
    }

    res.status(200).json({
      success: true,
      data: payCodes,
      count: payCodes.length,
      month: month,
      refCode: refCode,
      role: internalUser.role,
      email: email,
      refPercent: internalUser.refPercent,
    });
  } catch (error) {
    logger.error("Error in getPayCodeByCollaborators:", error);
    handleError(error, res, "Internal server error");
  }
});
