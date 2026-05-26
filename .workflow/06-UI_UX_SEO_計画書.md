# 🏆 Kigyou-list: Chiến lược Thiết kế UI/UX & SEO Toàn Diện (Chi tiết)

Tài liệu này lưu trữ toàn bộ chiến lược, thiết kế giao diện UI/UX và giải pháp SEO Programmatic cho dự án **Kigyou-list** (Nền tảng dữ liệu doanh nghiệp Nhật Bản). Mục tiêu là xây dựng một hệ thống tối ưu hóa vượt trội so với các đối thủ mạnh tại Nhật Bản như Musubu, Baseconnect và SalesNow.

---

## 📊 1. Phân Tích Đối Thủ & Khác Biệt Cốt Lõi (Competitor Analysis)

### Bảng so sánh các đối thủ chính tại thị trường Nhật Bản

| Tiêu chí | **Musubu** | **Baseconnect** | **SalesNow** | **→ Kigyou-list (Mục tiêu)** |
| :--- | :--- | :--- | :--- | :--- |
| **Số lượng công ty** | ~400 vạn | ~340 vạn | ~300 vạn | **500 vạn+ (Full G-Biz + HelloWork)** |
| **Intent Signal** | Tuyển dụng + Tin tức | Tuyển dụng | Hạn chế | **Tuyển dụng + Trợ cấp + Đấu thầu + Bằng sáng chế** |
| **Lịch sử Tài chính** | ✅ Cơ bản | ✅ Cơ bản | ✅ | **✅ Lịch sử 5 năm + Biểu đồ động** |
| **Giá cả** | ~¥30,000/tháng | ~¥20,000/tháng | ~¥15,000/tháng | **Freemium + Hệ thống mỏ neo cực rẻ** |
| **Mobile UX** | ⚠️ Trung bình | ⚠️ Trung bình | ⚠️ Trung bình | **✅ Tối ưu Mobile-First** |
| **SEO Programmatic** | ⚠️ Yếu | ⚠️ Yếu | ⚠️ Yếu | **✅ Tối ưu hóa hàng triệu URL tự động** |
| **AI Search/Tagging**| ❌ Chưa có | ❌ Chưa có | ❌ Chưa có | **✅ Phân loại ngành JSIC tự động bằng AI** |

### Lợi thế cạnh tranh độc quyền (Unfair Advantage) của chúng ta:
1. **Dữ liệu Intent Data siêu sâu:** Tích hợp cả G-Biz (Trợ cấp, Đấu thầu, Bằng sáng chế) cùng HelloWork (Tin tuyển dụng thực tế).
2. **SEO Programmatic quy mô lớn:** Tự động tạo và index hơn 5 triệu trang tĩnh, chiếm lĩnh từ khóa tìm kiếm tên doanh nghiệp và thông tin liên hệ.
3. **Mô hình Freemium 4 tầng thông minh:** Thu hút lượng lớn khách vãng lai bằng cách hiển thị các thông tin cơ bản công khai (bao gồm SĐT và Website), sau đó làm mờ (Blur) FAX, Email và Intent Signals để dẫn dắt họ đăng ký tài khoản (Free Member) hoặc nâng cấp lên gói trả phí (Trial/Pro) để tải dữ liệu.
4. **Mobile-First thực sự:** Thiết kế tối ưu hóa cho di động trước, giúp nhân viên Sales dễ dàng sử dụng mọi lúc mọi nơi.

---

## 🎨 2. Hệ Thống Thiết Kế UI/UX (Design System)

Để tạo ra trải nghiệm Premium, đáng tin cậy (Chuẩn B2B SaaS Nhật Bản), chúng ta tuân thủ hệ thống thiết kế dưới đây:

### A. Bảng màu (Color Palette - Trust & Energy)
*   **Primary (Trust Blue):** `#1B4F8A` (Xanh đại dương đậm - Tạo sự tin cậy tuyệt đối, chuyên nghiệp).
*   **Secondary (Energy Teal):** `#00A896` (Xanh ngọc - Biểu thị tín hiệu tăng trưởng, hoạt động tích cực).
*   **Accent (Gold Signal):** `#F2A30F` (Vàng cam - Dành cho Intent data, huy hiệu Premium).
*   **Background (Light):** `#F8FAFC` (Nền xám trắng sáng sạch sẽ).
*   **Surface (Card):** `#FFFFFF` (Màu trắng của các thẻ nội dung).
*   **Dark Mode Background:** `#0D1117` (Màu xám tối chuẩn phong cách GitHub).
*   **Text Primary:** `#1A1A2E` (Màu chữ đen xanh dễ đọc).
*   **Text Secondary:** `#6B7280` (Màu xám cho nhãn và mô tả phụ).

### B. Typography & Font chữ
*   **Font Tiếng Nhật:** `"Noto Sans JP"` (Google Fonts) - Font chữ Gothic hiện đại, hiển thị sắc nét nhất trên cả macOS, Windows, iOS và Android.
*   **Line-height:** `1.7` (Tỷ lệ hoàn hảo giúp người dùng Nhật Bản đọc chữ Kanji không bị mỏi mắt).
*   **Font Mono (Số liệu):** `"JetBrains Mono"` hoặc `"Inter"` dành cho mã số pháp nhân (法人番号) và doanh thu, số điện thoại để căn chỉnh đẹp mắt.

### C. Grid & Responsive Layout
*   **Mobile (<768px):** 4-column grid, margin `16px`. Touch targets tối thiểu `48x48px` cho mọi nút bấm.
*   **Tablet (768px - 1024px):** 8-column grid, margin `24px`.
*   **Desktop (>1024px):** 12-column grid, max-width `1280px` để cân đối layout.

---

## 🏗️ 3. Kiến Trúc 5 Trang Chính (Page Architecture)

---

### 📄 TRANG 1: TRANG CHỦ (ホームページ)
Thiết kế tập trung vào việc chuyển đổi khách truy cập vãng lai thành user đăng ký (Conversion-focused).

*   **Hero Section:**
    *   Tiêu đề lớn (H1): `500万社の企業データを、今すぐ無料で検索` (Tìm kiếm dữ liệu 5 triệu doanh nghiệp, hoàn toàn miễn phí ngay bây giờ).
    *   Thanh tìm kiếm (Search Bar) thông minh, hỗ trợ Instant Search (Gợi ý ngay khi gõ).
    *   Các Chip lọc nhanh bên dưới: `#IT・通信`, `#東京都`, `#採用活動中`, `#補助金受給企業`.
*   **Stats Counter Section:** Hiển thị quy mô dữ liệu bằng các con số nhảy động: `5,000,000+ Doanh nghiệp | 47 Tỉnh thành | 99 Ngành nghề`.
*   **Feature Grid (3 Columns):**
    1.  `詳細検索` (Tìm kiếm chi tiết bằng bộ lọc sâu).
    2.  `財務分析` (Xem biểu đồ tài chính 5 năm trực quan).
    3.  `インテントシグナル` (Theo dõi tuyển dụng, đấu thầu, trợ cấp).

---

### 📄 TRANG TÌM KIẾM & BỘ LỌC CHUYÊN SÂU (詳細検索ページ)
Trái tim của hệ thống dành cho nhân viên Sales và Marketing.

#### Thiết kế Layout:
*   **Desktop:** Sidebar bên trái (rộng 300px, cố định khi scroll) chứa bộ lọc. Bảng kết quả bên phải dạng Card Grid hoặc Table.
*   **Mobile:** Nút Floating Action Button (FAB) `[🔍 絞り込み]` nổi ở góc dưới bên phải. Khi chạm vào sẽ mở ra **Bottom Sheet / Drawer** toàn màn hình để chọn bộ lọc thân thiện với một tay.

#### Hệ thống lọc 3 tầng (3-Tier Faceted Filters):
1.  **Tier 1: Bộ lọc cơ bản (Luôn hiển thị)**
    *   `キーワード検索` (Từ khóa: Tên công ty, ngành nghề...)
    *   `業界 (JSIC)` (Ngành nghề đa cấp chuẩn Nhật).
    *   `地域` (Tỉnh thành từ 1 đến 47).
    *   `従業員数` (Số lượng nhân viên - Dạng Slider + preset).
2.  **Tier 2: Bộ lọc nâng cao (Thu gọn mặc định - Click để mở rộng)**
    *   `売上高` (Doanh thu năm gần nhất).
    *   `資本金` (Vốn điều lệ).
    *   `設立年度` (Năm thành lập).
    *   `ステータス` (Trạng thái: Chỉ hiển thị doanh nghiệp đang hoạt động `活動中`).
3.  **Tier 3: Bộ lọc Tín hiệu tăng trưởng (Intent Signals - Khóa Premium 🔑)**
    *   `採用シグナルあり` (Đang tuyển dụng - HelloWork).
    *   `補助金受給あり` (Vừa nhận trợ cấp chính phủ).
    *   `調達・入札実績あり` (Có trúng thầu công vụ).
    *   `特許出願あり` (Có bằng sáng chế mới).

---

### 📄 TRANG CHI TIẾT CÔNG TY (企業詳細プロフィール)
Trang cung cấp thông tin 360 độ về một doanh nghiệp cụ thể, đồng thời đóng vai trò là nam châm thu hút SEO (SEO Magnet).

*   **Thông tin Header:** Tên công ty (H1), Mã số pháp nhân (`法人番号`), Tỉnh thành, Nhãn trạng thái hoạt động.
*   **Cơ chế chuyển đổi (Freemium Conversion Funnel):**
    *   **Hiển thị tự do (Khách vãng lai):** Tên công ty, Địa chỉ đăng ký, Quy mô nhân sự, Vốn điều lệ, Biểu đồ tài chính, **Số điện thoại (`電話番号`) và Link Website chính thức (`website_url`)** (vì các thông tin này công khai ở các trang khác, việc hiển thị tự do giúp tăng SEO và độ tin cậy).
    *   **Làm mờ (Blur) + Khóa thông tin liên hệ:** Số FAX, Email đại diện, chi tiết đơn tuyển dụng cụ thể (HelloWork) và các tín hiệu mua hàng chi tiết (Intent Signals) sẽ bị làm mờ.
    *   **Nút CTA nổi bật:** `🔒 無料登録してすべての情報を表示` (Đăng ký tài khoản miễn phí để sử dụng Dashboard ABM và mở khóa FAX, Email, chi tiết tuyển dụng/trợ cấp).
*   **Biểu đồ động (Interactive Charts):** Dùng thư viện Recharts để vẽ biểu đồ đường (Line/Area Chart) biểu diễn Doanh thu (`売上高`), Lợi nhuận thường niên (`経常利益`), Lợi nhuận sau thuế (`当期純利益`) và Tổng tài sản trong 5 năm gần nhất.

---

### 📄 TRANG DANH MỤC (カテゴリ・一覧ページ)
Đánh vào các từ khóa đuôi dài (Long-tail Keywords) có tỷ lệ chuyển đổi B2B cực cao.
*   **Cấu trúc URL:** `/industry/[mã-ngành]/location/[mã-tỉnh]`
*   **Ví dụ:** `/industry/it/location/tokyo` (Danh sách các công ty CNTT tại Tokyo).
*   **Tiêu đề tối ưu SEO:** `東京都のIT・通信企業一覧（2026年最新） | Kigyou-list`
*   **Nội dung:** Chứa đoạn mô tả ngắn tối ưu SEO về ngành nghề tại khu vực, danh sách top 20-50 công ty tiêu biểu (kèm link nội bộ dẫn về trang chi tiết công ty).

---

### 📄 TRANG QUẢN LÝ DANH SÁCH (ABM Dashboard)
Tính năng dành cho khách hàng đăng ký thành viên để lưu trữ và quản lý khách hàng tiềm năng.
*   **MyList (マイリスト):** Tạo các danh mục lưu trữ riêng (Ví dụ: "Khách hàng Tokyo", "Khách hàng tuyển dụng"). Hạn mức lưu trữ tối đa 100 công ty cho tài khoản miễn phí và không giới hạn cho các gói trả phí.
*   **Kanban Board:** Kéo thả trạng thái tiếp cận Sales: `未連絡` (Chưa liên hệ) ➔ `連絡済み` (Đã liên hệ) ➔ `商談中` (Đang thương lượng) ➔ `成約` (Đã chốt).
*   **Xuất dữ liệu (Chỉ áp dụng với gói Trả Phí):** Nút `CSVダウンロード` để xuất toàn bộ danh sách đã lọc phục vụ chạy quảng cáo hoặc Sales offline. Khách miễn phí/vãng lai không được phép xuất file.

---

## 🔍 4. Chiến Lược Tối Ưu Hóa SEO Programmatic (Thân thiện với Google)

Để trang web tự động leo Top index của Google Nhật Bản mà không tốn chi phí viết bài thủ công:

### A. Cấu trúc URL thân thiện (Programmatic URLs)
*   **Trang công ty:** `domain.com/company/[法人番号]` (Ví dụ: `domain.com/company/1234567890123`).
*   **Trang ngành nghề:** `domain.com/industry/[industry_code]`.
*   **Trang khu vực:** `domain.com/location/[prefecture_code]`.
*   **Trang kết hợp:** `domain.com/industry/[industry_code]/location/[prefecture_code]`.

### B. Tự động hóa Metadata On-page
Mỗi khi một trang công ty được tạo ra, hệ thống tự động sinh các thẻ Meta dựa trên dữ liệu database:
```html
<title>[Tên công ty]の企業情報・業績・電話番号 | Kigyou-list</title>
<meta name="description" content="[Tên công ty]（[Địa chỉ đầy đủ]）の企業 thông tin chi tiết. Cung cấp mã số thuế, vốn điều lệ, số lượng nhân viên, lịch sử tài chính và thông tin tuyển dụng mới nhất.">
<link rel="canonical" href="https://domain.com/company/[Mã pháp nhân]" />
```

### C. Cấu trúc dữ liệu có cấu trúc (Schema Markup JSON-LD)
Nhúng trực tiếp mã JSON-LD chuẩn `Organization` hoặc `LocalBusiness` vào mã nguồn HTML để hiển thị Rich Snippets (ngôi sao, địa chỉ, thông tin nổi bật) trên trang tìm kiếm Google:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "五洋建設株式会社",
  "taxID": "1234567890123",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "文京区後楽",
    "addressRegion": "東京都",
    "postalCode": "1128628",
    "addressCountry": "JP"
  },
  "numberOfEmployees": 2500,
  "foundingDate": "1950-04-01"
}
```

### D. Chiến lực liên kết nội bộ tự động (Internal Linking) & Bài viết AI
Để Google Bot dễ dàng thu thập hết hơn 5 triệu trang mà không bị sót:
*   Cuối trang của Công ty A luôn hiển thị:
    *   **同業他社 (Công ty cùng ngành):** Link đến 5 công ty khác có cùng mã ngành JSIC.
    *   **近隣の企業 (Công ty cùng khu vực):** Link đến 5 công ty có địa chỉ lân cận.
*   **Sitemap phân mảnh (Sitemap Indexing):** Chia nhỏ sitemap thành các file chứa tối đa 50,000 URLs và khai báo trong file `sitemap-index.xml`.
*   **Hệ thống AI tự động viết bài Blog:** Tích hợp script gọi LLM API tự động nghiên cứu xu hướng tuyển dụng, tin tức doanh nghiệp, cập nhật chế độ trợ cấp tại Nhật để tự động xuất bản 2-3 bài viết blog chuẩn SEO chất lượng cao mỗi tuần, kéo mạnh Organic traffic về hệ thống.

---

## 📱 5. Tối Ưu Hóa Trải Nghiệm Mobile (Mobile-First UX Rules)

Vì hơn 90% người dùng truy cập bằng thiết bị di động, giao diện phải đáp ứng các tiêu chuẩn khắt khe sau:
1.  **Chống Auto-Zoom trên iOS:** Tất cả font size của thẻ `<input>` trên thiết bị di động phải đặt tối thiểu là `16px` để tránh Safari tự phóng to màn hình khi gõ.
2.  **Sử dụng Tab ngang dạng cuộn (Scrollable Tabs):** Các thanh tab menu điều hướng trên Mobile sẽ hiển thị dạng hàng ngang có thể vuốt (Swipe) kéo ngang để tránh chiếm dụng chiều cao màn hình.
3.  **Skeleton Loading:** Hiển thị các khung xám nhấp nháy mô phỏng cấu trúc card đang tải, mang lại cảm giác tải trang nhanh hơn thực tế.
4.  **Sticky Header & Bottom Navigation:**
    *   Thanh tìm kiếm trên Mobile sẽ được đính (Sticky) ở đầu trang khi scroll.
    *   Nút chuyển đổi trang hoặc mở bộ lọc sẽ được đặt ở phần dưới cùng trong tầm với của ngón tay cái.

---

## 🗺️ 6. Lộ Trình Triển Khai 5 Giai Đoạn (Roadmap)

1.  **Phase 1 — MVP Foundation:** Cài đặt Next.js, cấu hình Tailwind, Fonts chuẩn Nhật, Trang chủ và tìm kiếm cơ bản.
2.  **Phase 2 — Core Pages:** Trang chi tiết doanh nghiệp, tích hợp biểu đồ Recharts, trang danh mục ngành nghề, nhúng dữ liệu Schema Markup.
3.  **Phase 3 — SEO & Advanced Filters:** Tạo sitemap index tự động cho 5 triệu trang, cài đặt liên kết nội bộ tự động, kích hoạt bộ lọc nâng cao.
4.  **Phase 4 — Premium & Monetization:** Tích hợp xác thực tài khoản, cơ chế Blur thông tin liên hệ, ABM Kanban board, chức năng xuất CSV.
5.  **Phase 5 — Performance & Polish:** Kiểm tra tối ưu Core Web Vitals, làm mượt các hiệu ứng chuyển động, hỗ trợ chế độ Dark Mode.

---

## 💡 7. Mô Hình Kinh Doanh & Phân Cấp (Monetization Strategy)

Hệ thống áp dụng mô hình kinh doanh phân cấp rõ ràng kèm theo hiệu ứng giá mỏ neo để kích thích tỷ lệ chuyển đổi:

### A. Khách Vãng Lai (Guest - Không đăng ký tài khoản)
*   **Quyền lợi:** Tìm kiếm không giới hạn bằng bộ lọc cơ bản.
*   **Hiển thị:** Xem thông tin cơ bản, **bao gồm Số điện thoại và Website chính thức** (vì đây là dữ liệu công khai trên internet, giúp tăng uy tín và SEO cho trang web).
*   **Hạn chế:** 
    *   Bị ẩn/Blur: FAX, Email, chi tiết tín hiệu (Intent Signals).
    *   Không có quyền truy cập vào Dashboard ABM.
    *   **Không cho phép tải xuống (download) file dữ liệu dưới bất kỳ hình thức nào.**

### B. Khách Đăng Ký Tài Khoản Miễn Phí (Free Member)
*   **Quyền lợi:** 
    *   Mở rộng thêm một số quyền lợi xem chi tiết doanh nghiệp.
    *   Được cấp quyền truy cập vào **Dashboard ABM (Bảng điều khiển cá nhân)**.
    *   Được phép tạo danh sách theo dõi cá nhân (`マイリスト`) để lưu trữ tối đa 100 doanh nghiệp tiềm năng.
*   **Hạn chế:** Không cho phép tải file dữ liệu xuống.

### C. Gói Dùng Thử (Trial Tier)
*   **Cước phí:** **¥2,900 / tháng** (Giá gốc mỏ neo: ~~¥29,000 / tháng~~ - Giảm giá mạnh tạo hiệu ứng thu hút người dùng đăng ký ngay).
*   **Quyền lợi:**
    *   Mở khóa toàn bộ thông tin liên hệ (Email, FAX).
    *   Truy cập đầy đủ bộ lọc tín hiệu Intent (Tuyển dụng, Trợ cấp, Đấu thầu, Bằng sáng chế).
    *   Cho phép lưu trữ không giới hạn doanh nghiệp vào MyList.
    *   Cấp hạn mức tải file dữ liệu xuống máy tính để quản lý (ví dụ: tối đa 500 records/tháng).

### D. Gói Chuyên Nghiệp (Pro Tier)
*   **Cước phí:** **¥29,000 / tháng** (Giá gốc mỏ neo: ~~¥99,000 / tháng~~ - Giảm giá đặc biệt cho doanh nghiệp cần khai thác nhiều).
*   **Quyền lợi:**
    *   Đầy đủ tính năng cao cấp như Gói dùng thử.
    *   Hạn mức tải xuống (download) file dữ liệu cực lớn (ví dụ: tối đa 10,000+ records/tháng).
    *   Hỗ trợ xuất báo cáo tài chính 5 năm hàng loạt dưới dạng PDF/Excel.

---

## 🛠️ 8. Các Quyết Định Kỹ Thuật Lớn đã Chốt (Technical Stack Approved)

1.  **Tên miền (Domain Name):** Chọn **`kigyoulist.com`**. Đây là tên miền rất đẹp, sạch sẽ, trùng khớp 100% với tên hệ thống `kigyou-list` và cực kỳ tối ưu cho nhận diện thương hiệu cũng như SEO tại Nhật Bản.
2.  **Hosting & Deploy:** Next.js deploy lên **Vercel** (Tokyo Edge Network). Database **Turso** (Serverless SQLite). Search Engine **Meilisearch** chạy trên VPS giá rẻ.
3.  **Đa ngôn ngữ (i18n):** Phiên bản đầu tiên tập trung 100% vào tiếng Nhật chuyên nghiệp để tối ưu thời gian phát triển và chiếm lĩnh thị trường nội địa. Sẽ thêm phiên bản tiếng Anh trong tương lai.

---

> [!NOTE]
> *Tài liệu này là cẩm nang thiết kế chính thức của dự án Kigyou-list. Mọi chỉnh sửa về giao diện, mã nguồn Frontend và cấu trúc URL SEO phải tham chiếu và tuân thủ các nguyên tắc đã được định nghĩa trong file này.*
