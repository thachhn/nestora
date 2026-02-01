/* eslint-disable quote-props */
/**
 * Mailer service for sending emails
 */

import * as logger from "firebase-functions/logger";
import { ENV_CONFIGS } from "../utils/config";

const sendResendEmail = async ({
  from = ENV_CONFIGS.EMAIL_FROM || "",
  replyTo = ENV_CONFIGS.EMAIL_REPLY_TO || "",
  pass,
  to,
  subject,
  html,
  text,
}: {
  from?: string;
  replyTo?: string;
  pass?: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string }> => {
  const emailData = {
    from: `Tin Học Nestora <${from}>`,
    to: [to],
    subject: subject,
    html: html,
    text: text,
    reply_to: replyTo,
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pass}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok || !result?.id) {
      logger.error(`Failed to send email:`, result, result);
      throw new Error(`Failed to send email: ${result?.error?.message}`);
    }

    console.log("Email sent successfully:", result.id);
    return { id: result.id };
  } catch (error) {
    logger.error(`Failed to send email: ${error}`);
    throw new Error(`Failed to send email: ${error}`);
  }
};

export async function sendOTPEmail(
  email: string,
  otp: string,
  title: string
): Promise<string | undefined> {
  try {
    const data = await sendResendEmail({
      to: email,
      pass: ENV_CONFIGS.EMAIL_OTP_PASS,
      subject: title,
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Mã OTP của bạn là:</h2>
            <div style="background-color: #f4f4f4; padding: 12px; text-align: center; margin: 12px 0; border-radius: 5px;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 24px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>Mã OTP sẽ hết hạn sau 10 phút.</p>
          </div>
        </body>
      </html>
    `,
      text: `Mã OTP của bạn là: ${otp}. Mã OTP sẽ hết hạn sau 10 phút.`,
    });

    return data?.id;
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
): Promise<string | undefined> {
  try {
    const data = await sendResendEmail({
      to: email,
      pass: ENV_CONFIGS.EMAIL_WELCOME_PASS,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return data?.id;
  } catch (error) {
    logger.error(
      `Failed to send welcome email to ${email} for product ${productId}:`,
      error
    );
    // Don't throw error to avoid breaking the addUser flow
    // Just log the error
  }

  return undefined;
}
