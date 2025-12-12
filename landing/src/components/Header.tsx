import { Box, Typography, Link, Card } from "@mui/joy";

import { Email, Facebook, YouTube } from "@mui/icons-material";
import { TikTokIcon, ZaloIcon } from "../svgIcons";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
}
const socialLinks: SocialLink[] = [
  {
    name: "@tinhocnestora",
    url: "https://www.tiktok.com/@tinhocnestora",
    icon: <TikTokIcon />,
  },
  {
    name: "tinhocnestora",
    url: "https://www.facebook.com/tinhocnestora",
    icon: <Facebook />,
  },
  {
    name: "@tinhocnestora",
    url: "https://www.youtube.com/@tinhocnestora",
    icon: <YouTube />,
  },
  {
    name: "tinhocnestora@gmail.com",
    url: "mailto:tinhocnestora@gmail.com",
    icon: <Email />,
  },
  {
    name: "0559468839",
    url: "https://zalo.me/0559468839",
    icon: <ZaloIcon />,
  },
];

export default function Header() {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "center", md: "center" },
        gap: { xs: "16px", md: "32px" },
        padding: { xs: "16px", lg: "24px" },
      }}
    >
      <Box
        sx={{
          width: { xs: "150px", md: "250px" },
          height: { xs: "150px", md: "250px" },
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid #FFFFFF",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <img
          src="/logo-cogiao.jpeg"
          alt="Cô giáo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      {/* Thông tin */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: { xs: "center", md: "flex-start" },
          textAlign: { xs: "center", md: "left" },
        }}
      >
        {/* Tên */}
        <Box>
          <Typography
            level="h1"
            sx={{
              fontSize: { xs: "28px", md: "36px", lg: "42px" },
              fontWeight: 700,
              ml: { xs: 0, md: 2 },
            }}
            onClick={() => {
              window.open("https://tinhocnestora.com", "_blank");
            }}
          >
            Tin học Nestora
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "8px",
            width: "100%",
            maxWidth: "700px",
            justifyContent: {
              xs: "center",
              md: "flex-start",
            },
          }}
        >
          {socialLinks.map((social, index) => (
            <Link
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "text.primary",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.primary",
                  "& svg": {
                    color: "text.primary",
                    width: "24px",
                    height: "24px",
                  },
                }}
              >
                {social.icon}
              </Box>
              <Typography
                level="body-md"
                sx={{
                  fontSize: { xs: "15px", md: "18px" },
                }}
              >
                {social.name}
              </Typography>
            </Link>
          ))}
        </Box>

        <Typography
          level="body-lg"
          sx={{
            fontSize: { xs: "15px", md: "18px" },
            lineHeight: 1.6,
            maxWidth: "700px",
            ml: { xs: 0, md: 2 },
          }}
        >
          Xin chào, mình là giáo viên dạy MOS, IC3 đam mê công nghệ và sáng tạo
          cùng AI
        </Typography>
        <Typography
          level="body-lg"
          sx={{
            fontSize: { xs: "15px", md: "18px" },
            lineHeight: 1.6,
            maxWidth: "700px",
            ml: { xs: 0, md: 2 },
          }}
        >
          Mình đã lập trình một số ứng dụng với mong muốn giúp việc dạy học của
          thầy cô dễ dàng hơn cũng như giúp các em học sinh hứng thú trong học
          tập. Nếu thầy cô thấy những ứng dụng này sẽ giúp ích cho công việc dạy
          học của thầy cô thì hãy ủng hộ mình nhé.
        </Typography>
      </Box>
    </Card>
  );
}
