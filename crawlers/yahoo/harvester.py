"""
Yahoo Map Company Harvester (Giai đoạn 1)
-------------------------------------------
Thu thập danh sách GID (định danh địa điểm) từ Yahoo Map.

Cách dùng:
    python harvester.py --keyword "IT 企業 東京" --max 200
    python harvester.py --keyword "製造業 大阪" --max 500
"""
import asyncio
import csv
import os
import re
import argparse
import logging
from urllib.parse import quote
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# --- Cấu hình ---
OUTPUT_FILE = "data/gids.csv"
HEADLESS = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("harvester.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Yahoo Map GID Harvester")
    parser.add_argument("--keyword", default="IT 企業 東京", help="Từ khóa tìm kiếm (tiếng Nhật)")
    parser.add_argument("--max", type=int, default=100, help="Số GID tối đa cần lấy")
    parser.add_argument("--output", default=OUTPUT_FILE, help="File CSV đầu ra")
    return parser.parse_args()


async def harvest(keyword: str, max_results: int) -> list[str]:
    """Thu thập GID từ Yahoo Map search results."""
    gids: set[str] = set()
    search_url = f"https://map.yahoo.co.jp/search?q={quote(keyword)}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
            proxy={"server": "socks5://127.0.0.1:40000"}
        )
        page = await context.new_page()

        log.info(f"Truy cập: {search_url}")
        try:
            await page.goto(search_url, timeout=45000, wait_until="domcontentloaded")
        except PlaywrightTimeout:
            log.warning("Timeout nhưng vẫn tiếp tục...")

        # Chờ sidebar xuất hiện (có thể thay selector nếu Yahoo thay đổi)
        try:
            await page.wait_for_selector("a[href*='gid=']", timeout=10000)
        except PlaywrightTimeout:
            log.warning("Không tìm thấy kết quả nào.")

        page_num = 0
        while len(gids) < max_results:
            page_num += 1
            # Trích xuất GID từ tất cả các link có chứa gid=
            links = await page.eval_on_selector_all(
                "a[href*='gid=']",
                "els => els.map(e => e.getAttribute('href'))"
            )
            before = len(gids)
            for href in links:
                if href:
                    m = re.search(r'gid=([A-Za-z0-9_\-]+)', href)
                    if m:
                        gids.add(m.group(1))

            log.info(f"Trang {page_num}: +{len(gids)-before} GIDs, tổng = {len(gids)}")

            if len(gids) >= max_results:
                break

            # Tìm nút "Trang tiếp" hoặc cuộn sidebar
            next_btn = await page.query_selector(
                "a.next, a[aria-label='次のページ'], button[aria-label='次へ'], a:has-text('次へ')"
            )
            if next_btn and await next_btn.is_visible():
                log.info("Nhấn nút trang tiếp...")
                await next_btn.click()
                await page.wait_for_timeout(2500)
            else:
                # Thử cuộn danh sách sidebar
                scrolled = await page.evaluate("""() => {
                    const sidebar = document.querySelector(
                        '#search-result-list, [class*="result"], [class*="list"]'
                    );
                    if (sidebar && sidebar.scrollHeight > sidebar.clientHeight) {
                        sidebar.scrollTop += 800;
                        return true;
                    }
                    return false;
                }""")
                if scrolled:
                    await page.wait_for_timeout(1500)
                    # Kiểm tra xem có thêm GID mới không
                    new_links = await page.eval_on_selector_all(
                        "a[href*='gid=']",
                        "els => els.map(e => e.getAttribute('href'))"
                    )
                    new_gids_count = sum(
                        1 for h in new_links
                        if h and re.search(r'gid=([A-Za-z0-9_\-]+)', h) and
                        re.search(r'gid=([A-Za-z0-9_\-]+)', h).group(1) not in gids
                    )
                    if new_gids_count == 0:
                        log.info("Không có thêm kết quả mới khi cuộn.")
                        break
                else:
                    log.info("Không tìm thấy nút tiếp hoặc sidebar để cuộn.")
                    break

        await browser.close()

    result = list(gids)[:max_results]
    log.info(f"Hoàn thành! Thu thập được {len(result)} GIDs.")
    return result


def save_gids(gids: list[str], filepath: str):
    os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["gid"])
        for gid in gids:
            writer.writerow([gid])
    log.info(f"Đã lưu {len(gids)} GIDs vào '{filepath}'")


if __name__ == "__main__":
    args = parse_args()
    gids = asyncio.run(harvest(args.keyword, args.max))
    save_gids(gids, args.output)
