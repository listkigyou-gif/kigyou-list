import sys
import urllib.request
import csv
import io

sys.stdout.reconfigure(encoding='utf-8')

sources = [
    ("RYOKAN_SHIZUOKA", "https://data.bodik.jp/dataset/e5c122bd-4195-4909-b5f5-11b023144a28/resource/f6ddbc17-3b7e-41e8-8677-7a3e1741bed3/download/ryokan20260331.csv"),
    ("RYOKAN_MINATO", "https://opendata.city.minato.tokyo.jp/dataset/6adb6ec4-6cf8-4d4c-b68a-96c095728b0b/resource/71b05077-1f8c-459e-a17a-3789273bca08/download/ryokan.csv"),
    ("RYOKAN_MEGURO", "https://data.bodik.jp/dataset/800b5b11-f0ad-42e1-92d0-e05ca81bf2be/resource/12b6d43c-cb1e-4dcb-97ff-a85fb0905a5e/download/131105_ryokan_20260331.csv"),
    ("FOOD_OITA", "https://data.bodik.jp/dataset/1b0a322a-6355-4b47-8fe7-478ec1b7d5e9/resource/b8d40e46-9b97-48cd-86a3-3183d78c629a/download/440001_food_business_all.csv"),
    ("FOOD_MINATO", "https://opendata.city.minato.tokyo.jp/dataset/54d8c582-00e2-4730-a23f-4a5befec9ae5/resource/c9d0299e-8e05-4317-877f-83055709e41f/download/food_business_all.csv"),
    ("FOOD_HIGASHIOSAKA", "https://data.bodik.jp/dataset/b5eeed4c-cec0-4eef-8513-b4882d6a18ec/resource/a0416f70-bda0-46fe-a684-b22a95135c32/download/272272_food_business_all_20260401.csv")
]

for label, url in sources:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read(8192)
            encoding = 'utf-8'
            try:
                text = raw.decode('utf-8')
            except:
                encoding = 'shift_jis'
                text = raw.decode('shift_jis', errors='replace')
            reader = csv.reader(io.StringIO(text))
            header = next(reader)
            print(f"[{label}] OK ({encoding}) -> {len(header)} cols: {header[:5]}")
    except Exception as e:
        print(f"[{label}] ERROR: {e}")
