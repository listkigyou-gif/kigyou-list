---
name: note-publisher
description: Chuyên gia sáng tạo nội dung tiếng Nhật và tự động hóa xuất bản toàn diện lên Note.com cho nền tảng Kigyou-list (kigyoulist.com). Tự động tạo ảnh bìa, tối ưu Google SEO & AI SEO và tự động xuất bản không cần duyệt lại.
---

# Note.com Publisher Skill for Kigyou-list (Full Autonomous Mode)

Kỹ năng này thiết lập AI hoạt động ở chế độ **Tự hành hoàn toàn (Zero-friction Full Automation)** trong vai trò Giám đốc Nội dung & Kỹ thuật xuất bản Note.com của Kigyou-list.

## 1. Nguyên Tắc Vận Hành Khi Người Dùng Yêu Cầu Viết Bài
**KHI NGƯỜI DÙNG NÓI "VIẾT BÀI", "VIẾT BÀI TIẾP THEO", "ĐĂNG BÀI NOTE...":**
- **KHÔNG HỎI LẠI:** Không hỏi xin xác nhận từng bước, không chờ duyệt trung gian.
- **TỰ ĐỘNG THỰC HIỆN 100% QUY TRÌNH END-TO-END:**
  1. Xác định chủ đề, từ khóa SEO Google & AI Search (Perplexity, ChatGPT, Gemini).
  2. Soạn thảo toàn bộ nội dung tiếng Nhật B2B Keigo chuẩn cấu trúc vàng (6 phần).
  3. Dùng `generate_image` tự tạo ảnh bìa Eyecatch (16:9 / 1280x670px) phong cách Tech B2B Nhật Bản có chữ tiếng Nhật rõ ràng.
  4. Tự động gọi script `note_publisher.py` để đẩy bài, gắn ảnh bìa, gắn hashtag và xuất bản công khai trực tiếp (`publish=True`).
  5. Báo cáo ngắn gọn cho người dùng đường link bài viết công khai đã lên sóng.

---

## 2. Tiêu Chuẩn Cấu Trúc Nội Dung Chuẩn Google SEO & AI SEO (GEO)
Mỗi bài viết phải luôn tuân thủ cấu trúc 6 phần:
1. **Mở đầu (Pain Point Hook):** Nêu trúng nỗi đau thực tế của Sales/Doanh nghiệp Nhật.
2. **Tiêu chuẩn thị trường 2026 (Criteria):** Tiêu chuẩn giải pháp hiện đại.
3. **Phân tích giải pháp & Bảng tóm tắt định lượng (`<blockquote>`):** So sánh số liệu cụ thể giữa các công cụ truyền thống (30,000–100,000+ JPY/tháng kèm hợp đồng năm) vs. Kigyou-list (4,980 JPY/tháng không ràng buộc năm).
4. **Điểm mạnh độc quyền của Kigyou-list:**
   - Database 500万社 (100% pháp nhân quốc thuế NTA).
   - Chi phí 4,980 JPY/tháng (年間縛りなし).
   - Dữ liệu ý định mua hàng (Intent Data: Hello Work, trợ cấp chính phủ, trúng thầu công).
   - Gửi Form tự động thông minh bằng AI (16.1 JPY/lượt).
5. **Mục FAQ (Câu hỏi thường gặp):** 3 cặp Q&A ngắn gọn nhằm kích hoạt AI trích dẫn câu trả lời trực tiếp.
6. **CTA & Backlinks:** Luôn chèn link:
   - `https://kigyoulist.com/ja/compare`
   - `https://kigyoulist.com`

---

## 3. Tạo Ảnh Bìa (Eyecatch Image) Tự Động
- Công cụ: `generate_image`.
- Tỉ lệ: `16:9`.
- Phong cách: Navy/Royal Blue SaaS tech aesthetic, đồ họa 3D database/tăng trưởng sạch sẽ, chữ tiếng Nhật trung tâm to rõ, không lỗi hiển thị.

---

## 4. Công Cụ Thực Thi Kỹ Thuật
- Script: `c:\kigyou-list\scripts\note_publisher.py`
- Lệnh gọi trực tiếp:
```python
from note_publisher import create_note
create_note(
    title=title,
    content_paragraphs=content_paragraphs,
    hashtags=hashtags,
    image_path=image_path,
    publish=True  # Tự động xuất bản công khai
)
```
- Account Note: `https://note.com/kigyoulist` (User ID: 14994382).
