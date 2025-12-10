/**
 * Get configuration value
 * Tries Firebase config first, then falls back to process.env
 */
export function getConfig(key: string): string | undefined {
  return process.env[key];
}

/**
 * Get required configuration value
 * Throws error if not found
 */
export function getRequiredConfig(key: string): string {
  const value = getConfig(key);
  if (!value) {
    throw new Error(`Required configuration ${key} is not set`);
  }
  return value;
}

export const ENV_CONFIGS = {
  SMTP_HOST: getConfig("SMTP_HOST") || "smtp.gmail.com",
  SMTP_SECURE: getConfig("SMTP_SECURE") || "false",
  SMTP_PORT: parseInt(getConfig("SMTP_PORT") || "587"),
  SMTP_USER: getRequiredConfig("SMTP_USER"),
  SMTP_PASS: getRequiredConfig("SMTP_PASS"),
  API_KEY: getRequiredConfig("API_KEY"),
};

export const smtpConfig = {
  host: ENV_CONFIGS.SMTP_HOST,
  port: ENV_CONFIGS.SMTP_PORT,
  secure: false,
  user: ENV_CONFIGS.SMTP_USER,
  pass: ENV_CONFIGS.SMTP_PASS,
  from: ENV_CONFIGS.SMTP_USER,
};

export const apiKey = ENV_CONFIGS.API_KEY;
