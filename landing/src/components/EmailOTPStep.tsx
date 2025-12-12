import { useState, useEffect, useMemo } from "react";
import { Typography, FormControl, Input, Button, Box, Divider } from "@mui/joy";
import OTPInput from "./OTPInput";
import { confirmDownload, requestDownload } from "../apis";

interface EmailOTPStepProps {
  productId: string;
  onDownloadSuccess: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function EmailOTPStep({
  productId,
  onDownloadSuccess,
  onError,
  onSuccess,
}: EmailOTPStepProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email) return;

    onError("");
    onSuccess("");
    setOtpLoading(true);
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setCountdown(0);

    try {
      const response = await requestDownload(email, productId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      onSuccess("");
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDownload = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    onError("");
    onSuccess("");
    setLoading(true);

    try {
      const response = await confirmDownload(email, otpString, productId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra khi tải file.");
      }

      // Get the file blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${productId}.html`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onSuccess("Tải file thành công!");
      onDownloadSuccess();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi tải file."
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  return (
    <Box>
      <Box sx={{ maxWidth: 400, mx: "auto", mb: 1 }}>
        {!otpSent && (
          <Box>
            <Typography level="title-lg" sx={{ textAlign: "center" }} mb={2}>
              Nhập email đã đăng ký mua hàng
            </Typography>
            <Typography level="body-md" sx={{ textAlign: "center" }}>
              Bạn sẽ nhận được một email có mã OTP để xác thực.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <FormControl sx={{ mb: 2 }}>
              <Input
                type="email"
                placeholder="Nhập email đã đăng ký mua hàng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || otpLoading}
                autoFocus={!otpSent}
                size="lg"
              />
            </FormControl>
          </Box>
        )}

        {otpSent && (
          <Box>
            <Typography level="h4" sx={{ textAlign: "center" }} mb={2}>
              Xác thực email
            </Typography>
            <Typography level="body-md" sx={{ textAlign: "center" }}>
              Mã OTP đã được gửi vào email {email}
            </Typography>
            <Typography level="body-md" sx={{ textAlign: "center" }}>
              Nhập OTP để tải file.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "center",
                mb: 2,
              }}
            >
              <OTPInput onChange={(value) => setOtp(value.split(""))} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Button
                onClick={handleDownload}
                loading={loading}
                disabled={otp.join("").length !== 6}
                sx={{ width: "100%" }}
                size="lg"
              >
                Download
              </Button>
            </Box>
          </Box>
        )}

        {!otpSent && (
          <Box sx={{ flex: 1 }}>
            <Button
              size="lg"
              sx={{ width: "100%" }}
              onClick={handleSendOTP}
              disabled={!isValidEmail || otpLoading || loading || countdown > 0}
              loading={otpLoading}
            >
              Gửi OTP
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
