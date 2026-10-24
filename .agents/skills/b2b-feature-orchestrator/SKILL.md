---
name: b2b-feature-orchestrator
description: Bộ chỉ huy Quản lý Tính năng & Chuẩn hóa Kiến trúc Giao diện B2B Nhật Bản cho Kigyou-list (kigyoulist.com). Kiểm soát vòng đời tính năng 5 tầng, quy định nghiêm ngặt về phong cách tối giản nhã nhặn (nền trắng/xám dịu mắt, tuyệt đối cấm khối đen/xanh đậm, cấm lạm dụng icon, loại bỏ cảm giác AI thiết kế) và điều phối đập đi xây lại Dashboard module hóa.
---

# B2B Feature Orchestrator & Anti-AI UI Rebuild Architecture

Kỹ năng này trao quyền cho Agent đóng vai trò **Chief Product Officer (CPO) & Lead Product Architect** của nền tảng **Kigyou-list (https://kigyoulist.com)**, chịu trách nhiệm quy hoạch tính năng mới và giám sát chuẩn hóa giao diện người dùng.

---

## 1. BỐN NGUYÊN TẮC GIAO DIỆN BẮT BUỘC (CRITICAL UI CONSTRAINTS)

Khi nâng cấp tính năng hoặc tái cấu trúc (rebuild) giao diện, **TUYỆT ĐỐI TUÂN THỦ 4 NGUYÊN TẮC VÀNG SAU ĐÂY**:

### 🚫 Nguyên Tắc 1: CẤM các khối nền đen, xanh đậm gắt mắt trong Light Mode (No Dark/Navy Black Blocks)
* **Thực trạng cần loại bỏ**: Trong chế độ sáng thông thường, tuyệt đối không sử dụng các khối màu nền đen xì, xanh navy đậm (`#0F172A`, `#0B1221`) cho code block, bảng biểu, hộp thông tin hay thẻ dữ liệu (như các giao diện hacker/crypto/developer neon).
* **Quy chuẩn bắt buộc**: 
  * Sử dụng màu nền **trắng tinh (`#FFFFFF`)** hoặc **xám ngà dịu mắt (`#F8FAFC`, `#F1F5F9`)**.
  * Chữ hiển thị là **màu đen hoặc xám than đậm (`#0F172A`, `#334155`, `#1E293B`)** để tạo độ tương phản êm dịu, đọc lâu không mỏi mắt.
  * Ngay cả các khung Code mẫu hay Terminal cũng phải dùng nền xám sáng thanh lịch (`bg-slate-50 border border-slate-200 text-slate-800`), tuyệt đối không dùng hộp đen gắt mắt.

### 🚫 Nguyên Tắc 2: KHÔNG lạm dụng icon nhiều quá khi không cần thiết (Icon Minimalism)
* **Thực trạng cần loại bỏ**: Không chèn icon trước mọi dòng tiêu đề, mọi thẻ dữ liệu, mọi dòng danh sách một cách máy móc (kiểu AI tự động cắm icon trang trí lòe loẹt).
* **Quy chuẩn bắt buộc**:
  * Chỉ sử dụng icon khi thực sự có **giá trị công năng (Functional Icons)**: Nút tìm kiếm (Search), nút sao chép (Copy), nút tải xuống (Download), nút xóa (Trash), nút đóng (Close).
  * Trong danh sách hoặc bảng biểu: Ưu tiên dùng text rõ ràng, khoảng trắng (Spacing) và đường kẻ phân cách mảnh (`border-slate-200`) thay vì nhồi nhét icon.

### 🚫 Nguyên Tắc 3: Giao diện KHÔNG ĐƯỢC có cảm giác do AI thiết kế (Anti-AI Gimmick)
* **Thực trạng cần loại bỏ**: Loại bỏ hoàn toàn các đặc trưng "AI vibe":
  * ❌ Gradient màu tím, hồng, xanh neon lấp lánh.
  * ❌ Viền phát sáng (Glow effects), bóng đổ phóng đại quá mức (`shadow-2xl`).
  * ❌ Icon ngôi sao/phép thuật (Sparkles ✨) tràn lan.
  * ❌ Bo góc tròn ủng như đồ chơi (`rounded-3xl`, `rounded-[2rem]`).
* **Quy chuẩn bắt buộc**:
  * Phong cách chuẩn **B2B Nhật Bản (和の洗練 - Japanese Enterprise Sobriety)**: Điềm đạm, gọn gàng, vuông vắn (`rounded-lg` 8px hoặc `rounded-md` 6px), các đường kẻ dứt khoát 1px, thông tin mạch lạc, tạo cảm giác như một cổng dữ liệu của ngân hàng hoặc tổ chức tín dụng uy tín.

### 🚫 Nguyên Tắc 4: Tương thích hoàn hảo và hiển thị tối ưu trên Google Chrome ở Chế độ Tối (Chrome Dark Mode Compatibility)
* **Thực trạng cần loại bỏ**: Tuyệt đối không để xảy ra tình trạng nền trang chuyển màu tối (Dark Mode) mà các khối thẻ Card lại giữ nguyên màu trắng bệch (`#FFFFFF`) gây chói lóa, tương phản khó chịu, nhức mắt cho người dùng như trong ảnh chụp thực tế. Tuyệt đối không để thẻ này màu tối, thẻ kia màu sáng lộn xộn.
* **Quy chuẩn bắt buộc**:
  * Khi Google Chrome hoặc hệ điều hành chuyển sang Chế độ Tối (`prefers-color-scheme: dark`), toàn bộ giao diện từ màu nền trang (`#0D1117`), các khối thẻ Card (`#161B22`), đường viền (`#30363D`), chữ (`#F8FAFC`, `text-slate-300`) phải tự động chuyển đổi đồng nhất 100%.
  * Bắt buộc tích hợp cơ chế phòng thủ 2 lớp: Script phát hiện trong `<head>` để gán class `dark` cho thẻ `<html>` và dự phòng Media Query `@media (prefers-color-scheme: dark)` trong CSS gốc (`globals.css`) để đảm bảo hiển thị tức thì, mượt mà và dịu mắt.

---

## 2. CHIẾN LƯỢC TÁI CẤU TRÚC GIAO DIỆN (MODULAR REBUILD STRATEGY)

Khi đập đi xây lại giao diện Dashboard (`/dashboard`) để đồng bộ với kho dữ liệu mở rộng:

### 2.1. Phân định ranh giới an toàn:
* **Các trang công cộng & SEO (`/`, `/area/[code]`, `/company/[id]`, `/directory`)**:
  * 🛡️ **BẢO TỒN NỀN TẢNG**: Giữ nguyên URL và cấu trúc routing vì đang đạt chỉ số Index 100% Success trên Google và Bing.
  * 🎯 **NÂNG CẤP TIỆM TIẾN**: Chỉ chèn thêm các nút chức năng mới (như nút "Theo dõi doanh nghiệp 🔔") và các khối dữ liệu mới.
* **Khu vực Quản trị Người Dùng (`/dashboard`)**:
  * 💥 **ĐẬP ĐI XÂY LẠI THEO KIẾN TRÚC MODULE HÓA**:
  * Xóa bỏ cấu trúc Monolithic (file `dashboard/page.tsx` dài 3.250 dòng).
  * Chia tách thành các file component con độc lập trong thư mục `frontend/src/components/dashboard/`:
    * `WatchlistTab.tsx` (Tính năng mới: Theo dõi & Biến động)
    * `MyListTab.tsx` (Danh sách lưu & phân loại)
    * `KanbanTab.tsx` (Bảng phễu bán hàng)
    * `ExportsTab.tsx` (Lịch sử tải CSV)
    * `FormCampaignsTab.tsx` (Chiến dịch gửi Form DM)
    * `DeveloperTab.tsx` (API & MCP Server)
    * `VerifiedProfileTab.tsx` (Chính chủ doanh nghiệp)
    * `SettingsTab.tsx` (Cấu hình tài khoản & hóa đơn)

---

## 3. HỒ SƠ TÍNH NĂNG MẪU: CORPORATE WATCHLIST & CHANGE ALERTS
> **Feature ID**: `feat-watchlist-alerts`  
> **Trạng thái**: `IN_DEVELOPMENT (Đang triển khai)`

### Tầng 1: Dữ Liệu (PostgreSQL & SQLite)
* Bảng `user_company_watchlist`:
  * `id`: UUID PRIMARY KEY
  * `user_email`: TEXT NOT NULL
  * `corporate_number`: VARCHAR(20) NOT NULL
  * `notify_email`: BOOLEAN DEFAULT TRUE (Nhận email cảnh báo)
  * `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  * `UNIQUE(user_email, corporate_number)`
* Bảng `company_change_logs`:
  * `id`: UUID / SERIAL PRIMARY KEY
  * `corporate_number`: VARCHAR(20) NOT NULL
  * `change_type`: VARCHAR(50) (LEGAL_NAME, ADDRESS, REPRESENTATIVE, INVOICE_STATUS, FINANCIAL_REPORT, HIRING_SIGNAL)
  * `old_value`: TEXT, `new_value`: TEXT
  * `detected_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Tầng 2: Giao Diện (Chuẩn Nền Trắng/Xám Dịu Mắt - Không Icon Thừa)
1. **Nút Theo Dõi trên trang chi tiết công ty (`/company/[id]`):**
   * Nút viền xám chữ đen nhã nhặn: `[監視リストに追加]` (Khi chưa theo dõi) và `[監視中 · 通知ON]` (Khi đang theo dõi).
   * Không dùng màu đen hay xanh đậm gắt mắt.
2. **Giao diện Tab Watchlist trong Dashboard (`WatchlistTab.tsx`):**
   * Bố cục 2 cột dịu mắt:
     * Cột trái (40%): Danh sách công ty đang theo dõi (Tên công ty, SĐT, Địa chỉ, nút Gỡ bỏ).
     * Cột phải (60%): Dòng thời gian biến động (Change Event Timeline) với nền trắng, viền xám mảnh, hiển thị ngày giờ và nội dung thay đổi rõ ràng.

### Tầng 3: Phân Quyền (Entitlements)
* **Gói Free (Trải nghiệm miễn phí hiện tại)**:
  * Theo dõi tối đa **10 doanh nghiệp**.
  * Nhận email cảnh báo biến động tự động.
* **Gói Pro (Thu phí tương lai)**:
  * Theo dõi **50 doanh nghiệp** + bộ lọc chuyên sâu (chỉ báo biến động tài chính, cảnh báo rủi ro xấu).
* **Gói Enterprise**:
  * Theo dõi **500+ doanh nghiệp** + Webhook bắn dữ liệu biến động vào CRM nội bộ.

### Tầng 4: Hệ Thống Cảnh Báo Email (Email Dispatcher)
* Tự động gửi email qua Resend khi phát hiện biến động:
  * Tiêu đề: `【Kigyou-list】監視中の企業（{company_name}）に最新の変動情報が検知されました`
  * Mẫu email: HTML nền trắng, viền xám nhạt, logo trang nhã, tóm tắt thông tin thay đổi và nút bấm xem chi tiết.

### Tầng 5: Truyền Thông & Báo Chí (PR & SEO)
* Xuất bản thông cáo báo chí lên PR-FREE / PressNow / Note.com:
  * *"Kigyou-list ra mắt tính năng Giám sát & Cảnh báo Biến động Doanh nghiệp Miễn phí (AI Corporate Monitoring) cho 5 triệu pháp nhân Nhật Bản"*.

---

## 4. CHECKLIST NGHIỆM THU GIAO DIỆN (UI ACCEPTANCE CHECKLIST)

Mọi thay đổi giao diện trước khi bàn giao bắt buộc phải qua 5 câu hỏi kiểm tra:
1. [ ] **Màu nền**: Có bất kỳ khối màu đen hoặc xanh đậm nào gây chói/gắt mắt không? (Nếu có ➔ chuyển ngay sang nền trắng `#FFFFFF` hoặc xám ngà `#F8FAFC`).
2. [ ] **Màu chữ**: Chữ có rõ ràng, tương phản êm dịu trên nền sáng không? (Ưu tiên `#0F172A`, `#334155`).
3. [ ] **Mật độ Icon**: Các icon xuất hiện có thực sự cần thiết không? Có bị lạm dụng trước từng dòng chữ không? (Nếu chỉ mang tính trang trí ➔ xóa bỏ).
4. [ ] **Cảm giác tổng thể**: Giao diện có toát lên sự chuyên nghiệp, chuẩn mực của một ngân hàng dữ liệu doanh nghiệp Nhật Bản (không mang cảm giác AI làm) không?
5. [ ] **Tương thích Chế độ Tối Google Chrome**: Khi mở trên Google Chrome ở Dark Mode (cài đặt hệ thống hoặc dark mode trình duyệt), giao diện có tự động thích ứng mượt mà không? Có khối thẻ nào bị giữ màu trắng bệch gây chói mắt không?

