# ⏰ Hướng dẫn Thiết lập Giám sát Tự động & Tự sửa lỗi (Self-Healing) qua `/schedule`

Tài liệu này hướng dẫn cách thiết lập và quản lý tác vụ chạy ngầm định kỳ bằng lệnh `/schedule` để giám sát toàn bộ tiến trình cào dữ liệu HelloWork từ 47 tỉnh thành của Nhật Bản, đồng thời tự động sửa lỗi và báo cáo trạng thái sau mỗi 15 phút.

---

## 🛠️ Tổng quan về Cơ chế Giám sát & Tự sửa lỗi (Self-Healing)

Hệ thống giám sát định kỳ thông qua script [monitor_report.py](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/monitor_report.py) thực hiện các nhiệm vụ sau:

1. **Kiểm tra trạng thái Orchestrator:**
   * Script sẽ quét các tiến trình đang chạy trong hệ thống.
   * Nếu phát hiện Orchestrator chính ([run_parallel.py](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/run_parallel.py)) bị crash hoặc tắt đột ngột, nó sẽ tự động kích hoạt lại để quá trình cào dữ liệu tiếp tục.

2. **Xử lý Worker bị treo (Hangs):**
   * Quét thời gian cập nhật của từng file log trong thư mục [logs/](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/logs/).
   * Nếu một worker của tỉnh nào đó đang chạy nhưng không có cập nhật mới trong hơn **10 phút**, hệ thống coi là tiến trình đã bị treo.
   * Script sẽ tự động gọi lệnh hệ thống (`taskkill` trên Windows) để dừng worker đó. Orchestrator chính sẽ tự động phát hiện và khởi động lại một worker mới thay thế.

3. **Kiểm tra và Reset Proxy lỗi:**
   * Hệ thống sẽ kiểm tra kết nối qua proxy SOCKS5 của từng tỉnh (cổng `40001` - `40047`).
   * Nếu proxy không phản hồi hoặc bị HelloWork chặn (block), script sẽ tự động gọi Docker để restart container tương ứng (ví dụ: `docker restart warp-proxy-<pref>`) nhằm cấp phát IP mới sạch sẽ từ Cloudflare WARP.

4. **Tổng hợp báo cáo tiến độ:**
   * Truy vấn cơ sở dữ liệu SQLite tại [hellowork.db](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/data/hellowork.db).
   * Tạo/cập nhật bảng thống kê trực quan dạng Markdown vào tệp [crawl_report.md](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/crawl_report.md) bao gồm: tỷ lệ phần trăm hoàn thành, số lượng đã cào, số lượng lỗi, và thời gian dự kiến hoàn thành (ETC).

---

## 🚀 Hướng dẫn Kích hoạt Lịch giám sát qua `/schedule`

Bạn có thể kích hoạt lịch trình chạy ngầm này theo 2 cách dưới đây:

### Cách 1: Sử dụng Lệnh tắt trực tiếp trong Chat (Khuyên dùng)
Hãy copy dòng lệnh bên dưới và gửi trực tiếp vào khung chat với Antigravity AI:

```text
/schedule cron="*/15 * * * *" prompt="Please run 'python monitor_report.py' in 'c:\TUHOCLAPTRINH\kigyou-list\crawlers\hellowork', read the updated 'crawl_report.md' to analyze progress and check for any issues. Apply any self-healing actions needed (such as restarting failed docker containers or workers via cmd), update the walkthrough, and report the progress to the user."
```

### Cách 2: Sử dụng Form Giao diện của IDE
1. Nhập `/schedule` vào khung chat và nhấn `Enter`.
2. Một hộp thoại tùy chọn (Form) sẽ xuất hiện, hãy điền các thông tin sau:
   * **Mode (Chế độ):** Chọn `Recurring cron`
   * **Cron Expression:** Nhập `*/15 * * * *` *(chạy mỗi 15 phút)*
   * **Prompt:** Copy và paste đoạn text sau:
     ```text
     Please run 'python monitor_report.py' in 'c:\TUHOCLAPTRINH\kigyou-list\crawlers\hellowork', read the updated 'crawl_report.md' to analyze progress and check for any issues. Apply any self-healing actions needed (such as restarting failed docker containers or workers via cmd), update the walkthrough, and report the progress to the user.
     ```
3. Nhấp nút **Submit** để lưu và khởi chạy.

> [!NOTE]
> Sau khi thiết lập thành công, AI sẽ trả về thông tin bao gồm một **Task ID** dạng `task-XXX` (Ví dụ: `task-503`). Bạn nên ghi nhớ mã Task ID này để quản lý hoặc hủy khi cần thiết.

---

## 🔎 Theo dõi Kết quả và Trạng thái Hệ thống

Hệ thống sẽ cập nhật trạng thái liên tục và bạn có thể kiểm tra qua:
* **Báo cáo tổng hợp trực quan:** Mở tệp [crawl_report.md](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/crawl_report.md) trong IDE của bạn để xem tiến độ cập nhật thực tế.
* **Thông báo định kỳ từ AI:** Mỗi 15 phút khi lịch kích hoạt, AI sẽ gửi thông báo tóm tắt tình trạng hệ thống, các hành động sửa lỗi đã thực hiện và tiến trình hoàn thành.

---

## 🛑 Cách Quản lý và Hủy Lịch Giám sát khi Hoàn thành

> [!IMPORTANT]
> Khi tiến trình cào dữ liệu HelloWork hoàn thành 100%, bạn **MUST** hủy lịch giám sát định kỳ này để giải phóng tài nguyên CPU và bộ nhớ cho máy tính của bạn.

### Bước 1: Xem các tác vụ đang chạy ngầm
Gửi yêu cầu vào khung chat:
> *"Hãy liệt kê các lịch trình đang chạy ngầm"* hoặc *"List background tasks"*

Hệ thống sẽ hiển thị danh sách các cron task kèm theo ID (ví dụ: `task-503`).

### Bước 2: Hủy lịch giám sát
Gửi yêu cầu vào khung chat để hủy tác vụ:
> *"Hãy hủy lịch trình task-503"* hoặc *"Stop task-503"*

*(Thay `task-503` bằng mã Task ID thực tế mà hệ thống đã cấp cho cron job của bạn).*

---

## 📂 Các tệp cấu hình chính
* **Báo cáo tiến trình cào:** [crawl_report.md](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/crawl_report.md)
* **Script giám sát & Self-Healing:** [monitor_report.py](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/monitor_report.py)
* **Cơ sở dữ liệu trung tâm SQLite:** [hellowork.db](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/data/hellowork.db)
* **Thư mục lưu trữ logs:** [logs/](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/logs/)
* **Script điều phối song song chính:** [run_parallel.py](file:///c:/TUHOCLAPTRINH/kigyou-list/crawlers/hellowork/run_parallel.py)
