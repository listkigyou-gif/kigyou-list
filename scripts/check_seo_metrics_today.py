# -*- coding: utf-8 -*-
import sys
import re
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from scripts.bing_webmaster import BingWebmasterClient

print("=" * 60)
print("1. BING WEBMASTER TOOLS - TRAFFIC STATS")
print("=" * 60)

client = BingWebmasterClient()
stats = client.get_traffic_summary()
for s in stats[-14:]:
    m = re.search(r'\d+', s['Date'])
    if m:
        dt = datetime.fromtimestamp(int(m.group(0)) / 1000)
        date_str = dt.strftime('%Y-%m-%d')
    else:
        date_str = s['Date']
    clicks = s.get('Clicks', 0)
    impr = s.get('Impressions', 0)
    ctr = (clicks / impr * 100) if impr > 0 else 0
    print(f"Date: {date_str} | Clicks: {clicks:3d} | Impressions: {impr:5d} | CTR: {ctr:5.2f}%")

print("\n" + "=" * 60)
print("2. BING CRAWL STATS & QUOTA")
print("=" * 60)
quota = client.get_submission_quota()
print(f"Daily Quota: {quota.get('DailyQuota')}/100 | Monthly Quota: {quota.get('MonthlyQuota')}/1700")

crawl_stats = client.get_crawl_stats()
if crawl_stats:
    print(f"Recent Crawl Stats ({len(crawl_stats)} entries):")
    for cs in crawl_stats[-7:]:
        m = re.search(r'\d+', cs.get('Date', ''))
        d_str = datetime.fromtimestamp(int(m.group(0)) / 1000).strftime('%Y-%m-%d') if m else cs.get('Date')
        print(f"  {d_str} | Crawled: {cs.get('CrawledPages', 0)} | In Code: {cs.get('Http2xx', 0)} 2xx | 3xx: {cs.get('Http3xx', 0)} | 4xx: {cs.get('Http4xx', 0)} | 5xx: {cs.get('Http5xx', 0)}")
else:
    print("No crawl stats available.")

print("\n" + "=" * 60)
print("3. AUTO INDEXNOW STATUS")
print("=" * 60)
import os, sqlite3
db_file = "data/indexnow.db"
if os.path.exists(db_file):
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM indexnow_submissions")
    total_sub = c.fetchone()[0]
    c.execute("SELECT status_code, COUNT(*) FROM indexnow_submissions GROUP BY status_code")
    by_status = c.fetchall()
    c.execute("SELECT submitted_at, COUNT(*) FROM indexnow_submissions GROUP BY SUBSTR(submitted_at, 1, 10) ORDER BY submitted_at DESC LIMIT 5")
    by_date = c.fetchall()
    conn.close()
    print(f"Total IndexNow submitted: {total_sub}")
    print(f"By status code: {by_status}")
    print(f"By date: {by_date}")
else:
    print("data/indexnow.db not found.")

