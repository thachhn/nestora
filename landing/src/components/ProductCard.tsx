import { useState, useRef, useEffect } from "react";
import { Image } from "@mui/icons-material";
import { Box, Button, Link } from "@mui/joy";
import AspectRatio from "@mui/joy/AspectRatio";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import Divider from "@mui/joy/Divider";
import Typography from "@mui/joy/Typography";

interface ProductCardProps {
  title: string;
  description: string;
  productId?: string;
  linkVideo?: string;
  linkImage?: string;
  onDownload: (productId: string) => void;
}

export default function ProductCard({
  title,
  description,
  productId,
  linkImage,
  linkVideo,
  onDownload,
}: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const hiddenTextRef = useRef<HTMLDivElement>(null);
  const MAX_LINES = 3;

  useEffect(() => {
    if (textRef.current && hiddenTextRef.current) {
      const lineHeight = parseInt(
        window.getComputedStyle(textRef.current).lineHeight
      );
      const maxHeight = lineHeight * MAX_LINES;
      const actualHeight = hiddenTextRef.current.scrollHeight;
      setShowReadMore(actualHeight > maxHeight);
    }
  }, [description]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography level="h3" textAlign={"center"}>
          {title}
        </Typography>
      </CardContent>
      <CardOverflow>
        <AspectRatio ratio="2">
          {linkImage ? (
            <img src={linkImage} loading="lazy" alt="" />
          ) : (
            <Image />
          )}
        </AspectRatio>
      </CardOverflow>
      <CardContent>
        <Box sx={{ position: "relative" }}>
          {/* Hidden element to measure actual text height */}
          <Typography
            ref={hiddenTextRef}
            level="body-md"
            sx={{
              position: "absolute",
              visibility: "hidden",
              height: "auto",
              width: "100%",
              whiteSpace: "pre-line",
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            {description.trim()}
          </Typography>
          <Typography
            ref={textRef}
            level="body-md"
            sx={{
              whiteSpace: "pre-line",
              display: "-webkit-box",
              WebkitLineClamp: isExpanded ? "none" : MAX_LINES,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description.trim()}
          </Typography>
          {showReadMore && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button
                variant="plain"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Thu gọn" : "Xem thêm"}
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
      <CardOverflow variant="soft" sx={{ bgcolor: "background.level1" }}>
        <Divider inset="context" />
        {!!productId && (
          <CardContent orientation="horizontal">
            <Link
              href={linkVideo}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                flex: 1,
              }}
            >
              <Button color="danger" size="lg" fullWidth>
                Xem demo
              </Button>
            </Link>

            <Button
              sx={{
                flex: 1,
              }}
              onClick={() => onDownload(productId)}
              size="lg"
            >
              Download
            </Button>
          </CardContent>
        )}
      </CardOverflow>
    </Card>
  );
}
