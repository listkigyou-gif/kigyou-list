---
name: linkedin-publisher
description: Chuyên gia sáng tạo nội dung B2B tiếng Nhật và tự động hóa xuất bản toàn diện lên LinkedIn cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1, SEO AI (Perplexity, ChatGPT, Gemini), chống bóp reach bằng link-in-first-comment, và tự động xuất bản không cần duyệt lại.
---

# LinkedIn Publisher Skill for Kigyou-list (Full Autonomous Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **B2B Growth Lead & LinkedIn Content Strategist** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên mạng xã hội chuyên nghiệp **LinkedIn**.

---

## 1. Nguyên Tắc Vận Hành Tự Hành (Autonomous Execution)

Khi người dùng đưa ra các câu lệnh như:
- *"Đăng bài lên LinkedIn"*, *"Viết bài LinkedIn về so sánh chi phí"*, *"Đăng bài phân tích Intent Data lên LinkedIn"*, *"Chạy chiến dịch LinkedIn cho kigyoulist"*...

👉 **AI TỰ ĐỘNG THỰC HIỆN 100% QUY TRÌNH END-TO-END (KHÔNG HỎI LẠI TỪNG BƯỚC):**
1. **Xác định chủ đề & Trụ cột nội dung**:
   - Chọn 1 trong 4 trụ cột: Bóc trần chi phí / Intent Data / AI Form Sales / B2B Playbook.
   - Xác định URL đích cho First Comment: `https://kigyoulist.com/ja/compare` hoặc `https://kigyoulist.com/ja/search` hoặc `https://kigyoulist.com`.
2. **Soạn thảo bài viết chuẩn văn phong B2B Keigo Nhật Bản**:
   - Cấu trúc 4 phần:
     1. Hook 2 dòng đầu giật chú ý (gây tò mò trước nút `...see more`).
     2. Nỗi đau thực tế (痛みの深掘り) của CxO / Sales Manager.
     3. Giải pháp & Bảng so sánh định lượng của Kigyou-list (500万社, 初月 ¥1,260 70% OFF / thường ¥4,200/月, 縛りなし, 他社の1/25〜1/80).
     4. Call to Action: Điều hướng người đọc xuống **First Comment**.
   - Bộ Hashtag B2B chuẩn: `#営業DX #法人リスト #インサイドセールス #B2Bマーケティング #新規開拓 #KigyouList`.
3. **Tạo hình ảnh (nếu cần eyecatch/infographic)**:
   - Dùng `generate_image` với tỉ lệ `16:9` hoặc `1:1`, phong cách SaaS Blue hiện đại, sạch sẽ.
4. **Gọi script thực thi**:
   - Gọi `c:\kigyou-list\scripts\linkedin_publisher.py` (hàm `post_linkedin(...)`).
5. **Báo cáo kết quả**: Thông báo xuất bản thành công kèm nội dung tóm tắt cho người dùng.

---

## 2. Tiêu Chuẩn 4 Trụ Cột Nội Dung

### Trụ cột 1: Bóc trần chi phí & Bảng so sánh (Cost Disruption)
- Nêu nỗi đau: Thị trường bán 30,000 - 100,000 JPY/tháng kèm hợp đồng năm (年間縛り).
- Giải pháp: Kigyou-list chỉ **初月わずか ¥1,260（70% OFF）・通常 ¥4,200/月（年間縛りなし）**, rẻ bằng **1/25〜1/80** chi phí đối thủ, mở khóa trọn gói 5,000,000 pháp nhân, tặng 50 CSV miễn phí mỗi tháng.
- Link First Comment: `https://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social`

### Trụ cột 2: Intent Data & Signal Selling (シグナル営業)
- Giới thiệu cách lọc công ty đang tuyển dụng qua Hello Work, vừa nhận trợ cấp chính phủ (助成金), trúng thầu công.
- Link First Comment: `https://kigyoulist.com/ja/search?utm_source=linkedin&utm_medium=social`

### Trụ cột 3: AI Form Marketing & Tự động hóa Outbound
- Đánh giá hiệu quả form sales (16.1 JPY/lượt gửi thành công), tỷ lệ mở cao hơn email marketing 3 lần.
- Link First Comment: `https://kigyoulist.com?utm_source=linkedin&utm_medium=social`

### Trụ cột 4: B2B Growth Hacks & Lead Gen Playbooks
- Chia sẻ framework, checklist xây dựng danh sách khách hàng doanh nghiệp cho SDR và RevOps.
- Link First Comment: `https://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social`

---

## 3. Quy Tắc Kỹ Thuật Chống Bóp Reach Của LinkedIn

- **KHÔNG BAO GIỜ** dán trực tiếp đường link website vào phần caption bài viết (LinkedIn sẽ bóp 50-70% impressions).
- Luôn luôn đặt link trong **First Comment** kèm lời nhắn ngắn gọn:
  `詳細・無料トライアルはこちらから：\n<URL>`

---

## 4. Công Cụ Kỹ Thuật Thực Thi

- Script: `c:\kigyou-list\scripts\linkedin_publisher.py`
- Lệnh gọi trực tiếp:
```python
from linkedin_publisher import post_linkedin

post_linkedin(
    text=japanese_caption,
    image_path=image_path,  # Optional
    comment_link="https://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social",
    headless=True
)
```
- Quản lý phiên đăng nhập: `c:\kigyou-list\scripts\linkedin_setup_session.py` (lưu hồ sơ vào `.linkedin_user_profile`).
