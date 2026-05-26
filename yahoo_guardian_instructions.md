# Hướng dẫn dành cho AI Agent: Hệ thống Canh gác & Tự sửa lỗi Yahoo Crawler 24/7

> [!IMPORTANT]
> **HƯỚNG DẪN DÀNH CHO AI**: Khi người dùng gọi file này hoặc yêu cầu bạn giám sát hệ thống cào Yahoo Maps, bạn phải đóng vai trò là "Người canh gác" (Guardian) hoạt động định kỳ mỗi 15 phút để đảm bảo hệ thống chạy liên tục 24/7 mà không cần người dùng can thiệp.

---

## 🏗️ Kiến trúc Hệ thống Hiện tại

Hệ thống cào dữ liệu Yahoo Maps gồm các thành phần sau:

| Thành phần | Mô tả |
| :--- | :--- |
| **50 Docker WARP Containers** | Image `caomingjun/warp`, cổng `40001–40080` (bỏ một số cổng như 40006–40029, 40040, 40042, 40044, 40046, 40048, 40056). Mỗi container cung cấp một SOCKS5 proxy qua Cloudflare WARP. |
| **50 Yahoo Crawler Workers** | Tiến trình `yahoo_searcher.py` chạy song song, mỗi luồng dùng một cổng proxy riêng. Giãn cách request: **15–30 giây/request**. Cooldown xoay IP: **12 giây/lần thử**. |
| **1 Daemon** | `run_yahoo_daemon.py` — Quản lý vòng đời của 50 workers, respawn tự động sau 15s cooldown khi worker thoát lỗi. |
| **1 Watchdog** | `yahoo_watchdog.py` — Kiểm tra chủ động container và log mỗi 2 phút. Tự động `docker restart` container bị lỗi. |
| **1 Monitor** | `monitor_yahoo.py` — Cập nhật báo cáo `yahoo_status_report.md` định kỳ. |
| **PostgreSQL** | Container `kigyou-postgres` (cổng 5432) — Cơ sở dữ liệu sản xuất. |

> [!NOTE]
> **Cơ chế xoay IP**: Khi bị Yahoo chặn (HTTP 429/403), worker gọi `docker restart warp-{port}` (KHÔNG tái tạo container) và chờ 12 giây giữa các lần thử (tối đa 3 lần). Container chạy lại sẽ kết nối WARP mới, nhận IP Cloudflare mới (thường là IPv6 dạng `2a09:bac...`).

---

## 📋 Nhiệm vụ của AI Agent khi thực hiện giám sát

Mỗi 15 phút (hoặc khi được gọi kiểm tra), bạn phải thực hiện tuần tự các bước sau:

### Bước 1: Kiểm tra Số lượng Tiến trình, Proxy Containers & Trạng thái Database

Chạy lần lượt các lệnh sau:
```powershell
# Đếm số tiến trình Python đang hoạt động (yêu cầu: ≥ 53 tiến trình)
(Get-CimInstance Win32_Process -Filter "name LIKE 'python%'").Count

# Đếm số container proxy warp đang chạy (yêu cầu: đúng 50 container)
(docker ps --filter "name=warp-" --filter "status=running" -q).Count

# Kiểm tra trạng thái chi tiết từng container
docker ps -a --filter name=warp- --filter name=kigyou-postgres
```

**Yêu cầu bình thường**:
* Đầy đủ **≥ 53 tiến trình Python** đang chạy (50 crawlers + 1 daemon + 1 watchdog + 1 monitor).
* Đầy đủ **50 container `warp-*`** đang ở trạng thái `Up (healthy)` hoặc `Up (health: starting)`.
* Container database **`kigyou-postgres`** ở trạng thái `Up`.

---

### Bước 2: Phân tích Logs để phát hiện sự cố

Hãy đọc và quét qua các file logs sau để phát hiện lỗi:
1. [yahoo_daemon.log](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_daemon.log): Xem dòng cuối có gặp ngoại lệ `Exception`, `Database locked`, hoặc `operational error` không.
2. [yahoo_watchdog.log](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_watchdog.log): Xem có lỗi container không thể phản hồi hoặc bị sập không.
3. [yahoo_status_report.md](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_status_report.md): Xem phần cảnh báo đỏ của cổng proxy nào bị chặn nhiều.

---

### Bước 3: Tự động khắc phục sự cố (Auto-Healing)

Nếu phát hiện bất kỳ sự lệch chuẩn nào so với trạng thái bình thường ở Bước 1 & 2, hãy thực hiện sửa lỗi tự động như sau:

* **Trường hợp 1: Số tiến trình Python < 53 hoặc mất Daemon/Monitor/Watchdog**
  * Hành động: Chạy trực tiếp script khôi phục dự phòng đã thiết lập sẵn:
    ```powershell
    powershell -ExecutionPolicy Bypass -File scripts/restart_all_yahoo.ps1
    ```
  * Sau đó khởi động lại các container proxy và 2 tiến trình nền:
    ```powershell
    docker compose -f crawlers/yahoo/docker-compose.yml up -d
    python scripts/run_yahoo_daemon.py --max-workers 50
    python -u scripts/monitor_yahoo.py
    ```

* **Trường hợp 2: Có container proxy của cổng nào đó bị `unhealthy`, `Dead`, hoặc `Exited`**
  * Hành động: **Khởi động lại** (`docker restart`) container lỗi — KHÔNG xóa/tái tạo:
    ```powershell
    # Ví dụ với cổng 40060 (container warp-40060):
    docker restart warp-40060
    ```
  * Nếu nhiều container bị lỗi cùng lúc, dùng:
    ```powershell
    docker compose -f crawlers/yahoo/docker-compose.yml up -d
    ```

* **Trường hợp 3: Database `kigyou-postgres` bị dừng**
  * Hành động: Chạy lệnh khởi động lại container database:
    ```powershell
    docker start kigyou-postgres
    ```

* **Trường hợp 4: Docker Desktop Service bị dừng hoàn toàn (dẫn đến PostgreSQL bị offline)**
  * Hành động: Khởi động lại service Docker trên Windows:
    ```powershell
    Start-Service 'com.docker.service'
    ```

---

### Bước 4: Thống kê Hiệu suất & Tốc độ cào (Delta 15 phút)

Hãy chạy script Python sau để truy vấn dữ liệu lịch sử và in ra bảng so sánh số lượng dữ liệu cào tăng thêm so với 15 phút trước:
```powershell
python scripts/get_yahoo_delta.py
```

* **Yêu cầu báo cáo**: Trong mỗi phản hồi/báo cáo định kỳ gửi cho người dùng, bạn **bắt buộc** phải chạy lệnh trên và đính kèm bảng Markdown kết quả hiển thị lượng tăng thêm (Delta) của:
  1. Số doanh nghiệp đã quét qua.
  2. Số điện thoại (SĐT) thu được.
  3. Số website chính thức thu được.

---

### Bước 5: Kiểm tra nhanh tiến độ thực tế từ CSV (Real-time)

Nếu database history chưa cập nhật (delta = 0), hãy chạy thêm lệnh sau để xem số lượng bản ghi thực tế đã ghi vào file CSV của từng luồng (chưa cần ETL sync):
```powershell
python -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); import glob, csv, os; rd = r'c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data'; files = glob.glob(os.path.join(rd, 'results_*.csv')); total = phones = webs = 0; [(lambda rows: [setattr(__import__('builtins'), '_', None) or [total.__class__.__add__ for r in rows if r.get('phone') and r.get('website')])([r for r in csv.DictReader(open(p, encoding='utf-8-sig'))]))(open(p, encoding='utf-8-sig')) for p in files]; print('Dùng script count_results.py')"
```
Hoặc chạy script đầy đủ hơn (nếu có):
```powershell
python C:\Users\admin\.gemini\antigravity-ide\brain\eeac9e3b-840a-4754-9a3e-2cb7bf93e287\scratch\count_results.py
```

---

## ⏰ Cách kích hoạt giám sát định kỳ (Mỗi 15 phút)

Để AI Agent tự động thức dậy và thực thi các nhiệm vụ canh gác trên 24/7, người dùng (hoặc bạn) hãy kích hoạt lịch trình tự động bằng lệnh `/schedule` của Antigravity IDE:

```text
/schedule cron="*/15 * * * *" prompt="Hãy đọc hướng dẫn tại [yahoo_guardian_instructions.md](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_guardian_instructions.md), thực hiện kiểm tra đầy đủ 53 tiến trình Python, 50 container proxy warp, trạng thái database PostgreSQL, phân tích logs và tự động thực hiện các bước khắc phục lỗi (Auto-Healing) nếu phát hiện sự cố để đảm bảo hệ thống cào Yahoo chạy 24/7."
```

> [!TIP]
> Lệnh trên sẽ tạo một cron job định kỳ chạy ẩn. Mỗi 15 phút, AI Agent sẽ thức dậy, tự kiểm tra toàn bộ hệ thống theo đúng quy trình trong file này và tự sửa lỗi nếu cần, sau đó cập nhật kết quả cho người dùng.

---

## 📌 Thông số kỹ thuật chính (Cập nhật 2026-05-26)

| Tham số | Giá trị |
| :--- | :--- |
| Số cổng proxy hoạt động | 50 (cổng `40001–40080`, bỏ một số như 40006–40029, 40040, 40042...) |
| Image Docker proxy | `caomingjun/warp` (Cloudflare WARP SOCKS5) |
| Cơ chế xoay IP | `docker restart warp-{port}` (KHÔNG tái tạo) |
| Giãn cách request đến Yahoo | `15–30 giây` ngẫu nhiên mỗi request |
| Cooldown giữa các lần thử xoay IP | `12 giây` mỗi lần thử (tối đa 3 lần) |
| Cooldown watchdog restart | 120 giây giữa các lần restart cùng 1 cổng |
| Ngưỡng xoay IP chủ động | Mỗi `200–500 request` ngẫu nhiên |
| Tốc độ cào trung bình | ~130–170 doanh nghiệp/phút (50 luồng) |
| IP Cloudflare WARP exit | Chủ yếu **IPv6** (`2a09:bac...`) khi WARP hoạt động |
| Fallback khi WARP mất kết nối | IPv4 thật của mạng Host (`118.68.122.76`) |