# 🗺️ KIGYOU-LIST FEATURE REGISTRY & MULTI-AGENT ARCHITECTURE CONTRACT
> **Single Source of Truth (SSOT)** cho toàn bộ hệ sinh thái tính năng, cơ sở dữ liệu, giao diện người dùng, phân quyền gói cước và chiến lược SEO của nền tảng **Kigyou-list (kigyoulist.com)**.
> **Bắt buộc áp dụng:** Mọi Agent (Data Engine, UI/UX, SEO, Growth Orchestrator, Billing) đều phải tham chiếu và tuân thủ hồ sơ tính năng tại tài liệu này.

---

## 1. NGUYÊN TẮC HỢP ĐỒNG LIÊN AGENT (MULTI-AGENT GOVERNANCE CONTRACT)

Khi bất kỳ Agent nào tạo mới, sửa đổi hoặc nâng cấp một tính năng, **tuyệt đối không được triển khai đơn lẻ (No Orphan Features)** mà bắt buộc phải hoàn thành đồng bộ **5 Tầng Liên Kết (5-Layer Stack)**:

```
[TẦNG 1: DỮ LIỆU]      ➔ Bảng Database (PostgreSQL/SQLite), nguồn cấp (NTA, FSA, GEPS, Crawler).
       │
[TẦNG 2: GIAO DIỆN]     ➔ Component UI chuẩn Nhật (jp-b2b-design-system), Route trang, Semantic HTML.
       │
[TẦNG 3: PHÂN QUYỀN]    ➔ Giới hạn gói cước: Free (Khách vãng lai), Verified (Định danh), Pro, Enterprise.
       │
[TẦNG 4: KỸ THUẬT SEO]  ➔ Schema.org JSON-LD, Dynamic Meta Title/Desc, Sitemap Chunk & IndexNow ping.
       │
[TẦNG 5: TRUYỀN THÔNG]  ➔ Bài viết PR (PR-FREE/PressNow/Zero-Press), bài Tech (Qiita/Zenn), Note.com.
```

---

## 2. MA TRẬN DANH MỤC TÍNH NĂNG CHÍNH THỨC (CORE FEATURE REGISTRY)

### NHÓM 1: CƠ SỞ DỮ LIỆU & TÌM KIẾM DOANH NGHIỆP (DATABASE & SEARCH)

#### 1.1. Advanced Multi-Criteria Company Search (Tìm Kiếm Đa Tiêu Chí)
* **Feature ID**: `feat-search-advanced`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Bảng `companies`, `sitemap_companies`, chỉ mục `idx_companies_employees_corp`, `idx_companies_pref`. 5.07M pháp nhân Nhật Bản.
* **Tầng 2 (UI/UX)**: Route `/[locale]/search`. Thanh tìm kiếm động, bộ lọc Drawer bên hông (`SearchSidebar.tsx`), phân trang mượt mà.
* **Tầng 3 (Entitlement)**:
  * **Free**: Tìm kiếm không giới hạn số lần, xem thông tin tóm tắt 20 kết quả/lần.
  * **Verified**: Xem chi tiết đầy đủ 50 kết quả/lần.
  * **Pro/Enterprise**: Xem không giới hạn kết quả, mở khóa toàn bộ số điện thoại và liên kết form.
* **Tầng 4 (SEO)**: Trang Hub tổng hợp, canonical động, noindex các trang filter quá sâu để tránh lãng phí crawl budget.
* **Tầng 5 (Marketing)**: Giới thiệu khả năng lọc 5 triệu doanh nghiệp trong 0.05s trên Note.com và Qiita.

#### 1.2. Reverse Phone Lookup & Intent (Tra Cứu Số Điện Thoại Doanh Nghiệp Đảo Ngược)
* **Feature ID**: `feat-search-phone-reverse`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Trường `phone_number` chuẩn hóa E.164 & định dạng nội địa Nhật (03-xxxx-xxxx, 06-xxxx-xxxx, 0120-xxx-xxx).
* **Tầng 2 (UI/UX)**: Hiển thị badge xác minh tại `/[locale]/company/[id]`, nút "Sao chép số" 1 chạm, cảnh báo an toàn.
* **Tầng 3 (Entitlement)**:
  * **Free**: Hiển thị đầy đủ số điện thoại của doanh nghiệp công khai để phục vụ tra cứu số lạ.
* **Tầng 4 (SEO)**: 
  * Schema: `telephone` trong `Organization`.
  * Dynamic Title: `【電話番号・住所】{company_name} | {phone_number}の企業情報` (Đón đầu lượng tìm kiếm SĐT đảo ngược trên Google).
* **Tầng 5 (Marketing)**: Bài viết Note.com: *"Cách tra cứu số điện thoại doanh nghiệp tránh cuộc gọi spam/lừa đảo tại Nhật"*.

#### 1.3. 5-Year Financial Trend Visualization (Biểu Đồ Tài Chính 5 Năm FSA EDINET)
* **Feature ID**: `feat-data-financial-edinet`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Đồng bộ từ FSA EDINET: `sales_amount` (Doanh thu), `ordinary_income` (Lợi nhuận thông thường), `net_assets`, `employee_count`.
* **Tầng 2 (UI/UX)**: Component biểu đồ cột & bảng tài chính 5 năm tại `/[locale]/company/[id]`, định dạng tiền tệ Nhật (万円, 億円, 兆円).
* **Tầng 3 (Entitlement)**:
  * **Free**: Xem biểu đồ 2 năm gần nhất.
  * **Pro/Enterprise**: Xem chi tiết 5 năm liên tục + phân tích chỉ số tăng trưởng.
* **Tầng 4 (SEO)**: Dynamic Title chứa trigger `【売上高・業績推移】` (đáp ứng đúng từ khóa Bing/Google người Nhật hay tìm).
* **Tầng 5 (Marketing)**: Bài viết phân tích tài chính doanh nghiệp tiêu biểu trên Qiita & Zenn.

#### 1.4. Qualified Invoice Issuer Verification (Xác Thực Mã Số Hóa Đơn T-Number)
* **Feature ID**: `feat-nta-invoice-check`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Tích hợp NTA Web-API Invoice (Mã T + 13 chữ số pháp nhân), ngày đăng ký hợp lệ, trạng thái còn hiệu lực.
* **Tầng 2 (UI/UX)**: Badge chứng nhận `適格請求書発行事業者 (インボイス対応済)` màu xanh ngọc uy tín, liên kết xác minh nguồn Quốc thuế.
* **Tầng 3 (Entitlement)**: Toàn bộ người dùng đều được xem miễn phí để củng cố tính minh bạch.
* **Tầng 4 (SEO)**: Schema `taxID`, từ khóa `インボイス登録番号`, `適格請求書`.
* **Tầng 5 (Marketing)**: Thông cáo báo chí PR-FREE về việc minh bạch hóa hóa đơn điện tử cho 5 triệu công ty.

---

### NHÓM 2: GIẢI PHÁP TIẾP THỊ B2B & KINH DOANH (OUTREACH & MONETIZATION)

#### 2.1. Form DM Automation Engine (Hệ Thống Tự Động Gửi Form Doanh Nghiệp B2B)
* **Feature ID**: `feat-form-marketing-engine`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Trường `contact_form_url`, bảng `form_campaigns`, `form_credits`, phát hiện Captcha/Turnstile.
* **Tầng 2 (UI/UX)**: Landing page `/[locale]/form-marketing`, giao diện quản lý chiến dịch gửi thư hàng loạt tại Admin/Dashboard.
* **Tầng 3 (Entitlement)**:
  * **Free**: Dùng thử 5 lượt gửi mẫu.
  * **Pro**: Tặng 300 credits/tháng, mua thêm 10 JPY/credit.
  * **Enterprise**: Gửi không giới hạn theo dung lượng cam kết, máy chủ IP riêng.
* **Tầng 4 (SEO)**: Landing page SEO từ khóa `フォーム営業 自動化`, `問い合わせフォーム営業 代行`, `フォームマーケティング`.
* **Tầng 5 (Marketing)**: Bài PR trên PRESSNOW & Tsunagugu về giải pháp tiếp cận khách hàng B2B không bị phàn nàn nhờ AI lọc từ khóa từ chối.

#### 2.2. High-Volume CSV Enterprise Export (Xuất Dữ Liệu CSV Hàng Loạt)
* **Feature ID**: `feat-export-csv-bulk`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Streaming export từ PostgreSQL/SQLite, mã hóa UTF-8 với BOM hỗ trợ mở trực tiếp bằng Microsoft Excel tiếng Nhật không bị lỗi font.
* **Tầng 2 (UI/UX)**: Nút "CSVエクスポート" trên thanh công cụ kết quả tìm kiếm, modal chọn cột cần xuất (SĐT, Email, Website, Người đại diện).
* **Tầng 3 (Entitlement)**:
  * **Free**: 20 dòng/ngày (tối đa 600 dòng/tháng).
  * **Verified Owner**: 50 dòng/ngày (1.500 dòng/tháng).
  * **Pro**: 10.000 dòng/tháng.
  * **Enterprise**: Không giới hạn.
* **Tầng 4 (SEO)**: Trang bảng giá `/[locale]/pricing`, từ khóa `企業リスト CSV ダウンロード`, `法人名簿 エクセル`.
* **Tầng 5 (Marketing)**: So sánh chi phí: Tiết kiệm 90% so với mua danh bạ tĩnh truyền thống 10 - 50¥/dòng.

---

### NHÓM 3: NỀN TẢNG DÀNH CHO LẬP TRÌNH VIÊN & AI (DEVELOPER & MCP SERVER)

#### 3.1. Public REST API v1
* **Feature ID**: `feat-developer-rest-api`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Các endpoints `/api/v1/companies`, `/api/v1/enrich/resolve`, `/api/v1/signals`, `/api/v1/quota`. Xác thực Bearer Token API Key.
* **Tầng 2 (UI/UX)**: Trang cổng thông tin lập trình viên `/[locale]/developer`, Swagger/OpenAPI interactive console.
* **Tầng 3 (Entitlement)**:
  * **Developer Free**: 100 requests/ngày.
  * **Pro API**: 10.000 requests/tháng.
  * **Enterprise API**: SLA 99.9%, Dedicated Rate Limit.
* **Tầng 4 (SEO)**: Thẻ `SoftwareApplication` schema, từ khóa `企業情報 API`, `法人番号 Web API`.
* **Tầng 5 (Marketing)**: Bài viết hướng dẫn tích hợp API vào Python/Node.js trên Qiita và Zenn.

#### 3.2. Model Context Protocol (MCP) Server for AI Agents
* **Feature ID**: `feat-developer-mcp-server`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Cổng MCP chuẩn kết nối Claude Desktop, Cursor IDE, Antigravity IDE.
* **Tầng 2 (UI/UX)**: Hướng dẫn cài đặt 1 lệnh `mcp_config.json` tại trang Developer.
* **Tầng 3 (Entitlement)**: Miễn phí truy vấn cơ bản cho cộng đồng nhà phát triển AI.
* **Tầng 4 (SEO)**: Đón đầu xu hướng SEO AI (GEO - Generative Engine Optimization) cho Cursor / Claude.
* **Tầng 5 (Marketing)**: Bài viết kỹ thuật viral trên Zenn: *"Cách biến AI Cursor thành chuyên gia phân tích 5 triệu công ty Nhật Bản qua MCP"*.

---

### NHÓM 4: MINH BẠCH, ĐỊNH DANH & PHÁP LÝ (TRUST & COMPLIANCE)

#### 4.1. Official Company Profile Claiming (Xác Nhận Hồ Sơ Doanh Nghiệp Chính Chủ)
* **Feature ID**: `feat-claim-profile`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Bảng `claims`, cơ chế xác minh DNS TXT record, HTML meta tag, hoặc gửi mã OTP qua email tên miền công ty (`@company.co.jp`).
* **Tầng 2 (UI/UX)**: Nút "この企業ページの管理者ですか？(無料オーナー申請)" tại trang chi tiết doanh nghiệp, Dashboard quản trị riêng.
* **Tầng 3 (Entitlement)**: Hoàn toàn miễn phí. Chủ doanh nghiệp được nâng hạn ngạch xuất CSV lên 50 dòng/ngày.
* **Tầng 4 (SEO)**: Badge `公式認証 (Verified Entity)` giúp tăng độ tin cậy trong mắt thuật toán Google E-E-A-T.
* **Tầng 5 (Marketing)**: Thông cáo báo chí PR-FREE: *"Kigyou-list mở cổng định danh hồ sơ doanh nghiệp miễn phí cho 5 triệu công ty"*.

#### 4.2. Corporate Data Opt-Out Portal (Cổng Tiếp Nhận Yêu Cầu Ẩn Dữ Liệu)
* **Feature ID**: `feat-compliance-opt-out`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Bảng `opt_outs`, xử lý cập nhật cờ `is_hidden` tự động trong 24h.
* **Tầng 2 (UI/UX)**: Trang tiếp nhận minh bạch tại `/[locale]/opt-out`, liên kết tại Footer toàn sàn.
* **Tầng 3 (Entitlement)**: Toàn bộ pháp nhân Nhật Bản đều được quyền yêu cầu theo Đạo luật bảo vệ thông tin cá nhân (APPI).
* **Tầng 4 (SEO)**: Đảm bảo tuân thủ Google Webmaster Guidelines và các quy định pháp lý B2B Nhật.
* **Tầng 5 (Marketing)**: Khẳng định uy tín, loại bỏ nỗi lo bị gắn nhãn "danh bạ rác".

---

### NHÓM 5: CỖ MÁY SEO ĐA TẦNG & CHỈ MỤC TỰ ĐỘNG (PSEO & INDEXING ENGINE)

#### 5.1. 47 Prefectures Regional SEO Hubs (Mạng Nhện 47 Tỉnh/Thành)
* **Feature ID**: `feat-seo-47-prefectures`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Dữ liệu phân cụm 47 tỉnh, 1.700+ quận huyện (Shikuchoson).
* **Tầng 2 (UI/UX)**: Khối HTML Grid trực quan tại Trang chủ + 47 trang landing page riêng biệt `/[locale]/area/[prefCode]`.
* **Tầng 4 (SEO)**: Cấu trúc đường dẫn sạch, Breadcrumbs chuẩn SEO, liên kết chéo spider-web toàn diện.

#### 5.2. Category × Prefecture Matrix Hubs (Ma Trận Ngành × Địa Phương)
* **Feature ID**: `feat-seo-industry-area-matrix`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: Ghép cặp 20 ngành chính JSIC × 47 tỉnh thành.
* **Tầng 2 (UI/UX)**: Trang chuyên sâu `/[locale]/industry/[code]/location/[pref]`.
* **Tầng 4 (SEO)**: Đánh trúng từ khóa tìm kiếm vàng như: `it企業 東京都豊島区` (từ khóa vừa lên #11 trên Google).

#### 5.3. High-Speed IndexNow 50,000 URLs/Day (Cỗ Máy Ép Index Siêu Tốc)
* **Feature ID**: `feat-seo-indexnow-fast`
* **Trạng thái**: `ACTIVE (100% Production)`
* **Tầng 1 (Data)**: PostgreSQL trên VPS, lưu vết `indexnow_submissions` chống nộp trùng lặp 100%.
* **Tầng 2 (Server/Cron)**: Crontab chạy 02:00 sáng mỗi ngày, nộp 50.000 URLs chia gói 10.000 URLs chuẩn IndexNow API.
* **Tầng 4 (SEO)**: Đã phủ sóng hơn **216.000 URLs** lên Bing Search, kéo traffic hiển thị lên hơn **2.650 impressions/tuần**.

---

## 3. CHECKLIST 5 BƯỚC BẮT BUỘC KHI PHÁT TRIỂN TÍNH NĂNG MỚI (NEW FEATURE CHECKLIST)

Mọi Agent trước khi thông báo "Đã hoàn thành tính năng" phải vượt qua bảng kiểm định sau:

- [ ] **1. Data Ready**: Dữ liệu có bảng lưu trữ rõ ràng, có index tìm kiếm, không làm chậm query chung?
- [ ] **2. UI Implemented**: Giao diện chuẩn B2B Nhật (`jp-b2b-design-system`), responsive mobile, nền trắng/xám dịu mắt, không lạm dụng icon, và tương thích 100% với Google Chrome ở Chế độ Tối (Dark Mode)?
- [ ] **3. Access Controlled**: Có logic phân biệt quyền lợi rõ ràng giữa Free, Verified, Pro và Enterprise?
- [ ] **4. SEO Configured**: Đã gắn thẻ Schema JSON-LD, Dynamic Title/Meta Description, và cập nhật vào Sitemap/IndexNow?
- [ ] **5. Story Published**: Đã lên lịch 1 bài PR hoặc bài phân tích trên PR-FREE / Note.com / Qiita để kéo backlink và traffic mồi?

---

> 📌 **Lưu ý bảo trì:** File này được cập nhật tự động mỗi khi có tính năng mới được đưa vào hoạt động chính thức trên Kigyou-list. Mọi Agent đều có thể đọc file này để tự điều chỉnh hành vi đồng bộ.
