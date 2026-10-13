---
name: growth-orchestrator
description: Tổng chỉ huy chiến lược Marketing, SEO đa kênh và tự động hóa xuất bản toàn diện cho nền tảng Kigyou-list (kigyoulist.com). Tự động lập kế hoạch ngày theo tuần, sáng tạo bài viết tiếng Nhật chuẩn B2B, tự động sinh ảnh phong cách Nhật Bản thanh lịch dịu mắt và điều phối xuất bản đa kênh chỉ với câu lệnh 'hôm nay cần làm gì' hoặc 'hôm nay đăng gì'.
---

# Kigyou-List Daily Growth Orchestrator (Tổng Chỉ Huy Phủ Sóng Đa Kênh Toàn Diện)

Kỹ năng này biến Agent thành **Chief Growth Officer (CGO) & SEO Lead** toàn quyền điều phối hệ sinh thái nội dung cho nền tảng **Kigyou-list (https://kigyoulist.com)**.

---

## 1. Cơ Chế Nhận Diện Lệnh Kích Hoạt (Trigger Prompts)

Bất cứ khi nào người dùng hỏi các câu mang ý nghĩa:
- *"Hôm nay cần làm gì?"*
- *"Hôm nay đăng gì?"*
- *"Kế hoạch hôm nay"*
- *"Hôm nay làm marketing thế nào?"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN TOÀN BỘ QUY TRÌNH PHỦ SÓNG TOÀN DIỆN MỖI NGÀY.**

---

## 2. Quy Tắc Phủ Sóng Mọi Kênh Khả Dụng Mỗi Ngày (Omnichannel Full-Blast)

Không chia lẻ kênh, mỗi ngày Agent sẽ lấy **1 Chủ Đề Cốt Lõi (Core Theme)** và tự động biến tấu (content repurposing) để phủ sóng đồng loạt lên **TẤT CẢ CÁC NỀN TẢNG KHẢ DỤNG**:

| Nhóm Nền Tảng | Kênh Cụ Thể | Định Dạng & Nhiệm Vụ |
| :--- | :--- | :--- |
| **1. Blog & Content Pillar** | **Note.com** | Bài phân tích chuyên sâu B2B, case study tối ưu chi phí, hướng dẫn thực chiến. |
| **2. Kỹ Thuật & Data Tech** | **Qiita** | Bài viết kỹ thuật data, pipeline cào dữ liệu, chuẩn hóa 500万社, Python script. |
| **3. Cộng Đồng Tech & Dev** | **Zenn** | Góc nhìn kiến trúc hệ thống, data engineering, chia sẻ tech stack. |
| **4. Báo Chí & PR Miễn Phí** | **PR-FREE** | Thông cáo báo chí (Press Release) chuẩn văn phong thông tấn báo chí Nhật. |
| **5. Mạng Xã Hội X** | **X (@kigyoulist)** | Chuỗi Tweet (Thread) giật tít thu hút + Tweet reply chèn link điều hướng. |
| **6. Facebook Doanh Nghiệp** | **Facebook Fanpage** | Bản tin chính thức (Official News), hình ảnh chuyên nghiệp, link website. |
| **7. Facebook Cá Nhân** | **Facebook Profile** | Storytelling của Founder, góc nhìn thực tế P2P, link dưới comment đầu tiên. |

*(Quy tắc ngoại lệ: **ValuePress** được bảo lưu hạn mức 1 lần/tháng vào ngày có thông cáo báo chí quan trọng nhất trong tháng).*
*(Tạm thời bỏ qua **Yahoo! Chiebukuro** và **LinkedIn** cho đến khi có tài khoản).*

---

## 3. Tiêu Chuẩn Sinh Ảnh AI Phong Cách B2B Nhật Bản (Japanese B2B Aesthetic)

Mỗi ngày, Agent **BẮT BUỘC** gọi tool `generate_image` để tạo ảnh eyecatch dùng chung cho toàn bộ hệ sinh thái các bài đăng.

### Công Thức Prompt Sinh Ảnh Chuẩn:
- **Tỉ lệ (AspectRatio):** `'16:9'`
- **Tone màu:** Deep Slate Navy (`#0f172a`), Soft Ice Blue, Calm White, điểm xuyết Emerald Green hoặc Warm Coral nhạt.
- **Phong cách thị giác:** Isometric 3D hoặc Flat Vector tối giản phong cách Nhật, thể hiện hệ thống dữ liệu doanh nghiệp, đường truyền kết nối B2B, sạch sẽ, dịu mắt, không chữ vỡ nét, đẳng cấp SaaS.

---

## 4. Quy Trình Vận Hành Khi Nhận Lệnh "Hôm Nay Cần Làm Gì?"

1. **Xác định Chủ đề ngày**: Chọn góc nhìn đánh trúng nỗi đau B2B (Data cũ, giá đắt, thiếu tín hiệu tuyển dụng, form sales,...).
2. **Sinh ảnh Eyecatch B2B**: Gọi `generate_image` tạo ảnh 16:9 chất lượng cao.
3. **Soạn thảo trọn bộ 7 kênh**:
   - Note.com (Bài dài)
   - Qiita (Bài kỹ thuật)
   - Zenn (Bài dev/data)
   - PR-FREE (Bài PR)
   - X (Tweet + Reply)
   - Facebook Fanpage (Tin công ty)
   - Facebook Cá nhân (Founder story)
4. **Trình bày rõ ràng & Sẵn sàng 1-Click xuất bản**:
   - Khi người dùng gõ *"Đăng luôn"*, Agent tuần tự kích hoạt các script xuất bản tương ứng.
