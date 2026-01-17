interface ProductConfig {
  id: string;
  name: string;
  buildDir: string;
  price: number;
  file: string;
}

export const PRODUCTS_CONFIG: ProductConfig[] = [
  {
    id: "truy-tim-ngoi-vua",
    name: "Truy Tìm Ngôi Vua",
    buildDir: "../../mini/points",
    price: 49000,
    file: "products/truy-tim-ngoi-vua/private/build.html",
  },
  {
    id: "memomi",
    name: "Ghép hình giải đố - MEMOMI",
    buildDir: "../../mini/memory-cards",
    price: 49000,
    file: "products/memomi/private/build.html",
  },
  {
    id: "virtual-gallery",
    name: "Phòng trưng bày ảnh",
    buildDir: "../../mini/virtual-gallery",
    price: 49000,
    file: "products/virtual-gallery/private/build.html",
  },
  // Thêm các sản phẩm khác ở đây
  // {
  //   id: "product-id",
  //   name: "Product Name",
  //   buildDir: "../../mini/product-path",
  //   price: 49000,
  //   file: "products/product-id/private/build.html",
  // },
];


const emailTemplate = (id: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Email của thầy cô đã được thêm vào hệ thống. Thầy cô hãy tải file tại đây: <a href="https://nestora.edu.vn/product/${id}" style="color: #4CAF50;">https://nestora.edu.vn/product/${id}</a></p>

        <p>Thầy cô có thể xem hướng dẫn tải file tại đây: <a href="https://drive.google.com/file/d/1k9JzSz29uOSSqcbfcZlonNF5fAmp9TqP/view" style="color: #4CAF50;">https://drive.google.com/file/d/1k9JzSz29uOSSqcbfcZlonNF5fAmp9TqP/view</a></p>

        <p><strong>Lưu ý:</strong></p>
        <ul style="line-height: 1.8;">
          <li>Vì dữ liệu của ứng dụng được lưu vào trình duyệt web, nên nếu thầy cô xóa lịch sử trình duyệt hoặc cài lại máy tính có thể gây ra mất dữ liệu. Vì thế, thầy cô hãy thường xuyên xuất dữ liệu để lưu trữ!</li>

          <li>Trước khi cập nhật phiên bản mới, thầy cô xuất dữ liệu ra file để tránh bị lỗi dữ liệu.</li>

          <li>Khi có tính năng mới, thầy cô chỉ cần tải lại file cài đặt ở link trên. Thầy cô theo dõi Tiktok hoặc giữ liên lạc qua Zalo để cập nhật tính năng mới mình sẽ thông báo trên kênh nhé!</li>

          <li>Vui lòng không chia sẻ file cho người khác mà không có sự đồng ý của Nestora. Nếu vi phạm, email sẽ bị XÓA khỏi hệ thống. Thầy cô sẽ không được cập nhật tính năng mới nữa.</li>

          <li>Nếu có thắc mắc trong quá trình sử dụng, thầy cô liên hệ qua email: <a href="mailto:tinhocnestora@gmail.com" style="color: #4CAF50;">tinhocnestora@gmail.com</a> hoặc Zalo: <a href="tel:0559468839" style="color: #4CAF50;">0559 468 839</a>.</li>
        </ul>

        <p>Cảm ơn thầy cô. Chúc thầy cô có những tiết dạy thú vị.</p>
      </div>
    </body>
  </html>
`;

const textTemplate = (
  id: string
) => `Email của thầy cô đã được thêm vào hệ thống. Thầy cô hãy tải file tại đây: https://nestora.edu.vn/product/${id}

Thầy cô có thể xem hướng dẫn tải file tại đây: https://drive.google.com/file/d/1k9JzSz29uOSSqcbfcZlonNF5fAmp9TqP/view

Lưu ý:

- Vì dữ liệu của ứng dụng được lưu vào trình duyệt web, nên nếu thầy cô xóa lịch sử trình duyệt hoặc cài lại máy tính có thể gây ra mất dữ liệu. Vì thế, thầy cô hãy thường xuyên xuất dữ liệu để lưu trữ!

- Trước khi cập nhật phiên bản mới, thầy cô xuất dữ liệu ra file để tránh bị lỗi dữ liệu.

- Khi có tính năng mới, thầy cô chỉ cần tải lại file cài đặt ở link trên. Thầy cô theo dõi Tiktok hoặc giữ liên lạc qua Zalo để cập nhật tính năng mới mình sẽ thông báo trên kênh nhé!

- Vui lòng không chia sẻ file cho người khác mà không có sự đồng ý của Nestora. Nếu vi phạm, email sẽ bị XÓA khỏi hệ thống. Thầy cô sẽ không được cập nhật tính năng mới nữa.

- Nếu có thắc mắc trong quá trình sử dụng, thầy cô liên hệ qua email: tinhocnestora@gmail.com hoặc Zalo: 0559 468 839.

Cảm ơn thầy cô. Chúc thầy cô có những tiết dạy thú vị.`;

export const PRODUCT_MAP = PRODUCTS_CONFIG.reduce((acc, product) => {
  const productId = product.id;
  acc[productId] = {
    name: product.name,
    file: product.file,
    price: product.price,
    emailTemplate: emailTemplate(product.id),
    textTemplate: textTemplate(product.id),
  };
  return acc;
}, {} as Record<string, {
  name: string;
  file: string;
  price: number;
  emailTemplate: string;
  textTemplate: string;
}>);
