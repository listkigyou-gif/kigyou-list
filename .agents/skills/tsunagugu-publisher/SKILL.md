---
name: tsunagugu-publisher
description: Chuyên gia soạn thảo thông cáo báo chí (Press Release) tiếng Nhật chuẩn văn phong PR B2B và tự động hóa xuất bản toàn diện 1-lệnh lên cổng báo chí ツナググ (press.portal-th.com) miễn phí 100% cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1, Bing Webmaster Tools, SEO AI (GEO), đồng bộ thực thể TQC株式会社, phủ sóng truyền thông B2B Nhật Bản.
---

# Tsunagugu (Portal-TH) Press Release Publisher Skill for Kigyou-list (Autonomous 1-Command Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **PR & Media Relations Specialist / SEO Entity Growth Lead** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên cổng phân phối thông cáo báo chí **ツナググ (https://press.portal-th.com/)** với **Chi phí 0 Yên (5 bài/tháng miễn phí, duyệt siêu tốc 5 - 15 phút)**.

---

## 1. Nguyên Tắc Vận Hành 1-Lệnh (Single-Command Autonomous Execution)

Khi người dùng ra lệnh:
> *"Đăng bài mới lên press.portal-th.com"* hoặc *"Chạy bài PR tiếp theo trên Tsunagugu"* hoặc *"Đăng bài tự động lên portal-th"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI TỪNG BƯỚC):**

1. **Chuẩn bị payload JSON**:
   - `title`: Tiêu đề giật tít báo chí chứa từ khóa Bing & Google TOP (`国内最大級500万件超`, `企業リスト`, `ダウンロード`).
   - `lead`: Đoạn mở đầu chuẩn mực báo chí Nhật Bản, định vị thương hiệu Kigyou-list và pháp nhân TQC株式会社.
   - `heading_1`, `body_1`, `heading_2`, `body_2`, `heading_3`, `body_3`: Cấu trúc 3 đoạn logic chặt chẽ.
   - `category`: `service` (サービス紹介).
   - `industry`: `g_net` (ネットサービス).
   - `company_name`: `TQC株式会社`
   - `business_desc`: `B2B企業データプラットフォーム「Kigyou-list」の企画・開発・運営`
   - `contact_name`: `キム　バン　チュン`
   - `email`: `info@kigyoulist.com`
   - `prefecture`: `tr13` (東京都)
   - `address`: `豊島区南池袋２丁目３３－６ 佐藤ビル３F`
   - `phone`: `03-6907-1219`
   - `url`: `https://kigyoulist.com/`
   - `under_5_this_month`: `sv010` (いいえ - Miễn phí)
   - `sns_option`: `sv02` (利用しない - 0 Yên)
   - `share_agreement`: `わかりました` (Đồng ý chia sẻ)
   - `consult_service`: `sg00` (特になし)
   - `image_path`: Banner 16:9 lưu tại `scripts/press_releases/eyecatch_01.jpg`.

2. **Kích hoạt Script xuất bản tự động**:
   - Kiểm tra thử nghiệm (Dry-Run):
     ```powershell
     python c:\kigyou-list\scripts\auto_publish_tsunagugu.py --dry-run
     ```
   - Xuất bản chính thức:
     ```powershell
     python c:\kigyou-list\scripts\auto_publish_tsunagugu.py --payload scripts\press_releases\release_tsunagugu_01.json
     ```

3. **Báo cáo kết quả**:
   - Ảnh chụp màn hình kết quả tại `scratch/tsunagugu_published.png` hoặc `scratch/tsunagugu_confirmation.png`.

---

## 2. Thông Tin Thực Thể Đồng Bộ Tuyệt Đối (Entity Truth)

- **Tên pháp nhân:** `TQC株式会社`
- **Địa chỉ:** `東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F` (Giải quyết truy vấn GSC `it企業 東京都豊島区`)
- **Điện thoại:** `03-6907-1219` (Giải quyết truy vấn GSC `03-6907-1219`, `0369071219`)
- **Mã số hóa đơn (Invoice):** `T4013301048678`
- **Đại diện / Liên hệ:** `キム　バン　チュン`
- **Domain chính thức:** `https://kigyoulist.com/`
