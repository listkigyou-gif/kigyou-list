# Bộ Nhớ Chiến Lược & Nhật Ký Chống Lặp SEO Google (`kigyoulist.com`)

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC TRƯỚC KHI HÀNH ĐỘNG:**
> Mọi Agent / Subagent khi nhận nhiệm vụ liên quan đến **Google Indexing, Sitemap, Crawl Budget, Search Console hoặc SEO kỹ thuật** cho `kigyoulist.com` **PHẢI đọc tệp này trước tiên**.
> - **Cấm tuyệt đối** đề xuất lại hoặc triển khai lại các phương án đã ghi trong **Mục 2 (Danh sách Hướng Đã Thử & Thất Bại)**.
> - Mọi thay đổi cấu hình mới **PHẢI được ghi bổ sung** vào **Mục 1** (cấu hình hiện hành) và **Mục 3** (nhật ký thử nghiệm) kèm baseline đo đạc thực tế.

---

## 1. Cấu Hình Production Đang Vận Hành (Live Config Registry)

* **Domain Property GSC:** `sc-domain:kigyoulist.com` (Service Account `gsc-agent@kigyoulist-seo.iam.gserviceaccount.com`).
* **VPS Production:** `160.251.203.84` (`/var/www/kigyou-list`).
* **Bảo vệ & Phân biệt Googlebot thật (Nginx):**
  * `/etc/nginx/conf.d/00_google_real_ips.conf`: Whitelist **1,093 dải CIDR chính thức của Google** (`$is_google_real_ip`).
  * `/etc/nginx/conf.d/anti_bad_bots.conf`: Chặn `403 Forbidden` toàn bộ bot giả mạo User-Agent Googlebot (`$is_fake_googlebot`).
  * **Bot Shield `2026-11-19`** (`$is_bad_bot` = UA map `$is_bad_bot_ua` OR `geo $is_blocked_subnet`): chặn thêm `ShapBot`, `Yandex*`, `Baiduspider`, headless `Chrome/99.0.4844.51` + dải `116.179.33.0/24` (nguồn "user ảo Kashgar" trên GA4), UA cụt, `0day`. `robots.txt` / `robots.ts` đã `Disallow: /` tương ứng. Backup: `/root/anti_bad_bots.conf.bak.202611191053`. **CẤM** thêm Googlebot, bingbot, Applebot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, ExaSearchBot, meta-*, facebookexternalhit, Twitterbot vào danh sách chặn.
* **Phục vụ tĩnh NVMe `< 1ms` (`0% 5xx/404`):**
  * `/etc/nginx/sites-enabled/default` phục vụ trực tiếp từ `/var/www/kigyou-list/frontend/public/` cho `/robots.txt`, `/favicon.ico`, `/icon.svg`, `/sitemap.xml`, `/sitemap/*.xml`.
  * *Mục đích:* Ngăn chặn hoàn toàn sự cố Googlebot gặp `504`/`404` ở `/robots.txt` (từng xảy ra ngày `09/11` và `17/11/2026`, khiến Googlebot tạm dừng cào toàn site).
* **Kiến trúc Sitemap & Thin Content Guard:**
  * Chỉ nộp `https://kigyoulist.com/sitemap.xml` (Master Index) và `https://kigyoulist.com/sitemap/core.xml` (Hub cốt lõi `100% /ja/*`), tuyệt đối không đưa `/en`, `/vi` hay URL redirect/404 vào Sitemap.
  * Trang công ty con (`/ja/company/*`) áp dụng `richnessScore >= 3` $\rightarrow$ `index, follow`; `< 3` $\rightarrow$ `noindex, follow` trong `generateMetadata()`.
* **Cronjobs Indexing hiện tại trên VPS (`crontab -l`):**
  * `02:00 JST`: `auto_indexnow_submitter_pg.js --batch-size 5000 --allow-backlog` (**Dành riêng cho Bingbot** qua IndexNow).
  * `02:15 JST` & `17:15 JST`: `auto_google_indexing_pg.js` (Google Web Search Indexing API — **chỉ có hiệu lực với trang có Schema `JobPosting` / `BroadcastEvent`**).

---

## 2. Danh Sách Hướng Đã Thử & Thất Bại (Dead-Ends — CẤM LẶP LẠI)

| # | Phương án đã thử | Thời gian | Kết quả đo thực tế (Bằng chứng) | Kết luận / Quy tắc cấm |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Dùng Google Indexing API (`urlNotifications:publish`) để ép Google cào trang công ty `/ja/company/*` và Hub thường** | `2026-10-26` $\rightarrow$ `2026-11-18` | Đã bắn **19,150 URLs** nhận HTTP `200 OK` vào `google_indexing_submissions`, nhưng log Nginx chỉ ghi nhận **3–36 req/ngày** từ IP Googlebot thật; URL Inspection API trả về `URL is unknown to Google` (`lastCrawl=None`). | **CẤM** coi Google Indexing API là công cụ ép index trang công ty/danh bạ như Bing IndexNow. Chỉ ưu tiên gửi trang có Schema `JobPosting` hợp lệ (`/ja/jobs/latest/*` và `has_hiring = true`). |
| **2** | **Gộp 44,000 trang `/ja/company/*` vào `sitemap/core.xml` (49,009 URLs) với cùng timestamp** | `2026-11-04` $\rightarrow$ `2026-11-18` | Cột `Not indexed` trên GSC tăng vọt từ ~16K lên **52.5K** (`49,008` URL rơi vào `Discovered - currently not indexed`), `core.xml` bị loãng 89.8% bởi leaf pages trùng với `0.xml`..`4.xml`. | **CẤM** nhồi leaf `/ja/company/*` vào `core.xml`. `core.xml` chỉ được phép chứa các Hub URLs tinh gọn (~5,200 trang `/ja/*`) và không có `<lastmod>` giả đồng loạt. |
| **3** | **Nộp lẻ từng shard `sitemap/0.xml`..`46.xml` lên GSC UI** | Trước `2026-11-04` | Các shard con bị treo `isPending: true` và báo đỏ `Couldn't fetch` trên GSC UI. | **CẤM** nộp lẻ `0.xml`..`46.xml` trực tiếp trên GSC. Chỉ khai báo qua `sitemap.xml` gốc. |
| **4** | **Bấm "Validate Fix" trong GSC cho `Discovered / Crawled - currently not indexed` hoặc gửi URL redirect/404** | `2026-10` $\rightarrow$ `2026-11` | Bị `Validation Failed` và làm Googlebot tốn crawl budget (3–25 req/ngày) đi cào lại các URL cũ (`/ja/industry/03`, `/ja/changes`, `/company/*`, `/index.html/*`). | **CẤM** bấm Validate Fix cho trạng thái chờ index; **CẤM** đưa URL redirect (`/` $\rightarrow$ `/ja`, `/ja/ranking` $\rightarrow$ `/ja/ranking/salary`) hoặc 404 vào Sitemap/Queue. |
| **5** | **Đo tiến độ bằng HTTP `200 OK` của Indexing API hoặc nhìn biểu đồ GSC Web UI hàng ngày** | `2026-10` $\rightarrow$ `2026-11-18` | Biểu đồ GSC Web UI có độ trễ **4–5 ngày** (`Last update: 11/13/26` vào ngày `18/11`), còn API `200 OK` không phản ánh Googlebot có vào cào hay không. | **BẮT BUỘC** đo bằng 2 nguồn thật: (1) Log Nginx lọc IP Googlebot (`66.249.*`, `192.178.*`), (2) **GSC URL Inspection API** trên tập URL mẫu. |
| **6** | **Đặt `loading.tsx` trên các route SEO công khai (`[locale]/loading.tsx`, `directory/loading.tsx`, `pricing/loading.tsx`, `search/loading.tsx`) hoặc trả về `{ title: 'Not Found' }` thay vì gọi `notFound()` trong `generateMetadata()`** | Trước `2026-11-23` | Next.js App Router stream khung xương `loading.tsx` (`<main class="animate-pulse">` `0` ký tự + nhân đôi/nhân ba `<Header>`/`<Footer>`) làm thân `<body>` chính và nhốt **88%–94% nội dung thật (`110KB–397KB`) vào trong `<div hidden id="S:0..S:30">`**, đồng thời flush sớm `HTTP 200 OK` khiến mọi URL không tồn tại (`/ja/company/9999999999999`, `/ja/area/99`) bị **Soft 404 (`200 OK`)** và giữ 33 trang ở `Crawled - currently not indexed`. | **CẤM TUYỆT ĐỐI** tạo `loading.tsx` trên các route SEO công khai; **CẤM** gọi `useSearchParams()` trong layout/component chung mà không tách client `window.location.search`; trong `generateMetadata()` khi không tìm thấy bản ghi DB **BẮT BUỘC** gọi `return notFound();` để trả đúng `HTTP 404`. |
| **7** | **Xây dựng Hub trang theo kiểu danh bạ mỏng ("Thin Directory / Link Farm" - 200+ links nhưng chỉ có 1 thẻ `<p>` 82 chữ và 1 thẻ `<h2>`) khiến Google Quality Classifier xếp vào nhóm chất lượng thấp và kẹt ở `Crawled - currently not indexed`** | Trước `2026-11-24` | Trong khi trang chủ `/ja` có 8 thẻ `<h2>`, bảng so sánh, và FAQ chi tiết được Googlebot cào và **Index ngay lập tức (`PASS - Submitted and indexed`)** vào tối `2026-11-23`, thì các trang Hub khu vực (`/ja/area/*`) cào cùng thời điểm lại bị kẹt ở `Crawled - currently not indexed` vì trang dài 618KB nhưng 98% là 266 thẻ `<a>` (100 thẻ công ty nhân đôi link + 46 link tỉnh khác), không có phân tích chuyên sâu, không có bảng thống kê quận/huyện, không có FAQ. | **BẮT BUỘC** trang Hub phải đạt tiêu chuẩn **High Information Gain**: tối thiểu 6 thẻ `<h2>`, 8–12 đoạn văn `<p>` phân tích chuyên sâu (>500 chữ), bảng phân bổ doanh nghiệp theo Quận/Huyện thật từ DB (`city_counts`), khối liên kết Silo cùng vùng kinh tế (Regional Silo thay vì 46 link ngẫu nhiên), tối ưu danh sách thành 30 doanh nghiệp tiêu biểu (1 link/thẻ, giảm HTML từ 618KB xuống 430KB, giảm RSC từ 334KB xuống 230KB), và tích hợp bộ câu hỏi FAQ kèm schema `FAQPage`. |

---

## 3. Chiến Lược Cốt Lõi Đang Theo Đuổi Cho Googlebot (Active Strategy)

Khác với Bingbot (tin IndexNow ngay lập tức), Googlebot chỉ mở rộng index trên domain mới khi thỏa mãn **4 điều kiện đồng thời**:
1. **Spider-Web từ trang đã Index (`/ja`):** Trang `/ja` đã `Submitted and indexed` (`PASS`). Mọi Hub đầu tàu phải có liên kết nội bộ trực tiếp từ `/ja` và cấu trúc phẳng (2–3 clicks tới trang con).
2. **`core.xml` tinh gọn 100% Hub URLs:** Không nhiễu, không 404, không redirect, không trùng lặp leaf `/ja/company/*`.
3. **Request Indexing thủ công có chọn lọc (`Google-InspectionTool/1.0`):** Bấm trực tiếp trên GSC Web UI (~10–12 URL/ngày) cho **10 Hub đầu tàu** (`/ja/status/bankruptcies`, `/ja/changes/relocation`, `/ja/changes/merger`, `/ja/new-companies`, `/ja/jobs/latest`, `/ja/area/13`, `/ja/area/27`, `/ja/building`, `/ja/guide`, `/ja/invoice`) để kích hoạt `Google-InspectionTool` cào tức thì trong vài giây.
4. **External Authority & Crawl Demand:** Kéo Googlebot và TrustRank từ bên ngoài qua hệ thống bài viết thực chất trên Note.com, Qiita, Zenn, Wantedly và cổng PR báo chí Nhật Bản trỏ về các Hub `/ja/guide/*` và Data Hubs.

---

## 4. Nhật Ký Thử Nghiệm Theo Chu Kỳ (SEO Experiment Log)

| Đợt / Ngày | Baseline trước khi sửa | Thay đổi triển khai | Kết quả đo sau 7–14 ngày (Nginx Log + URL Inspection) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **#01 — `2026-11-17` đến `2026-11-18`** | GSC UI (`11/13`): `4` Indexed, `52.5K` Not indexed (`49,008` trong `core.xml`, `3,459` Crawled not indexed). Googlebot thật: `3–10` req/ngày; từng dính `504`/`404` ở `/robots.txt`. | 1. Whitelist 1,093 Google CIDRs + chặn fake Googlebot `403`.<br>2. Khóa cứng `/robots.txt` & `/favicon.ico` tĩnh trên NVMe.<br>3. Đang làm sạch `core.xml` (tách 44K công ty, bỏ 404/redirect), dọn DB `google_indexing_submissions`, ưu tiên `JobPosting` trong `auto_google_indexing_pg.js`. | *Đang theo dõi (Kiểm tra lại sau `2026-11-25` bằng kiểm toán Nginx IP + GSC URL Inspection API).* | `ACTIVE` |
| **#02 — `2026-11-23` (SSR Unhide & Soft-404 Elimination)** | 33/40 Hub URLs kẹt ở `Crawled - currently not indexed`; GSC cảnh báo `Soft 404`. Forensic DOM phát hiện `loading.tsx` nhốt `88%–94%` DOM (`110KB–397KB`) vào `<div hidden id="S:0..S:30">`, `<main>` đầu tiên `0` chữ, nhân đôi `<header>/<footer>`, `/ja/company/9999999999999` và `/ja/area/99` trả `HTTP 200 OK`. | 1. Xóa 4 file `loading.tsx` công khai (`[locale]`, `directory`, `pricing`, `search`).<br>2. Bỏ `useSearchParams()` SSR bailout khỏi `TopProgressBar`, `CompanyActions`, `CompanyManagementModal`.<br>3. Sửa `generateMetadata()` trong `company/[id]`, `license/[slug]`, `[locale]/layout` gọi `return notFound();`.<br>4. Tắt `prefetch={true}` trên `Header.tsx` chặn bão `?_rsc=`. | **Kết quả đo tức thì trên VPS:** `<div hidden>` giảm từ `110KB–397KB` xuống **`0 bytes (0 hidden divs)`**; văn bản hiển thị trực tiếp trong `<main>` tăng từ `0%` lên **`67.8%–88.6%`** (`1` `<header>`, `1` `<main>`, `1` `<footer>`); `/ja/area/99` và `/ja/company/9999999999999` trả chuẩn **`HTTP 404 Not Found`**. | `DEPLOYED & VERIFIED` |


### 🌐 Dealroom.co (DR 82 / DA 75) - B2B Directory & SaaS Intelligence
- **URL Hồ sơ Công khai:** https://app.dealroom.co/companies/kigyoulist_com
- **Tài khoản Quản trị (Admin Editor):** 	rung@kigyoulist.com
- **Trạng thái:** Live & Verified.
- **Backlink & Entity:**
  + Official Website: https://kigyoulist.com/ja (DoFollow)
  + Social: https://x.com/kigyoulist, https://www.linkedin.com/company/tqc-inc/
  + Publications: 
ote.com/kigyoulist
  + Products & Deep Links: /ja/search, /ja/pricing
  + Tech Docs: https://trungkim8694-cmd.github.io/kigyou-list-docs/


### 🌐 Peraichi (DR 85 / DA 88) - Web Builder & Authority Landing Page
- **URL Landing Page Công khai:** https://kigyoulist.hp.peraichi.com/
- **Tài khoản Quản trị:** 	rungkim8694@gmail.com
- **Trạng thái:** Live & Verified (HTTP 200 OK).
- **Backlink & Entity:**
  + Official Website: https://kigyoulist.com/ja (DoFollow Anchor & Button)
  + Title: 【公式】kigyoulist.com｜国内500万社法人データベース
  + Đơn vị chủ quản: TQC Inc. / TQC株式会社
