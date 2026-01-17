/**
 * File download utilities
 */

import * as path from "path";
import * as fs from "fs";
import { Storage } from "@google-cloud/storage";
import type { Response } from "express";
import { PRODUCT_MAP } from "./constants";
import * as logger from "firebase-functions/logger";

// Initialize Google Cloud Storage client
// Use GOOGLE_APPLICATION_CREDENTIALS env var if set, otherwise use file in src/
const storageOptions: { keyFilename?: string } = {};
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Use environment variable if set
  storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
} else {
  // Try to find credentials file in src/ directory (for local development)
  // __dirname will be lib/utils/ when compiled, so go up to src/
  const credentialsPath = path.resolve(
    __dirname,
    "../nestora-register-0fb28e95a4d1.json"
  );
  if (fs.existsSync(credentialsPath)) {
    storageOptions.keyFilename = credentialsPath;
  }
  // If no credentials file found, Storage will use default credentials
  // (Application Default Credentials or service account when deployed)
}

const storage = new Storage(storageOptions);
const BUCKET_NAME = "nestora-internal-f";
const bucket = storage.bucket(BUCKET_NAME);

/**
 * Get file path for productId
 * Download folder is at functions/download/ (outside src/)
 */
export function getFilePath(productId: string): string {
  const filename = PRODUCT_MAP[productId].file;
  if (!filename) {
    throw new Error(`No file mapping found for productId: ${productId}`);
  }

  return filename;

  // // Path relative to functions directory
  // // Download folder is at functions/download/ (same level as src/ and lib/)
  // const functionsDir = path.resolve(__dirname, "../..");
  // const filePath = path.join(functionsDir, "download", filename);
  // return filePath;
}

/**
 * Get file info (name, size, mime type) from GCS
 * Only supports HTML files
 */
export async function getFileInfo(filePath: string): Promise<{
  filename: string;
  size: number;
  mimeType: string;
}> {
  try {
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Only support HTML files
    if (ext !== ".html") {
      throw new Error(`Only HTML files are supported. File extension: ${ext}`);
    }

    const size =
      typeof metadata.size === "string"
        ? parseInt(metadata.size, 10)
        : metadata.size || 0;

    return {
      filename,
      size,
      mimeType: "text/html; charset=utf-8",
    };
  } catch (error) {
    logger.error(`Error getting file info for ${filePath}:`, error);
    throw error;
  }
}

/**
 * Replace placeholders in HTML content with user data
 */
export function replaceHTMLContent(htmlContent: string, email: string): string {
  // Replace {{email}} or {email} with actual email
  const replacedContent = htmlContent.replace(
    "e3t4eHh4ZW1haWx4eHh4fX0=",
    btoa(email)
  );

  return replacedContent;
}

/**
 * Send HTML file as download response with email replacement
 * Downloads file from Google Cloud Storage bucket
 * Uses async file reading to handle large files (up to 10MB+) efficiently
 */
export async function sendFile(
  res: Response,
  filePath: string,
  productId: string,
  email: string
): Promise<void> {
  try {
    // Get file info from GCS
    const fileInfo = await getFileInfo(filePath);

    // Download file content from GCS bucket
    const file = bucket.file(filePath);
    const [fileContentBuffer] = await file.download();
    const originalContent = fileContentBuffer.toString("utf-8");

    // Replace email placeholder with actual email
    const fileContent = replaceHTMLContent(originalContent, email);

    // Calculate new content length after replacement
    const contentLength = Buffer.byteLength(fileContent, "utf-8");

    // Set headers for HTML file download
    res.setHeader("Content-Type", fileInfo.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileInfo.filename}"`
    );
    res.setHeader("Content-Length", contentLength.toString());

    // Send HTML file content with replaced email
    res.send(fileContent);

    logger.info(
      `HTML file ${fileInfo.filename} sent for productId: ${productId}, email: ${email}, size: ${contentLength} bytes`
    );
  } catch (error) {
    logger.error(`Error sending HTML file ${filePath}:`, error);
    if (error instanceof Error && error.message.includes("Only HTML files")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error downloading file" });
    }
  }
}
