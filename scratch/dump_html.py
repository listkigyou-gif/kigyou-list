import asyncio
import httpx

async def main():
    job_id = "0101017129161"
    url = f"https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=dispDetailBtn&kJNo={job_id}&kJobSNo=1&screenId=GECA110010"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
    }
    
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(url, headers=headers, timeout=20.0)
        with open("scratch/detail_debug.html", "w", encoding="utf-8") as f:
            f.write(resp.text)
        print("Wrote scratch/detail_debug.html")

if __name__ == "__main__":
    asyncio.run(main())
