import { Box, Typography } from "@mui/joy";

export default function Footer() {
  return (
    <Box
      sx={{
        textAlign: "center",
        borderTop: "1px solid #333",
        marginTop: "auto",
        whiteSpace: "pre-line",
      }}
    >
      <Typography level="body-lg" m={2}>
        @ {new Date().getFullYear()} Bản quyền thuộc về Tin học Nestora.
      </Typography>
    </Box>
  );
}
