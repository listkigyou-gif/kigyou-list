with open("scripts/run_enrichment_loop.py", "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# Let's locate the boundary of corruption.
# We will replace the entire update_dashboard_file function end and the dashboard_monitor_worker function.
# Specifically, we find the part:
# "    web_proxies_table = \"| Container Proxy | Trạng thái |\\n| :--- | :--- |\\n\"\n    for name, status in web_proxies_status:\n        web_proxies_table += f\"| **{name}** | {status} |\\n\""
# and we replace everything from there to:
# "# Dashboard monitoring global variables"

start_marker = """    web_proxies_table = "| Container Proxy | Trạng thái |\\n| :--- | :--- |\\n"
    for name, status in web_proxies_status:
        web_proxies_table += f"| **{name}** | {status} |\\n\""""

end_marker = "# Dashboard monitoring global variables"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    print(f"Found boundaries: start_idx={start_idx}, end_idx={end_idx}")
    
    # We construct the correct section to put in between:
    correct_section = """    web_proxies_table = "| Container Proxy | Trạng thái |\\n| :--- | :--- |\\n"
    for name, status in web_proxies_status:
        web_proxies_table += f"| **{name}** | {status} |\\n"
 
    postgres_status = "🟢 Active" if "kigyou-postgres" in docker_status else "🔴 Stopped"
    
    content = f\"\"\"# Kigyou-List: Automated Enrichment Loop Dashboard
 
> [!NOTE]
> Trang báo cáo này được cập nhật tự động mỗi **1 tiếng** bởi Thread giám sát chạy song song trong chu trình điều phối chính.
> **Thời gian cập nhật cuối**: `{now_str}`
 
---
 
## 📊 Trạng thái Vòng lặp Tuần hoàn Hiện tại
* **Chu kỳ hiện tại (Cycle)**: `Cycle {current_cycle}`
* **Giai đoạn đang chạy**: `🎭 {current_stage}`
* **Trạng thái Database (SQLite)**: {db_ok}
 
### 📈 Lịch sử Tăng trưởng Dữ liệu Cào
````carousel
![Theo Giờ (24 Giờ qua)](file:///C:/Users/admin/.gemini/antigravity-ide/brain/86e1fa62-6c0f-49a5-8e98-33af04a92224/stats_history_24h.svg)
<!-- slide -->
![Theo Ngày (30 Ngày qua)](file:///C:/Users/admin/.gemini/antigravity-ide/brain/86e1fa62-6c0f-49a5-8e98-33af04a92224/stats_history_30d.svg)
<!-- slide -->
![Theo Tháng (12 Tháng qua)](file:///C:/Users/admin/.gemini/antigravity-ide/brain/86e1fa62-6c0f-49a5-8e98-33af04a92224/stats_history_12m.svg)
<!-- slide -->
![Theo Năm (Lịch sử các năm)](file:///C:/Users/admin/.gemini/antigravity-ide/brain/86e1fa62-6c0f-49a5-8e98-33af04a92224/stats_history_years.svg)
````
 
### ⏱️ Thống kê dữ liệu thực tế (SQLite Master)
| Chỉ số dữ liệu | Số lượng bản ghi | Mô tả |
| :--- | :--- | :--- |
| **Tổng số doanh nghiệp (G-Biz)** | **{total_companies:,}** | Dữ liệu nền móng từ Registry chính phủ |
| **Đã cào Yahoo Maps** | **{yahoo_crawled:,}** | Bổ sung số điện thoại và tọa độ |
| **Đã cào HelloWork (Raw)** | **{hellowork_crawled:,}** | Dữ liệu tuyển dụng thô từ HelloWork |
| **Đã cào Website** | **{website_crawled:,}** | Dữ liệu thô thu thập từ trang chủ doanh nghiệp |
| **Phân loại ngành nghề (AI)** | **{ai_tagged_mappings:,}** | Số lượng mapping ngành nghề JSIC do AI phân tích |
| **Tín hiệu kinh doanh (Signals)** | **{total_signals:,}** | Hojokin, Chotatsu, 特許, 表彰, 届出 |
| **Báo cáo tài chính (Financials)** | **{total_financials:,}** | Doanh thu, lợi nhuận, tổng tài sản qua các năm |
 
---
 
## 🐋 Trạng thái Dịch vụ Docker Infrastructure
* **PostgreSQL Production Container (`kigyou-postgres`)**: {postgres_status}
 
---
 
## 🎭 Chi tiết Hàng đợi & Proxy HelloWork
* **Trạng thái Hàng đợi tuyển dụng (`hellowork.db`)**:
  - **Đã hoàn thành (`completed`)**: **{hw_queue_stats['completed']:,}**
  - **Đang chờ cào (`pending`)**: **{hw_queue_stats['pending']:,}**
  - **Đang xử lý (`processing`)**: **{hw_queue_stats['processing']:,}**
  - **Thất bại quá hạn (`failed`)**: **{hw_queue_stats['failed']:,}**
 
{hw_proxies_table}
 
---
 
## 🌐 Chi tiết Hàng đợi & Proxy Website Scraper
* **Trạng thái cào trang chủ doanh nghiệp (`companies` table)**:
  - **Cào thành công (`SUCCESS`)**: **{web_crawl_stats['SUCCESS']:,}**
  - **Cào thành công nhưng rỗng (`SUCCESS_EMPTY`)**: **{web_crawl_stats['SUCCESS_EMPTY']:,}**
  - **Lỗi Timeout (`ERR_TIMEOUT`)**: **{web_crawl_stats['ERR_TIMEOUT']:,}**
  - **Lỗi DNS (`ERR_DNS`)**: **{web_crawl_stats['ERR_DNS']:,}**
  - **Lỗi Connection Refused (`ERR_CONNECTION_REFUSED`)**: **{web_crawl_stats['ERR_CONNECTION_REFUSED']:,}**
  - **Lỗi cào khác (`ERR_FAILED`)**: **{web_crawl_stats['ERR_FAILED']:,}**
  - **Đang chờ cào (`Pending`)**: **{web_crawl_stats['Pending']:,}**
 
{web_proxies_table}
 
---
 
## 🗺️ Chi tiết 30 Luồng cào Yahoo Maps (Kết quả CSV)
* **Tổng số doanh nghiệp đã cào trong đợt này (CSV)**: **{total_csv_records:,}**
 
{yahoo_table}
 
---
 
## 🛠️ Trạng thái Hệ thống & Logs gần nhất
* Vui lòng kiểm tra log điều phối chi tiết tại: [task-5478.log](file:///C:/Users/admin/.gemini/antigravity-ide/brain/86e1fa62-6c0f-49a5-8e98-33af04a92224/.system_generated/tasks/task-5478.log)
\"\"\"
    try:
        os.makedirs(os.path.dirname(dashboard_path), exist_ok=True)
        with open(dashboard_path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass


def dashboard_monitor_worker(stop_event):
    while not stop_event.is_set():
        try:
            update_dashboard_file()
        except Exception:
            pass
        stop_event.wait(3600)


"""
    
    new_content = content[:start_idx] + correct_section + content[end_idx:]
    with open("scripts/run_enrichment_loop.py", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Replacement successful!")
else:
    print(f"Failed to find start_marker={start_idx != -1} or end_marker={end_idx != -1}")
