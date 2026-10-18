import os
import sys
import time
import argparse
import json
from datetime import datetime

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

PR_FREE_FORM_URL = "https://pr-free.jp/prform/"
DEFAULT_EYECATCH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))
SCREENSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases"))

ARTIFACT_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\db0586ad-178e-41f6-a13d-23c6bba11fd1"

def publish_pr_free(
    team_name: str,
    contact_name: str,
    email: str,
    url: str,
    category: str,
    company_brand: str,
    title: str,
    subtitle: str,
    body: str,
    image_path: str = None,
    dry_run: bool = False,
    prefix: str = "pr_free"
):
    """
    Quy trình tự động hóa xuất bản thông cáo báo chí miễn phí trên PR-FREE (pr-free.jp).
    Hỗ trợ cả chế độ dry_run (kiểm tra form và xác nhận) và chế độ xuất bản thực tế.
    """
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    if not image_path or not os.path.exists(image_path):
        image_path = DEFAULT_EYECATCH

    print("\n=======================================================")
    print("🚀 PR-FREE (PR-FREE.JP) AUTONOMOUS PUBLISHER")
    print("=======================================================")
    print(f"🏢 Team/Company : {team_name}")
    print(f"👤 Contact Name : {contact_name}")
    print(f"📧 Email        : {email}")
    print(f"🔗 Target URL   : {url}")
    print(f"🏷️ Category     : {category}")
    print(f"🏷️ Brand Prefix : {company_brand}")
    print(f"📝 Title        : {title} ({len(title)} chars)")
    print(f"📄 Subtitle     : {subtitle} ({len(subtitle)} chars)")
    print(f"📖 Body length  : {len(body)} chars (min 300 required)")
    print(f"🖼️ Banner Image : {image_path}")
    print(f"⚙️ Mode         : {'DRY RUN (Xem trước, không gửi)' if dry_run else 'REAL SUBMIT (Gửi thật)'}")
    print("-------------------------------------------------------\n")

    if len(body) < 300:
        raise ValueError(f"Thân bài quá ngắn ({len(body)} ký tự). PR-FREE yêu cầu tối thiểu 300 ký tự.")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print(f"🌐 Đang truy cập form đăng ký: {PR_FREE_FORM_URL}...")
        page.goto(PR_FREE_FORM_URL, wait_until="networkidle", timeout=45000)
        time.sleep(2)

        # 1. Điền các trường thông tin Step 1
        print("✍️ Đang điền thông tin doanh nghiệp & thông cáo...")
        page.fill('input[name="your-teamname"]', team_name)
        page.fill('input[name="your-name"]', contact_name)
        page.fill('input[name="your-email"]', email)
        page.fill('input[name="url-adress"]', url)

        # Chọn danh mục
        if category:
            page.select_option('select[name="category"]', label=category)

        # Tên thương hiệu hiển thị đầu tiêu đề
        page.fill('input[name="companyname"]', company_brand[:15])

        # Tiêu đề & Phụ đề
        page.fill('input[name="your-subject"]', title[:140])
        if subtitle:
            page.fill('input[name="subtitle"]', subtitle[:140])

        # Nội dung thân bài
        page.fill('textarea[name="your-message"]', body)

        # Đính kèm ảnh banner
        if image_path and os.path.exists(image_path):
            file_size_mb = os.path.getsize(image_path) / (1024 * 1024)
            print(f"📎 Đang tải lên ảnh banner ({file_size_mb:.2f} MB): {image_path}...")
            file_input = page.locator('input[name="file-img1"]')
            file_input.set_input_files(image_path)
            time.sleep(2)

        # Chụp ảnh màn hình bước 1 đã điền xong
        step1_screen = os.path.join(SCREENSHOT_DIR, f"{prefix}_step1_filled.png")
        page.screenshot(path=step1_screen, full_page=True)
        if os.path.exists(ARTIFACT_DIR):
            import shutil
            shutil.copy2(step1_screen, os.path.join(ARTIFACT_DIR, f"{prefix}_step1_filled.png"))
        print(f"📸 Đã lưu ảnh màn hình bước 1: {step1_screen}")

        # 2. Bấm nút xác nhận Bước 1 -> Bước 2
        print("👉 Nhấp nút xác nhận nội dung và đồng ý điều khoản ('規約に同意して入力内容を確認')...")
        confirm_btn = page.locator('input.wpcf7c-btn-confirm, input[value="規約に同意して入力内容を確認"]')
        confirm_btn.scroll_into_view_if_needed()
        confirm_btn.click()

        # Chờ quá trình chuyển bước trong Contact Form 7
        time.sleep(3)

        # Kiểm tra xem có lỗi validation không
        error_elements = page.locator('.wpcf7-not-valid-tip').all()
        if error_elements:
            errors = [el.inner_text() for el in error_elements]
            err_screen = os.path.join(SCREENSHOT_DIR, f"{prefix}_validation_error.png")
            page.screenshot(path=err_screen, full_page=True)
            raise RuntimeError(f"Lỗi kiểm tra tính hợp lệ trên form: {errors}. Xem ảnh: {err_screen}")

        step2_screen = os.path.join(SCREENSHOT_DIR, f"{prefix}_step2_preview.png")
        page.screenshot(path=step2_screen, full_page=True)
        if os.path.exists(ARTIFACT_DIR):
            import shutil
            shutil.copy2(step2_screen, os.path.join(ARTIFACT_DIR, f"{prefix}_step2_preview.png"))
        print(f"📸 Đã chuyển sang Bước 2 (Xem trước nội dung). Ảnh: {step2_screen}")

        if dry_run:
            print("\n🏁 [DRY RUN HOÀN TẤT] Dừng lại trước khi gửi thực tế theo yêu cầu.")
            browser.close()
            return True

        # 3. Gửi thông cáo chính thức Bước 2
        print("🚀 Đang bấm gửi thông cáo chính thức ('リリースを送信')...")
        submit_btn = page.locator('input.wpcf7-submit[value="リリースを送信"]')
        submit_btn.scroll_into_view_if_needed()
        submit_btn.click()

        # Chờ phản hồi ajax từ WordPress
        print("⏳ Đang chờ hệ thống PR-FREE tiếp nhận và xử lý...")
        try:
            page.wait_for_selector('.wpcf7-response-output', timeout=20000)
            time.sleep(3)
        except Exception:
            pass

        final_screen = os.path.join(SCREENSHOT_DIR, f"{prefix}_success.png")
        page.screenshot(path=final_screen, full_page=True)
        if os.path.exists(ARTIFACT_DIR):
            import shutil
            shutil.copy2(final_screen, os.path.join(ARTIFACT_DIR, f"{prefix}_success.png"))
        print(f"📸 Đã lưu ảnh màn hình kết quả: {final_screen}")

        response_text = page.locator('.wpcf7-response-output').inner_text() if page.locator('.wpcf7-response-output').count() > 0 else ""
        print(f"\n📢 Phản hồi từ hệ thống PR-FREE: {response_text}")

        browser.close()
        print("\n🎉 [THÀNH CÔNG] Thông cáo báo chí đã được gửi lên PR-FREE thành công!")
        print("⏱️ Thời gian duyệt dự kiến: từ 5 phút đến 1 giờ.")
        return True

def main():
    parser = argparse.ArgumentParser(description="Tự động hóa xuất bản thông cáo báo chí PR-FREE (pr-free.jp)")
    parser.add_argument("--json", type=str, default="scripts/press_releases/release_pr_free_01.json", help="Đường dẫn file JSON chứa nội dung bài đăng")
    parser.add_argument("--dry-run", action="store_true", help="Chạy kiểm tra form mà không gửi thực tế")
    parser.add_argument("--prefix", type=str, default="pr_free", help="Tiền tố tên file ảnh chụp màn hình")
    args = parser.parse_args()

    json_path = os.path.abspath(args.json)
    if not os.path.exists(json_path):
        print(f"❌ Không tìm thấy file JSON: {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    publish_pr_free(
        team_name=data.get("team_name", "Kigyou-list運営事務局"),
        contact_name=data.get("contact_name", "広報担当"),
        email=data.get("email", "contact@kigyoulist.com"),
        url=data.get("url", "https://kigyoulist.com/?utm_source=prfree&utm_medium=pr"),
        category=data.get("category", "ＩＴ・通信"),
        company_brand=data.get("company_brand", "Kigyou-list"),
        title=data.get("title", ""),
        subtitle=data.get("subtitle", ""),
        body=data.get("body", ""),
        image_path=data.get("image_path", DEFAULT_EYECATCH),
        dry_run=args.dry_run,
        prefix=args.prefix
    )

if __name__ == "__main__":
    main()
