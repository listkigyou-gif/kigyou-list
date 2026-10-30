---
name: free-pressrelease-publisher
description: Chuyên gia soạn thảo thông cáo báo chí (Press Release) tiếng Nhật chuẩn văn phong PR B2B và tự động hóa xuất bản toàn diện 1-lệnh lên FREE PRESS RELEASE (free-pressrelease.com/pressrelease/) miễn phí 100% cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1, Bing Webmaster Tools, SEO AI (GEO), đồng bộ thực thể TQC株式会社, phủ sóng truyền thông báo chí và mạng xã hội B2B Nhật Bản.
---

# Free-PressRelease Publisher Skill for Kigyou-list (Autonomous 1-Command Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Chief Communications Officer (CCO) & PR / SEO Entity Lead** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên cổng phân phối thông cáo báo chí miễn phí **FREE PRESS RELEASE (https://free-pressrelease.com/pressrelease/)** với **Chi phí 0 Yên, duyệt từ 1h - 7 ngày, tự động đồng bộ lên Facebook và X của Venture News**.

---

## 1. Nguyên Tắc Vận Hành 1-Lệnh (Single-Command Autonomous Execution)

Khi người dùng ra lệnh:
> *"Đăng bài lên Free-PressRelease"* hoặc *"Tự động đăng bài free-pressrelease"* hoặc *"Chạy bài PR tiếp theo trên free-pressrelease"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI TỪNG BƯỚC):**

1. **Chuẩn bị payload bài viết JSON**:
   - `company_name`: `TQC株式会社` (Pháp nhân chính thức, không slogan).
   - `contact_name`: `キム　バン　チュン` (Tên thật, không nickname).
   - `phone`: `03-6907-1219` (Bắt buộc có dấu gạch ngang `-`).
   - `url`: `https://kigyoulist.com/ja` (100% Canonical HTTPS Non-WWW, không điền email).
   - `email`: `info@kigyoulist.com`
   - `title`: Tiêu đề giật tít báo chí chứa từ khóa Bing & Google TOP (`500万社`, `企業リスト`, `初月1,260円`, `永久無料プラン`).
   - `subtitle`: Phụ đề súc tích (100 - 180 ký tự), giải quyết trực tiếp nỗi đau B2B chi phí cao.
   - `body`: Nội dung chuẩn thông cáo báo chí Nhật Bản (Bối cảnh, tính năng, bảng giá, thông tin công ty).
      - **Quy chuẩn Backlink & Deep Link Bứt Phá Thứ Hạng (Hub & Spoke Protocol)**:
        - 🚫 **CHẤM DỨT NAKED URLS & ANCHOR GENERIC:** 100% sử dụng Mỏ neo từ khóa vàng B2B ngay trước URL để Google/Bing bot hiểu đúng thực thể.
        - ✅ **100% CANONICAL HTTPS NON-WWW:** Bắt buộc `https://kigyoulist.com/...` (loại bỏ hoàn toàn `http://` và `www.`).
        - ✅ **CÔNG THỨC 1+2 BẮT BUỘC (1 Link Cốt Lõi + 1–2 Deep Links Hub):**
          - `■ 500万社網羅の企業リスト・法人データベース Kigyou-list 公式サイト：https://kigyoulist.com/ja`
          - `■ 企業リストツールの料金プラン・機能比較表（初月1,260円・年縛りなし）：https://kigyoulist.com/ja/compare`
          - `■ 全国企業データベース・業種一覧ディレクトリ：https://kigyoulist.com/ja/directory`
          - `■ 【独自調査】全国企業の平均年間給与ランキングTOP50：https://kigyoulist.com/ja/ranking/salary`
          - `■ 【ホワイト企業調査】平均勤続年数ランキングTOP100：https://kigyoulist.com/ja/ranking/tenure`
          - `■ 【実質規模調査】厚生年金被保険者数ランキングTOP100：https://kigyoulist.com/ja/ranking/employees`
          - `※本調査結果を引用・転載される際は必ず【出典：Kigyou-list】のクレジットおよびリンクを明記してください。`
   - `image_path`: Banner 16:9 lưu tại `scripts/press_releases/eyecatch_01.jpg`.

2. **Kích hoạt Script xuất bản tự động hoàn toàn**:
   - **Chạy kiểm tra (Dry-Run):**
     ```powershell
     python c:\kigyou-list\scripts\auto_publish_free_pressrelease.py --payload scripts\press_releases\release_free_pressrelease_01.json --dry-run
     ```
   - **Xuất bản chính thức:**
     ```powershell
     python c:\kigyou-list\scripts\auto_publish_free_pressrelease.py --payload scripts\press_releases\release_free_pressrelease_01.json
     ```

3. **Báo cáo kết quả**:
   - Minh chứng form đã điền đầy đủ: `scratch/free_pressrelease_filled.png`.
   - Minh chứng gửi thành công: `scratch/free_pressrelease_submitted.png`.
   - Lập kế hoạch kiểm tra index trên Bing Webmaster Tools & Google Search Console.

---

## 2. Thông Tin Thực Thể Đồng Bộ Tuyệt Đối (Entity Truth)

- **Tên pháp nhân:** `TQC株式会社`
- **Địa chỉ:** `東京都豊島区東池袋1-34-5 いちご東池袋ビル6階` (Khớp truy vấn GSC `it企業 東京都豊島区`)
- **Điện thoại:** `03-6907-1219` (Khớp truy vấn GSC `03-6907-1219`, `0369071219`)
- **Website đại diện:** `https://kigyoulist.com/ja` (100% Canonical HTTPS Non-WWW)
- **Tài khoản profile lưu trữ:** `.free_pressrelease_user_profile` (Lưu session Google Account).

---

## 3. Lộ Trình 3 Bài Viết B2B Trọng Điểm Đã Được Soạn Sẵn

1. **Bài 1:** CSDL 5 triệu doanh nghiệp & Gói vĩnh viễn 20 CSV/ngày
   - File: `scripts/press_releases/release_free_pressrelease_01.json`
   - Mục tiêu: Chiếm lĩnh Top 1-3 Bing & Google cho `企業リスト`, `法人データベース`.
2. **Bài 2:** Nâng cấp tính năng tra cứu ngược SĐT 03 & Lọc theo địa bàn / IT Toshima-ku
   - File: `scripts/press_releases/release_free_pressrelease_02.json`
   - Mục tiêu: Đón đầu lượng tìm kiếm trên GSC về hotline `03-6907-1219` và pháp nhân IT.
3. **Bài 3:** Báo cáo thị trường SaaS & B2B Data Map 2026
   - File: `scripts/press_releases/release_free_pressrelease_03.json`
   - Mục tiêu: Đẩy mạnh thứ hạng từ khóa `saas カオスマップ 2026` từ Top #5 lên Top 1-3 Bing.

> [!IMPORTANT]
> **QUY TẮC BẢO TOÀN TÊN MIỀN THƯƠNG HIỆU (DOMAIN INTEGRITY):**
> Tuyệt đối cấm viết tên miền dạng `kigyoulist.com`. Tên miền chính thức của nền tảng 100% là **`kigyoulist.com`**. Khi giới thiệu dịch vụ bằng tiếng Nhật, chỉ viết: `Kigyou-list` hoặc `Kigyou-list（kigyoulist.com）`.
