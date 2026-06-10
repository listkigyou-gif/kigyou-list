import sys
from bs4 import BeautifulSoup

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def main():
    with open("scratch/detail_debug.html", "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, "html.parser")
    scripts = soup.find_all("script")
    
    print(f"Found {len(scripts)} script tags:")
    for idx, script in enumerate(scripts):
        src = script.get("src")
        text = script.text.strip()
        print(f"\n--- Script {idx} | Src: {src} ---")
        if text:
            print(text[:1000]) # print first 1000 chars

if __name__ == "__main__":
    main()
