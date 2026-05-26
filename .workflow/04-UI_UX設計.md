# Hướng dẫn: Chức năng và Giao diện Người dùng (UI/UX設計)

Tài liệu này định nghĩa các tính năng và tiêu chuẩn thiết kế giao diện cho hệ thống **Kigyou-list**.

---

## 1. Yêu cầu Tiên quyết (Core Requirement)
*   **Ngôn ngữ:** Giao diện hiển thị 100% bằng **Tiếng Nhật** ở phiên bản đầu tiên để tối ưu hóa thời gian phát triển và chiếm lĩnh thị trường nội địa. Mọi nhãn (label), thông báo lỗi (error message), placeholder đều phải được viết chuẩn văn phong doanh nghiệp Nhật Bản (Keigo/Teineigo). Phiên bản tiếng Anh sẽ được thêm vào ở giai đoạn tiếp theo để mở rộng quy mô quốc tế.

---

## 2. Tính năng Cốt lõi (Core Features)

### A. Công cụ Tìm kiếm & Bộ lọc (詳細検索)
Trái tim của hệ thống là công cụ lọc dữ liệu doanh nghiệp đa chiều dành cho Sales/Marketers. Website cho phép lọc cực sâu theo các tiêu chí sau:

*   **Bộ lọc Cơ bản (Basic Filters) - Khách vãng lai & Free Member:**
    *   `業界` (Ngành nghề - Theo danh mục chuẩn JSIC).
    *   `地域` (Khu vực - Theo 47 tỉnh thành).
    *   `設立年度` (Năm thành lập).
    *   `従業員数` (Số lượng nhân viên).
    *   `売上高` (Doanh thu).
    *   `資本金` (Vốn điều lệ).
*   **Bộ lọc Nâng cao (Advanced Filters) - Cần đăng ký tài khoản:**
    *   `市区町村` (Quận/Huyện - Chỉ hiển thị sau khi chọn tỉnh).
    *   `代表者名` (Tên giám đốc/người đại diện).
    *   `ステータス` (Lọc các doanh nghiệp đang hoạt động `活動中`).
*   **Bộ lọc Tín hiệu (Intent Data Filters) - DÀNH CHO PHIÊN BẢN TRẢ PHÍ (Trial/Pro):**
    *   `採用シグナルあり` (Có tín hiệu tuyển dụng - Data từ HelloWork).
    *   `購買シグナルあり` (Có tín hiệu mua hàng/tăng trưởng: nhận trợ cấp, đấu thầu, bằng sáng chế - Data từ G-Biz).

---

### B. Hồ sơ Doanh nghiệp 360 độ (企業詳細プロフィール)
Trang chi tiết của mỗi công ty cần hiển thị đầy đủ thông tin nhất có thể để Sales nghiên cứu trước khi gọi. 
**Lưu ý SEO:** Mỗi công ty sẽ được tự động tạo ra một trang riêng biệt (Dedicated Page) với URL thân thiện dạng `/company/[corporate_number]` (Ví dụ: `kigyoulist.com/company/1234567890123`).

*   **基本情報 (Thông tin cơ bản):** Tên công ty, Mã số pháp nhân (`法人番号`), Địa chỉ (`登記住所`), Ngày thành lập, Vốn điều lệ, Doanh thu, Tên người đại diện.
*   **連絡先 (Thông tin liên hệ - Quy định phân quyền hiển thị):**
    *   `電話番号` (Số điện thoại) và `WebサイトURL` (Website): **Hiển thị công khai** cho tất cả người dùng (bao gồm khách vãng lai) để tăng uy tín, hỗ trợ Sales tra cứu nhanh và tối ưu hóa SEO.
    *   `FAX番号` (Số Fax) và `メールアドレス` (Email): **Làm mờ (Blur)**. Yêu cầu đăng ký tài khoản miễn phí để mở khóa.
*   **求人情報 (Tin tuyển dụng):** Hiển thị các vị trí đang tuyển dụng lấy từ HelloWork.
*   **インテントシグナル (Tín hiệu mua hàng/Trợ cấp):** Hiển thị dòng sự kiện lịch sử đấu thầu, trợ cấp của G-Biz.
*   **財務情報履歴 (Lịch sử Tài chính):** Vẽ biểu đồ trực quan (Recharts) lịch sử doanh thu và lợi nhuận 5 năm gần nhất.

---

### C. Quản lý Danh sách (リスト管理 - ABM Dashboard)
*   **Khách Đăng ký miễn phí (Free Member):** Cho phép tạo `マイリスト` (My List) để lưu trữ tối đa 100 doanh nghiệp tiềm năng vào bảng điều khiển cá nhân (Dashboard ABM).
*   **Khách Trả phí (Trial & Pro):** Không giới hạn số lượng công ty lưu trữ.
*   **Kanban Board:** Tính năng đánh giá và quản lý trạng thái tiếp cận Sales: `未連絡` (Chưa liên hệ) ➔ `連絡済み` (Đã liên hệ) ➔ `商談中` (Đang thương lượng) ➔ `成約` (Đã chốt).
*   **Xuất file (CSV Export):** Chỉ cho phép khách hàng trả phí xuất dữ liệu ra file CSV phục vụ công tác Sales. Khách miễn phí/vãng lai không được phép tải file.

---

## 3. Tiêu chuẩn Thẩm mỹ (Design Aesthetics)
*   **Premium & Clean:** Giao diện cần tạo cảm giác chuyên nghiệp, đắt tiền. Sử dụng bảng màu xanh dương tin cậy (`#1B4F8A`) làm màu chủ đạo kết hợp ngọc lục bảo (`#00A896`) cho các tín hiệu và nút hành động.
*   **Tốc độ (Speed):** Tối ưu hóa UI để thao tác tìm kiếm trả về kết quả ngay lập tức (Instant Search) bằng Meilisearch/Typesense. Hạn chế giật lag khi tải hàng ngàn kết quả.
*   **Responsive:** Hoạt động hoàn hảo trên Màn hình PC (vì đối tượng người dùng chính là Sales ngồi văn phòng), đồng thời tối ưu hóa tuyệt đối cho Mobile-First (sử dụng Bottom Sheets cho các bộ lọc, touch target ≥ 48px, cỡ chữ tối thiểu 16px để chống auto-zoom trên iOS).
