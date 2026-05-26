# Hướng dẫn: Chiến lược SEO (SEO戦略)

Tài liệu này định nghĩa chiến lược SEO tự động (Programmatic SEO) để thu hút lượng lớn traffic tự nhiên từ Google Nhật Bản. Mục tiêu là khi người dùng tìm kiếm thông tin về một công ty bất kỳ tại Nhật Bản, trang web **kigyoulist.com** sẽ lọt vào Top 3 kết quả tìm kiếm.

---

## 1. Cấu trúc URL Programmatic (プログラマティックURL構造)

Hệ thống sẽ tự động sinh ra hàng triệu trang web tĩnh dựa trên dữ liệu từ Database.

### A. Trang Hồ sơ Công ty (企業個別ページ)
*   **Mẫu URL:** `kigyoulist.com/company/[法人番号]` (Ví dụ: `kigyoulist.com/company/1234567890123`).
*   **Mẫu Tiêu đề (Title Tag):** `[商号または名称]の企業情報・業績・電話番号 | kigyoulist`
*   **Mẫu Mô tả (Meta Description):** `[商号または名称]（[登記住所]）の企業 thông tin chi tiết. Cung cấp mã số thuế, vốn điều lệ, số lượng nhân viên, số điện thoại và website chính thức mới nhất.`
*   **Chiến lược thu hút Lead & Phân quyền:**
    *   Trang hiển thị đầy đủ thông tin cơ bản kèm **Số điện thoại** và **Website chính thức** (giúp tăng index Google và tạo độ uy tín cao cho trang web).
    *   Các thông tin giá trị như **Số Fax, Email đại diện, chi tiết đơn tuyển dụng cụ thể và Intent signals** sẽ bị làm mờ (Blur) kèm theo nút Call-to-Action: **"無料登録してすべての情報を表示"** (Đăng ký tài khoản miễn phí để sử dụng Dashboard ABM và xem FAX, Email, chi tiết tuyển dụng/trợ cấp).

### B. Trang Danh mục Ngành nghề & Khu vực (カテゴリページ)
Đây là nguồn thu hút "Long-tail Keywords" cực kỳ hiệu quả cho mục đích B2B.
*   **Mẫu URL:** `kigyoulist.com/industry/[業種コード]/location/[都道府県コード]` (Ví dụ: `kigyoulist.com/industry/it/location/tokyo`).
*   **Mẫu Tiêu đề:** `東京都のIT・通信企業一覧（2026年最新） | kigyoulist`
*   **Nội dung:** Hiển thị danh sách top các công ty thuộc ngành đó tại khu vực đó, kèm theo tính năng lọc và bản đồ phân bố.

---

## 2. Kỹ thuật SEO On-page (内部SEO対策)

*   **Ngôn ngữ HTML:** Luôn set `<html lang="ja">` để báo hiệu cho Google đây là trang tiếng Nhật.
*   **Cấu trúc dữ liệu (Schema Markup - 構造化データ):**
    *   Mỗi trang công ty phải nhúng JSON-LD với chuẩn `Organization` hoặc `LocalBusiness` để hiển thị rich snippets trên Google Search.
    *   Đảm bảo các trường như Tên, Địa chỉ, `taxID` (áp dụng mã số pháp nhân bangou) được điền đầy đủ.
*   **Liên kết nội bộ (Internal Linking):**
    *   Trong trang của công ty A, tự động hiển thị box: "Các công ty cùng ngành nghề" (同業他社) và "Các công ty cùng khu vực" (近隣の企業). Điều này giúp Google Bot dễ dàng thu thập dữ liệu toàn bộ website.
*   **Bài viết Blog Tự động bằng AI (AI Auto-Blogging):**
    *   Tích hợp script tự động kết hợp LLM để nghiên cứu các xu hướng tuyển dụng, tin tức kinh tế, chính sách hỗ trợ trợ cấp của Nhật Bản và tự động viết 2-3 bài blog chuẩn SEO chất lượng cao mỗi tuần để thu hút organic traffic về website.

---

## 3. Tối ưu Hiệu suất (Core Web Vitals)
*   Google đánh giá rất cao tốc độ tải trang (Page Speed). Hệ thống Frontend phải được xây dựng trên công nghệ sinh trang tĩnh (SSG/ISR) như **Next.js 15 (App Router)** và deploy lên **Vercel** có Edge Network đặt trực tiếp tại Tokyo để đảm bảo TTFB dưới 200ms.
*   Thời gian First Contentful Paint (FCP) và Largest Contentful Paint (LCP) phải dưới 1.5 giây.
*   Đảm bảo giao diện không bị giật/nhảy nội dung khi tải (Cumulative Layout Shift - CLS = 0) bằng cách cấu hình kích thước hình ảnh/card cố định và tối ưu hóa Noto Sans JP font.
