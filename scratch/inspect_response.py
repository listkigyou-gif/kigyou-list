import sys
from bs4 import BeautifulSoup

# Reconfigure stdout to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/test_job_response.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
error_elements = soup.select(".msg_E")
for err in error_elements:
    print("Error element text:", err.get_text(strip=True))

if "ID_shokugyo" in html:
    print("Found ID_shokugyo in HTML!")
else:
    print("ID_shokugyo NOT found in HTML.")

# Find any search result links
links = soup.select('a[href*="action=dispDetailBtn"]')
print(f"Found {len(links)} links with action=dispDetailBtn:")
for link in links:
    print("Link href:", link.get('href'))
    print("Link text:", link.get_text(strip=True))
