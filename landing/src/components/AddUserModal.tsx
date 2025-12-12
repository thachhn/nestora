import {
  Box,
  Button,
  FormControl,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Textarea,
} from "@mui/joy";
import { useState } from "react";
import { products } from "../constants/products";
import { addUsersToProduct } from "../apis";

const AddUserModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const apiKey = localStorage.getItem("addUserApiKey");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const [editApiKey, setEditApiKey] = useState("");
  const handleClose = (_?: unknown, closeReason?: string) => {
    if (closeReason === "backdropClick") {
      return;
    }

    onClose();
  };

  const handleSaveApiKey = () => {
    localStorage.setItem("addUserApiKey", editApiKey);
    onClose();
  };

  const handleAddUsers = async () => {
    setLoading(true);
    const emails = editApiKey
      .split(/[\n,\s]+/)
      .filter((v) => v.trim())
      .map((v) => v.trim().toLowerCase());

    if (selectedProduct && apiKey && emails.length > 0) {
      const response = await addUsersToProduct(emails, selectedProduct, apiKey);

      if (!response.ok) {
        const data = await response.json();

        alert("Failed to add users: " + data.error);
      } else {
        alert("Users added successfully");

        onClose();
      }
    }

    setLoading(false);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        sx={{
          maxWidth: 450,
          width: "90%",
        }}
      >
        <ModalClose />

        {!apiKey && (
          <Box>
            <FormControl>
              <Input
                type="text"
                placeholder="Key"
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
              />
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button onClick={handleSaveApiKey}>Lưu</Button>
            </Box>
          </Box>
        )}

        {apiKey && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl>
              <Select
                value={selectedProduct}
                onChange={(_, value) => setSelectedProduct(value || "")}
                placeholder="Chọn sản phẩm"
              >
                {products
                  .filter((v) => v.productId)
                  .map((v) => {
                    return (
                      <Option key={v.productId} value={v.productId}>
                        {v.title}
                      </Option>
                    );
                  })}
              </Select>
            </FormControl>
            <FormControl>
              <Textarea
                placeholder="Emails"
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                minRows={10}
              />
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button loading={loading} onClick={handleAddUsers}>
                Lưu
              </Button>
            </Box>
          </Box>
        )}
      </ModalDialog>
    </Modal>
  );
};

export default AddUserModal;
