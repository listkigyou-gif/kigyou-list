---
name: pressnow-publisher
description: Chuyên gia soạn thảo thông cáo báo chí (Press Release) B2B chuẩn Nhật Bản và tự động hóa xuất bản toàn diện 1-lệnh lên PRESSNOW (pressnow.jp) miễn phí 100% cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1 (Brand Entity TQC株式会社), SEO Bing & GEO (Perplexity/ChatGPT/Copilot), khai thác backlink báo chí uy tín cao và phủ sóng truyền thông B2B.
---

# PRESSNOW Press Release Publisher Skill for Kigyou-list (Full Autonomous 1-Command Mode)

Kỹ năng này thiết lập Agent hoạt động ở vai trò **Chief Communications Officer (CCO) & B2B PR / SEO Growth Specialist** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên cổng phân phối thông cáo báo chí **PRESSNOW (https://pressnow.jp/)** với **Chi phí 0 Yên (Gói Miễn Phí)**, tối ưu chuyển đổi từ các dữ liệu tìm kiếm thực tế của **Google Search Console** và **Bing Webmaster Tools**.

---

## 1. Nguyên Tắc Vận Hành 1-Lệnh (Single-Command Autonomous Execution)

Khi người dùng ra lệnh:
> *"Đăng bài lên PRESSNOW"* hoặc *"Tự động đăng thông cáo báo chí lên PRESSNOW về [chủ đề/tính năng]"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI TỪNG BƯỚC):**

1. **Phân tích dữ liệu tìm kiếm & Lập dàn ý**:
   - Khai thác từ khóa chuyển đổi cao từ Bing Webmaster (`企業リスト`, `SaaS カオスマップ 2026`, `財務諸表`, `売上高`, `営業リスト`).
   - Củng cố thực thể Brand Entity chuẩn Google Search Console (`TQC株式会社`, `03-6907-1219`, `東京都豊島区`).
2. **Sinh nội dung tiếng Nhật chuẩn cấu trúc PRESSNOW**:
   - **Loại hình (`listing_type`)**: Mặc định `無料掲載`.
   - **Danh mục (`category` / `sub_category_it`)**: `ＩＴ・通信` > `SaaS・クラウド` (hoặc `DX・業務効率化`).
   - **Tiêu đề (`title`)**: 30〜60 ký tự, từ khóa quan trọng ở nửa đầu.
   - **Phụ đề (`subtitle`)**: 40〜80 ký tự, tóm tắt đối tượng và giá trị giải pháp.
   - **Lead (`lead`)**: 100〜200 ký tự chuẩn 5W1H (Ai, cái gì, khi nào, ở đâu, lý do, bằng cách nào).
   - **Thân bài (`body_heading1-3`, `body_text1-3`)**: Bối cảnh thị trường, tính năng 5 triệu data + tài chính, định hướng AI matching.
   - **Thông tin công ty & 4 liên kết phụ Deep Hubs (`official`)**:
      - 🚫 **CHẤM DỨT NAKED URL & GENERIC ANCHOR:** Toàn bộ liên kết phụ và thân bài bắt buộc dùng Mỏ neo từ khóa vàng B2B.
      - ✅ **100% CANONICAL HTTPS NON-WWW:** Bắt buộc `https://kigyoulist.com/...` (nghiêm cấm `http://` hoặc `www.`).
      - ✅ **QUY CHUẨN MỎ NEO 4 LIÊN KẾT PHỤ (DEEP HUBS PAGERANK PROTOCOL):**
        - Sub 1 (Ranking Hub / Directory): `全国企業の平均年間給与ランキングTOP50` (`https://kigyoulist.com/ja/ranking/salary`) または `ホワイト企業・勤続年数ランキング` (`https://kigyoulist.com/ja/ranking/tenure`)
        - Sub 1-B (Directory Hub): `全国企業データベース・業種一覧` (`https://kigyoulist.com/ja/directory`)
        - Sub 2 (Pricing Hub): `企業リストツールの料金比較・初期費用0円` (`https://kigyoulist.com/ja/compare`)
        - Sub 3 (Invoice Hub): `適格請求書発行事業者・インボイス登録番号検索` (`https://kigyoulist.com/ja/invoice`)
        - Sub 4 (Official Brand Entity): `Kigyou-list公式X（Twitter）` (`https://x.com/kigyoulist`)
3. **Lưu file Payload JSON**:
   - Lưu vào `scripts/press_releases/release_pressnow_YYYYMMDD.json`.
4. **Kích hoạt Script xuất bản tự động bằng Playwright**:
   - Chạy lệnh kiểm tra / xuất bản:
     ```powershell
     # Chế độ gửi duyệt chính thức:
     python c:\kigyou-list\scripts\auto_publish_pressnow.py --json scripts\press_releases\release_pressnow_YYYYMMDD.json

     # Hoặc chế độ Dry-run (nếu người dùng yêu cầu chỉ kiểm tra trước):
     python c:\kigyou-list\scripts\auto_publish_pressnow.py --json scripts\press_releases\release_pressnow_YYYYMMDD.json --dry-run
     ```
5. **Báo cáo kết quả**: Cung cấp link ảnh chụp màn hình xác nhận kết quả (`pressnow_success.png` hoặc `pressnow_preview.png`).

---

## 2. Quy Chuẩn Kỹ Thuật Form PRESSNOW (Contact Form 7 + Conditionals)

1. **URL Form**: `https://pressnow.jp/pressform/`.
2. **Loại hình đăng (`listing-type`)**:
   - `無料掲載`: Miễn phí 100%. Yêu cầu sau khi duyệt xuất bản, website chính thức của công ty có đặt link giới thiệu bài viết này trên trang tin tức.
   - `スタンダード掲載（5,500円）`: Dành cho trường hợp không đặt link ngược.
3. **Các trường bắt buộc (Required Fields)**:
   - `company-name`, `your-name`, `your-tel`, `your-email`
   - `category`, `sub-category-it`
   - `release-title` (H1), `subtitle` (H2-H3), `release-lead` (5W1H)
   - `body-heading1`, `body-text1`, `body-heading2`, `body-text2`, `body-heading3`, `body-text3`
   - `official-company`, `official-site`
   - `release-image` (Banner 1200x675px, 16:9)
   - `confirm-site-url`, 4 checkbox cam kết `free-confirm[]` (khi chọn Free)
   - `antisocial-use[]`, `terms-agree[]`, `mail-check[]`
4. **Nút gửi**: `input.wpcf7-submit` (Value: `この内容で送信する`).
5. **Xác nhận thành công**: Redirect sang `https://pressnow.jp/thanks/` hoặc sự kiện `wpcf7mailsent`.

---

## 3. Mẫu Payload JSON Chuẩn

```json
{
  "listing_type": "無料掲載",
  "company_name": "TQC株式会社",
  "your_name": "高橋 里佳",
  "your_tel": "03-6907-1219",
  "your_email": "info@kigyoulist.com",
  "category": "ＩＴ・通信",
  "sub_category_it": "SaaS・クラウド",
  "title": "国内500万件超の企業データベース「kigyou-list」に2026年最新SaaS連携・財務データ分析機能を追加",
  "subtitle": "B2B営業リスト作成から企業信用調査までをワンストップ化。中小企業の新規開拓とDX推進を支援する新機能を公開。",
  "lead": "TQC株式会社（本社：東京都豊島区、代表取締役：天間 吉人）は、2026年10月より、日本全国500万件超の法人データを網羅する企業情報プラットフォーム「kigyou-list」において、最新の「SaaSカオスマップ2026連携機能」および「売上高・財務諸表の精密検索フィルター」を正式リリースしました。営業効率化と与信管理の両立を実現します。",
  "body_heading1": "背景と課題：質の高いB2B営業リストと企業財務データの不足",
  "body_text1": "...",
  "body_heading2": "新機能の特徴：500万件超の網羅性×財務データ×SaaSカオスマップ2026連携",
  "body_text2": "...",
  "body_heading3": "今後の展望：AI技術を活用した次世代ビジネスマッチングの展開",
  "body_text3": "...",
  "remarks": "※本リリースに関する画像素材や詳細データは公式サイトおよびお問い合わせ窓口よりご請求いただけます。",
  "image_path": "scripts/press_releases/eyecatch_01.jpg",
  "confirm_site_url": "https://kigyoulist.com/news/pressnow-coverage",
  "official": {
    "company": "TQC株式会社",
    "address": "東京都豊島区池袋2丁目",
    "person": "広報担当：高橋 里佳",
    "tel": "03-6907-1219",
    "site": "https://kigyoulist.com/ja",
    "email": "info@kigyoulist.com",
    "sub_url1_label": "全国500万社データベース・業種一覧",
    "sub_url1": "https://kigyoulist.com/ja/directory",
    "sub_url2_label": "企業リストツールの料金比較・機能一覧",
    "sub_url2": "https://kigyoulist.com/ja/compare",
    "sub_url3_label": "適格請求書発行事業者・インボイス登録番号検索",
    "sub_url3": "https://kigyoulist.com/ja/invoice",
    "sub_url4_label": "公式X（旧Twitter）",
    "sub_url4": "https://x.com/kigyoulist"
  }
}
```

---

## 4. Tự Động Kiểm Tra Quá Trình Duyệt Bài (Live Web & Gmail Monitor)

Khi người dùng hỏi:
> *"Bài viết đã được duyệt chưa?"* hoặc *"Kiểm tra email xem PRESSNOW đã phản hồi chưa"*

👉 **AGENT TỰ ĐỘNG CHẠY 2 CƠ CHẾ KIỂM TRA:**

1. **Kiểm tra trực tiếp trên Cổng Báo Chí PRESSNOW**:
   ```powershell
   python c:\kigyou-list\scripts\check_pressnow_live.py "kigyou-list"
   ```
   - Quét xem bài viết đã được ban biên tập xuất bản công khai hay chưa.

2. **Kiểm tra Hộp thư Gmail quản trị (`listkigyou@gmail.com`)**:
   ```powershell
   python c:\kigyou-list\scripts\gmail_inbox_monitor.py
   ```
   - Tự động đăng nhập qua IMAP SSL, quét toàn bộ Inbox và Spam để lấy email thông báo kết quả duyệt bài từ Ban biên tập PRESSNOW.


> [!IMPORTANT]
> **QUY TẮC BẢO TOÀN TÊN MIỀN THƯƠNG HIỆU (DOMAIN INTEGRITY):**
> Tuyệt đối cấm viết tên miền dạng `kigyoulist.com`. Tên miền chính thức của nền tảng 100% là **`kigyoulist.com`**. Khi giới thiệu dịch vụ bằng tiếng Nhật, chỉ viết: `Kigyou-list` hoặc `Kigyou-list（kigyoulist.com）`.

---

## 5. Mẫu Thông Cáo Báo Chí Điều Tra Thu Hút Báo Lớn (【独自調査リリース】)

Kích hoạt kịch bản điều tra độc quyền để các tòa soạn báo lớn cào và đưa tin lại:
- **Tiêu đề (`title`)**: `【独自調査】全国企業の平均年間給与ランキングTOP50を発表！1位は1,235万円の野村総合研究所。公認証券報告書データから独自集計`
- **Phụ đề (`subtitle`)**: `国内最大級500万社データベース『Kigyou-list』が有価証券報告書を分析。ホワイト企業・被保険者数ランキングも公開し全社CSV出力に対応。`
- **Lead (`lead`)**: `TQC株式会社（本社：東京都豊島区、代表取締役：天間 吉人）は、国内最大級500万件超の法人データを網羅する「Kigyou-list（kigyoulist.com）」において、金融庁EDINET開示の有価証券報告書に基づく「全国企業の平均年間給与ランキングTOP50」および厚生労働省データに基づく「ホワイト企業ランキング」を公表いたしました。`
- **Deep links trong Thân bài & Sub links**:
  - `https://kigyoulist.com/ja/ranking/salary`
  - `https://kigyoulist.com/ja/ranking/tenure`
  - `https://kigyoulist.com/ja/ranking/employees`
- **Quy tắc trích dẫn nguồn**:
  `※本調査結果を引用・転載される際は、必ず【出典：法人データベース『Kigyou-list（kigyoulist.com）』】のクレジットおよびリンクを明記してください。`
