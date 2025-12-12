import DownloadModal from "./components/DownloadModal";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import { Box, Grid } from "@mui/joy";
import { useState } from "react";
import { products } from "./constants/products";

function App() {
  const [openDownloadModal, setOpenDownloadModal] = useState<string>("");

  const onDownload = (productId: string) => {
    setOpenDownloadModal(productId);
  };

  return (
    <Box
      className="app"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          padding: 3,
        }}
      >
        <Header />

        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid xs={12} md={6} lg={4} xl={3} key={product.title}>
              <ProductCard {...product} onDownload={onDownload} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Footer />
      <DownloadModal
        open={openDownloadModal !== ""}
        onClose={() => setOpenDownloadModal("")}
        productId={openDownloadModal}
      />
    </Box>
  );
}

export default App;
