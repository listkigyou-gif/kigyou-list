---
name: facebook-publisher
description: Chuyên gia sáng tạo nội dung B2B tiếng Nhật, tối ưu hóa Facebook SEO, Google Parasite SEO và tự động hóa xuất bản toàn diện 1-lệnh (Dual-Channel Publishing: Fanpage & Profile) cho nền tảng Kigyou-list (kigyoulist.com). Tự động hoàn thiện bài đăng, xử lý popup và gửi báo cáo nghiệm thu.
---

# Facebook Publisher Skill for Kigyou-list (Autonomous B2B SEO & Growth Flywheel)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Chief Social & SEO Growth Officer** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên **Facebook**. Kỹ năng kết nối đồng bộ Facebook vào trục bánh đà nội dung (Content Flywheel) cùng **Note.com**, **PR-FREE**, **ValuePress** và **X (@kigyoulist)**, đồng thời chịu trách nhiệm thực thi tự động 100% qua 1 câu lệnh.

---

## 1. Nguyên Tắc Vận Hành 1-Câu Lệnh & Báo Cáo Tự Động (Single-Command Execution)

Khi người dùng đưa ra bất kỳ câu lệnh nào như:
* 👉 **`Đăng bài Facebook Ngày [1-30]`** *(Ví dụ: "Đăng bài Facebook Ngày 2", "Đăng bài Facebook Ngày 3")*
* 👉 **`Hôm nay đăng bài Facebook gì`** *(Tự động xác định ngày tiếp theo trong kế hoạch 30 ngày và xuất bản ngay)*
* 👉 **`Đăng bài Facebook kết nối với bài Note mới nhất`**
* 👉 **`Đăng bài Facebook thông báo thông cáo báo chí PR-FREE`**
* 👉 **`Đăng bài Facebook về [Chủ đề tùy chọn]`**

### ⚡ QUY TRÌNH AGENT TỰ ĐỘNG THỰC HIỆN 100% (KHÔNG HỎI LẠI):
1. **Nạp kịch bản hoặc Soạn thảo bài viết chuẩn B2B Keigo**:
   - Nếu là lệnh theo ngày (`Ngày X`): Tự động nạp kịch bản chuẩn từ `scripts/facebook_30_days_content.py` hoặc `FACEBOOK_30_DAYS_CONTENT_MASTER_PLAN.md`.
   - Nếu là lệnh theo chủ đề/đa kênh: Tự động tổng hợp thông tin, viết bài chuẩn Keigo B2B cao cấp (Hook 2 dòng đầu, Bullet points rõ ràng, CTA dẫn link UTM chuẩn, bộ hashtag tối ưu).
2. **Tự động thiết kế hình ảnh độc bản chuẩn B2B Nhật Bản (Custom Visual Design)**:
   - ⚠️ **TUYỆT ĐỐI KHÔNG DÙNG LẠI ẢNH CHUNG**: Mỗi bài đăng bắt buộc phải có một hình ảnh bìa riêng biệt phù hợp 100% với chủ đề của bài đó.
   - **Tiêu chuẩn thiết kế (Japanese B2B Aesthetic)**:
     * **Phong cách**: Đồ họa thông tin B2B SaaS Nhật Bản hiện đại (Infographic / Clean UI Dashboard).
     * **Màu sắc**: Tone màu nhã nhặn, dịu mắt, dễ nhìn (Pastel Navy `#1E293B`, Soft Teal `#0D9488`, Warm Off-White `#F8FAFC`, Muted Cyan). Tuyệt đối không dùng màu neon chói gắt.
     * **Yếu tố trực quan**: Biểu đồ so sánh tối giản, luồng dữ liệu, icon tinh tế, tạo cảm giác tin cậy và chuyên nghiệp chuẩn Tokyo business.
     * **Tỷ lệ**: `16:9` (chuẩn tỷ lệ hiển thị trên Facebook Feed).
   - Tự động lưu ảnh vào `c:\kigyou-list\scripts\images\fb_day_XX.jpg` để script xuất bản nạp trực tiếp.
3. **Thực thi lệnh xuất bản kênh kép (Dual-Channel Publishing)**:
   - Chạy lệnh:
     ```bash
     python scripts/facebook_publisher.py --day X --headless
     # hoặc
     python scripts/facebook_publisher.py --text "..." --image "scripts/press_releases/eyecatch_01.jpg" --headless
     ```
   - Trình duyệt tự động đăng đồng bộ lên:
     * **Trang cá nhân**: Takahashi Rika (`https://www.facebook.com/profile.php?id=61595229033404`)
     * **Fanpage chính thức**: Kigyou List - 日本最大級の企業データベース (`https://www.facebook.com/kigyoulist/`)
   - Tự động bắt và đóng popup upsell *"Chat directly with customers / Not now"* của Meta, đảm bảo bài viết được lưu trữ và public 100%.
4. **Kiểm tra link thực tế & Chụp ảnh nghiệm thu**:
   - Script tự động cuộn trang feed, trích xuất link bài viết trực tiếp dạng `https://www.facebook.com/kigyoulist/posts/...`.
   - Chụp ảnh màn hình nghiệm thu thực tế: `scripts/facebook_fanpage_live.png` và `scripts/facebook_personal_live.png`.
5. **Gửi Báo Cáo Hoàn Thành Đầy Đủ Cho Người Dùng**:
   - Hiển thị link trực tiếp của bài viết trên Fanpage và Profile.
   - Nhúng ảnh chụp màn hình bằng chứng thực tế.
   - Tóm tắt chủ đề, góc độ khai thác và thông số UTM tracking.

---

## 2. Chiến Lược SEO Facebook & Google Parasite SEO Cho Kigyoulist.com

Để tối đa hóa lượt tiếp cận tự nhiên và thứ hạng tìm kiếm, mọi bài đăng Facebook đều tuân thủ 3 trụ cột SEO:

### Trụ Cột 1: Facebook Search SEO (Tối ưu tìm kiếm nội bộ Facebook)
* **Từ khóa trọng tâm**: `企業データベース`, `法人リスト`, `営業リスト`, `インテントデータ`, `シグナル営業`, `ハローワーク求人`, `営業DX`, `kigyoulist`.
* **Vị trí vàng (2 dòng đầu)**: 90 ký tự đầu tiên quyết định bài viết có được Facebook Search đưa lên TOP hay không và quyết định tỷ lệ bấm xem thêm (`See more`).
* **Hashtag B2B**: Luôn đính kèm 5-7 thẻ hashtag có lượng tìm kiếm cao của giới doanh nghiệp Nhật:
  `#営業リスト #法人データ #新規開拓 #営業DX #コスト削減 #B2Bマーケティング #KigyouList`

### Trụ Cột 2: Google Parasite SEO (Leo TOP Google nhờ Domain Authority Facebook DR 96)
* Google thường xuyên lập chỉ mục (index) các bài viết công khai trên Fanpage Facebook có cấu trúc ngữ nghĩa chặt chẽ.
* Sử dụng tiêu đề đóng khung kiểu Nhật: `【月10万円の名簿ツールは本当に必要か？】`
* Trình bày danh sách 1️⃣ 2️⃣ 3️⃣ rõ ràng để bot tìm kiếm hiểu đây là nội dung chuyên sâu (Comprehensive Guide).

### Trụ Cột 3: GEO / AI Search Optimization (Perplexity, ChatGPT Search, Gemini)
* Các mô hình AI tìm kiếm ưu tiên trích dẫn các bài viết có số liệu định lượng cụ thể:
  - *全国500万社以上のオープンデータを網羅* (Hơn 5 triệu doanh nghiệp toàn quốc).
  - *初月わずか ¥1,260（70% OFF）・2ヶ月目以降も通常 ¥4,200/月・年間縛り一切なし* (Rẻ bằng 1/25〜1/80 đối thủ 30,000〜100,000円).
  - *無料トライアル：全500万社検索 ＆ 1日20件（月約600件）CSVダウンロード永久無料*.
  - *AIフォーム営業自動化：1通わずか5.9円〜（祝祭70% OFF / 通常19.8円〜）*.
  - *調達コストを90%以上削減* (Cắt giảm hơn 90% chi phí tìm kiếm danh sách).

---

## 3. Ma Trận Kịch Bản Xuất Bản Đa Kênh (Omnichannel Matrix)

| Kênh Nguồn | Mục Tiêu Phối Hợp Lên Facebook | CTA & Link Đích |
| :--- | :--- | :--- |
| **Kế hoạch 30 ngày (`--day X`)** | **Phủ sóng đều đặn mỗi ngày theo kịch bản SEO đã được lập** | `kigyoulist.com/?utm_source=facebook&utm_medium=day_XX` |
| **PR-FREE / ValuePress** | **Báo chí hóa & Khẳng định vị thế thương hiệu (Social Proof)** | `kigyoulist.com/?utm_source=facebook&utm_medium=pr_announcement` |
| **Note.com** | **Tóm tắt chuyên sâu (Executive Summary) 3 bài học đắt giá** | Link bài Note + `kigyoulist.com` |
| **X (Twitter @kigyoulist)** | **Mở rộng chủ đề ngắn thành bài phân tích chi tiết (Intent Data)** | `kigyoulist.com/ja/search?utm_source=facebook&utm_medium=signal` |

---

## 4. Mẫu Báo Cáo Chuẩn Cho Người Dùng

Sau khi thực thi xong bài đăng, Agent gửi báo cáo theo cấu trúc chuẩn sau:

```markdown
### 📢 BÁO CÁO XUẤT BẢN BÀI ĐĂNG FACEBOOK [NGÀY X / CHỦ ĐỀ]

Bài viết đã được xuất bản tự động thành công đồng thời lên **Fanpage Kigyou List** và **Trang cá nhân** ở chế độ **Công khai (Public 🌐)**!

* 📌 **Chủ đề**: [Tiêu đề bài viết]
* 🎯 **Mục tiêu SEO**: [Từ khóa chính: ví dụ 法人リスト, コスト削減]
* 🔗 **Link bài viết Fanpage**: [URL bài viết trực tiếp]
* 🔗 **Link Fanpage chính thức**: https://www.facebook.com/kigyoulist/
* 👤 **Link Trang cá nhân**: https://www.facebook.com/profile.php?id=61595229033404
* 📊 **Link đích (CTA)**: [Link website kèm UTM tracking]

📸 **Minh chứng bài viết đã lên sóng thực tế**:
![Bằng chứng bài viết đã đăng](file:///c:/kigyou-list/scripts/facebook_fanpage_live.png)
```

---

## 5. Danh Mục Công Cụ Kỹ Thuật

* **File điều phối chính**: `c:\kigyou-list\scripts\facebook_publisher.py`
* **File dữ liệu 30 ngày**: `c:\kigyou-list\scripts\facebook_30_days_content.py`
* **Kế hoạch chiến lược tổng thể**: `c:\kigyou-list\FACEBOOK_SEO_STRATEGY_AND_EXECUTION_PLAN.md`
* **Hồ sơ phiên đăng nhập Facebook**: `c:\kigyou-list\.facebook_user_profile`
