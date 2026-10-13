---
name: pr-free-publisher
description: Chuyên gia soạn thảo thông cáo báo chí (Press Release) tiếng Nhật chuẩn văn phong báo chí B2B và tự động hóa xuất bản toàn diện 1-lệnh lên PR-FREE (pr-free.jp) miễn phí 100% cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1, SEO AI (GEO - ChatGPT/Perplexity/Gemini), củng cố thực thể thương hiệu (Entity Authority), xây dựng backlink báo chí uy tín và phủ sóng truyền thông B2B.
---

# PR-FREE Press Release Publisher Skill for Kigyou-list (Full Autonomous 1-Command Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Chief Communications Officer (CCO) & B2B PR / GEO Growth Specialist** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên cổng phân phối thông cáo báo chí miễn phí hàng đầu Nhật Bản **PR-FREE (https://pr-free.jp/)** với **Chi phí 0 Yên, không cần số điện thoại, duyệt siêu tốc 5 - 60 phút**.

---

## 1. Nguyên Tắc Vận Hành 1-Lệnh (Single-Command Autonomous Execution)

Khi người dùng ra lệnh:
> *"Đăng bài mới lên PR-FREE về [chủ đề/tính năng]"* hoặc *"Chạy chiến dịch PR tiếp theo trên PR-FREE"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI TỪNG BƯỚC):**

1. **Sinh nội dung PR tiếng Nhật chuẩn quy chuẩn PR-FREE**:
   - **Tên thương hiệu (`company_brand`)**: Tối đa **10-15 ký tự** (ví dụ: `Kigyou-list`).
   - **Tiêu đề (`title`)**: Tối đa **140 ký tự** (Khuyên dùng 40-70 ký tự). Có số liệu định lượng (`500万社`, `月額4,980円`) + góc nhìn tin tức.
   - **Phụ đề (`subtitle`)**: Tối đa **140 ký tự** (Nêu bật giải pháp: Giảm 90% chi phí tìm khách hàng, không ràng buộc hợp đồng năm).
   - **Thân bài (`body`)**: Plain text (**Tối thiểu 300 ký tự**). Không dùng HTML tags `<p>`, `<a>`. Sử dụng ký tự phân cách như `■`, `━━━━━━━━━━━━━` để chia đoạn rõ ràng. Luôn gắn link chính thức kèm tracking: `https://kigyoulist.com/?utm_source=prfree&utm_medium=pr`.
2. **Banner thương hiệu (`image_path`)**:
   - Sử dụng ảnh Banner chuẩn tỉ lệ 16:9 lưu tại `scripts/press_releases/eyecatch_01.jpg` (Chứa logo và tên miền **`kigyoulist.com`**).
3. **Lưu file payload JSON**:
   - Lưu vào `scripts/press_releases/release_pr_free_YYYYMMDD.json`.
4. **Kích hoạt Script xuất bản tự động hoàn toàn**:
   ```powershell
   python c:\kigyou-list\scripts\auto_publish_pr_free.py --json scripts\press_releases\release_pr_free_YYYYMMDD.json
   ```
5. **Báo cáo kết quả**: Hiển thị ảnh chụp màn hình xác nhận hoàn tất `pr_free_success.png` và thông tin thời gian chờ duyệt.

---

## 2. Bí Quyết Định Dạng & Kỹ Thuật PR-FREE (Crucial Specs & Gotchas)

1. **URL Đăng Ký**: Biểu mẫu tại `https://pr-free.jp/prform/`.
2. **Không Cần Tài Khoản / Số Điện Thoại**: Bất kỳ ai cũng có thể gửi bài, không có hệ thống đăng nhập.
3. **Form Kiến Trúc 2 Bước**:
   - Bước 1: Điền thông tin -> Bấm `input.wpcf7c-btn-confirm` (đồng ý điều khoản và xác nhận).
   - Bước 2: Xem lại nội dung -> Bấm `input.wpcf7-submit` (Gửi bài chính thức).
4. **Quy Định Thân Bài (Plain Text Only)**:
   - PR-FREE xử lý text thô và tự động chuyển đổi xuống dòng thành `<p>`, `<br>`. Tuyệt đối không paste code HTML `<p>` hoặc `<a>` vì sẽ bị hiển thị nguyên văn chuỗi HTML thô ra bài viết.
5. **Độ Dài Tối Thiểu**: Thân bài phải từ **300 ký tự trở lên**, nếu dưới 300 ký tự sẽ bị Contact Form 7 chặn lại.
6. **Tốc Độ Duyệt**:
   - 92% tỷ lệ duyệt.
   - Thường lên sóng sau 5 phút đến 1 giờ. Không thể đặt trước ngày giờ như ValuePress mà được duyệt duyệt cuốn chiếu theo thời gian gửi (khuyên gửi vào giờ hành chính 9:00 - 17:00 Nhật Bản).

---

## 3. Chiến Thuật Đa Kênh Phối Hợp Giữa PR-FREE & ValuePress

| Kênh | Tần Suất Đề Xuất | Thế Mạnh & Vai Trò | Backlink & SEO Attribute |
| :--- | :--- | :--- | :--- |
| **ValuePress** | 30 ngày / 1 bài | Báo chí chính thống cấp quốc gia, liên kết truyền thông hàng đầu | High Authority DA 82+, đặt lịch phát hành trước |
| **PR-FREE** | 10-14 ngày / 1 bài | Linh hoạt, duyệt trong ngày, mở rộng độ phủ keyword ngách | Fast Indexing, Entity Co-occurrence, GEO citations |
| **Qiita** | Hàng tuần | Dân kỹ thuật & Developer, kiến trúc Crawler 5 triệu công ty | DoFollow DA 90+ |
| **Note.com** | Hàng tuần | Giới kinh doanh SME, Case study cắt giảm 90% chi phí sales | High Authority DA 85+ |
| **X (Twitter)** | Hàng ngày | Khuếch đại tin tức, tương tác B2B | Real-time social signal |
| **LinkedIn** | Hàng tuần | Kết nối C-Level, đối tác đại lý & doanh nghiệp | B2B decision-maker network |

---

## 4. Mẫu Payload JSON Chuẩn

```json
{
  "team_name": "Kigyou-list運営事務局",
  "contact_name": "広報担当",
  "email": "contact@kigyoulist.com",
  "url": "https://kigyoulist.com/?utm_source=prfree&utm_medium=pr",
  "category": "ＩＴ・通信",
  "company_brand": "Kigyou-list",
  "title": "国内最大級500万社を網羅する法人データベース『Kigyou-list』が大型アップデート。月額4,980円で求人・助成金シグナルに対応",
  "subtitle": "初期費用0円・年間契約の縛りなし。中小企業やスタートアップの新規開拓コストを最大90%削減する営業DXを推進。",
  "body": "国内最大級500万件超の法人オープンデータを統合するB2B営業・マーケティング支援プラットフォーム『Kigyou-list（企業リスト.com）』は、ハローワークの最新求人募集情報および政府助成金・補助金採択シグナルを抽出可能な大型アップデートを実施いたしました。\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n■ サービス概要\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n・サービス名：Kigyou-list（企業リスト.com）\n・公式サイト：https://kigyoulist.com/?utm_source=prfree&utm_medium=pr\n・利用料金：月額 4,980円（税込）\n・初期費用：0円（即日利用可能）",
  "image_path": "c:\\kigyou-list\\scripts\\press_releases\\eyecatch_01.jpg"
}
```
