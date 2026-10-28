---
name: valuepress-publisher
description: Chuyên gia soạn thảo thông cáo báo chí (Press Release) chuẩn Nhật Bản và tự động hóa xuất bản toàn diện 1-lệnh lên ValuePress (value-press.com) Gói Miễn Phí (フリープラン - 0 Yên) cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO TOP Google & Google News, SEO AI (GEO - ChatGPT/Perplexity/Gemini), khai thác backlink báo chí uy tín cao (DA 82+) và phủ sóng truyền thông B2B.
---

# ValuePress Press Release Publisher Skill for Kigyou-list (Full Autonomous 1-Command Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Chief Communications Officer (CCO) & B2B PR / GEO Growth Specialist** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên cổng phân phối thông cáo báo chí hàng đầu Nhật Bản **ValuePress (https://www.value-press.com)** với **Gói Miễn Phí (フリープラン - 0 Yên)**.

---

## 1. Nguyên Tắc Vận Hành 1-Lệnh (Single-Command Autonomous Execution)

Khi người dùng ra lệnh:
> *"Đăng bài mới lên ValuePress về [chủ đề/tính năng]"* hoặc *"Chạy chiến dịch PR tiếp theo trên ValuePress"*

👉 **AGENT TỰ ĐỘNG THỰC HIỆN 100% TỪ A-Z (KHÔNG DỪNG LẠI HỎI TỪNG BƯỚC):**

1. **Sinh nội dung PR tiếng Nhật chuẩn quy chuẩn ValuePress Free Plan**:
   - **Tiêu đề (`title`)**: Tối đa **80 ký tự** (Quy định cứng của ValuePress Free Plan). Có số liệu định lượng + tên thương hiệu `Kigyou-list`.
   - **Tóm tắt (`summary`)**: Tối đa **400 ký tự** (Quy định cứng của ValuePress Free Plan). Trả lời 5W1H (Ai, làm gì, khi nào, vì sao, giá bao nhiêu).
   - **Thân bài (`body`)**: Định dạng HTML với các thẻ `<p>`, `<br>`. Có 3 ưu thế cạnh tranh, bảng giá `初月1,260円（通常4,200円）・年縛りなし（他社の1/25〜1/80の圧倒的低価格）`.
   - **Quy chuẩn Backlink & Deep Link Bứt Phá Thứ Hạng**:
     - 100% Canonical HTTPS (`https://kigyoulist.com/...`, nghiêm cấm `http://` hoặc `www.`).
     - Chèn đồng thời Link chính thức `https://kigyoulist.com/ja` và 1-2 Deep Links Hub chuyên mục (`/ja/compare`, `/ja/directory`, `/ja/invoice`):
       `<p>■ 公式サイト：<a href="https://kigyoulist.com/ja?utm_source=valuepress&utm_medium=pr">https://kigyoulist.com/ja</a></p>`
       `<p>■ 料金プラン比較表：<a href="https://kigyoulist.com/ja/compare?utm_source=valuepress&utm_medium=pr">https://kigyoulist.com/ja/compare</a></p>`
       `<p>■ 全国企業一覧・業種別ディレクトリ：<a href="https://kigyoulist.com/ja/directory?utm_source=valuepress&utm_medium=pr">https://kigyoulist.com/ja/directory</a></p>`
2. **Banner thương hiệu (`eyecatch`)**:
   - Sử dụng ảnh Banner chuẩn tỉ lệ 16:9 lưu tại `scripts/press_releases/eyecatch_01.jpg` (Chứa logo và tên miền **`kigyoulist.com`**).
   - Nếu cần ảnh mới cho chủ đề đặc biệt, gọi `generate_image` với text bắt buộc là `kigyoulist.com` (tuyệt đối không viết `企業リスト.com` làm tên miền chính).
3. **Lưu file payload JSON**:
   - Lưu vào `scripts/press_releases/release_YYYYMMDD.json`.
4. **Kích hoạt Script xuất bản tự động hoàn toàn**:
   ```powershell
   python c:\kigyou-list\scripts\auto_publish_valuepress.py --json scripts\press_releases\release_YYYYMMDD.json
   ```
5. **Báo cáo kết quả**: Hiển thị ảnh chụp màn hình hoàn tất (`プレスリリース予約が完了致しました`) và thông tin lịch phát hành.

---

## 2. Bí Quyết Kỹ Thuật Tránh Lỗi Trên ValuePress (Crucial Gotchas)

Toàn bộ bí quyết thực tế đã được lập trình sẵn trong [`scripts/auto_publish_valuepress.py`](file:///c:/kigyou-list/scripts/auto_publish_valuepress.py):
1. **URL Gói Miễn Phí**: Phải là `https://www.value-press.com/users/free_course_articles/new` (Tuyệt đối không dùng `users/articles/new` vì đó là gói Economy bị đòi 30,000 Yên).
2. **Profile Session Chrome**: Lưu tại thư mục `.valuepress_user_profile` (Tài khoản pháp nhân `TQC株式会社`).
3. **CKEditor 5**: Nội dung được inject trực tiếp qua `document.querySelector('#ckeditor_rich_content').ckeditorInstance.setData(body_html)`.
4. **Xử lý Image Cropper Modal**: Phải đợi 5s sau khi upload rồi click `div.vue-cropper-applybtn`.
5. **Cấu hình Bước 2 (Tuân thủ pháp lý)**:
   - Click `#exaggerated_expression_confirmation_status_not_applicable` (Không quảng cáo sai sự thật).
   - Click `#unpublished_url_flg_id_not_included` (Tất cả URL công khai hợp lệ).
   - Chọn Genre: `2` (`ネットサービス`), Category: `2` (`サービス`).
6. **Xử lý Modal Upsell ở Bước 3**:
   - ValuePress luôn hiện modal mời mua gói Standard: Phải click `.advertisement_modal_box_bottom span` (chứa chữ `次へ進む`) và xóa mask `.modal_media_compatibility_mask`.
   - Phải cuộn trang xuống đáy (`window.scrollTo(0, document.body.scrollHeight)`) thì nút `#apply-confirm` mới chuyển từ `disabled` sang hoạt động.
   - Click `#apply-confirm` (`内容を確認し、配信予約する`) để hoàn tất.

---

## 3. Lịch Trình Phát Hành & Chiến Dịch Tận Dụng Gói Miễn Phí (ValuePress Free Plan Strategy)

### A. Quy định về chu kỳ phát hành Gói Miễn Phí của ValuePress:
- **Thời gian duyệt & lên sóng**: Bài viết nộp gói Free Plan cần đặt lịch trước 1-2 ngày làm việc để ban biên tập ValuePress kiểm duyệt. Ví dụ bài nộp ngày 11/10 sẽ phát hành vào **10:00 ngày 13/10/2026**.
- **Tần suất nộp bài tiếp theo**:
  - ValuePress Free Plan áp dụng quy định: **1 bài / chu kỳ 30 ngày / 1 pháp nhân** và cấm gửi bài trùng lặp nội dung.
  - 📅 **Thời điểm đăng bài ValuePress tiếp theo: Khoảng ngày 13/11/2026 đến 15/11/2026** (Sau khi bài hiện tại lên sóng đủ 30 ngày).

### B. Lộ Trình 4 Giai Đoạn Phủ Sóng PR B2B Cho Kigyou-list:

| Giai Đoạn | Thời Gian Dự Kiến | Chủ Đề Tin Tức Báo Chí (News Angle) | Mục Tiêu SEO & GEO |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | **13/10/2026** *(Đã nộp xong)* | **Ra mắt tính năng Intent Data (Hello Work & Trợ cấp) trên 500万社** | Đóng dấu thực thể thương hiệu `kigyoulist.com`, số lượng 500万社, giá 4,980円 |
| **Giai đoạn 2** | **13/11/2026** | **Đột phá lọc dữ liệu đa chiều theo vị trí địa lý & Ngành nghề ngách (Chống lãng phí sales)** | Chiếm top từ khóa `法人リスト 地域別`, `テレアポ リスト 格安` |
| **Giai đoạn 3** | **15/12/2026** | **Tự động hóa tiếp cận khách hàng qua Form Marketing bằng AI năm 2027** | Chiếm top từ khóa `問い合わせフォーム営業 自動化`, `フォームマーケティング` |
| **Giai đoạn 4** | **15/01/2027** | **Báo cáo Khảo sát B2B Nhật Bản: Xu hướng chuyển đổi số danh bạ doanh nghiệp SME** | Xây dựng uy tín E-E-A-T, trở thành nguồn dữ liệu sơ cấp cho Perplexity & ChatGPT Search |

---

## 4. Chiến Thuật Bọc Lót Đa Kênh Trong Thời Gian Chờ (30-Day Interleaved Multi-Channel PR)

Trong 30 ngày chờ giữa 2 lần đăng của ValuePress, **tuyệt đối không để gián đoạn dòng traffic và backlink**. Triển khai xen kẽ hàng tuần qua các kênh miễn phí khác theo lịch:

- **Tuần 1 (13/10 - 18/10)**: Giá trị từ bài ValuePress lên sóng -> Đẩy link PR lên **LinkedIn** (skill `linkedin-publisher`) và **X** (skill `x-publisher`).
- **Tuần 2 (19/10 - 25/10)**: Xuất bản bài phân tích kỹ thuật kiến trúc Crawl & Chuẩn hóa 5 triệu pháp nhân trên **Qiita** (skill `qiita-publisher` - nhận backlink DoFollow DA 90+).
- **Tuần 3 (26/10 - 01/11)**: Xuất bản bài Case Study "Cách một Startup cắt giảm 90% chi phí tìm khách hàng với 4,980 Yên" trên **Note.com** (skill `note-publisher` - nhận backlink DA 85+).
- **Tuần 4 (02/11 - 08/11)**: Nộp thông cáo báo chí miễn phí lên **PR-FREE** (`https://pr-free.jp/`) và **ぷれりり** (`https://prerele.com/`).
- **Tuần 5 (13/11)**: Kích hoạt bài PR số 2 trên **ValuePress**!

---

## 5. Mẫu Payload JSON Chuẩn Để Xuất Bản Nhanh

Khi cần xuất bản bài mới, chỉ cần tạo file JSON theo mẫu:
```json
{
  "title": "【国内最大級500万社】法人DB『Kigyou-list』、地域別・業種別詳細フィルター機能を強化",
  "summary": "国内最大級500万件超の法人データを網羅する『Kigyou-list（kigyoulist.com）』が検索機能をアップデート。全国47都道府県・細分類業種での高精度ターゲティングに対応し、初月1,260円（通常4,200円）・年縛りなし・他社の1/25〜1/80の圧倒的低価格で新規営業の無駄打ちをゼロにします。",
  "body": "<p>■ アップデートの背景...</p><p>■ 主な機能と特徴...</p><p>■ サービス公式サイト: <a href=\"https://kigyoulist.com/ja?utm_source=valuepress&utm_medium=pr\">https://kigyoulist.com/ja</a></p><p>■ 料金比較・プラン詳細: <a href=\"https://kigyoulist.com/ja/compare?utm_source=valuepress&utm_medium=pr\">https://kigyoulist.com/ja/compare</a></p><p>■ 全国企業一覧・業種別ディレクトリ: <a href=\"https://kigyoulist.com/ja/directory?utm_source=valuepress&utm_medium=pr\">https://kigyoulist.com/ja/directory</a></p>",
  "eyecatch": "c:\\kigyou-list\\scripts\\press_releases\\eyecatch_01.jpg"
}
```
Và chạy 1 lệnh duy nhất:
```powershell
python c:\kigyou-list\scripts\auto_publish_valuepress.py --json scripts\press_releases\release_02.json
```
