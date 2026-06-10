import asyncio
import sys
import httpx
from bs4 import BeautifulSoup
import re

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def _clean_address(text):
    if not text: return None
    return re.sub(r'\s+', '', text)

def parse_detail(html, job_id):
    soup = BeautifulSoup(html, 'html.parser')
    data = {"job": {"job_id": job_id}, "company": {}}
    all_details = {}
    for row in soup.find_all("tr"):
        th = row.find("th")
        tds = row.find_all("td")
        if th and tds:
            main_title = "".join(th.get_text().split())
            for td in tds:
                for a in td.find_all("a", string=re.compile("職種解説")): a.decompose()
                value = td.get_text("\n", strip=True)
                lines = [l.strip() for l in value.split('\n') if l.strip()]
                if len(lines) >= 2:
                    sub_title = lines[0]
                    sub_value = "\n".join(lines[1:])
                    if sub_title not in all_details: all_details[sub_title] = sub_value
                if main_title and main_title not in all_details: all_details[main_title] = value

    def find_val(keywords):
        for k in keywords:
            if k in all_details: return all_details[k]
        for k, v in all_details.items():
            for kw in keywords:
                if kw in k: return v
        return None

    data["company"].update({
        "company_name": find_val(["事業所名"]),
        "address": _clean_address(find_val(["所在地"])),
        "industry_name": find_val(["産業"]),
    })

    data["job"].update({
        "reception_date": find_val(["受付年月日"]),
        "job_title": find_val(["職種"]),
        "job_content": find_val(["仕事内容", "仕事"]),
    })
    
    for k, v in all_details.items():
        if "法人番号" in k:
            num = "".join(filter(str.isdigit, v))
            if len(num) == 13:
                data["company"]["corporate_number"] = data["job"]["corporate_number"] = num
                break

    return data

async def main():
    job_id = "0101017129161"
    init_url = "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
    }
    
    async with httpx.AsyncClient(verify=False) as client:
        # Step 1: GET the search form to get the JSESSIONID cookie
        print("Step 1: GET search form...")
        resp_init = await client.get(init_url, headers=headers, timeout=20.0)
        
        # Step 2: POST the search form with job ID
        print("Step 2: POST search request...")
        soup = BeautifulSoup(resp_init.text, "html.parser")
        form = soup.find("form", id="mainForm") or soup.find("form")
        
        action = form.get("action", "/kensaku/GECA110010.do")
        post_url = "https://www.hellowork.mhlw.go.jp" + action if action.startswith("/") else action
        if not post_url.startswith("http"):
            post_url = "https://www.hellowork.mhlw.go.jp/kensaku/" + action
            
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
        
        resp_post = await client.post(post_url, data=form_data, headers=post_headers, timeout=20.0)
        html = resp_post.text
        
        # Step 3: Check if the response contains the detail directly, or if we need to follow a link
        print(f"Step 3: Analyzing response (Length: {len(html)})...")
        if "ID_shokugyo" in html:
            print("[+] Directly landed on detail page!")
            detail_html = html
        elif f"kJNo={job_id}" in html:
            print("[+] Found list link, navigating to detail...")
            # Extract link href
            post_soup = BeautifulSoup(html, "html.parser")
            link_el = post_soup.select_one(f"a[href*='kJNo={job_id}'][href*='action=dispDetailBtn']")
            if link_el and 'href' in link_el.attrs:
                href = link_el['href']
                if href.startswith('.'):
                    href = "/kensaku/" + href[2:]
                detail_url = "https://www.hellowork.mhlw.go.jp" + href if href.startswith("/") else href
                if not detail_url.startswith("http"):
                    detail_url = "https://www.hellowork.mhlw.go.jp/kensaku/" + href
                
                resp_detail = await client.get(detail_url, headers=headers, timeout=20.0)
                detail_html = resp_detail.text
            else:
                print("[-] Could not find link element in search list.")
                detail_html = None
        else:
            print("[-] Search result page does not contain detail or link.")
            detail_html = None
            
        if detail_html:
            data = parse_detail(detail_html, job_id)
            print("\n--- PARSED RESULTS ---")
            print("Company Name:", data["company"].get("company_name"))
            print("Address:", data["company"].get("address"))
            print("Industry:", data["company"].get("industry_name"))
            print("Job Title:", data["job"].get("job_title"))
            print("Job Content:", data["job"].get("job_content"))
            
            # Print a snippet of the table rows where company name or job title is to inspect values
            detail_soup = BeautifulSoup(detail_html, "html.parser")
            for elem in detail_soup.find_all(id=True):
                if elem["id"] in ["ID_gsJgshMei", "ID_jgshMei", "ID_sksu"]:
                    print(f"Element ID '{elem['id']}': Tag={elem.name}, Text={elem.text.strip()}")

if __name__ == "__main__":
    asyncio.run(main())
