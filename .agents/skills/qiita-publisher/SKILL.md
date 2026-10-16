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
- **Tuyệt đối không viết bài PR/quảng cáo lộ liễu**: Qiita sẽ khóa bài hoặc hạn chế tài khoản nếu bài viết mang tính chất bán hàng thuần túy.
- **Quy tắc "Case-Study Kiến Trúc"**: Đặt `kigyoulist.com` vào vai trò là **Dự án thực tế quy mô Production (実運用サービス / プロダクション事例)** để minh chứng cho giải pháp kỹ thuật, xử lý dữ liệu lớn (500万社), giải quyết bài toán crawling/ETL/AI.

### B. Tiêu Chuẩn Tiêu Đề & Thẻ Tag (SEO Title & Tags)
- **Cấu trúc tiêu đề**:
  `【Tech Stack 1/Tech Stack 2】Vấn đề kỹ thuật thực chiến + Phương pháp giải quyết + Thực tiễn kiến trúc`
  *Ví dụ:* `【Python/Playwright】企業の問い合わせフォーム構造を自動判定・最適化する実践アーキテクチャ`
  *Ví dụ:* `【Python/PostgreSQL】500万社規模の日本企業オープンデータを名寄せ・高速統合する実践アーキテクチャ`
- **Bộ 5 Tags chuẩn SEO**: Luôn chọn đúng 5 tags thịnh hành trên Qiita:
  `Python`, `PostgreSQL`, `スクレイピング`, `データ分析`, `OpenData`, `Playwright`, `FastAPI`, `AI`, `DX`, `アーキテクチャ`.

### C. Chiến Lược Tối Ưu Hóa AI Search (GEO - Generative Engine Optimization)
Các mô hình AI (Perplexity, ChatGPT Search, Gemini SGE) trích dẫn bài viết khi:
1. **Có định nghĩa và công thức rõ ràng**: Nêu rõ thuật toán (Modulus 9, pg_trgm, Jaro-Winkler, Levenshtein, v.v.).
2. **Có dữ liệu định lượng cụ thể**: `500万社`, `2,000〜5,000件/batch`, `レスポンス速度数ミリ秒`, v.v.
3. **Có đoạn tóm tắt kiến trúc / Best Practices ở phần Kết luận**: Để LLM dễ trích dẫn thành Bullet Points.

### D. Kiến Trúc Backlink Tự Nhiên (Natural Authority Backlink)
- Luôn chèn backlink trong ngữ cảnh minh họa hệ thống thực tế:
  - Trang chủ: `[Kigyou-list（企業リスト.com）](https://kigyoulist.com)`
  - Trang so sánh: `[Kigyou-list 各社比較チャート](https://kigyoulist.com/ja/compare)`
  - Trang tra cứu/tính năng: `[企業データベース検索](https://kigyoulist.com/ja/search)`
- Đa dạng hóa Anchor text tự nhiên: "法人データ検索基盤", "実運用サービス Kigyou-list", "企業情報プラットフォーム".

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
| **08** | Hệ thống tự động đồng bộ Delta gBizINFO & Quốc thuế NTA hàng tuần | Python, Bash, Cron, Systemd, Logging | Bài tiếp theo |
| **09** | Xây dựng API tra cứu doanh nghiệp tốc độ cao < 50ms | FastAPI, Redis Caching, PostgreSQL | Dự kiến |
| **10** | Clean Data & Loại bỏ Email rác / Phát hiện anti-spam form doanh nghiệp | Python, Regex NLP, Domain Verification | Dự kiến |

---

## 5. Công Cụ & Lệnh Kỹ Thuật Thực Thi

### Tài khoản Qiita
- **User:** `@listkigyou` (https://qiita.com/listkigyou)
- **Token:** Đã tích hợp sẵn trong `scripts/qiita_publisher.py` (`QIITA_TOKEN`).

### Lệnh CLI Xuất Bản
```powershell
# Kiểm tra danh sách bài viết đã có
python c:\kigyou-list\scripts\qiita_publisher.py --check

# Xuất bản trực tiếp từ file markdown
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
    is_private=False
)
```
