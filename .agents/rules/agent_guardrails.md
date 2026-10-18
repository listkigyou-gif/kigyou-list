# Quy Tắc Vận Hành Chung Cho Tác Nhân AI (General Agent Guardrails)

Quy tắc này áp dụng tự động cho mọi tác nhân và subagent trong dự án `kigyou-list`.

---

## 1. Bảo Vệ Dữ Liệu & Phiên Làm Việc (Data & Session Protection)
- **Tuyệt đối không xóa:** Không xóa các tệp cơ sở dữ liệu (`kigyou-list.db`, `hellowork.db`), dữ liệu gốc trong `importdata/` và 6 thư mục phiên làm việc của trình duyệt (`.x_user_profile`, `.facebook_user_profile`, `.linkedin_user_profile`, `.valuepress_user_profile`, `.note_user_profile`, `.zenn_user_profile`).
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
