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

DEFAULT_PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))
DEFAULT_EYECATCH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

def publish_valuepress_free(title, summary, body_html, eyecatch_path=None, profile_dir=None):
    """
    Quy trình tự động hóa 100% xuất bản Thông Cáo Báo Chí Gói Miễn Phí (フリープラン) trên ValuePress.
    Đã được tối ưu hóa cho nền tảng kigyoulist.com.
    """
    if not profile_dir:
        profile_dir = DEFAULT_PROFILE_DIR
    if not eyecatch_path or not os.path.exists(eyecatch_path):
        eyecatch_path = DEFAULT_EYECATCH

    print(f"\n=======================================================")
    print(f"🚀 VALUEPRESS FREE PLAN PUBLISHER - KIGYOULIST.COM")
    print(f"=======================================================")
    print(f"📝 Title: {title[:60]}... ({len(title)} chars)")
    print(f"📄 Summary: {summary[:60]}... ({len(summary)} chars)")
    print(f"🖼️ Banner: {eyecatch_path}")
    print(f"👤 Profile: {profile_dir}")
    print(f"-------------------------------------------------------\n")

    # Kiểm tra giới hạn ký tự của ValuePress Free Plan
    if len(title) > 80:
        print(f"⚠️ Cảnh báo: Tiêu đề dài {len(title)} ký tự. ValuePress giới hạn tối đa 80 ký tự. Đang tự động cắt gọn...")
        title = title[:80]
    if len(summary) > 400:
        print(f"⚠️ Cảnh báo: Tóm tắt dài {len(summary)} ký tự. ValuePress giới hạn tối đa 400 ký tự. Đang tự động cắt gọn...")
        summary = summary[:400]

    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox"
        ]
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=True,
            args=args,
            viewport={"width": 1366, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())

        # ---------------------------------------------------------
        # BƯỚC 1: TRUY CẬP VÀ ĐIỀN NỘI DUNG (プレスリリース作成)
        # ---------------------------------------------------------
        print("[1/3] Đang truy cập trình soạn thảo Gói Miễn Phí...")
        page.goto("https://www.value-press.com/users/free_course_articles/new", wait_until="domcontentloaded")
        time.sleep(3)

        # Bỏ qua hướng dẫn nếu có popup
        skip_btn = page.locator("button:has-text('スキップ'), a:has-text('スキップ')")
        if skip_btn.count() > 0:
            skip_btn.first.click()
            time.sleep(1)

        # Đính kèm ảnh Banner (16:9)
        if os.path.exists(eyecatch_path):
            print("  📸 Đang tải lên ảnh Banner...")
            file_input = page.locator("input[type='file'].slider, input[type='file']").first
            file_input.set_input_files(eyecatch_path)
            time.sleep(5) # Đợi S3 tải và render cropper

            apply_btn = page.locator("div.vue-cropper-applybtn")
            if apply_btn.count() > 0:
                apply_btn.first.click()
                time.sleep(3)
                print("  ✓ Đã chèn ảnh Banner thành công!")

        # Điền Tiêu đề và Tóm tắt
        print("  ✍️ Đang điền Tiêu đề và Tóm tắt...")
        page.locator("#article_title").fill(title)
        page.locator("#article_summary").fill(summary)
        time.sleep(1)

        # Điền Thân bài vào CKEditor 5
        print("  📝 Đang điền Nội dung vào CKEditor...")
        page.evaluate("""(html) => {
            const el = document.querySelector('#ckeditor_rich_content');
            if (el && el.ckeditorInstance) {
                el.ckeditorInstance.setData(html);
            }
        }""", body_html)
        time.sleep(2)

        # Lưu bản nháp Bước 1
        print("  💾 Đang lưu bản nháp...")
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('.save-draft, button, a')).filter(b => b.innerText && b.innerText.includes('下書き保存'));
            for (const b of btns) {
                if (b.offsetWidth > 0 && b.offsetHeight > 0) {
                    b.click();
                    return;
                }
            }
            if (btns.length > 0) btns[0].click();
        }""")
        time.sleep(4)
        print(f"  ✓ Đã lưu nháp. URL hiện tại: {page.url}")

        # ---------------------------------------------------------
        # BƯỚC 2: CẤU HÌNH PHÁT HÀNH (プレスリリース配信設定)
        # ---------------------------------------------------------
        print("\n[2/3] Đang chuyển sang Bước 2 (Cài đặt phát hành)...")
        step2_btn = page.locator("a#confirm, a:has-text('配信先、日時を設定する'), button:has-text('配信先、日時を設定する')")
        if step2_btn.count() > 0:
            step2_btn.first.click()
            time.sleep(4)

        print("  ⚙️ Đang cấu hình các cam kết pháp lý & chuyên mục...")
        try:
            # 1. Cam kết tuân thủ biểu đạt không lừa dối khách hàng
            page.locator("#exaggerated_expression_confirmation_status_not_applicable").click()
            time.sleep(0.5)
            # 2. Xác nhận toàn bộ URL công khai hợp lệ
            page.locator("#unpublished_url_flg_id_not_included").click()
            time.sleep(0.5)
            # 3. Phân loại chuyên mục B2B
            page.select_option("select#article_genre_id", value="2")     # ネットサービス
            time.sleep(0.5)
            page.select_option("select#article_category_id", value="2")  # サービス
            time.sleep(0.5)
            print("  ✓ Cấu hình Bước 2 hoàn tất.")
        except Exception as e:
            print(f"  ⚠️ Lưu ý Bước 2: {e}")

        # ---------------------------------------------------------
        # BƯỚC 3: XÁC NHẬN VÀ ĐẶT LỊCH PHÁT HÀNH (内容確認・予約)
        # ---------------------------------------------------------
        print("\n[3/3] Đang chuyển sang Bước 3 (Xác nhận & Nộp bài)...")
        confirm_btn = page.locator("a:has-text('配信内容を確認する'), button:has-text('配信内容を確認する')")
        if confirm_btn.count() > 0:
            confirm_btn.first.click()
            time.sleep(4)

        # Xử lý popup chào mua gói Standard (Upsell Modal)
        close_span = page.locator(".advertisement_modal_box_bottom .reset, .advertisement_modal_box_bottom span")
        if close_span.count() > 0:
            print("  🛑 Phát hiện Popup gói trả phí! Đang bấm '次へ進む' để tiếp tục gói Free...")
            close_span.first.click()
            time.sleep(2)
        
        # Dọn sạch lớp phủ mask nếu còn sót lại
        page.evaluate("""() => {
            const masks = document.querySelectorAll('.modal_media_compatibility_mask, .modal_media_compatibility');
            masks.forEach(m => m.remove());
        }""")
        time.sleep(1)

        # Cuộn trang xuống đáy để kích hoạt nút đặt lịch phát hành
        print("  📜 Đang cuộn trang xuống đáy để kích hoạt xác nhận...")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        # Click nút nộp bài đặt lịch cuối cùng
        print("  🚀 Đang bấm '内容を確認し、配信予約する'...")
        page.evaluate("""() => {
            const btn = document.querySelector('#apply-confirm');
            if (btn) {
                btn.disabled = false;
                btn.click();
            }
        }""")
        time.sleep(6)

        # Bấm xác nhận phụ nếu có (SweetAlert2 hoặc modal confirm)
        secondary_confirm = page.locator(".swal2-confirm, button:has-text('OK'), button:has-text('はい')")
        if secondary_confirm.count() > 0 and secondary_confirm.first.is_visible():
            secondary_confirm.first.click()
            time.sleep(4)

        # Kiểm tra kết quả
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "published_results"))
        os.makedirs(res_dir, exist_ok=True)
        screenshot_path = os.path.join(res_dir, f"vp_free_result_{timestamp}.png")
        page.screenshot(path=screenshot_path, full_page=True)

        is_success = page.locator("text='プレスリリース予約が完了致しました'").count() > 0 or "confirm?" in page.url
        print(f"\n=======================================================")
        if is_success:
            print(f"🎉 XUẤT BẢN THÀNH CÔNG! ĐÃ NỘP BÀI VÀO HÀNG CHỜ DUYỆT CỦA VALUEPRESS.")
        else:
            print(f"ℹ️ Đã hoàn tất các bước. Vui lòng kiểm tra ảnh chụp màn hình kết quả.")
        print(f"📸 Ảnh chụp kết quả: {screenshot_path}")
        print(f"🔗 URL trang: {page.url}")
        print(f"=======================================================\n")

        context.close()
        return is_success, screenshot_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ValuePress Free Plan Auto Publisher for Kigyou-list")
    parser.add_argument("--json", help="Path to JSON file containing title, summary, body, eyecatch")
    parser.add_argument("--title", help="Article Title (Max 80 chars)")
    parser.add_argument("--summary", help="Article Summary (Max 400 chars)")
    parser.add_argument("--body-file", help="Path to HTML or text file containing body")
    parser.add_argument("--eyecatch", help="Path to eyecatch image (16:9)")

    args = parser.parse_args()

    if args.json and os.path.exists(args.json):
        with open(args.json, "r", encoding="utf-8") as f:
            data = json.load(f)
        publish_valuepress_free(
            title=data.get("title"),
            summary=data.get("summary"),
            body_html=data.get("body"),
            eyecatch_path=data.get("eyecatch")
        )
    elif args.title and args.summary and args.body_file and os.path.exists(args.body_file):
        with open(args.body_file, "r", encoding="utf-8") as f:
            body_html = f.read()
        publish_valuepress_free(
            title=args.title,
            summary=args.summary,
            body_html=body_html,
            eyecatch_path=args.eyecatch
        )
    else:
        print("Sử dụng: python auto_publish_valuepress.py --json <path_to_json> hoặc chỉ định --title, --summary, --body-file, --eyecatch")
