/**
 * File download utilities
 */

import * as fs from "fs";
import * as path from "path";
import { PruductId } from "./constants";
import * as logger from "firebase-functions/logger";

/**
 * Mapping productId to HTML filename
 */
const PRODUCT_FILE_MAP: Record<PruductId, string> = {
  [PruductId.TRUY_TIM_NGOI_VUA]: "truy-tim-ngoi-vua/truy_tim_ngoi_vua.html",
};

/**
 * Get file path for productId
 * Download folder is at functions/download/ (outside src/)
 */
export function getFilePath(productId: PruductId): string {
  const filename = PRODUCT_FILE_MAP[productId];
  if (!filename) {
    throw new Error(`No file mapping found for productId: ${productId}`);
  }

  // Path relative to functions directory
  // Download folder is at functions/download/ (same level as src/ and lib/)
  const functionsDir = path.resolve(__dirname, "../..");
  const filePath = path.join(functionsDir, "download", filename);
  return filePath;
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Get file info (name, size, mime type)
 * Only supports HTML files
 */
export function getFileInfo(filePath: string): {
  filename: string;
  size: number;
  mimeType: string;
} {
  const stats = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();

  // Only support HTML files
  if (ext !== ".html") {
    throw new Error(`Only HTML files are supported. File extension: ${ext}`);
  }

  return {
    filename,
    size: stats.size,
    mimeType: "text/html; charset=utf-8",
  };
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
 * Uses async file reading to handle large files (up to 10MB+) efficiently
 */
export async function sendFile(
  res: any,
  filePath: string,
  productId: PruductId,
  email: string
): Promise<void> {
  try {
    if (!fileExists(filePath)) {
      logger.error(`File not found: ${filePath} for productId: ${productId}`);
      res.status(404).json({ error: "File not found" });
      return;
    }

    const fileInfo = getFileInfo(filePath);

    // Read HTML file content asynchronously (non-blocking)
    // This can handle files up to 10MB+ efficiently
    const originalContent = await fs.promises.readFile(filePath, "utf-8");

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
