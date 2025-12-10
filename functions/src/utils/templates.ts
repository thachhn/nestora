/**
 * Email templates mapping by productId
 */

import { PruductId } from "./constants";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Get email template by productId
 */
export function getTemplateByProductId(
  productId: PruductId,
  code: string
): EmailTemplate {
  const templates: Record<PruductId, EmailTemplate> = {
    [PruductId.TRUY_TIM_NGOI_VUA]: {
      subject: "Chào mừng bạn đến với Truy Tìm Ngôi Vua",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4CAF50;">Chào mừng bạn đến với Truy Tìm Ngôi Vua!</h2>
              <p>Bạn đã được thêm vào hệ thống thành công.</p>
              <p>Mã truy cập của bạn là:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
              </div>
              <p>Vui lòng lưu mã này để sử dụng khi cần tải file.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Đây là email tự động, vui lòng không trả lời email này.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `Chào mừng bạn đến với Truy Tìm Ngôi Vua! Bạn đã được thêm vào hệ thống thành công. Mã truy cập của bạn là: ${code}. Vui lòng lưu mã này để sử dụng khi cần tải file.`,
    },
  };

  return templates[productId] || getDefaultTemplate(code);
}

/**
 * Get default template (fallback)
 */
function getDefaultTemplate(code: string): EmailTemplate {
  return {
    subject: "Chào mừng bạn đến với hệ thống",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Chào mừng bạn!</h2>
            <p>Bạn đã được thêm vào hệ thống thành công.</p>
            <p>Mã truy cập của bạn là:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
            </div>
            <p>Vui lòng lưu mã này để sử dụng khi cần tải file.</p>
          </div>
        </body>
      </html>
    `,
    text: `Chào mừng bạn! Bạn đã được thêm vào hệ thống thành công. Mã truy cập của bạn là: ${code}. Vui lòng lưu mã này để sử dụng khi cần tải file.`,
  };
}
