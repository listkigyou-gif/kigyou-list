# Hướng dẫn dành cho AI Agent: Hệ thống Canh gác & Tự sửa lỗi Yahoo Crawler 24/7

> [!IMPORTANT]
> **HƯỚNG DẪN DÀNH CHO AI**: Khi người dùng gọi file này hoặc yêu cầu bạn giám sát hệ thống cào Yahoo Maps, bạn phải đóng vai trò là "Người canh gác" (Guardian) hoạt động định kỳ mỗi 15 phút để đảm bảo hệ thống chạy liên tục 24/7 mà không cần người dùng can thiệp.

---

## 🏗️ Kiến trúc Hệ thống Hiện tại (Cơ chế Luồng Độc Lập Hoàn Toàn)

Hệ thống cào dữ liệu Yahoo Maps gồm các thành phần sau:

| Thành phần | Mô tả |
| :--- | :--- |
| **53 Docker WARP Containers** | Image `caomingjun/warp`, cổng `40002–40080` (đã tắt cổng lỗi 40001, bỏ các cổng 40006–40008 đang được HelloWork sử dụng, và một số cổng như `40013–40029`, 40040, 40042, 40044, 40046, 40048, 40056). Mỗi container cung cấp một SOCKS5 proxy qua Cloudflare WARP. |
| **50 Yahoo Crawler Workers** | Tiến trình `yahoo_searcher.py` chạy song song dùng cổng proxy riêng (tối đa 50 luồng hoạt động cùng lúc). Giãn cách request: **6–20 giây/request**. |
| **1 Daemon** | `run_yahoo_daemon.py` — Quản lý độc lập vòng đời từng luồng theo cơ chế cuốn chiếu: khi worker kết thúc thành công (`exit code = 0`), Daemon tự gộp kết quả riêng luồng đó vào `companies_basic.csv`, xóa `results_{port}.csv`, lấy 1,000 công ty mới tiếp theo ghi vào `part_i.csv` và restart worker ngay lập tức. Chạy lệnh: `python scripts/run_yahoo_daemon.py --max-workers 50 --thread-batch-size 1000`. |
| **1 Watchdog** | `yahoo_watchdog.py` — Kiểm tra chủ động container, log và tự động quét dọn các tiến trình Chrome headless mồ côi mỗi 2 phút để tránh rò rỉ RAM/CPU. |
| **1 Monitor** | `monitor_yahoo.py` — Cập nhật báo cáo `yahoo_status_report.md` định kỳ. |
| **ETL Chạy Nền** | Tiến trình đồng bộ PostgreSQL (ETL Steps 3,5,7) được Daemon khởi chạy bất đồng bộ trong nền (`subprocess.Popen` chạy `run_pipeline.py --steps 3,5,7`) mỗi khi đạt 20,000 dòng cào mới hoặc sau 2 tiếng. |
| **PostgreSQL** | Container `kigyou-postgres` (cổng 5432) — Cơ sở dữ liệu sản xuất. |

> [!NOTE]
> **Cơ chế luồng độc lập**: Cơ chế này loại bỏ hoàn toàn việc các luồng cào nhanh phải chờ các luồng cào chậm/kẹt proxy. Tối ưu hóa 100% hiệu suất của 50 proxy 24/7. Thay vì bắt cả 50 luồng chạy chung chu kỳ lô lớn, vòng đời từng luồng được tách biệt và chạy cuốn chiếu.

---

## 📋 Nhiệm vụ của AI Agent khi thực hiện giám sát

Mỗi 15 phút (hoặc khi được gọi kiểm tra), bạn phải thực hiện tuần tự các bước sau:

### Bước 1: Kiểm tra Số lượng Tiến trình, Proxy Containers & Trạng thái Database

Chạy lần lượt các lệnh sau:
```powershell
# Đếm số tiến trình Python đang hoạt động (yêu cầu: ≥ 53 tiến trình)
(Get-CimInstance Win32_Process -Filter "name LIKE 'python%'").Count

# Đếm số container proxy warp đang chạy (yêu cầu: đúng 53 container)
(docker ps --filter "name=warp-" --filter "status=running" -q).Count

# Kiểm tra trạng thái chi tiết từng container
docker ps -a --filter name=warp- --filter name=kigyou-postgres
```

**Yêu cầu bình thường**:
* Đầy đủ **≥ 53 tiến trình Python** đang chạy (50 crawlers + 1 daemon + 1 watchdog + 1 monitor, cộng thêm 1 tiến trình ETL `run_pipeline.py` chạy nền bất đồng bộ khi đạt ngưỡng).
* Đầy đủ **53 container `warp-*`** đang ở trạng thái `Up (healthy)` hoặc `Up (health: starting)` (cổng 40001 đã dừng, các cổng 40006-40008 được HelloWork sử dụng nên không tính).
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

* **Trường hợp 1: Số tiến trình Python < 48 hoặc mất Daemon/Monitor/Watchdog**
  * Hành động: Chỉ cần chạy trực tiếp script khôi phục dự phòng tự động đã thiết lập sẵn. Script này sẽ tự động dọn dẹp các tiến trình cũ, khởi động dịch vụ Docker, PostgreSQL, và chạy lại Daemon cùng Monitor ở chế độ ẩn:
    ```powershell
    powershell -ExecutionPolicy Bypass -File scripts/restart_all_yahoo.ps1
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

* **Trường hợp 5: Tiến trình Chrome headless mồ côi (`chrome-headless-shell.exe`) tích tụ làm tràn RAM/CPU**
  * Hành động: Watchdog đã tích hợp sẵn cơ chế tự động quét và dọn dẹp định kỳ mỗi 2 phút. Tuy nhiên, nếu bạn muốn dọn dẹp thủ công khẩn cấp ngay lập tức mà không ảnh hưởng đến các luồng cào đang chạy, hãy thực hiện lệnh sau:
    ```powershell
    python scripts/yahoo_watchdog.py --once
    ```

* **Giải pháp nếu cần giảm dung lượng RAM (Khởi động lại & Giải phóng RAM)**:
  * Hành động: Định kỳ chạy lệnh dọn dẹp bằng script [stop_all.py](file:///c:/TUHOCLAPTRINH/kigyou-list/scratch/stop_all.py) để giải phóng triệt để các tiến trình Chrome mồ côi (nếu có) trước khi chạy lại:
    ```powershell
    python scratch/stop_all.py
    ```

---


### Bước 4: Thống kê Hiệu suất & Tốc độ cào (Delta 15 phút)

Hãy chạy script Python sau để truy vấn dữ liệu lịch sử và in ra bảng so sánh số lượng dữ liệu cào tăng thêm so với 15 phút trước:
```powershell
python scripts/get_yahoo_delta.py
```

* **Yêu cầu báo cáo bắt buộc**: Trong mỗi phản hồi/báo cáo định kỳ gửi cho người dùng, bạn **bắt buộc** phải sử dụng cấu trúc bảng Markdown sau để trình bày thông tin:

#### 1. Bảng Trạng thái Sức khỏe Hệ thống (System Health):
```markdown
| Thành phần | Yêu cầu | Thực tế | Trạng thái |
| :--- | :---: | :---: | :---: |
| **Tiến trình Python** | $\ge 53$ | **[Số lượng thực tế]** | 🟢 Khỏe mạnh / 🔴 Cần khắc phục |
| **Warp Proxy Containers** | $53$ | **[Số lượng]/53** | 🟢 Khỏe mạnh / 🔴 Cần khắc phục |
| **PostgreSQL Database** | `Up` | **[Trạng thái thực tế]** | 🟢 Khỏe mạnh / 🔴 Cần khắc phục |
```

#### 2. Bảng Thống kê Hiệu suất & Tốc độ cào (15 phút gần nhất):
```markdown
| Chỉ số dữ liệu | Mốc [Thời gian 1] | Mốc [Thời gian 2] | Lượng tăng thêm (Delta) / Tốc độ cào / 1 phút |
| :--- | :---: | :---: | :---: |
| **Doanh nghiệp đã quét** | [Giá trị 1] | [Giá trị 2] | **+[Delta]** doanh nghiệp <br> *(~[Tốc độ] công ty / phút)* |
| **Số điện thoại (SĐT)** | [Giá trị 1] | [Giá trị 2] | **+[Delta]** SĐT <br> *(~[Tốc độ] SĐT / phút)* |
| **Website chính thức** | [Giá trị 1] | [Giá trị 2] | **+[Delta]** website <br> *(~[Tốc độ] website / phút)* |
```

#### 3. Bảng Thống kê Hiệu suất & Tốc độ cào (Từ 0:00 đến hiện tại):
```markdown
| Chỉ số dữ liệu | Mốc [Thời gian 0:00] | Mốc [Thời gian hiện tại] | Lượng tăng thêm (Delta) / Tốc độ cào / 1 phút |
| :--- | :---: | :---: | :---: |
| **Doanh nghiệp đã quét** | [Giá trị 1] | [Giá trị 2] | **+[Delta]** doanh nghiệp <br> *(~[Tốc độ] công ty / phút)* |
| **Số điện thoại (SĐT)** | [Giá trị 1] | [Giá trị 2] | **+[Delta]** SĐT <br> *(~[Tốc độ] SĐT / phút)* |
| **Website chính thức** | [Giá trị 1] | [Giá trị 2] | **+[Delta]** website <br> *(~[Tốc độ] website / phút)* |
```
*(Trong đó, thời gian tính tốc độ cào trên phút = [Thời gian 2] - [Thời gian 1] tính theo số phút thực tế)*


---

### Bước 5: Kiểm tra nhanh tiến độ thực tế từ CSV (Real-time)

Nếu database history chưa cập nhật (delta = 0), hãy chạy thêm lệnh sau để xem số lượng bản ghi thực tế đã ghi vào file CSV của từng luồng (chưa cần ETL sync):
```powershell
python -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); import glob, csv, os; rd = r'c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\data'; files = glob.glob(os.path.join(rd, 'results_*.csv')); total = phones = webs = 0; [(lambda rows: [setattr(__import__('builtins'), '_', None) or [total.__class__.__add__ for r in rows if r.get('phone') and r.get('website')])([r for r in csv.DictReader(open(p, encoding='utf-8-sig'))]))(open(p, encoding='utf-8-sig')) for p in files]; print('Dùng script count_results.py')"
```
Hoặc chạy script đầy đủ hơn (nằm trong thư mục `scratch/` của dự án):
```powershell
python scratch/count_results.py
```

---

## ⏰ Cách kích hoạt giám sát định kỳ (Mỗi 15 phút)

Để AI Agent tự động thức dậy và thực thi các nhiệm vụ canh gác trên 24/7, người dùng (hoặc bạn) hãy kích hoạt lịch trình tự động bằng lệnh `/schedule` của Antigravity IDE:

```text
/schedule cron="*/15 * * * *" prompt="Hãy đọc hướng dẫn tại [yahoo_guardian_instructions.md](file:///c:/TUHOCLAPTRINH/kigyou-list/yahoo_guardian_instructions.md), thực hiện kiểm tra đầy đủ 53 tiến trình Python, 56 container proxy warp, trạng thái database PostgreSQL, phân tích logs và tự động thực hiện các bước khắc phục lỗi (Auto-Healing) nếu phát hiện sự cố để đảm bảo hệ thống cào Yahoo chạy 24/7."
```

> [!TIP]
> Lệnh trên sẽ tạo một cron job định kỳ chạy ẩn. Mỗi 15 phút, AI Agent sẽ thức dậy, tự kiểm tra toàn bộ hệ thống theo đúng quy trình trong file này và tự sửa lỗi nếu cần, sau đó cập nhật kết quả cho người dùng.

---

## 📌 Thông số kỹ thuật chính (Cập nhật 2026-05-28)

| Tham số | Giá trị |
| :--- | :--- |
| Cơ chế cào | Luồng Độc Lập Hoàn Toàn (Thread-level Autonomy) |
| Số luồng / cổng proxy hoạt động | 50 luồng hoạt động (trên 56 cổng proxy có sẵn, đã tắt 40001) |
| Kích thước lô cào của mỗi luồng | 1,000 doanh nghiệp/lần nạp cuốn chiếu |
| Lệnh khởi chạy Daemon | `python scripts/run_yahoo_daemon.py --max-workers 50 --thread-batch-size 1000` |
| Image Docker proxy | `caomingjun/warp` (Cloudflare WARP SOCKS5) |
| Cơ chế xoay IP | `docker restart warp-{port}` (KHÔNG tái tạo) |
| Giãn cách request đến Yahoo | `6–20 giây` ngẫu nhiên mỗi request |
| Ngưỡng xoay IP chủ động | Mỗi `40–80 request` ngẫu nhiên |
| ETL PostgreSQL Chạy Nền | Bất đồng bộ sau mỗi 20,000 bản ghi hoặc 2 tiếng |
| IP Cloudflare WARP exit | Chủ yếu **IPv6** (`2a09:bac...`) khi WARP hoạt động |
| Fallback khi WARP mất kết nối | IPv4 thật của mạng Host (`118.68.122.76`) |