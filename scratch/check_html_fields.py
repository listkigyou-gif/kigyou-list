import sys
from bs4 import BeautifulSoup

# Reconfigure stdout/stderr to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

def main():
    with open("scratch/detail_debug.html", "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.find_all("tr")
    
    print("Non-empty fields found in HTML:")
    for idx, row in enumerate(rows):
        th = row.find("th")
        tds = row.find_all("td")
        if th and tds:
            th_text = " ".join(th.get_text().split())
            td_texts = []
            for td in tds:
                td_text = " ".join(td.get_text().split())
                if td_text:
                    td_texts.append(td_text)
            if td_texts:
                print(f"Row {idx:03d} | Header: {th_text} | Values: {' / '.join(td_texts)}")

if __name__ == "__main__":
    main()
