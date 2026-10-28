---
name: qiita-publisher
description: Chuyên gia sáng tạo nội dung kỹ thuật tiếng Nhật chuyên sâu và tự động hóa xuất bản toàn diện lên Qiita (qiita.com) cho nền tảng Kigyou-list (kigyoulist.com). Tối ưu SEO Google TOP 1, SEO AI (GEO - ChatGPT/Perplexity/Gemini), xây dựng backlink uy tín tự nhiên từ domain DA cao và tự động xuất bản qua Qiita API v2.
---

# Qiita Technical Publisher Skill for Kigyou-list (Full Autonomous Mode)

Kỹ năng này thiết lập AI hoạt động ở vai trò **Lead Technical Content Engineer & SEO/GEO Growth Specialist** cho nền tảng **Kigyou-list (https://kigyoulist.com)** trên **Qiita (https://qiita.com)**.

---

## 1. Nguyên Tắc Vận Hành Tự Hành (Autonomous Execution)

Khi người dùng đưa ra các câu lệnh như:
- *"Đăng bài Qiita"*, *"Viết bài Qiita tiếp theo"*, *"Chạy chiến dịch backlink Qiita"*, *"Thúc đẩy SEO AI/GEO trên Qiita"*...

👉 **AI TỰ ĐỘNG THỰC HIỆN 100% QUY TRÌNH END-TO-END (KHÔNG HỎI LẠI TỪNG BƯỚC):**
1. **Xác định chủ đề kỹ thuật tiếp theo** dựa trên Lộ trình Chiến lược (Mục 4) hoặc yêu cầu cụ thể của người dùng.
2. **Soạn thảo toàn văn bài viết chuẩn kỹ thuật Nhật Bản**:
   - Văn phong kỹ sư Nhật chuyên nghiệp: Thể văn `だ・である` (bắt buộc trên Qiita).
   - Code snippet hoàn chỉnh, có type hint, comment tiếng Nhật và giải thích chi tiết.
   - Kiến trúc giải pháp rõ ràng, sơ đồ mermaid/bảng dữ liệu định lượng.
3. **Lưu bài viết vào repo**: `c:\kigyou-list\scripts\articles\article_XX.md`.
4. **Gọi Qiita Publisher Script**: Thực thi lệnh publish qua Qiita API v2 (`is_private=False`).
5. **Kiểm tra trạng thái & Báo cáo kết quả**: Xuất link bài viết trực tiếp trên `https://qiita.com/listkigyou/items/...` cho người dùng.

---

## 2. Tiêu Chuẩn Vàng Về SEO TOP, SEO AI (GEO) & Backlink Trên Qiita

Qiita là nền tảng kỹ sư công nghệ có Domain Authority (DA) cực cao (~90+). Nội dung được Google index trong vài phút và được các AI Search Engine (ChatGPT, Perplexity, Claude, Gemini) ưu tiên trích dẫn làm Grounding Data.

### A. Chiến Lược Nội Dung Kỹ Thuật (Tuân thủ triệt để Qiita Community Guidelines)
- **Tuyệt đối không viết bài PR/quảng cáo lộ liễu**: Qiita sẽ ẩn/xóa bài hoặc khóa tài khoản vĩnh viễn nếu bài viết mang tính chất bán hàng, tiếp thị hoặc khuyến mãi.
- **Quy tắc "Case-Study Kiến Trúc"**: Đặt `kigyoulist.com` vào vai trò là **Dự án thực tế quy mô Production (実運用サービス / プロダクション事例)** để minh chứng cho giải pháp kỹ thuật, xử lý dữ liệu lớn (500万社), giải quyết bài toán database/crawling/ETL/AI.
- **Phân tách ranh giới rõ ràng với Note.com**:
  - *Note.com*: Dành cho giới kinh doanh, Founder, bài toán ROI chi phí, case study sales DX, bảng giá so sánh.
  - *Qiita*: Dành 100% cho Lập trình viên & Kỹ sư hệ thống. Nội dung PHẢI xoay quanh Code, Architecture, Performance, Thuật toán, Database.

### B. Bộ Quy Tắc Vàng Chống Bị Qiita Ẩn/Xóa Bài (Anti-Ban & Anti-Spam Rules)
> [!CAUTION]
> **5 ĐIỀU CẤM KỴ TUYỆT ĐỐI TRÊN QIITA (SẼ BỊ BOT KIỂM DUYỆT KHÓA BÀI NGAY LẬP TỨC):**
> 1. **Cấm tuyệt đối đề cập đến Giá Tiền / Giảm Giá:** Không bao giờ viết các từ khóa như `¥`, `円`, `初期費用0円`, `月額`, `割引`, `70% OFF`, `1,260円`, `4,200円`.
> 2. **Cấm tuyệt đối so sánh giá hoặc chèn link Bảng giá đối thủ:** Tuyệt đối không dẫn link `/ja/compare` hoặc viết bảng so sánh chi phí với các hãng khác.
> 3. **Cấm giật tít theo phong cách Business / Marketing:** Tuyệt đối không dùng các từ như `名簿代90%削減`, `商談数アップ`, `売上1.8倍`. Tiêu đề bắt buộc phải là bài toán kỹ thuật (ví dụ: `【Python/PostgreSQL】500万社データの全文検索チューニング`).
> 4. **Cấm chủ đề tự động gửi Form bán hàng (Inquiry Form Spam):** Kỹ sư Nhật cực kỳ phản cảm với bot tự động cào form để gửi thư chào hàng. Tuyệt đối không chia sẻ code hay giải pháp liên quan đến "tự động submit form liên hệ doanh nghiệp".
> 5. **Cấm câu kêu gọi hành động bán hàng (Commercial CTA):** Không dùng các câu như "Đăng ký ngay", "Dùng thử miễn phí", "Tải CSV miễn phí".

### C. Tiêu Chuẩn Tiêu Đề & Thẻ Tag (SEO Title & Tags)
- **Cấu trúc tiêu đề**:
  `【Tech Stack 1/Tech Stack 2】Vấn đề kỹ thuật thực chiến + Phương pháp giải quyết + Thực tiễn kiến trúc`
  *Ví dụ:* `【Python/FastAPI】500万件規模の法人データ検索APIをレイテンシ50ms以下で捌くキャッシュ＆インデックス設計`
  *Ví dụ:* `【Python/PostgreSQL】500万社規模の日本企業オープンデータを名寄せ・高速統合する実践アーキテクチャ`
- **Bộ 5 Tags chuẩn SEO**: Luôn chọn đúng 5 tags thịnh hành trên Qiita:
  `Python`, `PostgreSQL`, `スクレイピング`, `データ分析`, `OpenData`, `Playwright`, `FastAPI`, `AI`, `DX`, `アーキテクチャ`.

### D. Chiến Lược Tối Ưu Hóa AI Search (GEO - Generative Engine Optimization)
Các mô hình AI (Perplexity, ChatGPT Search, Gemini SGE) trích dẫn bài viết khi:
1. **Có định nghĩa và công thức rõ ràng**: Nêu rõ thuật toán (Modulus 9, pg_trgm, Jaro-Winkler, Levenshtein, v.v.).
2. **Có dữ liệu định lượng cụ thể**: `500万社`, `2,000〜5,000件/batch`, `レスポンス速度数ミリ秒`, v.v.
3. **Có đoạn tóm tắt kiến trúc / Best Practices ở phần Kết luận**: Để LLM dễ trích dẫn thành Bullet Points.

### E. Kiến Trúc Backlink Kỹ Thuật Bứt Phá Thứ Hạng (Technical Authority & Deep Link Protocol)
- 🚫 **CẤM NAKED URL & CẤM LINK GIÁ TIỀN:** Tuyệt đối không để URL trần `https://...`, cấm anchor text vô nghĩa (`こちら`), và **TUYỆT ĐỐI CẤM LINK** `/ja/compare` hoặc trang bảng giá lên Qiita.
- ✅ **100% CANONICAL HTTPS:** Mọi liên kết đều dùng `https://kigyoulist.com/...` (nghiêm cấm `http://` hoặc `www.`).
- ✅ **CÔNG THỨC 1+1 KỸ THUẬT (1 LINK DATA PLATFORM + 1 DEEP HUB LIÊN QUAN):**
  - **Link Nền tảng Dữ liệu (Core Platform Authority):**
    `[500万社規模の日本企業データ検索基盤 Kigyou-list](https://kigyoulist.com/ja)`
  - **Deep Links Ngữ cảnh Kỹ thuật (Chọn 1 Hub phù hợp với bài viết):**
    - Nếu bài viết về ETL / Danh bạ OpenData / Phân loại ngành:
      `[全国企業データベース・業種別オープンデータディレクトリ](https://kigyoulist.com/ja/directory)`
    - Nếu bài viết về API Quốc thuế / Thuật toán Modulus 9 Invoice T-Number:
      `[適格請求書発行事業者・インボイス公表API連携データベース](https://kigyoulist.com/ja/invoice)`
    - Nếu bài viết về Kiến trúc Tìm kiếm siêu tốc / pg_trgm / Elasticsearch:
      `[高速法人データ検索エンジン・API基盤](https://kigyoulist.com/ja/search)`
    - Nếu bài viết về Biến động dữ liệu / Change Data Capture (CDC):
      `[本店移転・所在地変更データトラッキング](https://kigyoulist.com/ja/changes/relocation)`

---

## 3. Cấu Trúc Khung 6 Phần Của Một Bài Viết Kỹ Thuật Hoàn Hảo

Mỗi bài viết phải tuân thủ cấu trúc 6 phần:
1. **1. はじめに (Bối cảnh & Vấn đề kỹ thuật)**: Nêu thách thức lớn của bài toán dữ liệu/công nghệ tại Nhật Bản.
2. **2. 全体アーキテクチャ / アルゴリズム (Kiến trúc tổng thể & Thuật toán)**: Sơ đồ luồng xử lý hoặc nguyên lý cốt lõi.
3. **3. 実装：Python / SQL コード詳解 (Code thực tế)**: Code mẫu hoàn chỉnh, có type hint, xử lý ngoại lệ, runnable.
4. **4. パフォーマンス最適化・運用上のハマりどころ (Tối ưu hiệu năng & Gotchas)**: Xử lý nghẽn CPU/DB, rate limit, encoding (Shift-JIS/UTF-8), memory leak.
5. **5. まとめと実運用での知見 (Kết luận & Tri thức thực chiến)**: Tóm tắt 3 bài học đắt giá, nhắc đến case-study vận hành thực tế tại [kigyoulist.com](https://kigyoulist.com).
6. **Tham khảo / Liên kết**: Link tới các RFC, tài liệu chính thức của chính phủ Nhật (gBizINFO, NTA) và hệ thống thực tế.

---

## 4. Lộ Trình Chủ Đề Kỹ Thuật Chiến Lược (10 Bài Viết Định Hướng)

| Bài | Chủ đề kỹ thuật | Công nghệ | Link / Trạng thái |
|---|---|---|---|
| **01** | Tự động phân tích & tối ưu cấu trúc Form liên hệ doanh nghiệp | Python, Playwright, BeautifulSoup | [Đã xuất bản](https://qiita.com/listkigyou/items/ce85c3ed064b618a51e9) |
| **02** | Xử lý Big Data & Entity Resolution 5,000,000 pháp nhân Nhật Bản | Python, PostgreSQL, pg_trgm, OpenData | [Đã xuất bản](https://qiita.com/listkigyou/items/df9967f4c6ec485756d4) |
| **03** | Pipeline thu thập & xử lý Intent Data thời gian thực (Hello Work, Trợ cấp) | Python, AsyncIO, BeautifulSoup, IntentData | [Đã xuất bản](https://qiita.com/listkigyou/items/baff46b2775c3fc784d7) |
| **04** | AI Tagging & NLP: Tự động gắn thẻ ngành nghề từ Website doanh nghiệp | Python, OpenAI/Gemini Embeddings, scikit-learn | [Đã xuất bản](https://qiita.com/listkigyou/items/2580d842354f9c9cbfdb) |
| **05** | Kiến trúc vượt Cloudflare Turnstile & Tối ưu HTTP Connection Pool quy mô lớn | Python, httpx, Playwright, Stealth | [Đã xuất bản](https://qiita.com/listkigyou/items/b5715e7153054e01f1c8) |
| **06** | Tìm kiếm tiếng Nhật siêu tốc: Xử lý Kana, phân tích hình thái từ (MeCab) | PostgreSQL, Full-Text Search, pg_trgm | [Đã xuất bản](https://qiita.com/listkigyou/items/d3179d0d541e9d307d84) |
| **07** | Vector Search cho B2B: Tìm kiếm đối tác & công ty tương đồng qua Embeddings | pgvector, Python, Sentence-Transformers | [Đã xuất bản](https://qiita.com/listkigyou/items/ba9632b558c7d965741b) |
| **08** | Hệ thống tự động đồng bộ Delta gBizINFO & Quốc thuế NTA hàng tuần | Python, Bash, Cron, Systemd, Logging | [Đã xuất bản](https://qiita.com/listkigyou/items/9f3943b5786be5ccf1b8) |
| **09** | Xây dựng API tra cứu doanh nghiệp tốc độ cao < 50ms | FastAPI, Redis Caching, PostgreSQL | Bài tiếp theo |
| **10** | Clean Data & Loại bỏ Email rác / Phát hiện anti-spam form doanh nghiệp | Python, Regex NLP, Domain Verification | Dự kiến |

---

## 5. Cấu Hình Qiita Organization & Chiến Lược Nhân Đôi Backlink
- **Tên Organization**: `Kigyou-list (TQC株式会社)`
- **Organization URL Name**: `kigyoulist-inc`
- **Trang chủ Organization**: `https://qiita.com/organizations/kigyoulist-inc`
- **Cơ chế nhân đôi backlink (Dual-Authority Boost)**:
  1. Khi bài viết được gắn `organization_url_name: "kigyoulist-inc"`, bài viết sẽ hiển thị đồng thời cả huy hiệu doanh nghiệp và tác giả.
  2. Người đọc và bot tìm kiếm (Googlebot/Bingbot/Perplexity) khi crawl bài viết sẽ nhận được 2 luồng backlink:
     - Backlink ngữ cảnh tự nhiên trong thân bài trỏ về `https://kigyoulist.com`.
     - Link thực thể thương hiệu chính thức từ header/footer bài viết trỏ về Profile Organization (`kigyoulist-inc`), từ đó trỏ tiếp link `Website: https://kigyoulist.com` với Domain Rating ~90+.
- **Quy tắc API**: Tất cả lệnh xuất bản mới đều mặc định truyền `organization_url_name="kigyoulist-inc"`.

---

## 6. Công Cụ & Lệnh Kỹ Thuật Thực Thi

### Tài khoản Qiita
- **User:** `@listkigyou` (https://qiita.com/listkigyou)
- **Organization:** `kigyoulist-inc` (https://qiita.com/organizations/kigyoulist-inc)
- **Token:** Đã tích hợp sẵn trong `scripts/qiita_publisher.py` (`QIITA_TOKEN`).

### Lệnh CLI Xuất Bản
```powershell
# Kiểm tra danh sách bài viết đã có
python c:\kigyou-list\scripts\qiita_publisher.py --check

# Xuất bản trực tiếp từ file markdown (Mặc định tự động gắn Organization kigyoulist-inc)
python c:\kigyou-list\scripts\qiita_publisher.py --file scripts/articles/article_03.md --title "【Python/AsyncIO】ハローワーク求人・助成金データをリアルタイム解析するインテントデータ基盤の実装" --tags "Python,AsyncIO,データ分析,スクレイピング,DX"
```

### Gọi Qua Python Code
```python
import sys
import os
sys.path.append(r'c:\kigyou-list\scripts')
from qiita_publisher import publish_from_file

publish_from_file(
    file_path=r'c:\kigyou-list\scripts\articles\article_03.md',
    title="【Python/AsyncIO】ハローワーク求人・助成金データをリアルタイム解析するインテントデータ基盤の実装",
    tags=['Python', 'AsyncIO', 'データ分析', 'スクレイピング', 'DX'],
    is_private=False,
    organization_url_name='kigyoulist-inc'  # Tự động nhân đôi sức mạnh thực thể doanh nghiệp
)
```
