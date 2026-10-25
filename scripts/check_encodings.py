import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

data_dir = r"c:\kigyou-list\importdata\open-data\hospitality_food"
for fname in os.listdir(data_dir):
    fpath = os.path.join(data_dir, fname)
    if fname.startswith("ryokan"):
        with open(fpath, "rb") as f:
            raw = f.read(500)
            utf8_ok = False
            sjis_ok = False
            try:
                t_utf8 = raw.decode('utf-8')
                utf8_ok = True
            except:
                pass
            try:
                t_sjis = raw.decode('shift_jis')
                sjis_ok = True
            except:
                pass
            print(f"{fname}: UTF-8 OK? {utf8_ok} | Shift-JIS OK? {sjis_ok}")
            if utf8_ok:
                print("  UTF-8 sample:", t_utf8[:80].replace('\n', ' '))
            elif sjis_ok:
                print("  Shift-JIS sample:", t_sjis[:80].replace('\n', ' '))
