---
name: google-search-console
description: Cẩm nang tối ưu hóa SEO Google Search Console (GSC Master Engine), chẩn đoán & xử lý triệt để 8 lỗi lập chỉ mục (Coverage & Indexing Doctor), khai phá từ khóa vàng (Quick Wins CTR Booster), phát hiện ăn thịt từ khóa (Cannibalization Detection), cảnh báo suy giảm traffic (Content Decay) và thanh tra Googlebot thời gian thực (URL Inspection API) cho nền tảng Kigyou-list (kigyoulist.com).
---

# Google Search Console Optimization Engine for Kigyou-list
# (全サイトGoogleサーチコンソール最適化・インデックス診断マスター基盤)

Tài liệu này xác lập **Quy chuẩn Tối ưu hóa SEO Kỹ thuật & Cẩm nang Vận hành Toàn diện trên Google Search Console** cho nền tảng **Kigyou-list (https://kigyoulist.com)** quy mô hơn 5.07 triệu doanh nghiệp Nhật Bản.

Hệ thống được chắt lọc từ các kiến trúc mã nguồn mở hàng đầu thế giới về SEO Automation & Data Intelligence (`Suganthans-GSC-MCP`, `advertools`, `joshcarty/google-searchconsole`), tích hợp trực tiếp vào hạ tầng của Kigyou-list.

---

## 1. HẠ TẦNG KẾT NỐI & THẨM QUYỀN TRUY CẬP (AUTHORITY & ACCESS)

Hệ thống được xác thực trực tiếp với Google Search Console API v1 thông qua tài khoản Service Account có thẩm quyền cao nhất:

* **Domain Property chính:** `sc-domain:kigyoulist.com` (Bao quát 100% tất cả subdomain và giao thức https/http).
* **Tài khoản Service Account:** `gsc-agent@kigyoulist-seo.iam.gserviceaccount.com`
* **Mức độ phân quyền:** `siteOwner` (Chủ sở hữu tên miền - Full Quyền Quản trị, Nộp Sitemap, Truy vấn Analytics và Gọi URL Inspection).
* **File khóa xác thực:** `c:\kigyou-list\google_credentials.json` (hoặc biến môi trường `GOOGLE_APPLICATION_CREDENTIALS`).
* **Giao diện Web UI:** [https://search.google.com/search-console](https://search.google.com/search-console) (có thể phối hợp cùng `browser_subagent` để chụp ảnh đồ thị, xem báo cáo Coverage khi cần).

---

## 2. BỘ BA THUẬT TOÁN TRÍ TUỆ SEO (DISTILLED SEO INTELLIGENCE)

Hệ thống vận hành 3 thuật toán phân tích chuyên sâu giải quyết bài toán tăng trưởng traffic cho kho dữ liệu 5 triệu trang:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   BỘ BA THUẬT TOÁN TRÍ TUỆ GOOGLE SEARCH CONSOLE                      │
├─────────────────────────┬─────────────────────────┬────────────────────────────────────┤
│ 1. QUICK-WINS CTR       │ 2. CANNIBALIZATION      │ 3. CONTENT DECAY WATCHDOG          │
│    BƠM TRAFFIC CẤP TỐC  │    CHỐNG ĂN THỊT TỪ KHÓA│    PHÒNG CHỐNG TỤT HẠNG DÀI HẠN    │
├─────────────────────────┼─────────────────────────┼────────────────────────────────────┤
│ • Lọc Query: Impr >= 5  │ • Quét các Query kích   │ • So sánh chu kỳ 28 ngày hiện tại  │
│ • Rank: #4 - #20        │   hoạt >= 2 URL cùng lúc│   với 28 ngày liền kề trước đó     │
│ • CTR: <= 3.5% (Dưới TB)│ • Tính độ phân tán Impr │ • Báo động đỏ khi Clicks tụt >= 20%│
│ • Tự sinh khuyến nghị   │ • Ép Canonical dứt khoát│   hoặc Rank tụt >= 3 bậc           │
│   Title/Meta tiếng Nhật │   hoặc củng cố Internal │ • Đề xuất cập nhật dữ liệu tài     │
│   đánh trúng tâm lý B2B │   Link về trang Hub chủ │   chính EDINET/Invoice mới nhất    │
└─────────────────────────┴─────────────────────────┴────────────────────────────────────┘
```

### A. Quick-Wins CTR Booster (Bứt phá Traffic không cần chờ đẩy Rank)
* **Nguyên lý:** Một từ khóa đang đứng ở Top 4 đến 15 trên Google đã có hàng chục đến hàng trăm lượt hiển thị (Impressions) mỗi tháng. Người dùng Nhật nhìn thấy kết quả nhưng không click vì Title Tag hoặc Meta Description chưa đủ sức hấp dẫn hoặc thiếu thông tin họ tìm kiếm (法人番号, 決算, 評判, 電話番号).
* **Quy tắc tối ưu hóa Title/Snippet B2B Nhật:**
  1. *Truy vấn tên pháp nhân (`株式会社...`):* Thêm ngay tiền tố/hậu tố: `【企業情報・法人番号・所在地】`.
  2. *Truy vấn số điện thoại (`03-...`):* Hiển thị rõ ràng trong Meta Description: `電話番号・事業者特定・公式企業情報・インボイス登録番号`.
  3. *Truy vấn theo ngành/khu vực (`IT企業 東京都豊島区`):* Bổ sung số lượng công ty trong danh sách vào Title: `東京都豊島区のIT企業一覧【〇〇件・最新リスト】`.

### B. Cannibalization Detector (Chống Phân Tán Sức Mạnh Nội Bộ)
* **Nguyên lý:** Hiện tượng 1 truy vấn tiếng Nhật nhưng Google lúc thì hiển thị trang Hub ngành, lúc thì hiển thị trang Chi tiết công ty, khiến cả hai trang đều không đủ điểm sức mạnh (Page Authority) để lọt vào Top 3.
* **Biện pháp xử lý:**
  1. Đặt Canonical tag tuyệt đối về trang đích đúng chuẩn (`https://kigyoulist.com/ja/company/{code}` hoặc `/ja/industry/{slug}`).
  2. Đặt Internal Link một chiều: Trang công ty con đặt breadcrumb trỏ ngược về Hub cha với anchor text chuẩn.

### C. Content Decay Watchdog (Phát hiện Tụt Hạng & Làm Tươi Nội Dung)
* **Nguyên lý:** Google cực kỳ ưu tiên nội dung "Freshness" đối với dữ liệu pháp nhân. Khi một doanh nghiệp có biến động (đổi trụ sở, công bố báo cáo tài chính mới, thay đổi giám đốc), nếu website không cập nhật, Googlebot sẽ giảm tần suất cào và tụt thứ hạng.
* **Biện pháp xử lý:** Kích hoạt hook đồng bộ `background_legal_history_etl.py` để bổ sung dữ liệu mới và bắn Google VIP Indexing API.

---

## 3. CẨM NANG CHẨN ĐOÁN & XỬ LÝ 8 BỆNH LÝ LẬP CHỈ MỤC (PAGE INDEXING DOCTOR)

Khi kiểm tra báo cáo **Page Indexing (Trang)** trên GSC, Agent bắt buộc tuân thủ phác đồ điều trị sau:

| Bệnh Lý Trên GSC | Nguyên Nhân Kỹ Thuật | Phác Đồ Điều Trị Cho Kigyou-list |
| :--- | :--- | :--- |
| **1. Discovered - currently not indexed**<br>*(Đã phát hiện - hiện chưa lập chỉ mục)* | Googlebot đã tìm thấy URL qua sitemap/internal link nhưng chưa đủ Crawl Budget hoặc đang xếp hàng đợi (Queue).<br>*(Bot chưa hề đọc HTML - Last crawled: N/A)*. | • **TUYỆT ĐỐI CẤM BẤM NÚT 'VALIDATE FIX'**: Bấm nút này sẽ ép Googlebot quét lại các link rác/link cũ và dễ bị báo `Validation Failed`.<br>• Đảm bảo sitemap chỉ chứa 100% tiếng Nhật (`/ja/`) để không làm loãng hàng đợi.<br>• Bơm Internal Link từ Hub ngành/khu vực.<br>• Kích hoạt `auto_google_indexing_pg.js` đưa các URL có biến động vào VIP Queue. |
| **2. Crawled - currently not indexed**<br>*(Đã thu thập dữ liệu - hiện chưa lập chỉ mục)* | Googlebot đã tải HTML về nhưng đánh giá trang đang trong giai đoạn Sandbox hoặc chờ đánh giá tín hiệu chất lượng/người dùng. | • **TUYỆT ĐỐI CẤM BẤM NÚT 'VALIDATE FIX'**: Đây không phải lỗi kỹ thuật.<br>• Kích hoạt ETL làm giàu dữ liệu: Bổ sung mã Invoice NTA, Báo cáo EDINET, Giấy phép ngành nghề (đạt richnessScore >= 3).<br>• Đảm bảo Schema JSON-LD `Corporation` & `Dataset` hợp lệ. |
| **3. Page with redirect**<br>*(Trang có chuyển hướng)* | URL gốc chuyển hướng 301 sang URL mới (vd: http sang https, www sang non-www, `/company/*` sang `/ja/company/*`). | • Đây là **trạng thái bình thường** nếu người dùng truy cập link cũ.<br>• Tuy nhiên, trong Internal Link và Sitemap **tuyệt đối không được chứa link chuyển hướng**; phải trỏ trực tiếp đến URL đích chuẩn. |
| **4. Alternate page with proper canonical tag**<br>*(Trang thay thế có thẻ chuẩn tắc thích hợp)* | URL phụ (vd: có tham số `?ref=`, `?page=1`) trỏ canonical về trang gốc. | • Trạng thái hoàn toàn chính xác theo chuẩn SEO.<br>• Đảm bảo thẻ `<link rel="canonical" href="..." />` luôn là link tuyệt đối https không có trailing slash thừa. |
| **5. Duplicate without user-selected canonical**<br>*(Trùng lặp khi người dùng chưa chọn thẻ chuẩn tắc)* | Trang không khai báo canonical, Google phải tự đoán URL đại diện. | • Lỗi nghiêm trọng! Bắt buộc mọi trang Server Component trong Next.js 15 phải có `alternates.canonical` trong `generateMetadata()`. |
| **6. Not found (404) & Soft 404**<br>*(Không tìm thấy trang hoặc 404 mềm)* | Mã pháp nhân không tồn tại nhưng server lại trả về HTTP 200 kèm trang trắng hoặc chữ "Không tìm thấy". | • Trả về đúng HTTP Status Code `404` bằng hàm `notFound()` của Next.js.<br>• Không bao giờ trả mã 200 cho trang không có dữ liệu doanh nghiệp. |
| **7. Blocked by robots.txt**<br>*(Bị chặn bởi tệp robots.txt)* | Quy tắc Disallow đang chặn Googlebot cào trang công khai. | • Kiểm tra `https://kigyoulist.com/robots.txt`.<br>• Chỉ Disallow `/api/*`, `/admin/*`, `/dashboard/*`. Mọi đường dẫn `/ja/*` bắt buộc Allow. |
| **8. Excluded by 'noindex' tag**<br>*(Bị loại trừ bởi thẻ 'noindex')* | Vô tình chèn `<meta name="robots" content="noindex">` vào trang công khai. | • Rà soát `layout.tsx` và `page.tsx`. Chỉ cho phép noindex trên trang tìm kiếm nội bộ có query param rỗng hoặc trang tài khoản cá nhân. |

---

## 4. HỆ THỐNG LỆNH CLI ĐIỀU HÀNH CHUẨN HÓA

Agent sử dụng script điều hành trung tâm [gsc_optimizer.py](file:///c:/kigyou-list/scripts/gsc_optimizer.py) để thực thi mọi tác vụ chẩn đoán:

```bash
# 1. Báo cáo tổng quan hiệu suất (Clicks, Impr, CTR, Avg Position) 28 ngày qua
python c:\kigyou-list\scripts\gsc_optimizer.py summary --days 28

# 2. Khai thác ngay các cơ hội vàng Quick-Wins để tối ưu CTR tiếng Nhật
python c:\kigyou-list\scripts\gsc_optimizer.py quick-wins --days 28 --min-impr 3 --max-ctr 5.0

# 3. Quét xung đột từ khóa (Cannibalization) giữa trang Hub và Company
python c:\kigyou-list\scripts\gsc_optimizer.py cannibalization --days 28 --min-impr 2

# 4. Quét sụt giảm hiệu suất (Content Decay) so với chu kỳ 28 ngày trước
python c:\kigyou-list\scripts\gsc_optimizer.py decay --days 28

# 5. Thanh tra trực tiếp Googlebot qua URL Inspection API thời gian thực
python c:\kigyou-list\scripts\gsc_optimizer.py inspect "https://kigyoulist.com/ja"
python c:\kigyou-list\scripts\gsc_optimizer.py inspect "https://kigyoulist.com/ja/company/1020005009694"

# 6. Kiểm tra tình trạng nạp và cảnh báo của toàn bộ 12 Sitemaps trên GSC
python c:\kigyou-list\scripts\gsc_optimizer.py sitemaps

# 7. Xuất toàn bộ báo cáo tổng hợp chuẩn SEO Health Check
python c:\kigyou-list\scripts\gsc_optimizer.py report
```

---

## 5. QUY CHUẨN NỘP SITEMAP INDEX DUY NHẤT (MASTER SITEMAP INDEX PROTOCOL)

Theo tài liệu chính thức từ Google Search Console, hệ thống tuân thủ nghiêm ngặt **Quy chuẩn nộp 1 file Sitemap Index duy nhất**:

1. **URL Nộp Duy Nhất:** `https://kigyoulist.com/sitemap.xml` (Tệp mục lục gốc chuẩn XML `<sitemapindex>`).
2. **Cấu trúc phân nhánh tự động:** Bên trong file index tự động khai báo toàn bộ các phân mảnh con:
   * `sitemap/core.xml`: ~4,980 URLs tinh hoa 100% tiếng Nhật (đã loại bỏ 10.000 link đa ngôn ngữ rác để tối ưu hóa Crawl Budget).
   * `sitemap/0.xml` đến `sitemap/16.xml`: Mỗi shard chứa 10.000 - 50.000 URLs doanh nghiệp.
3. **Tuyệt đối cấm nộp thủ công từng file con rời rạc:** Việc nộp riêng lẻ `0.xml` – `9.xml` sẽ làm nghẽn hàng đợi Googlebot và gây ra lỗi hiển thị giả lập "Couldn't fetch" trên giao diện GSC.
4. **Script quản trị & nạp tự động:** [submit_all_sitemaps_gsc.py](file:///c:/kigyou-list/scripts/submit_all_sitemaps_gsc.py).

---

## 6. PHỐI HỢP ĐỒNG BỘ ĐA KÊNH TRONG HỆ SINH THÁI KIGYOU-LIST

* **Phối hợp với `b2b-seo-engine`:** Khi `gsc_optimizer.py` phát hiện trang có lỗi `Crawled - currently not indexed`, tự động kích hoạt Cloudflare cache purge và bổ sung trang đó vào hàng đợi ưu tiên của `auto_google_indexing_pg.js`.
* **Phối hợp với `growth-orchestrator`:** Khi phát hiện các từ khóa Top Queries trên GSC (như `tqc株式会社`, `IT企業 東京都豊島区`, số điện thoại công ty), tự động đưa danh sách này vào kế hoạch bài viết trên Note.com, Zenn, Qiita và Press Release để thâu tóm toàn bộ trang 1 Google.
* **Phối hợp với `bing-webmaster`:** So sánh chéo tỷ lệ index giữa Googlebot và Bingbot để đánh giá thuật toán đánh giá chất lượng trang của hai công cụ tìm kiếm lớn nhất thế giới.
