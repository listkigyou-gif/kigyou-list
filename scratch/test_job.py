import asyncio
import sys
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Reconfigure stdout/stderr to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

async def main():
    job_id = "1303009478861"
    base_url = "https://www.hellowork.mhlw.go.jp"
    init_url = f"{base_url}/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
    proxy_url = "socks5://127.0.0.1:40000"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
    }
    
    async with httpx.AsyncClient(proxy=proxy_url, verify=False) as client:
        # Step 1
        resp_init = await client.get(init_url, headers=headers, timeout=30.0)
        print("Init status:", resp_init.status_code)
        
        soup = BeautifulSoup(resp_init.text, "html.parser")
        form = soup.find("form", id="mainForm") or soup.find("form")
        if not form:
            print("Form not found in init")
            return
            
        action = form.get("action", "/kensaku/GECA110010.do")
        print("Form action raw:", action)
        
        post_url = urljoin(init_url, action)
        print("Resolved post_url:", post_url)
        
        form_data = {}
        for input_tag in form.find_all("input"):
            name = input_tag.get("name")
            value = input_tag.get("value", "")
            if name:
                form_data[name] = value
                
        form_data["kJNoJo1"] = job_id[:5]
        form_data["kJNoGe1"] = job_id[5:]
        form_data["searchNoBtn"] = "求人番号検索"
        form_data["action"] = "searchNoBtn"
        
        post_headers = headers.copy()
        post_headers["Referer"] = init_url
        post_headers["Content-Type"] = "application/x-www-form-urlencoded"
        
        # Step 2
        resp_post = await client.post(post_url, data=form_data, headers=post_headers, timeout=30.0)
        print("Post status:", resp_post.status_code)
        
        html = resp_post.text
        print("HTML length:", len(html))
        
        # Check if error message is present
        soup_post = BeautifulSoup(html, "html.parser")
        error_elements = soup_post.select(".msg_E")
        for err in error_elements:
            print("Found error element:", err.get_text(strip=True))
            
        # Write response to file to examine
        with open("scratch/test_job_response.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("Saved HTML response to scratch/test_job_response.html")

if __name__ == "__main__":
    asyncio.run(main())
