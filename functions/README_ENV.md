cd functions

firebase functions:secrets:set SMTP_USER="your-email@gmail.com"
firebase functions:secrets:set SMTP_PASS="your-app-password"
firebase functions:secrets:set API_KEY="your-secret-api-key"
firebase functions:secrets:set SMTP_HOST="smtp.gmail.com"
firebase functions:secrets:set SMTP_PORT="587"
firebase functions:secrets:set SMTP_SECURE="false"
firebase functions:secrets:set SMTP_FROM="your-email@gmail.com"

firebase deploy --only functions