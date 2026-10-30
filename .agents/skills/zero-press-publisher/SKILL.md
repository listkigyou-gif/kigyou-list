---
name: zero-press-publisher
description: Chuyên gia soạn thảo thông cáo báo chí (Press Release) tiếng Nhật chuẩn văn phong PR B2B và tự động hóa xuất bản toàn diện 1-lệnh lên Zero-Press (zero-press.net) miễn phí 100% cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1, Bing Webmaster, SEO AI (GEO), đồng bộ thực thể TQC株式会社, phủ sóng tới 20 cơ quan truyền thông báo chí lớn tại Nhật Bản.
---

# Zero-Press Press Release Publisher Skill for Kigyou-list (Full Autonomous 1-Command Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Chief Communications Officer (CCO) & PR / SEO Growth Specialist** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên cổng phân phối thông cáo báo chí miễn phí **Zero-Press (https://zero-press.net/)** (thuộc Sakinext Co., Ltd) với **Chi phí 0 Yên, tự động phân phối tới 20 cơ quan truyền thông báo chí lớn**.

---

## 1. Nguyên Tắc Vận Hành 1-Lệnh (Single-Command Autonomous Execution)

Khi người dùng ra lệnh:
> *"Đăng bài mới lên Zero-Press"* hoặc *"Chạy bài PR tiếp theo trên Zero-Press"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI TỪNG BƯỚC):**

1. **Chuẩn bị payload bài viết JSON**:
   - `title`: Tiêu đề giật tít chuẩn phong cách báo chí B2B Nhật Bản, có con số định lượng (`500万社`, `初月1,260円`, `1日20件CSV永久無料`).
   - `summary`: Tóm tắt mở đầu súc tích (150 - 250 ký tự), nêu rõ tên pháp nhân vận hành **TQC株式会社** và thương hiệu **Kigyou-list**.
   - `body_html`: Nội dung chuẩn HTML (thẻ `<p>`, `<h2>`, `<h3>`, `<strong>`, `<a>`, `<br>`).
      - **Quy chuẩn Backlink & Deep Link Bứt Phá Thứ Hạng (Hub & Spoke Protocol)**:
        - 🚫 **CẤM TUYỆT ĐỐI NAKED URL & GENERIC ANCHOR TEXT:** Không bao giờ để thẻ `<a>` hiển thị URL trần hoặc từ generic (`こちら`, `詳細`). Khai tử việc chèn link trần, chuyển đổi 100% sang Mỏ neo từ khóa vàng tiếng Nhật (High-Volume Commercial B2B Anchor Texts).
        - ✅ **100% CANONICAL HTTPS NON-WWW:** Bắt buộc `https://kigyoulist.com/...` (nghiêm cấm `http://` hoặc `www.`).
        - ✅ **CÔNG THỨC 1+2 BẮT BUỘC (1 Link Cốt Lõi + 1–2 Deep Links Hub):**
          `<p>■ <a href="https://kigyoulist.com/ja?utm_source=zeropress&utm_medium=pr">国内最大級500万社を網羅する企業リスト・法人データベース Kigyou-list 公式サイト</a></p>`
          `<p>■ <a href="https://kigyoulist.com/ja/compare?utm_source=zeropress&utm_medium=pr">企業リストツールの料金プラン比較・初期費用0円（初月1,260円・年縛りなし）</a></p>`
          `<p>■ <a href="https://kigyoulist.com/ja/directory?utm_source=zeropress&utm_medium=pr">全国企業データベース・業種一覧ディレクトリ検索</a></p>
   - `category`: `tech`, `product`, `business`, hoặc `research` (ưu tiên `research` khi đăng bài xếp hạng / điều tra độc quyền).
   - `ranking_deep_links`:
     - `<p>■ <a href="https://kigyoulist.com/ja/ranking/salary?utm_source=zeropress&utm_medium=pr">【独自調査】全国企業の平均年間給与ランキングTOP50</a></p>`
     - `<p>■ <a href="https://kigyoulist.com/ja/ranking/tenure?utm_source=zeropress&utm_medium=pr">【ホワイト企業調査】平均勤続年数ランキングTOP100</a></p>`
     - `<p>■ <a href="https://kigyoulist.com/ja/ranking/employees?utm_source=zeropress&utm_medium=pr">【実質規模調査】厚生年金被保険者数ランキングTOP100</a></p>`
     - `<p>※本調査結果を引用・転載される際は必ず【出典：Kigyou-list】のクレジットおよびリンクを明記してください。</p>`
   - `delivery`: `published` (phát hành ngay), `scheduled` (hẹn giờ), hoặc `draft` (lưu nháp).
   - `image_path`: Banner 16:9 lưu tại `scripts/press_releases/eyecatch_01.jpg`.
2. **Kích hoạt Script xuất bản tự động hoàn toàn**:
   ```powershell
   python c:\kigyou-list\scripts\auto_publish_zero_press.py --json scripts\press_releases\release_zero_press_01.json
   ```
3. **Báo cáo kết quả**: URL bài viết live trên Zero-Press và ảnh chụp màn hình xác nhận hoàn tất `scratch/zero_press_published.png`.

---

## 2. Thông Tin Thực Thể & Sản Phẩm Chuẩn Xác (Entity Truth)

- **Đơn vị chủ quản / Tài khoản:** `TQC株式会社` (Tokyo Toshima-ku). Đồng bộ với thực thể tìm kiếm trên Google Search Console (`tqc株式会社` Rank #9.3).
- **Thương hiệu:** `Kigyou-list（kigyoulist.com）` - Cơ sở dữ liệu 5,000,000+ doanh nghiệp toàn quốc.
- **Gói Miễn Phí (フリープラン):**
  - **1 ngày 20 CSV (khoảng 600 CSV/tháng)** hoàn toàn miễn phí trọn đời (永久無料).
  - Không cần thẻ tín dụng, không ràng buộc thời hạn.
- **Gói Tiêu Chuẩn (スタンダードプラン):**
  - Khuyến mãi tháng đầu: **1,260円** (giảm 70% từ 4,200円). Không ràng buộc hợp đồng năm.

---

## 3. Ma Trận Chiến Thuật 3 Kênh PR Phối Hợp

| Kênh PR | Tần Suất | Chi Phí | Thế Mạnh & Đặc Thù | Điểm Khác Biệt |
| :--- | :--- | :--- | :--- | :--- |
| **Zero-Press (zero-press.net)** | 3 - 5 ngày / 1 bài | 0 Yên | Tự động phân phối tới **20 đơn vị báo chí lớn**, giao diện soạn thảo HTML hiện đại, hỗ trợ hẹn giờ | Tích hợp thực thể `TQC株式会社`, link HTML dofollow/in-body |
| **PR-FREE (pr-free.jp)** | 10 - 14 ngày / 1 bài | 0 Yên | Phân phối tin tức B2B linh hoạt, duyệt nhanh 5 - 60 phút, không cần đăng nhập | Định dạng Plain Text, hỗ trợ SEO từ khóa ngách |
| **ValuePress (value-press.com)** | 30 ngày / 1 bài | 0 Yên (Free Plan) | Kênh thông cáo báo chí chính thống uy tín cao nhất (DA 82+), mạng lưới truyền thông cấp quốc gia | Duyệt nghiêm ngặt, tần suất 1 bài/tháng |

---

## 4. Cấu Trúc Payload JSON Chuẩn

```json
{
  "title": "国内最大級500万社を網羅する法人データベース『Kigyou-list』が正式リリース。初月1,260円・永久無料プラン（1日20件CSV）で中小企業の営業DXを支援",
  "summary": "TQC株式会社は、日本全国500万件超の法人データを網羅し、業界最安値水準の月額1,260円〜（年間契約縛りなし）で利用可能なB2B営業・マーケティング支援プラットフォーム『Kigyou-list（kigyoulist.com）』の提供を本格開始いたしました。",
  "category": "tech",
  "delivery": "published",
  "image_path": "c:\\kigyou-list\\scripts\\press_releases\\eyecatch_01.jpg",
  "body_html": "<p>TQC株式会社（本社：東京都豊島区）は、国内最大級500万社超の法人データベース...</p><p>■ 企業リスト・法人データベース公式サイト: <a href=\"https://kigyoulist.com/ja?utm_source=zeropress&utm_medium=pr\">https://kigyoulist.com/ja</a></p><p>■ 料金プラン比較表: <a href=\"https://kigyoulist.com/ja/compare?utm_source=zeropress&utm_medium=pr\">https://kigyoulist.com/ja/compare</a></p><p>■ 全国企業データベース・業種一覧: <a href=\"https://kigyoulist.com/ja/directory?utm_source=zeropress&utm_medium=pr\">https://kigyoulist.com/ja/directory</a></p>"
}
```

> [!IMPORTANT]
> **QUY TẮC BẢO TOÀN TÊN MIỀN THƯƠNG HIỆU (DOMAIN INTEGRITY):**
> Tuyệt đối cấm viết tên miền dạng `kigyoulist.com`. Tên miền chính thức của nền tảng 100% là **`kigyoulist.com`**. Khi giới thiệu dịch vụ bằng tiếng Nhật, chỉ viết: `Kigyou-list` hoặc `Kigyou-list（kigyoulist.com）`.
