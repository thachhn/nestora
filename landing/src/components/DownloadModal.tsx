import { useState } from "react";
import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Alert,
  Button,
  Box,
} from "@mui/joy";
import { products } from "../constants/products";
import PurchaseStep from "./PurchaseStep";
import EmailOTPStep from "./EmailOTPStep";
import { ArrowBack } from "@mui/icons-material";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
}

type Step = "purchase" | "email-otp";

const DownloadModal = ({ open, onClose, productId }: DownloadModalProps) => {
  const productDetail = products.find(
    (product) => product.productId === productId
  );
  const [step, setStep] = useState<Step>("purchase");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClose = (_?: unknown, closeReason?: string) => {
    if (closeReason === "backdropClick") {
      return;
    }

    // Reset state when closing
    setStep("purchase");
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`Đã copy ${label} vào clipboard!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Không thể copy vào clipboard");
      setTimeout(() => setError(null), 2000);
    }
  };

  const handleDownloadSuccess = () => {
    // Close modal after a short delay
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  if (!productDetail) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        sx={{
          maxWidth: step === "purchase" ? 600 : 450,
          width: "90%",
        }}
      >
        <ModalClose />
        {step !== "purchase" && (
          <Box>
            <Button
              variant="plain"
              onClick={() => {
                setStep("purchase");
                setError(null);
                setSuccess(null);
              }}
              sx={{
                pl: 0,
              }}
              startDecorator={<ArrowBack />}
              size="sm"
            >
              Quay lại
            </Button>
          </Box>
        )}
        {step === "purchase" && (
          <Typography level="h4" component="h2">
            {step === "purchase" ? "Thông tin mua hàng" : "Download"}
          </Typography>
        )}

        {error && (
          <Alert color="danger" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="success" sx={{ mb: 1 }}>
            {success}
          </Alert>
        )}

        {step === "purchase" ? (
          <PurchaseStep
            product={productDetail}
            onContinue={() => setStep("email-otp")}
            onCopy={handleCopy}
          />
        ) : (
          <EmailOTPStep
            productId={productId}
            onDownloadSuccess={handleDownloadSuccess}
            onError={setError}
            onSuccess={setSuccess}
          />
        )}
      </ModalDialog>
    </Modal>
  );
};

export default DownloadModal;
