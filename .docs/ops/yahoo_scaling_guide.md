# Hướng dẫn Điều phối Số luồng cào Yahoo Maps (50 Luồng ⇄ 57 Luồng)

> [!IMPORTANT]
> **HƯỚNG DẪN DÀNH CHO AI AGENT**: 
> Khi người dùng yêu cầu chuyển đổi quy mô luồng cào dữ liệu (ví dụ: *"tăng lên 57 luồng"* khi đi ngủ hoặc *"quay về 50 luồng"* khi sử dụng máy tính làm việc), AI Agent phải tự động đọc hướng dẫn này, chỉnh sửa các tệp tin cấu hình và chạy các lệnh dưới đây để thực hiện nâng/hạ cấp nhanh chóng trong một lượt chạy duy nhất.

---

## 🏗️ Kiến trúc các Cổng Port Proxy bổ sung
Để mở rộng hệ thống từ 50 lên 57 luồng, chúng ta sẽ mở thêm 7 cổng proxy nhàn rỗi trong dải cổng Cloudflare WARP SOCKS5:
* **7 cổng bổ sung**: `40006, 40007, 40008, 40009, 40010, 40011, 40012`.
* **Dịch vụ Docker**: Tạo thêm 7 container `warp-40006` đến `warp-40012` tương ứng.

---

## 📈 PHẦN 1: QUY TRÌNH NÂNG LÊN 57 LUỒNG CÀO (Tối đa hóa tài nguyên ban đêm)

Khi người dùng yêu cầu tăng lên 57 luồng, AI Agent thực hiện tuần tự 4 bước sau:

### Bước 1.1: Thêm 7 Container vào [docker-compose.yml](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/yahoo/docker-compose.yml)
Mở tệp tin `docker-compose.yml` và chèn đoạn cấu hình sau vào phần cuối của mục `services:`:

```yaml
  warp-40006:
    image: caomingjun/warp
    container_name: warp-40006
    ports:
      - "40006:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always

  warp-40007:
    image: caomingjun/warp
    container_name: warp-40007
    ports:
      - "40007:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always

  warp-40008:
    image: caomingjun/warp
    container_name: warp-40008
    ports:
      - "40008:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always

  warp-40009:
    image: caomingjun/warp
    container_name: warp-40009
    ports:
      - "40009:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always

  warp-40010:
    image: caomingjun/warp
    container_name: warp-40010
    ports:
      - "40010:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always

  warp-40011:
    image: caomingjun/warp
    container_name: warp-40011
    ports:
      - "40011:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always

  warp-40012:
    image: caomingjun/warp
    container_name: warp-40012
    ports:
      - "40012:1080"
    environment:
      - WARP_SLEEP=2
    privileged: true
    restart: always
```

### Bước 1.2: Cập nhật Danh sách cổng trong các script Python
Chỉnh sửa biến danh sách cổng proxy tại các tệp tin sau:

1. **[run_yahoo_daemon.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/run_yahoo_daemon.py) (Dòng 54)**:
   * Thay đổi định nghĩa `ALL_PORTS`:
     ```python
     # Thay đổi thành:
     ALL_PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40006, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
     ```

2. **[yahoo_watchdog.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/yahoo_watchdog.py) (Dòng 83)**:
   * Thay đổi định nghĩa `ALL_PORTS`:
     ```python
     # Thay đổi thành:
     ALL_PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40006, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
     ```

3. **[monitor_yahoo.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/monitor_yahoo.py) (Dòng 40)**:
   * Thay đổi định nghĩa `PORTS`:
     ```python
     # Thay đổi thành:
     PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40006, 40013)) + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
     ```

### Bước 1.3: Cập nhật tham số luồng trong [restart_all_yahoo.ps1](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/restart_all_yahoo.ps1) (Dòng 106)
* Chỉnh sửa tham số `--max-workers` khởi chạy Daemon:
  ```powershell
  # Thay đổi thành 57:
  Start-Process -FilePath "C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe" -WorkingDirectory $ProjectRoot -ArgumentList "scripts/run_yahoo_daemon.py --max-workers 57 --thread-batch-size 1000" -WindowStyle Hidden
  ```

### Bước 1.4: Triển khai Khởi động lại hệ thống
Chạy lần lượt các lệnh sau trong PowerShell của dự án để khởi chạy toàn bộ 57 luồng cào dữ liệu mới:
```powershell
# 1. Tạo và khởi động 7 container proxy mới
docker compose -f crawlers/yahoo/docker-compose.yml up -d

# 2. Chạy script restart dọn dẹp và nạp Daemon + Monitor mới với 57 luồng cào
powershell -ExecutionPolicy Bypass -File scripts/restart_all_yahoo.ps1
```

---

## 📉 PHẦN 2: QUY TRÌNH HẠ XUỐNG 50 LUỒNG CÀO (Giải phóng tài nguyên làm việc ban ngày)

Khi người dùng yêu cầu đưa về cấu hình 50 luồng, AI Agent thực hiện tuần tự 4 bước sau:

### Bước 2.1: Khôi phục Danh sách cổng 50 luồng gốc trong các script Python
Chỉnh sửa biến danh sách cổng proxy tại các tệp tin để bỏ các cổng từ `40006` đến `40012`:

1. **[run_yahoo_daemon.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/run_yahoo_daemon.py) (Dòng 54)**:
   * Khôi phục định nghĩa `ALL_PORTS`:
     ```python
     ALL_PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
     ```

2. **[yahoo_watchdog.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/yahoo_watchdog.py) (Dòng 83)**:
   * Khôi phục định nghĩa `ALL_PORTS`:
     ```python
     ALL_PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
     ```

3. **[monitor_yahoo.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/monitor_yahoo.py) (Dòng 40)**:
   * Khôi phục định nghĩa `PORTS`:
     ```python
     PORTS = [40001, 40002, 40003, 40004, 40005] + list(range(40030, 40040)) + [40041, 40043, 40045, 40047, 40049] + [p for p in range(40050, 40060) if p != 40056] + [40060] + list(range(40061, 40081))
     ```

### Bước 2.2: Khôi phục tham số luồng trong [restart_all_yahoo.ps1](file:///c:/TUHOCLAPTRINH/kigyou-list/scripts/restart_all_yahoo.ps1) (Dòng 106)
* Chỉnh sửa tham số `--max-workers` về `50`:
  ```powershell
  Start-Process -FilePath "C:\Users\admin\AppData\Local\Programs\Python\Python313\python.exe" -WorkingDirectory $ProjectRoot -ArgumentList "scripts/run_yahoo_daemon.py --max-workers 50 --thread-batch-size 1000" -WindowStyle Hidden
  ```

### Bước 2.3: Xóa đoạn cấu hình 7 container thừa trong [docker-compose.yml](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/yahoo/docker-compose.yml)
* Xóa các mục dịch vụ của `warp-40006` đến `warp-40012` đã thêm ở Bước 1.1 để giữ cấu hình gọn gàng và tránh khởi chạy lại trong tương lai.

### Bước 2.4: Dọn dẹp và áp dụng Khởi động lại hệ thống ở mức 50 Luồng
Chạy lần lượt các lệnh sau trong PowerShell để giảm số luồng và tắt 7 container proxy thừa:
```powershell
# 1. Dừng và gỡ bỏ 7 container thừa để giải phóng RAM cho máy tính làm việc
docker stop warp-40006 warp-40007 warp-40008 warp-40009 warp-40010 warp-40011 warp-40012
docker rm warp-40006 warp-40007 warp-40008 warp-40009 warp-40010 warp-40011 warp-40012

# 2. Khởi chạy lại hệ thống dọn dẹp ở cấu hình 50 luồng
powershell -ExecutionPolicy Bypass -File scripts/restart_all_yahoo.ps1
```
