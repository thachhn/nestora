import {
  Typography,
  Button,
  Alert,
  Box,
  Divider,
  IconButton,
  Link,
  Grid,
} from "@mui/joy";
import { ContentCopy } from "@mui/icons-material";
import { type Product, BANK_ACCOUNT } from "../constants/products";

interface PurchaseStepProps {
  product: Product;
  onContinue: () => void;
  onCopy: (text: string, label: string) => void;
}

const formatPrice = (price?: number) => {
  if (!price) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function PurchaseStep({
  product,
  onContinue,
  onCopy,
}: PurchaseStepProps) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid xs>
            <Typography level="title-md">Tên sản phẩm</Typography>
            <Typography color="success" level="title-lg" sx={{ mb: 1 }}>
              {product.title}
            </Typography>
          </Grid>
          <Grid xs>
            <Typography level="title-md">Giá tiền</Typography>
            <Typography level="title-lg" color="danger">
              {formatPrice(product.price)}
            </Typography>
          </Grid>
        </Grid>

        <Alert variant="soft" color="warning" sx={{ mt: 1 }}>
          <Typography level="body-sm">
            Nếu thầy cô đã được đăng ký email vào hệ thống, hãy bỏ qua phần
            thanh toán và nhấn nút tiếp tục tải về bên dưới.
          </Typography>
        </Alert>

        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid xs={12} sm md>
            <Typography level="title-md" sx={{ mb: 1 }}>
              Thông tin chuyển khoản
            </Typography>
            <Box
              sx={{
                bgcolor: "background.level1",
                p: 2,
                borderRadius: "sm",
              }}
            >
              <Typography level="body-sm" lineHeight={"28px"}>
                <strong>Họ tên chủ TK:</strong> {BANK_ACCOUNT.accountName}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography level="body-sm">
                  <strong>Số tài khoản:</strong> {BANK_ACCOUNT.accountNumber}
                </Typography>
                <Button
                  size="sm"
                  variant="soft"
                  sx={{
                    display: {
                      xs: "none",
                      md: "inline-flex",
                    },
                  }}
                  onClick={() =>
                    onCopy(BANK_ACCOUNT.accountNumber, "số tài khoản")
                  }
                  startDecorator={<ContentCopy fontSize="small" />}
                >
                  Nhấn để copy
                </Button>
                <IconButton
                  size="sm"
                  variant="soft"
                  sx={{
                    display: {
                      xs: "block",
                      md: "none",
                    },
                  }}
                  onClick={() =>
                    onCopy(BANK_ACCOUNT.accountNumber, "số tài khoản")
                  }
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
              <Typography level="body-sm" lineHeight={"28px"}>
                <strong>Nickname:</strong> {BANK_ACCOUNT.nickName}
              </Typography>
              <Typography level="body-sm" lineHeight={"28px"}>
                <strong>Tên ngân hàng:</strong> {BANK_ACCOUNT.bankName}
              </Typography>
            </Box>
          </Grid>
          <Grid
            xs={12}
            md="auto"
            sm="auto"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 174,
                height: 174,
                overflow: "hidden",
                flexShrink: 0,
                borderRadius: 8,
              }}
            >
              <img
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                src={"/vietcombank-qr.jpg"}
                alt="bank logo"
              />
            </Box>
          </Grid>
        </Grid>
        <Alert variant="soft" color="primary" sx={{ mt: 2 }}>
          <Typography level="body-sm">
            <strong>Lưu ý:</strong> Sau khi chuyển khoản xong, thầy cô chụp màn
            hình chuyển khoản và{" "}
            <Typography component={"span"} color="danger">
              gửi địa chỉ email
            </Typography>{" "}
            của thầy cô tới Zalo Tin Học Nestora{" "}
            <Link
              href="https://zalo.me/0559468839"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontWeight: "bold" }}
            >
              0559468839
            </Link>{" "}
            hoặc email{" "}
            <Link
              href="mailto:tinhocnestora@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontWeight: "bold" }}
            >
              tinhocnestora@gmail.com
            </Link>{" "}
            để mình đăng ký cho thầy cô nhé. Nếu thầy cô có thắc mắc gì, hãy
            liên hệ mình qua Zalo hoặc email này luôn nhé.
          </Typography>
        </Alert>
      </Box>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button variant="solid" color="primary" onClick={onContinue}>
          Tiếp tục tải về
        </Button>
      </Box>
    </Box>
  );
}
