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
| **1. Discovered - currently not indexed**<br>*(Đã phát hiện - hiện chưa lập chỉ mục)* | Googlebot đã tìm thấy URL qua sitemap/internal link nhưng chưa đủ Crawl Budget hoặc đánh giá là mass programmatic leaf pages chưa có Crawl Demand.<br>*(Bot chưa hề đọc HTML - Last crawled: N/A)*. | • **TUYỆT ĐỐI CẤM BẤM NÚT 'VALIDATE FIX'**: Bấm nút này sẽ ép Googlebot quét lại các link rác/link cũ và dễ bị báo `Validation Failed`.<br>• **Cấm nhồi trang `/ja/company/*` vào `core.xml`**: Giữ `core.xml` chỉ chứa ~5,119 Hub URLs chuẩn tiếng Nhật (`/ja/`), có `<lastmod>` thực tế.<br>• **ĐÃ NGƯNG GOOGLE INDEXING API**: Không bắn `indexing.googleapis.com`; thay bằng bơm Internal Link từ `/ja`, dùng GSC UI Request Indexing (~10 Hub/ngày) và Backlink vệ tinh. |
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

# 8. Chạy bộ kiểm toán thực chứng 4 tầng (Nginx Googlebot IP + Endpoints/Sitemap Purity + PG Queue + GSC API)
python c:\kigyou-list\scripts\google_seo_forensic_auditor.py --days 7

# 9. Tái tạo sitemap/core.xml tinh gọn (~5,119 Pure Hubs) và sitemap.xml + nạp lại GSC
python c:\kigyou-list\scripts\generate_clean_core_sitemap.py
```

---

## 5. QUY CHUẨN SITEMAP TINH GỌN & STATIC NVME SITEMAP ENGINE (~5,119 PURE HUBS PROTOCOL)

Hệ thống vận hành theo kiến trúc **Static NVMe Sitemap Engine (`Kigyoulist-StaticSitemapEngine`)** đảm bảo tốc độ tải `< 1ms` và tính tinh khiết tuyệt đối cho Googlebot:

1. **2 URL Sitemap Duy Nhất Được Nộp Trên GSC (`sitemap.xml` + `sitemap/core.xml`):**
   * `https://kigyoulist.com/sitemap.xml`: Tệp mục lục gốc `<sitemapindex>` chứa `sitemap/core.xml` (đứng đầu tiên) + **47 mảnh công ty (`0.xml` .. `46.xml`)**.
   * `https://kigyoulist.com/sitemap/core.xml`: **CHỈ chứa ~5,119 trang Hub 100% tiếng Nhật (`/ja/*`) trả mã `200 OK`**, bao gồm: Core Static Hubs (`/ja`, `/ja/directory`, `/ja/compare`, `/ja/press`, `/ja/guide`, `/ja/invoice`, `/ja/watchlist`, `/ja/changes`...), toàn bộ bài Cẩm nang (`/ja/guide/*`), 5 Event Hubs + 6 tháng lưu trữ gần nhất (`2026-11`..`2026-06`) + 47 tỉnh thành, `/ja/building` + 101 Cao ốc văn phòng, 3 Ranking Hubs (`/salary`, `/tenure`, `/employees`), 47 `/ja/area/*`, `/ja/licenses` + 432 License Hubs, và 4,251 cặp `Industry × Prefecture`.
2. **Tại sao TUYỆT ĐỐI CẤM nhồi 44,000 trang `/ja/company/*` vào `core.xml`?**
   * **Bài học kiểm chứng (Forensic Nov 2026):** Khi từng nhồi 44,000 trang hồ sơ công ty lẻ (chiếm 89.8% `core.xml`) với cùng một `<lastmod>`, toàn bộ 44,000 trang đó vừa **trùng lặp với `0.xml`..`4.xml`**, vừa làm Google đánh giá toàn bộ `core.xml` là *mass programmatic leaf pages* và đẩy **49,008 URL vào `Discovered - currently not indexed`** (cột Not indexed nhảy vọt từ ~16K lên 52.5K).
   * Tách `core.xml` về **0 `/ja/company/*`**, **0 URL redirect (`/`, `/ja/ranking`)**, **0 URL 404**, và gán `<lastmod>` chuẩn `YYYY-MM-DD` phản ánh ngày cập nhật dữ liệu thật giúp Googlebot nhận diện rõ 5,119 Hub trụ cột có thẩm quyền cao.
3. **Cấu hình Tái Tạo & Cache Bắt Buộc:**
   * Luôn dùng [`scripts/generate_clean_core_sitemap.py`](file:///c:/kigyou-list/scripts/generate_clean_core_sitemap.py) (script cũ [`scripts/boost_core_sitemap_49k.py`](file:///c:/kigyou-list/scripts/boost_core_sitemap_49k.py) đã bị vô hiệu hóa và trỏ ngược về đây) để kết xuất tĩnh ra `/var/www/kigyou-list/frontend/public/sitemap*.xml`, giữ `Nginx` phục vụ trực tiếp từ NVMe (`Cache-Control: public, max-age=86400, s-maxage=604800`), và chỉ purge đúng 2 URL `/sitemap.xml` & `/sitemap/core.xml` trên Cloudflare.

---

## 6. PHỐI HỢP ĐỒNG BỘ ĐA KÊNH TRONG HỆ SINH THÁI KIGYOU-LIST

* **Phối hợp với `b2b-seo-engine`:** Duy trì hai đường ray tách biệt: Bingbot đẩy mạnh qua IndexNow 5,000 URL/đêm; Googlebot **KHÔNG dùng Indexing API** mà dồn lực vào Sitemap Hubs tinh gọn (`core.xml`), Spider-Web từ `/ja`, GSC UI Request Indexing và off-page authority.
* **Phối hợp với `growth-orchestrator`:** Khi phát hiện các từ khóa Top Queries thực tế của người dùng trên GSC (ngành nghề, tỉnh thành, tín hiệu B2B), đưa vào kế hoạch bài viết trên Note.com, Zenn, Qiita, Wantedly và các cổng Press Release để tạo backlink và tăng Crawl Demand cho các Hub đầu tàu (Lưu ý: Bắt buộc loại trừ toàn bộ truy vấn nội bộ do Founder/Developer test theo Mục 7).
* **Phối hợp với `bing-webmaster`:** Không lấy tốc độ Index của Bing (4,000+ trang/ngày qua IndexNow) làm kỳ vọng sai cho Googlebot; sử dụng Bing để kiểm tra khả năng render HTML và tìm nhu cầu từ khóa thực tế tại Nhật Bản.

---

## 7. BỘ LỌC LOẠI TRỪ TỪ KHÓA NỘI BỘ (INTERNAL DEVELOPER TRAFFIC EXCLUSION)

> [!IMPORTANT]
> **QUY TẮC BẤT DI BẤT DỊCH KHI PHÂN TÍCH & BÁO CÁO SEO CHO KIGYOU-LIST:**
> Toàn bộ các nhóm truy vấn dưới đây đều là **lưu lượng tìm kiếm và click nội bộ do Founder/Developer thực hiện trong quá trình phát triển và kiểm thử dự án**:
> 1. **Nhóm pháp nhân & hotline:** `tqc`, `tqc株式会社`, `t.q.c`, `tcq`, `ctq`, `tqa`, `tqq`, `tqcs`, `tqi`, `tqr`, `ｔｑｃ`, `03-6907-1219`, `0369071219`.
> 2. **Nhóm từ khóa test khu vực Toshima-ku / Kita-ku / Itabashi-ku:** `it企業 東京都豊島区`, `itコンサルティング 東京都豊島区`, `itサービス 東京都豊島区`, `it関連 東京都豊島区`, `itコンサルティング 東京都北区`, `itコンサルティング 東京都板橋区`.
> 
> * **Tuyệt đối KHÔNG đưa** các từ khóa này vào thống kê báo cáo SEO/GSC, không tính làm thành tích Top 1, không đánh giá là cơ hội Quick-Wins, và không dùng làm căn cứ định hướng kế hoạch SEO/content.
> * Mọi báo cáo và script phân tích GSC phải chủ động **loại trừ (filter out)** toàn bộ nhóm từ khóa này để dữ liệu phản ánh 100% lưu lượng tìm kiếm tự nhiên (organic) của khách hàng thực tế.

---

## 8. QUY CHUẨN PHÁ BĂNG LẬP CHỈ MỤC GOOGLEBOT & KIỂM TOÁN THỰC CHỨNG (GOOGLEBOT FORENSIC PLAYBOOK)

Quy chuẩn này đúc kết từ đợt điều tra pháp y (Forensic Audit 11/2026) để chấm dứt tình trạng "bắn API mù quáng" mà vẫn dậm chân ở 4 trang được lập chỉ mục:

### 8.1. Tách Bạch Thực Tế: Googlebot Khác Hoàn Toàn Bingbot
| Tiêu chí | Bingbot (IndexNow) | Googlebot (Google Search) |
| :--- | :--- | :--- |
| **Cơ chế Push API** | IndexNow chấp nhận mọi URL B2B và kích hoạt bot cào hàng nghìn trang/ngày. | **ĐÃ BỎ HẲN Google Indexing API (`indexing.googleapis.com`).** Thực chứng 19,182 URL (gồm 14,978 `has_hiring=true`) đều bị Googlebot bỏ qua; API này chỉ hợp với site tuyển dụng thuần có tin mới còn hạn `validThrough`. |
| **Quy tắc `auto_google_indexing_pg.js`** | *(Không áp dụng — dùng `auto_indexnow_submitter_pg.js`)* | **ĐÃ VÔ HIỆU HÓA HOÀN TOÀN:** Đã gỡ khỏi Crontab VPS, [`vps_api_daemon.py`](file:///c:/kigyou-list/scripts/vps_api_daemon.py) và [`seoIndexingTrigger.ts`](file:///c:/kigyou-list/frontend/src/lib/seoIndexingTrigger.ts). Không bật lại. |
| **Động lực Crawl chính** | Sitemap + IndexNow API. | **Internal Links từ trang đã Index (`/ja`)** + **Clean Hub `core.xml` (~5,119 URLs)** + **GSC UI Manual Request Indexing** + **Backlinks chất lượng cao**. |

### 8.2. Chống Ngộ Nhận Qua Độ Trễ GSC UI (Real-Time Verification Protocol)
* Biểu đồ *Page Indexing* trên GSC Web UI thường **trễ 4–5 ngày** (`Last update` chậm so với thực tế). Không bao giờ dựa duy nhất vào số đếm `200 OK` của Indexing API hay biểu đồ Web UI để kết luận bot đã cào.
* **Bắt buộc chạy công cụ kiểm toán 4 tầng** sau mỗi đợt nâng cấp hoặc định kỳ hàng tuần:
  ```bash
  python c:\kigyou-list\scripts\google_seo_forensic_auditor.py --days 7
  ```
  1. **Tầng 1 (Log Nginx IP Google thật):** Chỉ đếm IP thuộc dải chính thức Google (`66.249.*`, `192.178.*`, `74.125.*`, `64.233.*`, `209.85.*`, `216.239.*`), tách riêng `Googlebot` vs `Google-InspectionTool`, và đảm bảo bot giả mạo bị chặn `403`.
  2. **Tầng 2 (Sức khỏe Endpoint & Sitemap Purity):** Kiểm tra `200 OK` trên `/robots.txt`, `/favicon.ico`, `/sitemap.xml`, `/sitemap/core.xml` và xác nhận `company_leaves == 0`, `empty_locs == 0` trong `core.xml`.
  3. **Tầng 3 (PostgreSQL Queue Health):** Kiểm tra `bad_legacy_urls == 0` trong bảng `google_indexing_submissions`.
  4. **Tầng 4 (GSC Sitemaps & URL Inspection API):** Xem trực tiếp `verdict`, `coverageState` và `lastCrawlTime` của từng Hub trọng điểm theo thời gian thực.

### 8.3. Quy Tắc Hạ Tầng Sống Còn (Zero-5xx & Spider-Web Từ `/ja`)
* **Zero-5xx trên `/robots.txt` và `/favicon.ico`:** Cả 2 file bắt buộc phục vụ tĩnh từ ổ NVMe qua Nginx ở mức `0ms`. Nếu `/robots.txt` dính dù chỉ một lỗi `504` khi server restart, Googlebot sẽ tạm dừng cào toàn bộ tên miền.
* **Sổ cái theo dõi Request Indexing thủ công (`c:\kigyou-list\data\gsc_manual_request_indexing_history.json`):**
  * **BẮT BUỘC ĐỌC FILE NÀY TRƯỚC KHI ĐỀ XUẤT DANH SÁCH REQUEST INDEXING MỚI:** Vì người dùng có thể trao đổi ở cửa sổ `Side Question` độc lập với luồng chat chính (và Cloudflare Edge Cache phục vụ trực tiếp `Google-InspectionTool` tại Edge mà không ghi log xuống Nginx VPS), mọi URL đã bấm Request Indexing đều được lưu tập trung trong [`data/gsc_manual_request_indexing_history.json`](file:///c:/kigyou-list/data/gsc_manual_request_indexing_history.json).
  * Tuyệt đối không đề xuất lặp lại bất kỳ URL nào đã nằm trong `already_submitted_urls`. Khi đề xuất đợt mới, cập nhật ngay vào sổ cái này.
* **Cổng Kiểm định Bánh cóc 4 Tầng (`c:\kigyou-list\scripts\ratchet_gate.py` & `c:\kigyou-list\data\project_ratchet_scorecard.json`):**
  * Sau mọi đợt sửa code SEO, Sitemap, Metadata hoặc Deploy VPS, bắt buộc chạy `python c:\kigyou-list\scripts\ratchet_gate.py` để xác minh không có bất kỳ chỉ số nào bị tụt lùi so với kỷ lục trong `data/project_ratchet_scorecard.json`.
* Kết hợp đồng thời liên kết trực tiếp từ trang chủ đã Index (`/ja`) và backlink ngữ cảnh từ `note-publisher`, `qiita-publisher`, `zenn-publisher`, `wantedly-publisher` và các cổng Thông cáo báo chí để nâng Crawl Demand tự nhiên, kéo các nhánh con thoát khỏi trạng thái `Discovered / Crawled - currently not indexed`.

---

## 9. BỘ BA CÔNG CỤ KIỂM TOÁN QUALITY GATE & 5 BÀI HỌC XƯƠNG MÁU CHO PROGRAMMATIC SEO (CROSS-PROJECT PLAYBOOK)

Để không bao giờ "ngồi chờ Google trong mù quáng" khi các trang bị kẹt ở `Discovered` hoặc `Crawled - currently not indexed`, hệ thống tích hợp phương pháp luận của **3 bộ công cụ mã nguồn mở hàng đầu trên GitHub** vào 2 script kiểm toán thực chiến chạy trực tiếp trên server:

### 9.1. Bộ Ba Công Cụ Phân Tích & Script Thực Thi
1. **Phương pháp `eliasdabbas/advertools` & `sethblack/python-seo-analyzer` (Đo Boilerplate Similarity & Xung đột Robots):**
   * Bóc tách phần thân `<main>` (loại bỏ `<header>`, `<footer>`, `<nav>`), tính **5-char Shingle Jaccard Similarity** giữa các trang cùng template:
     * `< 35%`: **Độc bản an toàn (`UNIQUE`)** — vượt qua bộ lọc Near-Duplicate của Google.
     * `35% – 60%`: **Trung bình (`MODERATE`)** — cần theo dõi tỷ lệ chữ tĩnh.
     * `> 60%`: **Nguy cơ cao bị giữ ở `Crawled - currently not indexed`** do trùng khung giao diện.
   * Quét toàn bộ thẻ `<meta name="robots">`, `<meta name="googlebot">` và HTTP Header `X-Robots-Tag` để bắt sống mọi cờ `noindex` rơi rớt hoặc xung đột đa thẻ.
2. **Phương pháp `GoogleChrome/lighthouse` (Kiểm toán 16/16 Nhóm Template trong Sitemap):**
   * Quét đồng thời toàn bộ các nhóm cấu trúc route trong `sitemap/core.xml` để kiểm tra 8 tiêu chí sống còn:
     1) `HTTP != 200`, 2) `Noindex detected`, 3) `Canonical mismatch`, 4) `Missing H1`, 5) `Thin content (<600 chars)`, 6) `Invalid JSON-LD Schema`, 7) `Duplicate <title> groups`, 8) `Duplicate <h1> groups`.
3. **Phương pháp `viasite/site-audit-seo` & Playwright Mobile-First Googlebot Renderer:**
   * Giả lập `Googlebot Smartphone` (`412x915`), kiểm tra DOM thực tế sau khi hydrate JS, bắt toàn bộ lỗi `JS Console Error`, `Page Error` và các request API ngầm trả mã `4xx/5xx`.

* **Lệnh vận hành bắt buộc sau mỗi đợt nâng cấp SEO (hoặc khi tái sử dụng cho dự án mới):**
  ```bash
  # 1. Kiểm toán chiều sâu Quality Gate, Boilerplate Similarity & Playwright Mobile Render
  python c:\kigyou-list\scripts\google_quality_gate_auditor.py

  # 2. Quét toàn diện 180 URL đại diện cho 100% (16/16) nhóm Template trong core.xml
  python c:\kigyou-list\scripts\audit_all_core_hub_templates.py
  ```

### 9.2. Năm Bài Học Xương Máu Đúc Kết Từ Dự Án (Áp Dụng Cho Mọi Dự Án Dữ Liệu Lớn)
1. **Bài học 1 — Chặn rò rỉ Crawl Budget đa ngôn ngữ (`Accept-Language` Redirect + `hreflang`) & Mở `/api/auth/session` trong `robots.txt`:**
   * **Sai lầm từng gặp:** `middleware.ts` đọc header `Accept-Language: en-US` của Googlebot (cào từ IP Mỹ) và redirect `308` sang `/en`, kết hợp với 21 trang `/ja/*` phát thẻ `<link rel="alternate" hreflang="en">`. Kết quả là **81.2% (`591/728` hits/ngày) ngân sách cào của Googlebot bị đốt vào `/en/industry/*` và `/en/area/*`**. Ngoài ra, việc đặt `Disallow: /api/` mà không mở ngoại lệ `Allow: /api/auth/session` làm NextAuth (`getSession`) bị Googlebot chặn (`1/75 couldn't be loaded`) và văng 2 lỗi đỏ `Unexpected end of JSON input` trong JS Console khi Live Test.
   * **Quy chuẩn bắt buộc:** Trong `middleware.ts`, mọi User-Agent của Bot tìm kiếm/AI (`Googlebot`, `Bingbot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`...) phải luôn điều hướng về ngôn ngữ chính (`/ja`). Trong `robots.txt`, chặn `/en/`, `/vi/`, `/api/` nhưng **bắt buộc thêm `Allow: /api/auth/session`** để Googlebot Smartphone đạt `All resources were loaded` và `JavaScript console messages: No messages`.
2. **Bài học 2 — Tuyệt đối cấm dùng `SELECT DISTINCT ... LIMIT 1` trên bảng lớn để lấy tên Tỉnh/Danh mục (Vụ án `三重県` trên 4,298 trang Hub):**
   * **Sai lầm từng gặp:** Hàm `getPrefectureByCode(code)` chạy `SELECT DISTINCT prefecture_code, prefecture_name FROM companies WHERE prefecture_code = ? LIMIT 1`. Do trong bảng 5 triệu dòng có vài dòng nhiễu mang tên `三重県` và ký tự `三` (`U+4E09`) đứng đầu bảng mã Unicode chữ Hán khi PostgreSQL sort `DISTINCT`, toàn bộ **47 trang `/ja/area/01..47` và 4,251 trang `/ja/industry/*/location/*` đều xuất ra cùng một `<title>` và `<h1>` là `三重県` (Tỉnh Mie)**, đồng thời làm chậm TTFB mất 2–5 giây!
   * **Quy chuẩn bắt buộc:** Mọi danh mục cố định (47 tỉnh thành JIS X 0401, mã ngành JSIC, loại giấy phép) bắt buộc tra cứu `O(1)` (`0ms`) từ Dictionary hằng số trong bộ nhớ, tuyệt đối không quét bảng giao dịch để suy ra tên danh mục.
3. **Bài học 3 — Rà soát cờ `noindex` sót lại trong `layout.tsx` con và phân biệt `<h1>` cho trang lưu trữ tháng:**
   * **Sai lầm từng gặp:** Trang `/ja/watchlist` được đưa vào `sitemap/core.xml` nhưng file `watchlist/layout.tsx` cũ vẫn để `index: false, follow: false` (khiến Googlebot bị cấm index). Các trang lưu trữ theo tháng (`/2026-11` .. `/2026-06`) có `<title>` khác nhau nhưng quên chèn biến `yearMonth` vào thẻ `<h1>`.
   * **Quy chuẩn bắt buộc:** Mọi URL có mặt trong Sitemap bắt buộc có `robots: index, follow` và phải có bộ đôi `<title>` + `<h1>` độc nhất 100% trên toàn site.
4. **Bài học 4 — Không dùng Google Indexing API cho trang danh bạ B2B & Không nhồi trang lá vào `core.xml`:**
   * Thực chứng 19,182 URL bắn qua `indexing.googleapis.com` đều bị Googlebot bỏ qua, và việc nhồi 44,000 trang lá `/company/*` cùng một `<lastmod>` vào `core.xml` khiến Google đóng băng toàn bộ Sitemap ở `Discovered - currently not indexed`. Chỉ giữ các trang Hub tinh gọn trong `core.xml` và loại bỏ mọi Schema `JobPosting` đã quá hạn `validThrough`.
5. **Bài học 5 — Lưu ý khi đọc Log VPS phía sau Cloudflare Edge Cache:**
   * Khi bật Cloudflare `Cache Everything` (TTL 7 ngày), các lượt Googlebot hoặc `Google-InspectionTool` trúng `CF-Cache-Status: HIT` sẽ được Cloudflare trả HTML ở tốc độ `5–15ms` ngay tại trạm biên (rất tốt cho Crawl Budget) nhưng sẽ không ghi xuống `/var/log/nginx/access.log` của VPS. Do đó phải quản lý lịch sử bấm `Request Indexing` qua file sổ cái cố định [`data/gsc_manual_request_indexing_history.json`](file:///c:/kigyou-list/data/gsc_manual_request_indexing_history.json) và luôn gọi API `purge_cache` của Cloudflare sau mỗi lần sửa thẻ SEO/HTML.
6. **Chống Bẫy `<div hidden>` Streaming Skeleton (`loading.tsx`) & Lỗi Soft-404 Trong Next.js App Router:**
   * Tuyệt đối **CẤM** đặt `loading.tsx` trên các route SEO công khai (`[locale]/loading.tsx`, `directory/loading.tsx`, `pricing/loading.tsx`, `search/loading.tsx`). Khi có `loading.tsx`, Next.js xuất khung xương rỗng (`<main class="animate-pulse">` `0` chữ + nhân đôi `<Header>/<Footer>`) ở thân trang chính và nhốt **88%–94% nội dung thật vào `<div hidden id="S:0..S:30">`**, khiến Google Wave-1 Indexer đánh giá trang là khung rỗng trùng lặp (`Crawled - currently not indexed`), đồng thời flush sớm `HTTP 200 OK` gây lỗi **Soft 404** cho các URL không tồn tại.
   * Không gọi `useSearchParams()` trong các component layout/trang chung (`TopProgressBar`, `CompanyActions`, `CompanyManagementModal`) để tránh `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
   * Trong `generateMetadata()`, khi không tìm thấy dữ liệu bắt buộc gọi `return notFound();` để trả về đúng mã `HTTP 404 Not Found`.
