"""
Yahoo Map Company Extractor (Giai đoạn 2) - Phiên bản iframe-aware
---------------------------------------------------------------------
Chiến lược:
1. Truy cập https://map.yahoo.co.jp/place?gid={gid}
2. Chờ iframe (pc-map.yahoo.co.jp) xuất hiện là frame[1]
3. Đọc innerText của frame[1] để lấy dữ liệu

Thông tin thu thập:
    - Tên công ty / địa điểm
    - Địa chỉ
    - Số điện thoại
    - Link website (公式サイト)

Cách dùng:
    python extractor.py
    python extractor.py --input data/gids.csv --output data/companies_basic.csv --limit 50
"""
import asyncio
import csv
import os
import re
import argparse
import logging
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# --- Cấu hình ---
INPUT_FILE = "data/gids.csv"
OUTPUT_FILE = "data/companies_basic.csv"
CONCURRENT = 3        # Số browser context mở song song
HEADLESS = False      # Tắt headless để bypass bot detection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("extractor.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Yahoo Map Company Extractor")
    parser.add_argument("--input", default=INPUT_FILE)
    parser.add_argument("--output", default=OUTPUT_FILE)
    parser.add_argument("--limit", type=int, default=0, help="Giới hạn số công ty (0 = không giới hạn)")
    parser.add_argument("--headless", action="store_true", help="Chạy ở chế độ headless")
    return parser.parse_args()


def parse_frame_text(text: str) -> dict:
    """Parse dữ liệu từ nội dung text của iframe."""
    data = {"name": "", "address": "", "phone": "", "website": ""}
    
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # --- Tên: thường là dòng đầu tiên có ý nghĩa (trước "大学・大学院", "会社", etc.) ---
    # Tìm dòng tên bằng cách loại bỏ các dòng là ảnh (có đuôi "_1", "_2", ...)
    for line in lines:
        if re.search(r'の画像_\d+$', line):
            continue
        if len(line) > 1 and not re.match(r'^\d', line) and "の画像" not in line:
            data["name"] = line
            break

    # --- Địa chỉ: dòng có tên tỉnh/thành phố + địa chỉ chi tiết ---
    PREF_PATTERN = re.compile(
        r'(東京都|大阪府|北海道|神奈川県|愛知県|福岡県|京都府|兵庫県|埼玉県|千葉県'
        r'|静岡県|茨城県|広島県|宮城県|長野県|福島県|岡山県|三重県|熊本県|鹿児島県'
        r'|沖縄県|新潟県|滋賀県|山口県|愛媛県|長崎県|奈良県|青森県|岩手県|大分県'
        r'|石川県|宮崎県|富山県|秋田県|香川県|和歌山県|山形県|福井県|徳島県|高知県'
        r'|島根県|鳥取県|山梨県|佐賀県|群馬県|栃木県|岐阜県|三重県)'
    )
    for line in lines:
        if PREF_PATTERN.search(line) and re.search(r'(市|区|町|村|丁目|番地|番|号)', line):
            # Xóa chữ "コピー" nếu có ở cuối
            data["address"] = line.replace("コピー", "").strip()
            break

    # --- Số điện thoại ---
    for line in lines:
        m = re.search(r'(?<!\d)(0\d{1,4}[－\-]\d{1,4}[－\-]\d{4})(?!\d)', line)
        if m:
            data["phone"] = m.group(1).replace("－", "-")
            break

    return data


async def extract_place(page, gid: str) -> dict:
    """Trích xuất thông tin từ trang place của Yahoo Map."""
    url = f"https://map.yahoo.co.jp/place?gid={gid}"
    data = {"gid": gid, "name": "", "address": "", "phone": "", "website": ""}

    try:
        try:
            await page.goto(url, timeout=60000, wait_until="domcontentloaded")
        except PlaywrightTimeout:
            pass  # Tiếp tục dù timeout, dữ liệu có thể đã load

        # Chờ iframe xuất hiện
        await page.wait_for_timeout(8000)

        # Tìm frame của pc-map.yahoo.co.jp (frame index 1)
        target_frame = None
        for frame in page.frames:
            if "pc-map.yahoo.co.jp" in frame.url:
                target_frame = frame
                break

        if not target_frame:
            log.warning(f"MISS_FRAME | {gid} | Không tìm thấy iframe")
            return data

        # Đọc text từ iframe
        frame_text = await target_frame.inner_text("body")
        parsed = parse_frame_text(frame_text)
        data.update(parsed)

        # Lấy website link từ iframe
        try:
            website_link = await target_frame.query_selector(
                "a:has-text('公式サイト'), a:has-text('ウェブサイト'), a:has-text('Website')"
            )
            if website_link:
                href = await website_link.get_attribute("href")
                if href and href.startswith("http"):
                    data["website"] = href
        except Exception:
            pass

        status = "OK" if data["name"] else "EMPTY"
        log.info(f"{status} | {gid} | {data['name'][:30]} | {data['phone']} | {data['address'][:20]}")

    except Exception as e:
        log.error(f"ERROR | {gid} | {e}")

    return data


async def run(input_file: str, output_file: str, limit: int, headless: bool):
    # Đọc danh sách GID
    gids = []
    with open(input_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            gids.append(row["gid"])
    if limit:
        gids = gids[:limit]
    log.info(f"Bắt đầu trích xuất {len(gids)} công ty...")

    # Resume: đọc GID đã xử lý
    done_gids = set()
    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                done_gids.add(row["gid"])
        log.info(f"Đã có {len(done_gids)} GID trong file output, bỏ qua...")

    gids_todo = [g for g in gids if g not in done_gids]
    log.info(f"Cần xử lý thêm: {len(gids_todo)} GIDs")

    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
    fieldnames = ["gid", "name", "address", "phone", "website"]
    write_header = not os.path.exists(output_file)

    sem = asyncio.Semaphore(CONCURRENT)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=headless,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )

        async def process(gid):
            async with sem:
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    viewport={"width": 1280, "height": 900},
                )
                await context.add_init_script(
                    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
                )
                page = await context.new_page()
                # Không chặn resource để Yahoo Map có thể load iframe đúng cách
                try:
                    return await extract_place(page, gid)
                finally:
                    await context.close()

        tasks = [process(gid) for gid in gids_todo]

        with open(output_file, "a", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if write_header:
                writer.writeheader()

            for coro in asyncio.as_completed(tasks):
                result = await coro
                writer.writerow(result)
                f.flush()

        await browser.close()

    log.info(f"Hoàn thành! Kết quả lưu tại '{output_file}'")


if __name__ == "__main__":
    args = parse_args()
    if not os.path.exists(args.input):
        print(f"LỖI: Không tìm thấy '{args.input}'. Hãy chạy harvester.py trước.")
    else:
        asyncio.run(run(args.input, args.output, args.limit, args.headless))
