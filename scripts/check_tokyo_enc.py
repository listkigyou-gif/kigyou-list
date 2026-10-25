import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

for name in ["ryokan_tokyo_meguro.csv", "ryokan_tokyo_minato.csv"]:
    p = os.path.join(r"c:\kigyou-list\importdata\open-data\hospitality_food", name)
    with open(p, "rb") as f:
        raw = f.read(2000)
        for enc in ["cp932", "shift_jis", "euc_jp", "utf_8_sig", "utf_16", "iso2022_jp"]:
            try:
                t = raw.decode(enc)
                print(f"{name} -> {enc}: OK! Sample: {t[:60].replace('\n', ' ')}")
                break
            except Exception as e:
                pass
