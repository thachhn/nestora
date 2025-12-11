curl -X POST https://asia-southeast1-nestora-register.cloudfunctions.net/confirmDownload \
 -H "Content-Type: application/json" \
 -d '{
"email": "nopassm@gmail.com",
"productId": "truy-tim-ngoi-vua", "otp": "207223"
}'

curl -X POST https://asia-southeast1-nestora-register.cloudfunctions.net/requestDownload \
 -H "Content-Type: application/json" \
 -d '{
"email": "nopassm@gmail.com",
"productId": "truy-tim-ngoi-vua", "code": "XQCVI"
}'

curl -X POST https://asia-southeast1-nestora-register.cloudfunctions.net/addUser \
 -H "Content-Type: application/json" \
 -H "x-api-key: test123zzz" \
 -d '{
"emails": ["nopassm@gmail.com"],
"productId": "truy-tim-ngoi-vua"
}'
