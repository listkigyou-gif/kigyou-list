import asyncio
import sqlite3
import os
import sys
import httpx
from bs4 import BeautifulSoup

# Reconfigure stdout and stderr to UTF-8 to prevent Windows CP1252 encoding crashes
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

DB_PATH = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\hellowork\data\hellowork.db"

async def test_direct_get(client, job_id):
    url = f"https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=dispDetailBtn&kJNo={job_id}&kJobSNo=1&screenId=GECA110010"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
    }
    
    try:
        print(f"[{job_id}] Trying Direct GET to {url}...")
        resp = await client.get(url, headers=headers, timeout=20.0)
        print(f"[{job_id}] Status: {resp.status_code}")
        
        # Check if page is loaded
        html = resp.text
        if "ID_shokugyo" in html:
            print(f"[+] [{job_id}] Direct GET SUCCESSFUL! Found ID_shokugyo.")
            return True, html
        else:
            print(f"[-] [{job_id}] Direct GET failed to load job detail. (ID_shokugyo not found)")
            if "セッション" in html or "タイムアウト" in html:
                print(f"    Reason: Session Timeout / Session Required.")
            return False, html
    except Exception as e:
        print(f"[ERROR] [{job_id}] Direct GET Error: {e}")
        return False, None

async def test_form_post(client, job_id):
    # 1. Open the search page to get session cookies
    init_url = "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
    }
    try:
        print(f"[{job_id}] Step 1: GET {init_url}...")
        resp_init = await client.get(init_url, headers=headers, timeout=20.0)
        print(f"[{job_id}] Step 1 Status: {resp_init.status_code}")
        
        # 2. Extract cookies/parameters if needed, then perform search POST
        # HelloWork lookup form is submitted via post
        # Let's inspect fields. The fields in Playwright are kJNoJo1 and kJNoGe1
        # The form submit button click in JS: document.getElementById("ID_searchNoBtn").click()
        # In HTML, the form name or action might be GECA110010.do.
        # Let's construct a POST request.
        soup = BeautifulSoup(resp_init.text, "html.parser")
        form = soup.find("form", id="mainForm") or soup.find("form")
        if not form:
            print(f"[-] [{job_id}] Form not found in init page.")
            return False, None
            
        action = form.get("action", "/kensaku/GECA110010.do")
        post_url = "https://www.hellowork.mhlw.go.jp" + action if action.startswith("/") else action
        if not post_url.startswith("http"):
            post_url = "https://www.hellowork.mhlw.go.jp/kensaku/" + action
            
        # Parse inputs
        form_data = {}
        for input_tag in form.find_all("input"):
            name = input_tag.get("name")
            value = input_tag.get("value", "")
            if name:
                form_data[name] = value
                
        # Fill Job ID fields
        # kJNoJo1: first 5 chars, kJNoGe1: last 8 chars
        form_data["kJNoJo1"] = job_id[:5]
        form_data["kJNoGe1"] = job_id[5:]
        form_data["searchNoBtn"] = "求人番号検索"  # Value of search button
        # Usually we also need to specify action/screenId
        form_data["action"] = "searchNoBtn"
        
        print(f"[{job_id}] Step 2: POST to {post_url} with data...")
        post_headers = headers.copy()
        post_headers["Referer"] = init_url
        post_headers["Content-Type"] = "application/x-www-form-urlencoded"
        
        resp_post = await client.post(post_url, data=form_data, headers=post_headers, timeout=20.0)
        print(f"[{job_id}] Step 2 POST Status: {resp_post.status_code}")
        
        html = resp_post.text
        if "ID_shokugyo" in html:
            print(f"[+] [{job_id}] POST Search SUCCESSFUL! Found ID_shokugyo.")
            return True, html
            
        # If it doesn't show detail immediately, it might be a list page with a link to click
        if f"kJNo={job_id}" in html:
            print(f"[+] [{job_id}] Found job link in search results, following the link...")
            detail_soup = BeautifulSoup(html, "html.parser")
            link_el = detail_soup.select_one(f"a[href*='kJNo={job_id}'][href*='action=dispDetailBtn']")
            if link_el and 'href' in link_el.attrs:
                href = link_el['href']
                if href.startswith('.'):
                    href = "/kensaku/" + href[2:]
                detail_url = "https://www.hellowork.mhlw.go.jp" + href if href.startswith("/") else href
                if not detail_url.startswith("http"):
                    detail_url = "https://www.hellowork.mhlw.go.jp/kensaku/" + href
                    
                resp_detail = await client.get(detail_url, headers=headers, timeout=20.0)
                print(f"[{job_id}] Step 3 GET Detail Status: {resp_detail.status_code}")
                if "ID_shokugyo" in resp_detail.text:
                    print(f"[+] [{job_id}] GET Detail SUCCESSFUL!")
                    return True, resp_detail.text
                    
        print(f"[-] [{job_id}] POST Search failed to load job detail.")
        return False, html
    except Exception as e:
        print(f"[ERROR] [{job_id}] POST Search Error: {e}")
        return False, None

async def main():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}. Creating test job ID list.")
        # Some sample job IDs for testing
        job_ids = ["13040-01234561", "13040-02345671"]
    else:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT job_id FROM jobs_queue WHERE status = 'completed' LIMIT 3")
        rows = cursor.fetchall()
        job_ids = [row[0] for row in rows]
        if not job_ids:
            cursor.execute("SELECT job_id FROM jobs_queue LIMIT 3")
            rows = cursor.fetchall()
            job_ids = [row[0] for row in rows]
        conn.close()
        
    print(f"Job IDs to test: {job_ids}")
    
    # Try different proxy setups (using 40000, or direct if it fails)
    proxies_to_test = [
        None,  # Direct
        "socks5://127.0.0.1:40000",
        "socks5://127.0.0.1:40008"
    ]
    
    for proxy in proxies_to_test:
        print(f"\n--- Testing with proxy: {proxy} ---")
        # configure proxy client
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(proxy=proxy, limits=limits, verify=False) as client:
            for jid in job_ids:
                # 1. Try direct GET
                success, html = await test_direct_get(client, jid)
                if not success:
                    # 2. Try POST form
                    success, html = await test_form_post(client, jid)
                
                if success:
                    print(f"[SUCCESS] Successfully fetched {jid} details!")
                    soup = BeautifulSoup(html, "html.parser")
                    title = soup.select_one("title")
                    title_text = title.text.strip() if title else "No Title"
                    print(f"    Page Title: {title_text}")
                    
                    # Search for 'ID_shokugyo' in raw HTML to see how it appears
                    idx = html.find("ID_shokugyo")
                    if idx != -1:
                        print(f"    Raw HTML snippet around 'ID_shokugyo':\n{html[max(0, idx-100):min(len(html), idx+200)]}")
                    
                    # Try to locate the element using BS4
                    for elem in soup.find_all(id=True):
                        if elem["id"] == "ID_shokugyo":
                            print(f"    Found element by ID: {elem.name} | text: {elem.text.strip()[:100]}...")
                            break
                else:
                    print(f"[FAILED] Failed to fetch {jid} details.")
                    if html:
                        err_soup = BeautifulSoup(html, "html.parser")
                        err_msg = ""
                        for phrase in ["存在しません", "該当する", "公開されていません", "入力された求人番号"]:
                            if phrase in html:
                                err_msg = f"Confirmed Dead (Found: '{phrase}')"
                                break
                        if not err_msg:
                            err_msg = "Unknown reason (check HTML)"
                        print(f"    Reason: {err_msg}")
                        # Print some text content of body to help debug
                        body = err_soup.find("body")
                        if body:
                            print(f"    Body snippet: {body.text.strip()[:300]}")

if __name__ == "__main__":
    asyncio.run(main())
