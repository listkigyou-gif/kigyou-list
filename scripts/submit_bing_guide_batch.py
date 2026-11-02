# -*- coding: utf-8 -*-
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.join(os.path.dirname(__file__)))
from bing_webmaster import BingWebmasterClient

urls = [
    'https://kigyoulist.com/ja/guide',
    'https://kigyoulist.com/ja/guide/ai-sales-list',
    'https://kigyoulist.com/ja/guide/excel-sales-list-template',
    'https://kigyoulist.com/ja/guide/form-marketing-tips',
    'https://kigyoulist.com/ja/guide/bankruptcy-signs-check',
    'https://kigyoulist.com/ja/guide/edinet-salary-ranking-utilization',
    'https://kigyoulist.com/ja',
]

client = BingWebmasterClient()
print("[*] Submitting batch to Bing Webmaster Tools API...")
res = client.submit_url_batch(urls)
print("[+] Batch submitted successfully:", res)

quota = client.get_submission_quota()
print(f"[+] Remaining quota today: {quota.get('DailyQuota')}/100 | Monthly: {quota.get('MonthlyQuota')}/1700")
