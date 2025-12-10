# Hướng dẫn Deploy Firebase Functions

## Bước 1: Set Environment Variables (Secrets)

Trước khi deploy, cần set các environment variables (secrets) trên Firebase:

```bash
cd functions

# Set SMTP configuration
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_SECURE
firebase functions:secrets:set SMTP_FROM

# Set API key
firebase functions:secrets:set API_KEY
```

**Lưu ý:** Mỗi lần chạy sẽ hỏi bạn nhập giá trị. Hoặc có thể set trực tiếp:

```bash
firebase functions:secrets:set SMTP_USER="your-email@gmail.com"
firebase functions:secrets:set SMTP_PASS="your-app-password"
firebase functions:secrets:set API_KEY="your-secret-api-key"
firebase functions:secrets:set SMTP_HOST="smtp.gmail.com"
firebase functions:secrets:set SMTP_PORT="587"
firebase functions:secrets:set SMTP_SECURE="false"
firebase functions:secrets:set SMTP_FROM="your-email@gmail.com"
```

## Bước 2: Đảm bảo Firestore Database đã được tạo

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Firestore Database**
4. Nếu chưa có, tạo database với location: `asia-east2`

## Bước 3: Deploy Functions

```bash
# Từ thư mục root của project
firebase deploy --only functions
```

Hoặc deploy từ thư mục functions:

```bash
cd functions
npm run deploy
```

## Bước 4: Deploy Firestore Rules (nếu cần)

```bash
firebase deploy --only firestore:rules
```

## Bước 5: Kiểm tra Logs

Sau khi deploy, có thể xem logs:

```bash
firebase functions:log
```

Hoặc xem realtime:

```bash
firebase functions:log --only addUser
firebase functions:log --only requestDownload
firebase functions:log --only confirmDownload
```

## URLs sau khi deploy

Sau khi deploy thành công, bạn sẽ thấy URLs như:

```
https://us-central1-your-project-id.cloudfunctions.net/addUser
https://us-central1-your-project-id.cloudfunctions.net/requestDownload
https://us-central1-your-project-id.cloudfunctions.net/confirmDownload
```

## Test sau khi deploy

**Add User:**

```bash
curl -X POST https://us-central1-your-project-id.cloudfunctions.net/addUser \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "emails": ["test@example.com"],
    "productId": "truy-tim-ngoi-vua"
  }'
```

## Troubleshooting

- **Lỗi "Secret not found":** Đảm bảo đã set tất cả secrets trước khi deploy
- **Lỗi "File not found":** Đảm bảo thư mục `download/` được include khi deploy
- **Lỗi "Permission denied":** Kiểm tra Firebase project permissions
