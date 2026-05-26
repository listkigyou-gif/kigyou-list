# Báo cáo Giám sát Chi tiết Yahoo Maps Crawler

* **Thời gian cập nhật báo cáo**: `2026-05-26 16:32:38`
* **Số cổng proxy hoạt động**: `🟢 50 / 50`

---

## 🚨 Trạng thái Cảnh báo Hệ thống
> [!CAUTION]
> **PHÁT HIỆN CHẶN CẬP NHẬT (429)**: Các cổng `40003` phát hiện tần suất bị chặn cao (lỗi Block > 15 lần gần đây).
> * Daemon sẽ tự động restart và xoay IP chủ động cho các cổng này. Nếu bị chặn hàng loạt, vui lòng kiểm tra gói dữ liệu proxy hoặc mạng máy tính.



---

## 📈 Thống kê Tổng thể Dữ liệu (Tích lũy từ files kết quả)

| Chỉ số dữ liệu | Số lượng bản ghi | Mô tả |
| :--- | :--- | :--- |
| **Tổng số doanh nghiệp đã quét qua** | **319,291** | Số lượng doanh nghiệp được đọc và tìm kiếm trên Yahoo Map |
| **Số lượng Số điện thoại (SĐT) thu được** | **137,754** | Số lượng SĐT trích xuất thành công |
| **Số lượng Website chính thức thu được** | **33,173** | Số lượng URL website chính thức của doanh nghiệp |
| **Tỷ lệ trích xuất SĐT thành công** | **43.14%** | Hiệu năng tìm thấy thông tin liên hệ thực tế |

---

## ⚙️ Thống kê Tiến trình ETL (Đồng bộ Master & Postgres)
> [!NOTE]
> **Quy luật kích hoạt ETL**: Tiến trình ETL tự động chạy khi tổng số lượng dữ liệu cào mới **cộng gộp từ tất cả các cổng** đạt **2,000 records**, hoặc định kỳ sau mỗi **2 tiếng** (tùy điều kiện nào đến trước).

| Phân lớp dữ liệu | Số lượng bản ghi | Mô tả trạng thái |
| :--- | :--- | :--- |
| **Dữ liệu thô trong Staging (`raw_yahoo`)** | **318,422** | Dữ liệu Yahoo thô đã nạp thành công vào SQLite Staging (Step 3) |
| **Dữ liệu đã hợp nhất Master (`companies`)** | **318,422** | Số lượng doanh nghiệp đã được cập nhật dữ liệu Yahoo chính thức và đồng bộ sang **PostgreSQL** sản xuất (Step 5 & 7) |

---

## 📊 Biểu đồ Tăng trưởng Dữ liệu Cào Yahoo

* **Biểu đồ Cập nhật 15 phút (6 Giờ qua):**
![Biểu đồ Cập nhật 15 phút](stats_yahoo_15m.svg)

* **Biểu đồ Cập nhật 1 Tiếng (24 Giờ qua):**
![Biểu đồ Cập nhật 1 Tiếng](stats_yahoo_1h.svg)

---

## 🗺️ Chi tiết Hiệu suất cào trên từng Cổng Proxy
* Bảng liệt kê chi tiết số lượng thông tin thu được và trạng thái cảnh báo chặn của từng luồng.
* **Lưu ý**: Lỗi Chặn (Gần đây) được đếm dựa trên log 200 dòng cuối để phản ánh tốc độ bị chặn theo thời gian thực.

| Cổng Proxy | Trạng thái | Đã cào (Dòng CSV) | Số Điện Thoại | Website | Lỗi Chặn (Gần đây) | Tỷ lệ SĐT (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Port 40001** | 🟢 Active | 9,959 | 4,711 | 1,382 | 2 | 47.3% |
| **Port 40002** | 🟢 Active | 11,353 | 6,153 | 1,825 | 4 | 54.2% |
| **Port 40003** | 🟢 Active | 11,986 | 6,973 | 1,857 | 18 ⚠️ | 58.2% |
| **Port 40004** | 🟢 Active | 10,264 | 4,798 | 1,124 | 0 | 46.7% |
| **Port 40005** | 🟢 Active | 11,691 | 5,012 | 1,386 | 4 | 42.9% |
| **Port 40030** | 🟢 Active | 10,530 | 4,093 | 1,071 | 6 | 38.9% |
| **Port 40031** | 🟢 Active | 10,211 | 4,300 | 1,154 | 10 | 42.1% |
| **Port 40032** | 🟢 Active | 10,159 | 3,785 | 895 | 8 | 37.3% |
| **Port 40033** | 🟢 Active | 9,979 | 4,174 | 1,047 | 6 | 41.8% |
| **Port 40034** | 🟢 Active | 9,464 | 4,231 | 939 | 0 | 44.7% |
| **Port 40035** | 🟢 Active | 9,893 | 4,428 | 1,156 | 8 | 44.8% |
| **Port 40036** | 🟢 Active | 10,158 | 4,515 | 1,266 | 10 | 44.4% |
| **Port 40037** | 🟢 Active | 10,781 | 4,768 | 1,194 | 10 | 44.2% |
| **Port 40038** | 🟢 Active | 9,655 | 4,329 | 1,008 | 0 | 44.8% |
| **Port 40039** | 🟢 Active | 10,907 | 4,689 | 1,106 | 10 | 43.0% |
| **Port 40041** | 🟢 Active | 10,408 | 4,247 | 1,007 | 6 | 40.8% |
| **Port 40043** | 🟢 Active | 10,602 | 3,774 | 707 | 12 | 35.6% |
| **Port 40045** | 🟢 Active | 10,120 | 3,495 | 638 | 10 | 34.5% |
| **Port 40047** | 🟢 Active | 9,093 | 4,007 | 820 | 10 | 44.1% |
| **Port 40049** | 🟢 Active | 9,651 | 4,216 | 984 | 6 | 43.7% |
| **Port 40050** | 🟢 Active | 9,536 | 4,238 | 830 | 12 | 44.4% |
| **Port 40051** | 🟢 Active | 8,821 | 3,614 | 804 | 10 | 41.0% |
| **Port 40052** | 🟢 Active | 9,862 | 4,465 | 1,121 | 8 | 45.3% |
| **Port 40053** | 🟢 Active | 10,652 | 4,805 | 1,176 | 6 | 45.1% |
| **Port 40054** | 🟢 Active | 9,944 | 4,387 | 1,030 | 0 | 44.1% |
| **Port 40055** | 🟢 Active | 10,165 | 4,567 | 883 | 0 | 44.9% |
| **Port 40057** | 🟢 Active | 10,662 | 4,976 | 1,109 | 6 | 46.7% |
| **Port 40058** | 🟢 Active | 9,914 | 4,658 | 1,094 | 8 | 47.0% |
| **Port 40059** | 🟢 Active | 10,929 | 5,434 | 1,372 | 12 | 49.7% |
| **Port 40060** | 🟢 Active | 9,572 | 4,112 | 883 | 4 | 43.0% |
| **Port 40061** | 🟢 Active | 654 | 184 | 31 | 12 | 28.1% |
| **Port 40062** | 🟢 Active | 695 | 181 | 35 | 6 | 26.0% |
| **Port 40063** | 🟢 Active | 602 | 70 | 13 | 8 | 11.6% |
| **Port 40064** | 🟢 Active | 643 | 87 | 18 | 0 | 13.5% |
| **Port 40065** | 🟢 Active | 564 | 78 | 15 | 10 | 13.8% |
| **Port 40066** | 🟢 Active | 659 | 71 | 11 | 2 | 10.8% |
| **Port 40067** | 🟢 Active | 718 | 95 | 11 | 8 | 13.2% |
| **Port 40068** | 🟢 Active | 615 | 58 | 6 | 0 | 9.4% |
| **Port 40069** | 🟢 Active | 656 | 83 | 5 | 2 | 12.7% |
| **Port 40070** | 🟢 Active | 578 | 85 | 11 | 6 | 14.7% |
| **Port 40071** | 🟢 Active | 628 | 96 | 15 | 10 | 15.3% |
| **Port 40072** | 🟢 Active | 626 | 88 | 10 | 6 | 14.1% |
| **Port 40073** | 🟢 Active | 521 | 65 | 7 | 4 | 12.5% |
| **Port 40074** | 🟢 Active | 631 | 47 | 11 | 4 | 7.4% |
| **Port 40075** | 🟢 Active | 571 | 63 | 12 | 6 | 11.0% |
| **Port 40076** | 🟢 Active | 590 | 125 | 32 | 2 | 21.2% |
| **Port 40077** | 🟢 Active | 668 | 117 | 28 | 12 | 17.5% |
| **Port 40078** | 🟢 Active | 465 | 83 | 19 | 0 | 17.8% |
| **Port 40079** | 🟢 Active | 632 | 61 | 6 | 6 | 9.7% |
| **Port 40080** | 🟢 Active | 654 | 63 | 9 | 6 | 9.6% |


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
