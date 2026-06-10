# Hướng dẫn Khởi động lại Tiến trình Cào dữ liệu Yahoo Maps

> [!IMPORTANT]
> **DÀNH CHO AGENT AI & NGƯỜI DÙNG**: Khi máy tính bị mất điện, reset, hoặc khởi động lại, toàn bộ tiến trình cào dữ liệu Yahoo Maps sẽ bị dừng. File này hướng dẫn chi tiết cách khôi phục và chạy lại hệ thống nhanh nhất.

---

## 🚀 Cách 1: Khởi động lại Tự động (Nhanh nhất - Khuyên dùng)

Hệ thống đã được tích hợp sẵn một script PowerShell tự động hóa mọi công việc: dọn dẹp tiến trình rác cũ, khởi động dịch vụ Docker, bật PostgreSQL và kích hoạt Daemon/Monitor trong các cửa sổ terminal riêng biệt.

Bạn chỉ cần chạy lệnh PowerShell sau:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restart_all_yahoo.ps1
```

> [!TIP]
> **Đối với Agent AI**: Khi được yêu cầu khởi chạy hoặc kiểm tra hệ thống cào Yahoo sau khi máy reset, hãy ưu tiên chạy trực tiếp script ở trên. Script sẽ hiển thị trực quan các cửa sổ terminal để người dùng dễ theo dõi log.

---

## 🛠️ Cách 2: Khởi động thủ công từng bước

Nếu script tự động gặp lỗi phân quyền hoặc cần chạy thủ công, hãy thực hiện các bước sau:

### Bước 1: Dọn dẹp tiến trình cũ (Tránh xung đột & Tràn RAM)
Tắt tất cả các tiến trình Chrome chạy ẩn mồ côi và Python cũ còn sót lại:
```powershell
# Tắt Chrome headless shell
taskkill /F /IM chrome-headless-shell.exe /T

# Tắt các python worker cũ
Get-CimInstance Win32_Process -Filter "name LIKE 'python%'" | Where-Object {
    $_.CommandLine -like "*run_yahoo_daemon.py*" -or 
    $_.CommandLine -like "*monitor_yahoo.py*" -or 
    $_.CommandLine -like "*yahoo_watchdog.py*" -or 
    $_.CommandLine -like "*yahoo_searcher.py*"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

### Bước 2: Khởi động Docker & PostgreSQL
1. Mở ứng dụng **Docker Desktop** trên Windows và đợi Docker Daemon chuyển sang màu xanh (Ready).
2. Chạy container chứa cơ sở dữ liệu PostgreSQL sản xuất:
   ```powershell
   docker start kigyou-postgres
   ```

### Bước 3: Khởi chạy Daemon cào dữ liệu Yahoo Maps
Mở một cửa sổ PowerShell mới tại thư mục gốc dự án và chạy:
```powershell
# Chạy daemon chính với 15 luồng cào song song (Phù hợp mạng chậm)
python scripts/run_yahoo_daemon.py --max-workers 15

# Khi mạng tốt, tăng lại lên 50 luồng:
# python scripts/run_yahoo_daemon.py --max-workers 50
```
*(Tiến trình này sẽ tự động khởi động dịch vụ tự phục hồi `yahoo_watchdog.py` đi kèm).*

### Bước 4: Khởi chạy Monitor cập nhật báo cáo
Mở thêm một cửa sổ PowerShell khác và chạy:
```powershell
# Chạy monitor để cập nhật file báo cáo và biểu đồ mỗi 15 phút
python -u scripts/monitor_yahoo.py
```

---

## 🔍 Kiểm tra trạng thái hoạt động

Sau khi chạy xong, hãy xác minh hệ thống hoạt động bình thường bằng các lệnh sau:

1. **Kiểm tra số lượng tiến trình Python**:
   ```powershell
   (Get-Process -Name python -ErrorAction SilentlyContinue).Count
   ```
   *Số lượng tiến trình chạy bình thường sẽ vào khoảng **18** (1 Daemon + 1 Watchdog + 1 Monitor + 15 Crawler Workers). Khi chạy 50 luồng sẽ là ~53.*

2. **Kiểm tra danh sách Docker container**:
   ```powershell
   docker ps
   ```
   *Phải hiển thị `kigyou-postgres` và **15** container `warp-40001` đến `warp-40060` ở trạng thái Up (Healthy). (Tăng lên **50** khi có mạng tốt).*

3. **Xem Báo cáo Tiến trình**:
   Mở file [yahoo_status_report.md](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_status_report.md) để kiểm tra thời gian cập nhật gần nhất và các chỉ số cào (SĐT, Website) có đang tăng lên hay không.

---

## 📂 Danh sách các file Logs quan trọng

* **Log Daemon chính**: [yahoo_daemon.log](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_daemon.log) (Ghi lại chu kỳ quét hàng đợi và kích hoạt các worker).
* **Log Watchdog**: [yahoo_watchdog.log](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_watchdog.log) (Ghi lại nhật ký kiểm tra sức khỏe proxy và tự khởi động lại cổng bị chặn).
* **Logs chi tiết của từng Worker**: `crawlers/yahoo/logs/crawler_[Port].log` (ví dụ: [crawler_40001.log](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/yahoo/logs/crawler_40001.log)).
