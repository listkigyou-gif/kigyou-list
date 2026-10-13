import os
import sys
import json
import time
import argparse
from typing import Optional, List, Dict, Any

# Đảm bảo UTF-8 cho Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))

def get_browser_context(p, headless=True):
    args = [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox"
    ]
    try:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=headless,
            args=args,
            viewport={"width": 1366, "height": 900}
        )
    except Exception:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=headless,
            args=args,
            viewport={"width": 1366, "height": 900}
        )
    return context

def publish_valuepress_release(
    title: str,
    subtitle: str,
    lead: str,
    body: str,
    keywords: Optional[List[str]] = None,
    category: Optional[str] = "IT・Webサービス",
    image_path: Optional[str] = None,
    service_url: Optional[str] = "https://kigyoulist.com",
    is_draft: bool = True,
    headless: bool = True
) -> Dict[str, Any]:
    """
    Tự động hóa đăng thông cáo báo chí lên ValuePress (value-press.com):
    1. Kiểm tra session đăng nhập
    2. Vào trang tạo thông cáo báo chí (pressrelease/new)
    3. Điền Title, Subtitle, Lead, Body, Keywords, Links
    4. Tải lên hình ảnh chính (Main Visual)
    5. Lưu bản nháp (Draft) hoặc Gửi kiểm duyệt (Submit)
    """
    print("=" * 70)
    print("🚀 BẮT ĐẦU QUY TRÌNH XUẤT BẢN THÔNG CÁO BÁO CHÍ LÊN VALUEPRESS...")
    print(f"📌 Tiêu đề: {title[:50]}...")
    print(f"📌 Chế độ: {'LƯU BẢN NHÁP (DRAFT)' if is_draft else 'GỬI DUYỆT / XUẤT BẢN THẬT'}")
    print("=" * 70)

    if not os.path.exists(PROFILE_DIR):
        print(f"[-] CẢNH BÁO: Thư mục hồ sơ {PROFILE_DIR} chưa tồn tại.")
        print("    Vui lòng chạy `python scripts/valuepress_setup_session.py` trước để đăng nhập!")

    result = {
        "success": False,
        "title": title,
        "status": "pending",
        "url": None,
        "error": None
    }

    with sync_playwright() as p:
        context = get_browser_context(p, headless=headless)
        page = context.pages[0] if context.pages else context.new_page()

        try:
            print("[1/5] Kiểm tra phiên đăng nhập và điều hướng đến MyPage...")
            page.goto("https://www.value-press.com/mypage", wait_until="domcontentloaded")
            time.sleep(3)

            if "login" in page.url:
                error_msg = "Chưa có phiên đăng nhập ValuePress hợp lệ. Hãy chạy scripts/valuepress_setup_session.py."
                print(f"[-] LỖI: {error_msg}")
                result["error"] = error_msg
                context.close()
                return result

            print("[2/5] Truy cập trang soạn thảo thông cáo báo chí...")
            # ValuePress thường có URL tạo mới là /pressrelease/new hoặc nút trong mypage
            create_btn = page.locator("a[href*='/pressrelease/new'], a:has-text('プレスリリースを作成'), a:has-text('新規作成')")
            if create_btn.count() > 0:
                create_btn.first.click()
                time.sleep(3)
            else:
                page.goto("https://www.value-press.com/pressrelease/new", wait_until="domcontentloaded")
                time.sleep(3)

            print("[3/5] Điền các trường nội dung thông cáo báo chí...")
            
            # 1. Tiêu đề chính (Title)
            title_input = page.locator("input[name*='title'], input#title, input[placeholder*='タイトル']").first
            if title_input.count() > 0:
                title_input.fill(title)
                print("    ✓ Đã điền Tiêu đề chính (タイトル)")

            # 2. Tiêu đề phụ (Subtitle)
            sub_input = page.locator("input[name*='sub_title'], input[name*='subtitle'], input#subtitle, textarea[name*='subtitle']").first
            if sub_input.count() > 0:
                sub_input.fill(subtitle)
                print("    ✓ Đã điền Tiêu đề phụ (サブタイトル)")

            # 3. Đoạn dẫn dắt (Lead text)
            lead_input = page.locator("textarea[name*='lead'], textarea#lead, textarea[placeholder*='リード']").first
            if lead_input.count() > 0:
                lead_input.fill(lead)
                print("    ✓ Đã điền Đoạn dẫn dắt (リード文)")

            # 4. Nội dung chính (Body text)
            body_input = page.locator("textarea[name*='body'], textarea#body, textarea[name*='content'], div.note-editable, div[contenteditable='true']").first
            if body_input.count() > 0:
                if body_input.get_attribute("contenteditable") == "true":
                    body_input.click()
                    page.keyboard.insert_text(body)
                else:
                    body_input.fill(body)
                print("    ✓ Đã điền Nội dung chính (本文)")

            # 5. Từ khóa (Keywords)
            if keywords:
                kw_str = "、".join(keywords) if isinstance(keywords, list) else str(keywords)
                kw_input = page.locator("input[name*='keyword'], input#keyword, input[placeholder*='キーワード']").first
                if kw_input.count() > 0:
                    kw_input.fill(kw_str)
                    print(f"    ✓ Đã điền Từ khóa tìm kiếm: {kw_str}")

            # 6. Đường dẫn liên quan (URL)
            url_input = page.locator("input[name*='url'], input#url, input[placeholder*='URL']").first
            if url_input.count() > 0 and service_url:
                url_input.fill(service_url)
                print(f"    ✓ Đã gắn URL dịch vụ: {service_url}")

            # 7. Upload ảnh (nếu có)
            if image_path and os.path.exists(image_path):
                print(f"[4/5] Tải lên hình ảnh chính: {image_path}...")
                file_input = page.locator("input[type='file']").first
                if file_input.count() > 0:
                    file_input.set_input_files(image_path)
                    time.sleep(2)
                    print("    ✓ Đã tải ảnh đính kèm thành công")

            # Chụp ảnh màn hình trạng thái soạn thảo
            screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "valuepress_preview.png"))
            page.screenshot(path=screenshot_path)
            print(f"[+] Đã chụp ảnh xác nhận bản thảo: {screenshot_path}")

            # 8. Lưu nháp hoặc Nộp
            print(f"[5/5] Thực hiện {'Lưu nháp' if is_draft else 'Nộp bài xuất bản'}...")
            if is_draft:
                draft_btn = page.locator("button:has-text('下書き保存'), input[value*='下書き'], a:has-text('下書き保存'), button:has-text('一時保存')").first
                if draft_btn.count() > 0:
                    draft_btn.click()
                    time.sleep(3)
                    result["status"] = "draft_saved"
                    print("[✓] ĐÃ LƯU BẢN NHÁP THÀNH CÔNG TRÊN VALUEPRESS!")
                else:
                    print("[-] Không tìm thấy nút lưu nháp trực tiếp, trạng thái hiện tại được giữ trong form.")
                    result["status"] = "form_filled"
            else:
                submit_btn = page.locator("button:has-text('確認画面へ'), button:has-text('審査を申請'), button:has-text('配信申請')").first
                if submit_btn.count() > 0:
                    submit_btn.click()
                    time.sleep(3)
                    result["status"] = "submitted_for_review"
                    print("[✓] ĐÃ GỬI DUYỆT XUẤT BẢN THÀNH CÔNG!")
                else:
                    print("[-] Không tìm thấy nút xác nhận gửi duyệt.")

            result["success"] = True
            result["url"] = page.url

        except Exception as e:
            print(f"[-] Ngoại lệ xảy ra trong quá trình xuất bản: {e}")
            result["error"] = str(e)
        finally:
            context.close()

    return result

def main():
    parser = argparse.ArgumentParser(description="ValuePress Automated Press Release Publisher")
    parser.add_argument("--file", help="Đường dẫn file JSON hoặc MD chứa thông cáo báo chí")
    parser.add_argument("--draft", action="store_true", default=True, help="Lưu dưới dạng bản nháp (mặc định: True)")
    parser.add_argument("--submit", action="store_true", help="Gửi duyệt xuất bản thật")
    parser.add_argument("--headless", action="store_true", default=False, help="Chạy ở chế độ ẩn danh (headless)")

    args = parser.parse_args()

    if args.file and os.path.exists(args.file):
        with open(args.file, "r", encoding="utf-8") as f:
            if args.file.endswith(".json"):
                data = json.load(f)
            else:
                # Nếu là markdown đơn thuần
                content = f.read()
                data = {
                    "title": "【500万社網羅】法人データベース『Kigyou-list』大型アップデート",
                    "subtitle": "月額4,980円で即日利用可能、インテントデータにも対応",
                    "lead": "国内最大級500万件超の企業情報を網羅するKigyou-listが新機能をリリース。",
                    "body": content,
                    "keywords": ["法人リスト", "企業データベース", "営業DX", "新規開拓"]
                }
    else:
        # Dữ liệu mặc định mẫu thử nghiệm
        data = {
            "title": "【国内最大級500万社】法人データベース『Kigyou-list』がアップデート、月額4,980円・年縛りなしでハローワーク求人・助成金インテントデータに対応",
            "subtitle": "初期費用ゼロ・即日解約可能。中小企業・スタートアップの新規開拓コストを最大90%削減する新時代の営業DX基盤",
            "lead": "法人データベースプラットフォーム『Kigyou-list（企業リスト.com）』は、国内500万社以上のオープンデータを統合し、求人・助成金シグナルを抽出可能な大型アップデートを実施いたしました。",
            "body": "■ サービス提供の背景\n昨今のB2B営業において...",
            "keywords": ["法人リスト", "企業データベース", "営業DX", "インテントデータ", "新規開拓", "中小企業支援"],
            "category": "IT・Webサービス"
        }

    is_draft = not args.submit
    res = publish_valuepress_release(
        title=data.get("title", ""),
        subtitle=data.get("subtitle", ""),
        lead=data.get("lead", ""),
        body=data.get("body", ""),
        keywords=data.get("keywords", []),
        category=data.get("category", "IT・Webサービス"),
        image_path=data.get("image_path"),
        service_url=data.get("service_url", "https://kigyoulist.com"),
        is_draft=is_draft,
        headless=args.headless
    )
    print(f"\nKết quả thực thi: {res}")

if __name__ == "__main__":
    main()
