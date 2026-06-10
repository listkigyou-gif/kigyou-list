import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from datetime import datetime

# Timestamps and stats
t_midnight = "00:00:43"
stats_midnight = (2285127, 782934, 177553)

t_prev = "08:31:35"
stats_prev = (2445866, 825718, 188496)

t_latest = "08:46:34"
stats_latest = (2449263, 826737, 188711)

def calc_dur(t1_str, t2_str):
    fmt = "%H:%M:%S"
    dt1 = datetime.strptime(t1_str, fmt)
    dt2 = datetime.strptime(t2_str, fmt)
    diff_sec = (dt2 - dt1).total_seconds()
    if diff_sec < 0:
        diff_sec += 24 * 3600
    return diff_sec / 60.0

dur_15m = calc_dur(t_prev, t_latest)
dur_mid = calc_dur(t_midnight, t_latest)

# 15m delta
dc_15 = stats_latest[0] - stats_prev[0]
dp_15 = stats_latest[1] - stats_prev[1]
dw_15 = stats_latest[2] - stats_prev[2]

sc_15 = dc_15 / dur_15m
sp_15 = dp_15 / dur_15m
sw_15 = dw_15 / dur_15m

# Midnight delta
dc_m = stats_latest[0] - stats_midnight[0]
dp_m = stats_latest[1] - stats_midnight[1]
dw_m = stats_latest[2] - stats_midnight[2]

sc_m = dc_m / dur_mid
sp_m = dp_m / dur_mid
sw_m = dw_m / dur_mid

print("\n--- TABLE 1 ---")
print("| Thành phần | Yêu cầu | Thực tế | Trạng thái |")
print("| :--- | :---: | :---: | :---: |")
print("| **Tiến trình Python** | $\\ge 53$ | **56** | 🟢 Khỏe mạnh |")
print("| **Warp Proxy Containers** | $56$ | **56/56** | 🟢 Khỏe mạnh |")
print("| **PostgreSQL Database** | `Up` | **Up (2 days)** | 🟢 Khỏe mạnh |")

print("\n--- TABLE 2 ---")
print(f"| Chỉ số dữ liệu | Mốc {t_prev} | Mốc {t_latest} | Lượng tăng thêm (Delta) / Tốc độ cào / 1 phút |")
print("| :--- | :---: | :---: | :---: |")
print(f"| **Doanh nghiệp đã quét** | {stats_prev[0]:,} | {stats_latest[0]:,} | **+{dc_15:,}** doanh nghiệp <br> *(~{sc_15:.2f} công ty / phút)* |")
print(f"| **Số điện thoại (SĐT)** | {stats_prev[1]:,} | {stats_latest[1]:,} | **+{dp_15:,}** SĐT <br> *(~{sp_15:.2f} SĐT / phút)* |")
print(f"| **Website chính thức** | {stats_prev[2]:,} | {stats_latest[2]:,} | **+{dw_15:,}** website <br> *(~{sw_15:.2f} website / phút)* |")

print("\n--- TABLE 3 ---")
print(f"| Chỉ số dữ liệu | Mốc {t_midnight} | Mốc {t_latest} | Lượng tăng thêm (Delta) / Tốc độ cào / 1 phút |")
print("| :--- | :---: | :---: | :---: |")
print(f"| **Doanh nghiệp đã quét** | {stats_midnight[0]:,} | {stats_latest[0]:,} | **+{dc_m:,}** doanh nghiệp <br> *(~{sc_m:.2f} công ty / phút)* |")
print(f"| **Số điện thoại (SĐT)** | {stats_midnight[1]:,} | {stats_latest[1]:,} | **+{dp_m:,}** SĐT <br> *(~{sp_m:.2f} SĐT / phút)* |")
print(f"| **Website chính thức** | {stats_midnight[2]:,} | {stats_latest[2]:,} | **+{dw_m:,}** website <br> *(~{sw_m:.2f} website / phút)* |")
