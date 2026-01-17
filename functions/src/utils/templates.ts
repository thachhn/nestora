/**
 * Email templates mapping by productId
 */

import { PRODUCT_MAP } from "./constants";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Get email template by productId (without code)
 */
export function getTemplateByProductId(productId: string): EmailTemplate {
  return {
    text: PRODUCT_MAP[productId]?.textTemplate,
    html: PRODUCT_MAP[productId]?.emailTemplate,
    subject: PRODUCT_MAP[productId]?.name,
  };
}
