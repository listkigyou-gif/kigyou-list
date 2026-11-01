# -*- coding: utf-8 -*-
import sys
import urllib.request
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

def verify():
    url = "https://kigyoulist.com/ja"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"Status: {resp.status}")

            has_eyebrow = "国税庁公表データ準拠" in html
            has_h1 = "もっと身近でオープンに" in html and "信頼できる一次データ" in html
            has_sub = "国税庁の法人公表データや公的オープンデータを独自に統合" in html
            has_btn2 = "機能・料金プランを見る" in html and "/compare" in html

            print(f"Eyebrow updated: {has_eyebrow}")
            print(f"H1 updated: {has_h1}")
            print(f"Subtitle updated: {has_sub}")
            print(f"Button 2 updated: {has_btn2}")

            if all([has_eyebrow, has_h1, has_sub, has_btn2]):
                print("[SUCCESS] Trang chủ đã cập nhật hoàn hảo trên Production!")
            else:
                print("[WARNING] Một số phần tử chưa được cập nhật, cần purge cache!")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    verify()

