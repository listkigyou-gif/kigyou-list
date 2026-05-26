# scratch/fix_monitor.py
import os

file_path = 'scripts/monitor_yahoo.py'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read().splitlines()

# Find start and end indices
start_idx = next(i for i, l in enumerate(content) if 'generate_svg_chart(history_15m' in l)
end_idx = next(i for i, l in enumerate(content) if '# Build Port Table' in l)

# Define clean lines
clean_lines = [
    '    generate_svg_chart(history_15m, "Biểu đồ Tăng trưởng Thực tế (6 Giờ qua - Cập nhật 15 phút)", svg_15m_path, "15m")',
    '    generate_svg_chart(history_1h, "Biểu đồ Tăng trưởng Thực tế (24 Giờ qua - Cập nhật 1 tiếng)", svg_1h_path, "1h")',
    '',
    '    # 5. Build Markdown Content',
    '    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")',
    '',
    '    # Alerts and warnings',
    '    alert_section = ""',
    '    offline_ports = [p["port"] for p in port_details if "Stopped" in p["status"]]',
    '    blocked_ports = [p["port"] for p in port_details if p["blocks"] > 15]',
    '',
    '    if offline_ports:',
    '        alert_section += f"> [!WARNING]\\n> **CẢNH BÁO CỔNG PROXY**: Phát hiện {len(offline_ports)} cổng proxy đang offline (wireproxy.exe không chạy): `{", ".join(map(str, offline_ports[:5]))}`...\\n> * Hãy khởi chạy lại daemon cào hoặc tự động khắc phục bằng Watchdog.\\n\\n"',
    '',
    '    if blocked_ports:',
    '        alert_section += f"> [!CAUTION]\\n> **PHÁT HIỆN CHẶN CẬP NHẬT (429)**: Các cổng `{", ".join(map(str, blocked_ports[:5]))}` phát hiện tần suất bị chặn cao (lỗi Block > 15 lần gần đây).\\n> * Daemon sẽ tự động restart và xoay IP chủ động cho các cổng này. Nếu bị chặn hàng loạt, vui lòng kiểm tra gói dữ liệu proxy hoặc mạng máy tính.\\n\\n"',
    '',
    '    if not alert_section:',
    '        alert_section = "> [!NOTE]\\n> **HỆ THỐNG KHỎE MẠNH**: Tất cả 30 cổng proxy đang hoạt động tốt với tỷ lệ thành công ổn định.\\n\\n"'
]

new_content = content[:start_idx] + clean_lines + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_content) + '\n')

print("Patch applied successfully.")
