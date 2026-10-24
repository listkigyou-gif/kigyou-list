---
name: bing-webmaster
description: Chuyên gia phân tích dữ liệu tìm kiếm Bing Webmaster Tools, giám sát lưu lượng tìm kiếm (Search Performance), kiểm tra thứ hạng từ khóa tiếng Nhật (Queries & Impressions) và tự động ép lập chỉ mục siêu tốc (Fast Indexing / Submit URLs) qua Bing API & IndexNow cho nền tảng Kigyou-list (kigyoulist.com).
---

# Bing Webmaster & IndexNow Intelligence for Kigyou-list

Kỹ năng này trao quyền cho Agent tương tác trực tiếp với **Microsoft Bing Webmaster Tools API** và giao thức **IndexNow** của nền tảng **Kigyou-list (https://kigyoulist.com)** bằng API Key chính thức: `7c742571ab6a4103aa339488f8220031`.

---

## 1. Các Năng Lực Cốt Lõi

1. **Báo Cáo Hiệu Suất Tìm Kiếm (Search Performance):**
   * Tự động lấy số lượt click, lượt hiển thị (Impressions) theo ngày hoặc 7/30 ngày gần nhất.
   * Cung cấp dữ liệu thực tế về xu hướng tăng trưởng của website trên Bing.

2. **Phân Tích Từ Khóa B2B Tiếng Nhật (Top Queries):**
   * Đọc danh sách từ khóa thực tế mà người dùng Nhật đang tìm thấy `kigyoulist.com` (ví dụ: `企業リスト`, `企業データ`, `saas カオスマップ 2026`).
   * Phân tích vị trí trung bình (Rank) để đề xuất chủ đề bài viết mới cho `growth-orchestrator`.

3. **Ép Lập Chỉ Mục Siêu Tốc (Fast Indexing & IndexNow):**
   * Giải quyết trực tiếp cảnh báo: *"Some of your recently published pages were not submitted via IndexNow"*.
   * Gửi link mới của `kigyoulist.com` (hoặc các bài viết/trang doanh nghiệp mới) để bot Bing vào cào và index ngay trong vài phút thay vì chờ hàng tuần.
   * Hạn mức: **100 URLs/ngày** và **1.700 URLs/tháng**.

---

## 2. Cách Chạy Lệnh Thực Thi

Agent có thể chạy trực tiếp bộ công cụ qua script Python đã được chuẩn hóa:

```bash
# 1. Xem báo cáo tổng quan và hạn mức Index hôm nay
python c:\kigyou-list\scripts\bing_webmaster.py --action summary

# 2. Xem top từ khóa tiếng Nhật đang mang lại Click & Impression cao nhất
python c:\kigyou-list\scripts\bing_webmaster.py --action queries --limit 20

# 3. Xem top trang/URL có lượt hiển thị nhiều nhất trên Bing
python c:\kigyou-list\scripts\bing_webmaster.py --action pages --limit 20

# 4. Gửi 1 URL mới lên Bing để index ngay lập tức
python c:\kigyou-list\scripts\bing_webmaster.py --action submit --url "https://kigyoulist.com/ja/new-page-url"

# 5. Kiểm tra thống kê tiến độ IndexNow tự động chống trùng lặp
python c:\kigyou-list\scripts\auto_indexnow_submitter.py --stats

# 6. Chạy đợt nộp 1.000 URL doanh nghiệp tự động (Cam kết 100% không trùng lặp)
python c:\kigyou-list\scripts\auto_indexnow_submitter.py --batch-size 1000
```

---

## 3. Tích Hợp Vào Quy Trình Vận Hành Hàng Ngày

Khi người dùng hỏi:
* *"Tình hình traffic/từ khóa trên Bing thế nào?"*
* *"Bing đang lên những từ khóa nào?"*
* *"Ép Bing index trang này giúp tôi"*
* Hoặc trong chu trình tổng hợp buổi sáng của `growth-orchestrator`:

👉 **Agent tự động gọi `bing_webmaster.py` để lấy số liệu thực tế, giải thích rõ ràng và chủ động submit các URL mới để gia tăng độ phủ SEO B2B tại Nhật.**

---

## 4. Tự Động Hóa 100% Qua Master Data Orchestrator Hook

IndexNow được tích hợp trực tiếp vào vòng lặp Daemon của [master_orchestrator.py](file:///c:/kigyou-list/master_orchestrator.py) qua hàm `trigger_instant_indexing_hook(num_urls=500)`:
* **Chu kỳ**: Tự động kích hoạt sau mỗi lần hoàn thành Bulk Delta Sync lên VPS PostgreSQL.
* **Tier 0 ưu tiên**: Tự động lọc ra 500 doanh nghiệp vừa được bổ sung Báo cáo tài chính (EDINET) hoặc Giấy phép quốc gia (MLIT/NPA) chưa từng nộp.
* **Kiểm định**: Cam kết 100% không trùng lặp qua bảng SQLite `indexnow_submissions` và sử dụng IndexNow Key đã xác thực `0a1fbe0a7866441bb57817e0bf538068`.
