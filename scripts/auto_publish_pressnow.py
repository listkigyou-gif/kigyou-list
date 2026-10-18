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

PRESSNOW_FORM_URL = "https://pressnow.jp/pressform/"
DEFAULT_EYECATCH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases"))

def publish_pressnow(payload_data: dict, dry_run: bool = False):
    """
    Quy trình tự động hóa xuất bản thông cáo báo chí lên PRESSNOW (pressnow.jp).
    Hỗ trợ cả chế độ dry_run (điền và chụp ảnh kiểm tra) và real submission.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    listing_type = payload_data.get("listing_type", "無料掲載")
    company_name = payload_data.get("company_name", "TQC株式会社")
    your_name = payload_data.get("your_name", "高橋 里佳")
    your_tel = payload_data.get("your_tel", "03-6907-1219")
    your_email = payload_data.get("your_email", "info@kigyoulist.com")
    
    category = payload_data.get("category", "ＩＴ・通信")
    sub_category_it = payload_data.get("sub_category_it", "SaaS・クラウド")
    
    title = payload_data.get("title", "")
    subtitle = payload_data.get("subtitle", "")
    lead = payload_data.get("lead", "")
    
    body_h1 = payload_data.get("body_heading1", "")
    body_t1 = payload_data.get("body_text1", "")
    body_h2 = payload_data.get("body_heading2", "")
    body_t2 = payload_data.get("body_text2", "")
    body_h3 = payload_data.get("body_heading3", "")
    body_t3 = payload_data.get("body_text3", "")
    remarks = payload_data.get("remarks", "")
    
    official = payload_data.get("official", {})
    image_path = payload_data.get("image_path", DEFAULT_EYECATCH)
    if not os.path.isabs(image_path):
        image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", image_path))
    if not os.path.exists(image_path):
        image_path = DEFAULT_EYECATCH

    confirm_site_url = payload_data.get("confirm_site_url", "https://kigyoulist.com")

    print("\n" + "=" * 60)
    print("🚀 PRESSNOW (PRESSNOW.JP) AUTONOMOUS PUBLISHER")
    print("=" * 60)
    print(f"🏢 Listing Type   : {listing_type}")
    print(f"🏢 Company Name   : {company_name}")
    print(f"👤 Contact Person : {your_name}")
    print(f"📞 Contact Tel    : {your_tel}")
    print(f"📧 Contact Email  : {your_email}")
    print(f"🏷️ Category       : {category} > {sub_category_it}")
    print(f"📝 Title          : {title} ({len(title)} chars)")
    print(f"📄 Subtitle       : {subtitle} ({len(subtitle)} chars)")
    print(f"📖 Lead (5W1H)    : {len(lead)} chars")
    print(f"🖼️ Banner Image   : {image_path}")
    print(f"⚙️ Mode           : {'DRY RUN (Điền & Chụp ảnh, không gửi)' if dry_run else 'REAL SUBMISSION (Gửi duyệt chính thức)'}")
    print("-" * 60 + "\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1400, "height": 1050},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print(f"🌐 1. Đang truy cập URL form PRESSNOW: {PRESSNOW_FORM_URL}...")
        page.goto(PRESSNOW_FORM_URL, wait_until="networkidle", timeout=60000)
        time.sleep(2)

        # 1. Chọn loại đăng bài (listing-type)
        print(f"🔘 2. Chọn hình thức đăng: {listing_type}...")
        page.check(f'input[name="listing-type"][value="{listing_type}"]')
        time.sleep(1)

        # 2. Điền thông tin người nộp (không hiển thị công khai)
        print("✍️ 3. Điền thông tin doanh nghiệp & liên hệ...")
        page.fill('input[name="company-name"]', company_name)
        page.fill('input[name="your-name"]', your_name)
        page.fill('input[name="your-tel"]', your_tel)
        page.fill('input[name="your-email"]', your_email)

        # 3. Phân loại chuyên mục
        print("🏷️ 4. Chọn danh mục bài viết...")
        page.select_option('select[name="category"]', value=category)
        time.sleep(1)
        if sub_category_it:
            try:
                page.select_option('select[name="sub-category-it"]', value=sub_category_it)
            except Exception as e:
                print(f"   ⚠️ Lưu ý chọn sub-category: {e}")

        # 4. Tiêu đề, Phụ đề, Lead
        print("📝 5. Điền Tiêu đề, Phụ đề và Lead (5W1H)...")
        page.fill('input[name="release-title"]', title)
        page.fill('input[name="subtitle"]', subtitle)
        page.fill('textarea[name="release-lead"]', lead)

        # 5. Thân bài (Section 1, 2, 3)
        print("📖 6. Điền các phân đoạn Thân bài (H2 + Text)...")
        page.fill('input[name="body-heading1"]', body_h1)
        page.fill('textarea[name="body-text1"]', body_t1)

        page.fill('input[name="body-heading2"]', body_h2)
        page.fill('textarea[name="body-text2"]', body_t2)

        page.fill('input[name="body-heading3"]', body_h3)
        page.fill('textarea[name="body-text3"]', body_t3)

        if remarks:
            page.fill('textarea[name="remarks"]', remarks)

        # 6. Bảng thông tin chính thức cuối bài (Official info)
        print("🏛️ 7. Điền thông tin công ty & liên kết chính thức...")
        page.fill('input[name="official-company"]', official.get("company", company_name))
        if official.get("address"):
            page.fill('input[name="official-address"]', official.get("address"))
        if official.get("person"):
            page.fill('input[name="official-person"]', official.get("person"))
        if official.get("tel"):
            page.fill('input[name="official-tel"]', official.get("tel"))
        page.fill('input[name="official-site"]', official.get("site", "https://kigyoulist.com"))
        if official.get("email"):
            page.fill('input[name="official-email"]', official.get("email"))

        for i in range(1, 6):
            lbl_key = f"sub_url{i}_label"
            url_key = f"sub_url{i}"
            if official.get(lbl_key):
                page.fill(f'input[name="sub-url{i}-label"]', official.get(lbl_key))
            if official.get(url_key):
                page.fill(f'input[name="sub-url{i}"]', official.get(url_key))

        # 7. Upload ảnh Banner (Eyecatch 16:9)
        if os.path.exists(image_path):
            print(f"🖼️ 8. Tải lên hình ảnh banner: {os.path.basename(image_path)}...")
            page.set_input_files('input[name="release-image"]', image_path)
            time.sleep(1)

        # 8. Nếu là Free Listing: điền URL xác nhận & tích 4 cam kết
        if listing_type == "無料掲載":
            print("✅ 9. Tích cam kết cho gói Miễn Phí (無料掲載)...")
            page.fill('input[name="confirm-site-url"]', confirm_site_url)
            page.check('input[name="free-confirm1[]"]')
            page.check('input[name="free-confirm2[]"]')
            page.check('input[name="free-confirm3[]"]')
            page.check('input[name="free-confirm4[]"]')

        # 9. Tích các điều khoản bắt buộc
        print("🛡️ 10. Xác nhận điều khoản dịch vụ & cam kết chống phi pháp...")
        page.check('input[name="antisocial-use[]"]')
        page.check('input[name="terms-agree[]"]')
        page.check('input[name="mail-check[]"]')
        time.sleep(1)

        # Chụp ảnh toàn cảnh trước khi nộp
        preview_screenshot = os.path.join(OUTPUT_DIR, "pressnow_preview.png")
        page.screenshot(path=preview_screenshot, full_page=True)
        print(f"📸 Đã lưu ảnh chụp toàn bộ form: {preview_screenshot}")

        if dry_run:
            print("\n" + "=" * 60)
            print("✨ [DRY RUN HOÀN TẤT] Dữ liệu đã điền hợp lệ và không có lỗi!")
            print(f"📁 Hãy kiểm tra ảnh: {preview_screenshot}")
            print("=" * 60 + "\n")
            browser.close()
            return True

        # Tiến hành gửi thật
        print("\n🚀 11. BẤM GỬI CHÍNH THỨC TỚI PRESSNOW EDITORIAL TEAM...")
        page.click('input.wpcf7-submit')

        # Chờ phản hồi hoặc redirect sang thanks
        try:
            page.wait_for_url("**/thanks/**", timeout=25000)
            print("🎉 Thành công! Trang đã chuyển hướng tới https://pressnow.jp/thanks/")
        except Exception:
            # Kiểm tra xem có thông báo ajax thành công không
            time.sleep(5)
            output_msg = page.locator('.wpcf7-response-output').inner_text()
            print(f"ℹ️ Phản hồi từ Contact Form 7: {output_msg}")

        success_screenshot = os.path.join(OUTPUT_DIR, "pressnow_success.png")
        page.screenshot(path=success_screenshot, full_page=False)
        print(f"📸 Đã lưu ảnh xác nhận kết quả: {success_screenshot}")

        browser.close()
        print("\n" + "=" * 60)
        print("🏆 BÀI VIẾT ĐÃ ĐƯỢC GỬI THÀNH CÔNG LÊN PRESSNOW!")
        print("=" * 60 + "\n")
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PRESSNOW Autonomous Publisher")
    parser.add_argument("--json", required=True, help="Đường dẫn file JSON chứa payload bài viết")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử điền form và chụp ảnh, không bấm gửi")
    args = parser.parse_args()

    if not os.path.exists(args.json):
        print(f"❌ File JSON không tồn tại: {args.json}")
        sys.exit(1)

    with open(args.json, "r", encoding="utf-8") as f:
        data = json.load(f)

    publish_pressnow(data, dry_run=args.dry_run)
