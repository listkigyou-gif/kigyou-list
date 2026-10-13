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
