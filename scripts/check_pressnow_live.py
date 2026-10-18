import urllib.request
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def check_live(keyword="kigyou-list"):
    encoded_kw = urllib.parse.quote(keyword)
    url = f"https://pressnow.jp/?s={encoded_kw}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            matches = re.findall(r'<h2 class="entry-title"><a href="([^"]+)"[^>]*>([^<]+)</a></h2>', html)
            print(f"🔍 Kết quả tìm kiếm trên PRESSNOW với từ khóa '{keyword}':")
            if not matches:
                print("⏳ Hiện tại bài viết vẫn đang trong hàng đợi kiểm duyệt của ban biên tập PRESSNOW (chưa xuất bản công khai).")
                return None
            for link, title in matches:
                print(f"  • {title.strip()}: {link.strip()}")
            return matches[0][0]
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra: {e}")
        return None

if __name__ == "__main__":
    import urllib.parse
    kw = sys.argv[1] if len(sys.argv) > 1 else "kigyou-list"
    check_live(kw)
