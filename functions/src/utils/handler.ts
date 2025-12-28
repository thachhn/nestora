/**
 * Handler utilities for common request handling
 */

import { Request, Response } from "express";
import { apiKey } from "./config";

export interface HandlerOptions {
  allowedMethods?: string[];
  allowedHeaders?: string[];
  requireApiKey?: boolean;
  requireAuthenticationApiKey?: boolean;
}

/**
 * Setup CORS headers and handle OPTIONS request
 */
export function setupCORS(
  res: Response,
  allowedMethods: string[] = ["POST", "OPTIONS"],
  allowedHeaders: string[] = ["Content-Type"]
): boolean {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", allowedMethods.join(", "));
  res.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));

  return true;
}

/**
 * Handle OPTIONS request (preflight)
 */
export function handleOPTIONS(res: Response): boolean {
  res.status(204).send("");
  return true;
}

/**
 * Validate HTTP method
 */
export function validateMethod(
  req: Request,
  res: Response,
  allowedMethods: string[] = ["POST"]
): boolean {
  if (req.method === "OPTIONS") {
    handleOPTIONS(res);
    return false;
  }

  if (!allowedMethods.includes(req.method)) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }

  return true;
}

/**
 * Validate API key
 */
export function validateAPIKey(
  req: Request,
  res: Response,
  apiKey: string,
  headerName = "x-api-key"
): boolean {
  const providedApiKey =
    req.headers[headerName] || req.headers[headerName.toLowerCase()];

  if (!providedApiKey || providedApiKey !== apiKey) {
    res.status(401).json({ error: "Unauthorized: Invalid API key" });
    return false;
  }

  return true;
}

/**
 * Initialize handler with common setup
 * Returns false if request should be terminated (OPTIONS, wrong method, etc.)
 */
export function initHandler(
  req: Request,
  res: Response,
  options: HandlerOptions = {}
): boolean {
  const {
    allowedMethods = ["POST", "OPTIONS"],
    allowedHeaders = ["Content-Type"],
    requireApiKey = false,
    requireAuthenticationApiKey = false,
  } = options;

  // Setup CORS
  setupCORS(res, allowedMethods, allowedHeaders);

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    handleOPTIONS(res);
    return false;
  }

  // Validate method
  if (!validateMethod(req, res, allowedMethods)) {
    return false;
  }

  // Validate API key if required
  if (requireApiKey) {
    if (!validateAPIKey(req, res, apiKey as string, "x-api-key")) {
      return false;
    }
  }

  if (requireAuthenticationApiKey) {
    if (!validateAPIKey(req, res, `Apikey ${apiKey}`, "Authorization")) {
      return false;
    }
  }

  return true;
}

/**
 * Error handler wrapper
 */
export function handleError(
  error: any,
  res: Response,
  errorMessage = "Internal server error"
): void {
  console.error(error);
  res.status(500).json({ error: errorMessage });
}
