export const BANK_ACCOUNT = {
  accountName: "Pham Thi Tuyet Nhu",
  accountNumber: "0121000673395",
  nickName: "NESTORA",
  bankName: "Ngân hàng Vietcombank",
};

export interface Product {
  title: string;
  description: string;
  productId?: string;
  linkImage?: string;
  linkVideo?: string;
  price?: number;
}

export const products: Product[] = [
  {
    title: "Truy tìm ngôi vua",
    productId: "truy-tim-ngoi-vua",
    description: `
        👉 Ứng dụng quản lý điểm thưởng học sinh, tạo cảm giác thi đua trong lớp học.
        👉 Tải về sử dụng ngay không cần Internet, chạy được cho cả Window / Macbook.
        👉 Chỉ một file html duy nhất, không cần cài đặt, không sợ virus, giống như mở file PDF.
        👉 Quản lí được nhiều lớp học không giới hạn.
        👉 Nhập và xuất dữ liệu dễ dàng bằng file Excel.
        👉 Hỗ trợ đa ngôn ngữ: Tiếng Việt, Tiếng Anh. Phù hợp cho thầy cô dạy ngoại ngữ.
        👉 Khi ứng dụng cập nhật chức năng mới, thầy cô được cập nhật miễn phí nhé.
      `,
    linkVideo:
      "https://drive.google.com/file/d/1ID65smx92Zyt1Ws0fHXZ0u6e-ljdeyoq/view",
    linkImage: "/truy-tim-ngoi-vua.jpeg",
    price: 59000,
  },
  {
    title: "Chiến binh kim cương",
    description: "Coming Soon...",
  },
  {
    title: "Cung đấu",
    description:
      "Một phiên bản khác của Truy tìm ngôi vua nhưng phù hợp cho học sinh cấp 3 hơn. Hãy chờ nhé",
  },
  {
    title: "Kho bài giảng PPT",
    description: "Coming Soon...",
  },
];
