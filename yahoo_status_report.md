# Báo cáo Giám sát Chi tiết Yahoo Maps Crawler

* **Thời gian cập nhật báo cáo**: `2026-06-11 20:30:47`
* **Số cổng proxy hoạt động**: `🟢 53 / 53`

---

## 🚨 Trạng thái Cảnh báo Hệ thống
> [!NOTE]
> **HỆ THỐNG KHỎE MẠNH**: Tất cả 50 cổng proxy đang hoạt động tốt với tỷ lệ thành công ổn định.



---

## 📈 Thống kê Tổng thể Dữ liệu (Tích lũy từ files kết quả)

| Chỉ số dữ liệu | Số lượng bản ghi | Mô tả |
| :--- | :--- | :--- |
| **Tổng số doanh nghiệp đã quét qua** | **6,071,532** | Số lượng doanh nghiệp được đọc và tìm kiếm trên Yahoo Map |
| **Số lượng Số điện thoại (SĐT) thu được** | **2,074,914** | Số lượng SĐT trích xuất thành công |
| **Số lượng Website chính thức thu được** | **474,059** | Số lượng URL website chính thức của doanh nghiệp |
| **Tỷ lệ trích xuất SĐT thành công** | **34.17%** | Hiệu năng tìm thấy thông tin liên hệ thực tế |

---

## ⚙️ Thống kê Tiến trình ETL (Đồng bộ Master & Postgres)
> [!NOTE]
> **Quy luật kích hoạt ETL**: Tiến trình ETL tự động chạy khi tổng số lượng dữ liệu cào mới **cộng gộp từ tất cả các cổng** đạt **20,000 records**, hoặc định kỳ sau mỗi **2 tiếng** (tùy điều kiện nào đến trước).

| Phân lớp dữ liệu | Số lượng bản ghi | Mô tả trạng thái |
| :--- | :--- | :--- |
| **Dữ liệu thô trong Staging (`raw_yahoo`)** | **5,066,526** | Dữ liệu Yahoo thô đã nạp thành công vào SQLite Staging (Step 3) |
| **Dữ liệu đã hợp nhất Master (`companies`)** | **5,066,517** | Số lượng doanh nghiệp đã được cập nhật dữ liệu Yahoo chính thức và đồng bộ sang **PostgreSQL** sản xuất (Step 5 & 7) |

---

## 📊 Biểu đồ Tốc độ Cào Yahoo (Lượng tăng thêm/phút)

* **Biểu đồ Tốc độ cào 15 phút (6 Giờ qua):**
![Biểu đồ Tốc độ cào 15 phút](stats_yahoo_15m.svg)

* **Biểu đồ Tốc độ cào 1 Tiếng (24 Giờ qua):**
![Biểu đồ Tốc độ cào 1 Tiếng](stats_yahoo_1h.svg)

---

## 🗺️ Chi tiết Hiệu suất cào trên từng Cổng Proxy
* Bảng liệt kê chi tiết số lượng thông tin thu được và trạng thái cảnh báo chặn của từng luồng.
* **Lưu ý**: Lỗi Chặn (Gần đây) được đếm dựa trên log 200 dòng cuối để phản ánh tốc độ bị chặn theo thời gian thực.

| Cổng Proxy | Trạng thái | Đã cào (Dòng CSV) | Số Điện Thoại | Website | Lỗi Chặn (Gần đây) | Tỷ lệ SĐT (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Port 40002** | 🟢 Active | 316 | 244 | 69 | 0 | 77.2% |
| **Port 40003** | 🟢 Active | 292 | 117 | 5 | 0 | 40.1% |
| **Port 40004** | 🟢 Active | 322 | 233 | 67 | 0 | 72.4% |
| **Port 40005** | 🟢 Active | 290 | 205 | 44 | 0 | 70.7% |
| **Port 40009** | 🟢 Active | 312 | 231 | 68 | 0 | 74.0% |
| **Port 40010** | 🟢 Active | 312 | 223 | 64 | 0 | 71.5% |
| **Port 40011** | 🟢 Active | 310 | 183 | 45 | 0 | 59.0% |
| **Port 40012** | 🟢 Active | 312 | 128 | 20 | 0 | 41.0% |
| **Port 40030** | 🟢 Active | 270 | 101 | 17 | 0 | 37.4% |
| **Port 40031** | 🟢 Active | 251 | 189 | 57 | 0 | 75.3% |
| **Port 40032** | 🟢 Active | 305 | 182 | 61 | 0 | 59.7% |
| **Port 40033** | 🟢 Active | 282 | 199 | 51 | 0 | 70.6% |
| **Port 40034** | 🟢 Active | 313 | 135 | 26 | 0 | 43.1% |
| **Port 40035** | 🟢 Active | 198 | 86 | 23 | 0 | 43.4% |
| **Port 40036** | 🟢 Active | 344 | 120 | 15 | 0 | 34.9% |
| **Port 40037** | 🟢 Active | 61 | 26 | 1 | 0 | 42.6% |
| **Port 40038** | 🟢 Active | 102 | 75 | 25 | 0 | 73.5% |
| **Port 40039** | 🟢 Active | 329 | 236 | 71 | 0 | 71.7% |
| **Port 40041** | 🟢 Active | 333 | 124 | 22 | 0 | 37.2% |
| **Port 40043** | 🟢 Active | 301 | 136 | 19 | 0 | 45.2% |
| **Port 40045** | 🟢 Active | 319 | 129 | 24 | 0 | 40.4% |
| **Port 40047** | 🟢 Active | 132 | 94 | 23 | 0 | 71.2% |
| **Port 40049** | 🟢 Active | 285 | 199 | 74 | 0 | 69.8% |
| **Port 40050** | 🟢 Active | 290 | 217 | 58 | 0 | 74.8% |
| **Port 40051** | 🟢 Active | 289 | 174 | 56 | 0 | 60.2% |
| **Port 40052** | 🟢 Active | 294 | 123 | 17 | 0 | 41.8% |
| **Port 40053** | 🟢 Active | 318 | 222 | 75 | 0 | 69.8% |
| **Port 40054** | 🟢 Active | 280 | 119 | 17 | 0 | 42.5% |
| **Port 40055** | 🟢 Active | 301 | 226 | 67 | 0 | 75.1% |
| **Port 40057** | 🟢 Active | 288 | 95 | 12 | 0 | 33.0% |
| **Port 40058** | 🟢 Active | 338 | 256 | 77 | 0 | 75.7% |
| **Port 40059** | 🟢 Active | 324 | 237 | 63 | 0 | 73.1% |
| **Port 40060** | 🟢 Active | 334 | 237 | 65 | 0 | 71.0% |
| **Port 40061** | 🟢 Active | 307 | 222 | 72 | 0 | 72.3% |
| **Port 40062** | 🟢 Active | 325 | 213 | 67 | 0 | 65.5% |
| **Port 40063** | 🟢 Active | 307 | 197 | 63 | 0 | 64.2% |
| **Port 40064** | 🟢 Active | 257 | 96 | 21 | 0 | 37.4% |
| **Port 40065** | 🟢 Active | 278 | 208 | 57 | 0 | 74.8% |
| **Port 40066** | 🟢 Active | 267 | 154 | 33 | 0 | 57.7% |
| **Port 40067** | 🟢 Active | 331 | 247 | 72 | 0 | 74.6% |
| **Port 40068** | 🟢 Active | 293 | 219 | 80 | 0 | 74.7% |
| **Port 40069** | 🟢 Active | 240 | 107 | 25 | 0 | 44.6% |
| **Port 40070** | 🟢 Active | 312 | 237 | 71 | 0 | 76.0% |
| **Port 40071** | 🟢 Active | 375 | 262 | 74 | 0 | 69.9% |
| **Port 40072** | 🟢 Active | 370 | 138 | 21 | 0 | 37.3% |
| **Port 40073** | 🟢 Active | 301 | 217 | 53 | 0 | 72.1% |
| **Port 40074** | 🟢 Active | 289 | 202 | 62 | 0 | 69.9% |
| **Port 40075** | 🟢 Active | 309 | 237 | 72 | 0 | 76.7% |
| **Port 40076** | 🟢 Active | 87 | 36 | 14 | 0 | 41.4% |
| **Port 40077** | 🟢 Active | 341 | 249 | 82 | 0 | 73.0% |
| **Port 40078** | 🟢 Active | 460 | 162 | 19 | 0 | 35.2% |
| **Port 40079** | 🟢 Active | 463 | 247 | 64 | 0 | 53.3% |
| **Port 40080** | 🟢 Active | 464 | 183 | 40 | 0 | 39.4% |


---

## 🛠️ Đề xuất Xử lý Sự cố & Giám sát Lỗi
Nếu phát hiện một hoặc nhiều cổng bị lỗi hoặc bị chặn liên tục (biểu tượng cảnh báo hiện đỏ):
1. **Khởi động lại container proxy tương ứng**:
   ```powershell
   # Ví dụ khởi động lại container warp-40060 (Watchdog hoặc Daemon sẽ tự động phát hiện và phục hồi kết nối):
   docker restart warp-40060
   ```
2. **Kiểm tra Logs chi tiết**:
   * Logs của từng cổng được lưu tại: `crawlers/yahoo/logs/crawler_[Port].log`
   * Báo cáo tiến trình chính được lưu tại: [yahoo_daemon.log](file:///C:/TUHOCLAPTRINH/kigyou-list/yahoo_daemon.log)
