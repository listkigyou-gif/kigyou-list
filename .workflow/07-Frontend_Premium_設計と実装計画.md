# 🎨 HƯỚNG DẪN CHI TIẾT: THIẾT KẾ FRONTEND PREMIUM & SEO PROGRAMMATIC

Tài liệu này là cẩm nang hướng dẫn chi tiết cho **Bước 2: Xây dựng Giao diện Premium Frontend (Next.js 15)** cho dự án **Kigyou-list**. Hướng dẫn này đảm bảo việc tối ưu hóa giao diện (UI/UX), tốc độ tải trang (Core Web Vitals) và cấu trúc SEO tự động (Programmatic SEO) đạt tiêu chuẩn vượt trội so với các đối thủ như Musubu hay Baseconnect.

---

## 📐 1. Cấu hình Hệ thống Thiết kế (Design System - Tailwind CSS v4)

Chúng ta sử dụng **Tailwind CSS v4** đi kèm trong Next.js 15 để thiết lập một hệ thống giao diện tinh tế, hiện đại, đậm chất B2B SaaS Nhật Bản.

### A. Định nghĩa Bảng màu (Color Tokens)
*   `--primary` (`#1B4F8A` - Trust Blue): Xanh biển sâu đại diện cho sự tin cậy, chuyên nghiệp.
*   `--secondary` (`#00A896` - Energy Teal): Xanh ngọc lục bảo đại diện cho sự tăng trưởng, hoạt động tích cực.
*   `--accent` (`#F2A30F` - Gold Signal): Màu vàng cam mỏ neo cho Intent data và nhãn Premium.
*   `--neutral-light` (`#F8FAFC` - Slate Background): Màu nền xám nhạt hiện đại.
*   `--neutral-dark` (`#0D1117` - GitHub Dark): Màu nền tối sang trọng cho Dark Mode.

### B. Typography & Tiêu chuẩn Văn bản Nhật Bản
*   **Font chữ:** `"Noto Sans JP"` (Google Fonts) được tải qua `next/font/google`. Đây là font Gothic hiện đại, hiển thị sắc nét nhất trên cả Windows (loại bỏ răng cưa) và macOS/iOS/Android.
*   **Tỷ lệ giãn dòng (`line-height`):** Mặc định `1.7` cho tất cả văn bản chứa chữ Kanji giúp giao diện thoáng đãng, dễ đọc.
*   **Cỡ chữ trên Mobile:** Tối thiểu `16px` cho các ô input (`<input>`, `<select>`) để chặn đứng hành vi tự động phóng to (auto-zoom) gây khó chịu của trình duyệt Safari trên iPhone.

### C. Các lớp tiện ích đặc biệt (Custom Utility Classes)
*   `backdrop-blur-md` kết hợp với `opacity-50` để tạo ra hiệu ứng che mờ thông tin liên hệ (Email, FAX, Chi tiết tuyển dụng) một cách chân thực và hấp dẫn (Attractive Blur).
*   Hiệu ứng **Skeleton Loading animation** nhấp nháy mượt mà cho các card kết quả đang tải, tăng trải nghiệm tốc độ phản hồi.

---

## 🔍 2. Thiết kế Trang chủ & Faceted Search (Tìm kiếm đa chiều)

### A. Trang chủ (ホームページ - `/`)
Giao diện tập trung 100% vào việc tối đa hóa chuyển đổi (Conversion-focused):
1.  **Hero Section:** Tiêu đề H1 lớn, thu hút bằng chữ Kanji chuẩn văn phong Nhật: `500万社の企業データを、今すぐ無料で検索` (Tìm kiếm dữ liệu 5 triệu doanh nghiệp, hoàn toàn miễn phí ngay bây giờ).
2.  **Thanh tìm kiếm trung tâm:** Giao diện tối giản, bo tròn mềm mại, hỗ trợ tự động gợi ý.
3.  **Quick Filters (Chip tags):** Các nút bấm nhanh bên dưới thanh search: `#IT・通信`, `#東京都`, `#採用活動中`, `#補助金受給企業`.
4.  **Bảng số liệu động:** Đếm số lượng doanh nghiệp, tỉnh thành, ngành nghề chạy động để tạo ấn tượng mạnh mẽ cho khách vãng lai.

### B. Trang Tìm kiếm & Bộ lọc nâng cao (`/search`)
Giao diện lọc sâu đa chiều (Faceted Search) sử dụng kết nối trực tiếp đến SQLite qua Node.js native `node:sqlite` siêu tốc:
1.  **Bố cục Layout:**
    *   *Desktop:* Sidebar bên trái rộng `320px` cố định khi cuộn màn hình. Danh sách kết quả bên phải hiển thị dạng Grid Card hoặc Table.
    *   *Mobile:* Sử dụng một nút nổi **`[🔍 絞り込み]` (Floating Filter Button)** ở góc dưới bên phải. Khi nhấn sẽ kích hoạt **Bottom Drawer** trượt từ dưới lên, giúp người dùng thao tác lọc dễ dàng bằng một tay.
2.  **Bộ lọc 3 tầng (3-Tier Faceted Filters):**
    *   *Tầng 1 (Cơ bản):* Từ khóa, Tỉnh thành, Ngành nghề JSIC.
    *   *Tầng 2 (Nâng cao):* Slider Quy mô nhân sự (0-500+ người), Vốn điều lệ (Slider/Preset), Doanh thu.
    *   *Tầng 3 (Intent Signals):* Có tin tuyển dụng (HelloWork), vừa nhận trợ cấp (補助金), vừa trúng thầu (調達).

---

## 🏢 3. Thiết kế Trang chi tiết Công ty (`/company/[id]`)

Trang chi tiết là thỏi nam châm thu hút SEO (SEO Magnet) và là phễu dẫn dắt chuyển đổi người dùng trả phí.

### A. Cấu trúc Hồ sơ 360 độ
*   **Header:** Tên công ty lớn (H1), Huy hiệu Mã số pháp nhân (`法人番号`), trạng thái hoạt động (`活動中`).
*   **Phân quyền hiển thị thông tin:**
    *   *Mở công khai (Tối ưu SEO & Uy tín):* Địa chỉ, Số điện thoại (`電話番号`), Website URL chính thức.
    *   *Làm mờ hấp dẫn (Attractive Blur):* Số FAX, Email đại diện, chi tiết công việc của tin tuyển dụng, và chi tiết số tiền trợ cấp/đấu thầu.
    *   *Nút CTA thu hút:* `🔒 無料登録して tất cả thông tin` (Đăng ký miễn phí để mở khóa toàn bộ Email, FAX và chi tiết tín hiệu).
*   **Biểu đồ Tài chính 5 năm:**
    *   Vẽ biểu đồ lịch sử Doanh thu (`売上高`), Lợi nhuận (`経常利益`), Tổng tài sản trực quan bằng đồ họa SVG/CSS siêu nhẹ để Next.js render trực tiếp trên máy chủ (SSR), giúp trang tải tức thì và được Google Bot chấm điểm 100% Core Web Vitals.

### B. Tối ưu SEO Programmatic On-page
*   **Thẻ Meta tự động:**
    *   `Title`: `[Tên công ty]の企業情報・業績・電話番号 | Kigyou-list`
    *   `Description`: `[Tên công ty]（[Địa chỉ]）の企業 thông tin chi tiết. Cung cấp mã số thuế, vốn điều lệ, số lượng nhân viên, số điện thoại và website chính thức mới nhất.`
*   **Schema Markup (JSON-LD):** Nhúng trực tiếp Schema cấu trúc `Organization` hoặc `LocalBusiness` chứa đầy đủ tên, địa chỉ, mã số thuế pháp nhân để hiển thị Rich Snippets (ngôi sao, thông tin tóm tắt) nổi bật trên Google.
*   **Liên kết nội bộ (Internal Linking Matrix):**
    *   Cuối trang luôn hiển thị **同業他社 (Công ty cùng ngành)** và **近隣の企業 (Công ty cùng khu vực)** để giữ chân người dùng và giúp Google Bot lập chỉ mục toàn bộ website một cách tự động.

---

## 🛠️ 4. Sơ đồ Cấu trúc File triển khai Frontend

```text
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css          # Định nghĩa màu chủ đạo, font JP, lớp che mờ
│   │   ├── layout.tsx           # Tải Noto Sans JP, cấu hình metadata cơ sở
│   │   ├── page.tsx             # Trang chủ tối giản, ấn tượng, tối ưu chuyển đổi
│   │   ├── search/
│   │   │   └── page.tsx         # Trang Faceted Search (Sidebar lọc + Card Grid)
│   │   └── company/
│   │       └── [id]/
│   │           └── page.tsx     # Trang chi tiết 360 độ + Recharts SVG + Schema JSON-LD
│   └── lib/
│       └── db.ts                # Middleware kết nối node:sqlite trực tiếp lấy dữ liệu
```

---

> [!NOTE]
> Chiến lược này tập trung hoàn toàn vào 3 tiêu chí: **Thẩm mỹ Premium, Tốc độ tải trang dưới 1 giây, và Tối ưu hóa SEO tuyệt đối**.
> Việc sử dụng tính năng `node:sqlite` tích hợp sẵn trong Node.js 22 giúp hệ thống truy vấn 5,000 bản ghi nội bộ trong chưa đầy 1 mili-giây, mang lại hiệu năng tìm kiếm tức thì mà không cần cài đặt thêm server phức tạp trong giai đoạn phát triển này.
