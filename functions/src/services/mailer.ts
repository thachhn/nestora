/**
 * Mailer service for sending emails
 */

import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";
import { smtpConfig } from "../utils/config";

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure, // true for 465, false for other ports
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: smtpConfig.from || smtpConfig.user,
    to: email,
    subject: "Your Download OTP",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Download Verification Code</h2>
            <p>Your OTP code for file download is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              If you did not request this code, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Your OTP code for file download is: ${otp}. This code will expire in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}:`, error);
    throw new Error("Failed to send OTP email");
  }
}

/**
 * Send welcome email to user with product-specific template
 */
export async function sendWelcomeEmail(
  email: string,
  productId: string,
  template: { subject: string; html: string; text: string }
): Promise<void> {
  const mailOptions = {
    from: smtpConfig.from || smtpConfig.user,
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email} for product ${productId}`);
  } catch (error) {
    logger.error(
      `Failed to send welcome email to ${email} for product ${productId}:`,
      error
    );
    // Don't throw error to avoid breaking the addUser flow
    // Just log the error
  }
}
