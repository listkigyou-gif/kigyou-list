# Quy Tắc Vận Hành Chung Cho Tác Nhân AI (General Agent Guardrails)

Quy tắc này áp dụng tự động cho mọi tác nhân và subagent trong dự án `kigyou-list`.

---

## 1. Bảo Vệ Dữ Liệu & Phiên Làm Việc (Data & Session Protection)
- **Tuyệt đối không xóa:** Không xóa các tệp cơ sở dữ liệu (`kigyou-list.db`, `hellowork.db`), dữ liệu gốc trong `importdata/` và 7 thư mục phiên làm việc của trình duyệt (`.x_user_profile`, `.facebook_user_profile`, `.linkedin_user_profile`, `.valuepress_user_profile`, `.note_user_profile`, `.zenn_user_profile`, `.free_pressrelease_user_profile`).
- Các thư mục user profile trên chứa toàn bộ cookies và phiên đăng nhập đã xác thực để tự động đăng bài lên mạng xã hội/báo chí.

## 2. Tự Hành & Tối Ưu Tốc Độ (Autonomous & Zero-Friction Execution)
- Khi người dùng đưa ra câu lệnh viết bài, xuất bản, cào dữ liệu, hoặc sửa lỗi, tác nhân tự động thực hiện quy trình end-to-end từ A-Z, không dừng lại hỏi xin duyệt từng bước nhỏ trung gian.
- Phản hồi ngắn gọn, tập trung vào kết quả hành động và đường dẫn tệp tin liên quan.

## 3. Chống Rác Ổ Đĩa & Tràn Bộ Nhớ (Zero Disk Churn)
- Không lưu ảnh chụp màn hình kiểm thử tạm (`.png`) trực tiếp vào thư mục gốc hoặc `scripts/`. Các ảnh tạm thời phải được lưu vào `scratch/` hoặc tự động dọn dẹp sau khi xác nhận trạng thái.
- Các script cào dữ liệu hoặc gửi form phải có cơ chế giới hạn số lượng mẫu lưu trữ (`max_samples <= 50`) để tránh làm phình ổ cứng.

## 4. Thông Số Sản Phẩm & Gói Miễn Phí Chuẩn Xác (Product Truth & Free Tier)
- **Gói Miễn Phí (フリープラン / Free Tier):**
  - **Tải CSV:** Tối đa **20 CSV / ngày** (tương đương khoảng **600 CSV / tháng**).
  - **Thời hạn:** Hoàn toàn miễn phí trọn đời (**永久無料**), không yêu cầu thẻ tín dụng.
  - **Tra cứu:** Tìm kiếm, xem chi tiết và lọc không giới hạn trên toàn bộ 5 triệu doanh nghiệp.
- **Gói Trả Phí (Standard / Premium):**
  - Khuyến mãi tháng đầu: **1,260円** (giảm 70% từ 4,200円), không ràng buộc hợp đồng năm.
- **Lưu ý bộ nhớ:** Tuyệt đối không dùng con số cũ (50 CSV/tháng). Luôn luôn dùng thông số chuẩn: **20 CSV/ngày (khoảng 600 CSV/tháng)** trong mọi nội dung PR, marketing, bài viết đa kênh.

## 5. Chuẩn Hóa Thương Hiệu & Tên Miền Tuyệt Đối (Domain & Brand Integrity)
- **Tên miền chính thức duy nhất:** **`https://kigyoulist.com`** (viết liền, không có dấu gạch ngang giữa `kigyou` và `list` trong tên miền URL).
- **Tên thương hiệu chính thức:** **`Kigyou-list`** (tiếng Anh) hoặc **`Kigyou-list（kigyoulist.com）`** (khi chú thích domain).
- **TUYỆT ĐỐI NGHIÊM CẤM:**
  - ❌ **CẤM** viết hoặc dùng tên miền giả định: `企業リスト.com` (ĐÂY LÀ SAI HOÀN TOÀN, không tồn tại domain này của dự án).
  - ❌ **CẤM** viết domain dạng có gạch nối: `kigyou-list.com` hay `Kigyou-list.com`. Tên miền 100% chuẩn phải là **`kigyoulist.com`**.
  - Mọi báo cáo, modal in ấn (PDF/A4), email OTP, chân trang bản quyền, bài đăng mạng xã hội (Note, Qiita, Zenn, Facebook, X, PR) và Schema JSON-LD bắt buộc phải tuân thủ chuẩn xác **`kigyoulist.com`** và **`Kigyou-list`**.

## 6. Bộ Nhớ Bất Biến: Chiến Lược Sitemap & Tránh Lỗi Phân Mảnh (Sitemap & Zero Dilution Protocol)
- **CẤM NỘP LẺ CÁC SITEMAP CON**: Tuyệt đối **KHÔNG nộp các file sitemap con phân mảnh rời rạc** (`sitemap/0.xml` đến `sitemap/9.xml` hay `sitemap/46.xml`) trực tiếp lên Google Search Console. 
  - *Lý do*: Trước đây từng thử nộp phân mảnh lẻ tẻ dẫn đến lỗi Pending, cảnh báo lỗi và phân tán sự chú ý của bot.
  - *Quy chuẩn*: **Chỉ nộp DUY NHẤT 1 Master Sitemap Index: `https://kigyoulist.com/sitemap.xml`**. File mẹ này tự động khai báo `sitemap/core.xml` (Hub cốt lõi) và các phân nhánh con `0.xml` -> `46.xml` để bot Google/Bing tự động đọc theo phân cấp chuẩn.
- **100% CRAWL BUDGET CHO THỊ TRƯỜNG NHẬT BẢN (`ja`)**:
  - Không bao giờ đưa URL đa ngôn ngữ (`/en`, `/vi`) vào Sitemap nộp cho công cụ tìm kiếm.
  - Khách hàng B2B tra cứu doanh nghiệp tại Nhật tìm kiếm 100% bằng tiếng Nhật. Các trang `/en` và `/vi` chỉ tồn tại phục vụ người dùng ngoại quốc qua thẻ `hreflang`, loại bỏ hoàn toàn khỏi sitemap để tránh pha loãng tài nguyên cào của Googlebot.
- **BỘ LỌC THIN CONTENT GUARD (`richnessScore >= 3`)**:
  - Tuyệt đối không nộp sitemap hay lập chỉ mục cho các công ty "vỏ bọc" rác/rỗng dữ liệu (chỉ có tên và mã số thuế từ Quốc thuế).
  - Chỉ đưa vào sitemap những công ty đạt chuẩn chất lượng: có Hotline, Website chính thức, Giấy phép kinh doanh, Hóa đơn Invoice T-Number, Tuyển dụng HelloWork, hoặc Báo cáo tài chính EDINET (~463,800 công ty tinh hoa trong bảng `sitemap_companies`).

## 7. Bộ Nhớ Bất Biến: Vận Hành Crawler, Indexing Tuyển Dụng & Làm Giàu Dữ Liệu
- **Chu kỳ Bắn API Indexing Tự Động (Nightly Mega-Batch at 02:00 AM JST)**:
  - Khi cào được tin tuyển dụng HelloWork mới, **không bắn API tức thì ngay từng giây** để tránh làm nghẽn CPU/Nginx và bảo toàn hạn mức (Google chỉ cho 1,000 URLs/ngày qua cụm 5 keys).
  - Hệ thống tự động gom vào chu kỳ ban đêm: **02:00 AM JST (Bing IndexNow 5,000 URLs)** và **02:15 AM JST (Google VIP 1,000 URLs)** theo mô hình Trục bánh xe (Hub & Spoke).
  - Biến động tuyển dụng HelloWork được gán mức ưu tiên cao nhất **75 điểm** trong bộ lọc Hot Delta 48h.
- **Quy Chuẩn Làm Giàu Dữ Liệu B2B (Conflict Resolution Precedence)**:
  - Trường `manually_locked_fields` (Admin duyệt / Chủ DN Claim): 100% bất biến, bot tuyệt đối **KHÔNG ghi đè**.
  - Nếu công ty chưa có dữ liệu: Tự động bổ sung Website, Phone, FAX, Email, Đại diện, Nhân sự, Vốn điều lệ và kích hoạt cờ boolean (`has_website`, `has_phone`, `has_fax`, `has_email`, `has_hiring`).
  - Nếu công ty đã có dữ liệu: **Bảo tồn domain gốc của Website**, bảo tồn số tổng đài chính ở `phone_number` và lưu số HelloWork vào chi nhánh/bộ phận tuyển dụng.
- **Nghỉ Ngơi Thông Minh & Chống Chặn (Smart Adaptive Rest & Maintenance Resilience)**:
  - Ban đêm (22:00 - 06:00 JST) và Cuối tuần: Tự động ngủ 30–45 phút sau mỗi chu kỳ 47 tỉnh.
  - Ban ngày: Giữ nhịp cào 8.0s – 15.0s/request; nghỉ 5–15 phút sau mỗi chu kỳ.
  - Phát hiện bảo trì HelloWork (503/502 hoặc từ khóa `ただいまメンテナンス中`): Tự động ngủ 10–15 phút, tuyệt đối không spam request.
