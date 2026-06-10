import sqlite3
import datetime
import os

db_path = 'kigyou-list.db'

def get_stats():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. Total in raw_yahoo
    cur.execute("SELECT COUNT(*) FROM raw_yahoo")
    raw_yahoo_count = cur.fetchone()[0]
    
    # 2. Total in companies that have yahoo data
    cur.execute("SELECT COUNT(*) FROM companies WHERE yahoo_last_crawled_at IS NOT NULL")
    companies_yahoo_count = cur.fetchone()[0]
    
    # 3. Latest history records
    cur.execute("SELECT timestamp, total_crawled, total_phones, total_websites FROM yahoo_stats_history ORDER BY timestamp DESC LIMIT 30")
    history_records = cur.fetchall()
    
    conn.close()
    return raw_yahoo_count, companies_yahoo_count, history_records

raw_count, comp_count, history = get_stats()

print("="*60)
print(f"Current Raw Yahoo records (raw_yahoo): {raw_count:,}")
print(f"Current Merged/PostgreSQL synced records (companies): {comp_count:,}")
print("="*60)
print("Latest 30 records from yahoo_stats_history (newest first):")
print(f"{'Timestamp':<25} | {'Total Crawled':<15} | {'Total Phones':<15} | {'Total Websites':<15}")
print("-"*78)
for h in history:
    print(f"{h[0]:<25} | {h[1]:<15,} | {h[2]:<15,} | {h[3]:<15,}")
print("="*60)

# Calculate speed over different windows
# Let's filter out the negative jumps or trace actual increments between consecutive timestamps
print("\nSpeed calculations between consecutive snapshots (excluding negative jumps):")
print(f"{'From':<20} -> {'To':<20} | {'Duration (min)':<15} | {'Delta':<10} | {'Speed (comp/min)'}")
print("-"*85)

for i in range(len(history) - 1, 0, -1):
    t_start_str, c_start = history[i][0], history[i][1]
    t_end_str, c_end = history[i-1][0], history[i-1][1]
    
    t_start = datetime.datetime.strptime(t_start_str, "%Y-%m-%d %H:%M:%S")
    t_end = datetime.datetime.strptime(t_end_str, "%Y-%m-%d %H:%M:%S")
    
    dur_min = (t_end - t_start).total_seconds() / 60.0
    delta = c_end - c_start
    
    if dur_min > 0 and delta > 0:
        speed = delta / dur_min
        print(f"{t_start_str[-8:]} -> {t_end_str[-8:]} | {dur_min:<15.2f} | {delta:<10,} | {speed:.2f}")
    elif delta <= 0:
        print(f"{t_start_str[-8:]} -> {t_end_str[-8:]} | {dur_min:<15.2f} | {delta:<10,} | [Worker batch merged/cleared - Ignored]")
