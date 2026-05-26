"""
Yahoo Map Company Enricher (Giai đoạn 3)
------------------------------------------
Làm giàu dữ liệu bằng cách truy cập website chính thức của công ty
để tìm Số Fax và Email.

Logic:
    1. Đọc website URL từ companies_basic.csv
    2. Truy cập trang chủ, tìm link trang "Liên hệ" / "Giới thiệu"
    3. Dùng Regex để quét Fax và Email
    4. Ghi kết quả vào companies_final.csv

Cách dùng:
    python enricher.py
    python enricher.py --input data/companies_basic.csv --output data/companies_final.csv
"""
import asyncio
import csv
import os
import re
import argparse
import logging
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

# --- Cấu hình ---
INPUT_FILE = "data/companies_basic.csv"
OUTPUT_FILE = "data/companies_final.csv"
CONCURRENT = 5
HEADLESS = True

# Từ khóa để tìm trang "Liên hệ" / "Giới thiệu"
CONTACT_KEYWORDS = [
    "会社概要", "企業情報", "会社情報", "概要",
    "お問い合わせ", "問い合わせ", "コンタクト",
    "アクセス", "所在地",
    "Contact", "About", "Company", "Profile", "Access",
]

# Pattern Regex
FAX_PATTERN = re.compile(
    r'(?:Fax|FAX|ファックス|F\.?A\.?X\.?)\s*[：:・]?\s*(0\d{1,4}[-－]\d{1,4}[-－]\d{4})',
    re.IGNORECASE
)
EMAIL_PATTERN = re.compile(
    r'\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b'
)
# Loại trừ email hệ thống (ví dụ: noreply@, example@)
EMAIL_BLACKLIST = re.compile(
    r'(noreply|no-reply|donotreply|example|test@|admin@sentry)',
    re.IGNORECASE
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("enricher.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Company Data Enricher (Fax & Email)")
    parser.add_argument("--input", default=INPUT_FILE)
    parser.add_argument("--output", default=OUTPUT_FILE)
    parser.add_argument("--limit", type=int, default=0)
    return parser.parse_args()


def extract_contact_info(text: str) -> tuple[str, str]:
    """Trích xuất Fax và Email từ đoạn văn bản."""
    fax = ""
    email = ""

    fax_match = FAX_PATTERN.search(text)
    if fax_match:
        fax = fax_match.group(1)

    for m in EMAIL_PATTERN.finditer(text):
        candidate = m.group(1)
        if not EMAIL_BLACKLIST.search(candidate):
            email = candidate
            break

    return fax, email


async def find_contact_links(page, base_url: str) -> list[str]:
    """Tìm các link trang Liên hệ / Giới thiệu trên trang hiện tại."""
    try:
        all_links = await page.eval_on_selector_all(
            "a[href]",
            "els => els.map(e => ({text: e.innerText, href: e.getAttribute('href')}))"
        )
    except Exception:
        return []

    contact_links = []
    for item in all_links:
        text = (item.get("text") or "").strip()
        href = (item.get("href") or "").strip()
        if not href or href.startswith("#") or href.startswith("javascript"):
            continue
        # Chuyển relative URL → absolute
        if not href.startswith("http"):
            href = urljoin(base_url, href)
        # Chỉ lấy link cùng domain
        if urlparse(href).netloc != urlparse(base_url).netloc:
            continue
        # Kiểm tra từ khóa
        for kw in CONTACT_KEYWORDS:
            if kw in text or kw.lower() in href.lower():
                contact_links.append(href)
                break

    return list(dict.fromkeys(contact_links))  # Dedup


async def enrich_company(page, company: dict) -> dict:
    """Lấy Fax và Email cho một công ty."""
    result = dict(company)
    result.setdefault("fax", "")
    result.setdefault("email", "")

    website = (company.get("website") or "").strip()
    if not website or not website.startswith("http"):
        log.info(f"SKIP | {company.get('name', company.get('gid', ''))} | Không có website")
        return result

    try:
        await page.goto(website, timeout=25000, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
    except Exception as e:
        log.warning(f"GOTO ERROR | {website} | {e}")
        return result

    try:
        # Bước 1: Quét trang chủ
        home_text = await page.inner_text("body")
        fax, email = extract_contact_info(home_text)

        if fax and email:
            result["fax"] = fax
            result["email"] = email
            log.info(f"OK (home) | {company.get('name', '')[:25]} | fax={fax} | email={email}")
            return result

        # Bước 2: Tìm trang con (Contact/About)
        contact_links = await find_contact_links(page, website)
        log.info(f"  Tìm thấy {len(contact_links)} trang con để kiểm tra: {contact_links[:3]}")

        for link in contact_links[:4]:  # Giới hạn 4 trang con
            try:
                await page.goto(link, timeout=15000, wait_until="domcontentloaded")
                await page.wait_for_timeout(1000)
                sub_text = await page.inner_text("body")
                f2, e2 = extract_contact_info(sub_text)
                if f2 and not fax:
                    fax = f2
                if e2 and not email:
                    email = e2
                if fax and email:
                    break
            except Exception:
                continue

        result["fax"] = fax
        result["email"] = email
        status = "OK" if (fax or email) else "MISS"
        log.info(f"{status} | {company.get('name', '')[:25]} | fax={fax} | email={email}")

    except Exception as e:
        log.error(f"ERROR | {website} | {e}")

    return result


async def run(input_file: str, output_file: str, limit: int):
    # Đọc danh sách công ty
    companies = []
    with open(input_file, "r", encoding="utf-8") as f:
        companies = list(csv.DictReader(f))
    if limit:
        companies = companies[:limit]
    log.info(f"Bắt đầu enrich {len(companies)} công ty...")

    # Resume: đọc GID đã xử lý
    done_gids = set()
    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                done_gids.add(row["gid"])
        log.info(f"Đã có {len(done_gids)} GID trong file output, bỏ qua...")

    todo = [c for c in companies if c["gid"] not in done_gids]
    log.info(f"Cần xử lý thêm: {len(todo)} công ty")

    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)

    # Lấy fieldnames từ input + thêm fax, email
    sample = companies[0] if companies else {}
    base_fields = list(sample.keys())
    extra_fields = [f for f in ["fax", "email"] if f not in base_fields]
    fieldnames = base_fields + extra_fields

    write_header = not os.path.exists(output_file)
    sem = asyncio.Semaphore(CONCURRENT)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)

        async def process(company):
            async with sem:
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    )
                )
                page = await context.new_page()
                # Chặn tài nguyên không cần thiết
                await page.route(
                    "**/*.{png,jpg,jpeg,gif,svg,woff,woff2,mp4,webm,ico}",
                    lambda r: r.abort()
                )
                try:
                    return await enrich_company(page, company)
                finally:
                    await context.close()

        tasks = [process(c) for c in todo]

        with open(output_file, "a", newline="", encoding="utf-8-sig") as f:
            # utf-8-sig để Excel tự nhận mã hoá
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            if write_header:
                writer.writeheader()

            for coro in asyncio.as_completed(tasks):
                result = await coro
                writer.writerow(result)
                f.flush()

        await browser.close()

    log.info(f"Hoàn thành! Kết quả cuối cùng lưu tại '{output_file}'")


if __name__ == "__main__":
    args = parse_args()
    if not os.path.exists(args.input):
        print(f"LỖI: Không tìm thấy '{args.input}'. Hãy chạy extractor.py trước.")
    else:
        asyncio.run(run(args.input, args.output, args.limit))
