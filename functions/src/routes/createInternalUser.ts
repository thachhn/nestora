/**
 * Create Internal User handler
 * Creates a new internal user (admin or collaborators) - protected by API key
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { validateRequest, isValidEmail } from "../utils/validator";
import { createInternalUser } from "../models/InternalUsers";
import { initHandler, handleError } from "../utils/handler";

export const createInternalUserHandler = onRequest({}, async (req, res) => {
  // Initialize handler (CORS, method validation, API key validation)
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
    const validation = validateRequest(req.body, [
      "email",
      "password",
      "refCode",
      "role",
      "refPercent",
    ]);
    if (!validation.valid) {
      res.status(400).json({
        error: "Missing required fields",
        missingFields: validation.missingFields,
      });
      return;
    }

    const { email, password, refCode, role, refPercent } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Validate password
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
      return;
    }

    // Validate refCode
    if (
      !refCode ||
      typeof refCode !== "string" ||
      refCode.trim().length === 0
    ) {
      res
        .status(400)
        .json({ error: "refCode is required and cannot be empty" });
      return;
    }

    // Validate role
    if (role !== "admin" && role !== "collaborators") {
      res.status(400).json({
        error: "Invalid role. Must be 'admin' or 'collaborators'",
      });
      return;
    }

    // Validate refPercent
    const refPercentNum = Number(refPercent);
    if (isNaN(refPercentNum) || refPercentNum < 0 || refPercentNum > 100) {
      res.status(400).json({
        error: "refPercent must be a number between 0 and 100",
      });
      return;
    }

    // Create internal user
    const newUser = await createInternalUser({
      email,
      password,
      refCode,
      role,
      refPercent: refPercentNum,
    });

    logger.info(
      `Internal user created: ${newUser.email} with role ${newUser.role}`
    );

    res.status(200).json({
      success: true,
      message: "Internal user created successfully",
      data: {
        email: newUser.email,
        refCode: newUser.refCode,
        role: newUser.role,
        refPercent: newUser.refPercent,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    logger.error("Error in createInternalUser:", error);

    // Handle duplicate email or refCode errors
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        res.status(409).json({
          error: error.message,
        });
        return;
      }
      if (error.message.includes("already in use")) {
        res.status(409).json({
          error: error.message,
        });
        return;
      }
    }

    handleError(error, res, "Internal server error");
  }
});
