import asyncio
from playwright.async_api import async_playwright

async def test_site(page, url):
    try:
        print(f"Navigating to {url}...")
        t0 = asyncio.get_event_loop().time()
        response = await page.goto(url, timeout=15000)
        t1 = asyncio.get_event_loop().time()
        status = response.status if response else "No response"
        print(f"  Success {url}! Status: {status} | Time taken: {t1 - t0:.2f}s")
    except Exception as e:
        print(f"  Failed {url}: {e}")

async def main():
    proxy_port = 40001
    proxy_arg = f"--proxy-server=socks5://127.0.0.1:{proxy_port}"
    print(f"Testing SOCKS5 proxy via launch args: {proxy_arg}")
    
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        context = await browser.new_context(
            proxy={
                "server": f"socks5://[::1]:{proxy_port}"
            }
        )
        page = await context.new_page()
        
        await test_site(page, "http://104.28.157.20")
        await test_site(page, "https://api.ipify.org")
        await test_site(page, "https://search.yahoo.co.jp/search?p=test")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
