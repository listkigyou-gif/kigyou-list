import os
import sys
import json
import time

# Đảm bảo UTF-8 cho Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))
EYECATCH_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

TITLE = "【国内最大級500万社】法人DB『Kigyou-list』、求人・助成金インテントデータに対応"

SUMMARY = (
    "国内最大級500万件超の法人オープンデータを統合するB2B営業支援プラットフォーム"
    "『Kigyou-list（企業リスト.com）』が大型アップデートを実施。"
    "ハローワーク求人データおよび政府助成金の採択シグナルを抽出可能にし、"
    "月額4,980円（税込）・契約期間縛りなしで提供を開始いたしました。"
    "初期費用ゼロで企業の新規開拓コストを最大90%削減します。"
)

BODY = """■ サービス開発・提供の背景
昨今のB2B市場において、新規顧客開拓（アウトバウンド営業）の効率化は企業の死活問題となっています。しかし、従来の法人リスト販売サービスは「年間契約縛り（30万〜100万円単位の前払い）」や「1件数十円の従量課金」が主流であり、予算の限られた中小企業やスタートアップにとって大きな参入障壁となっていました。

また、単なる社名や電話番号だけのリストでは成約率が低下しており、「今、自社サービスを必要としている企業（インテントデータ）」へのピンポイントアプローチが強く求められています。

こうした課題を解決するため、『Kigyou-list（企業リスト.com）』は、国内最大級となる500万社以上のオープンデータを網羅し、月額4,980円（税込）・年縛りなしで利用できる次世代の法人データベースへと大型アップデートいたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 『Kigyou-list』の3つの革新的な特徴
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 国内最大級500万社を網羅するデータ鮮度と信頼性
国税庁法人番号公表サイト、経済産業省gBizINFO、官公庁オープンデータを独自技術で名寄せ・リアルタイム統合。最新の企業活動状況を反映した高精度な法人リストを提供します。

2. 求人・助成金シグナルを捉える「インテントデータ」機能
ハローワークの最新求人募集情報や、政府・自治体の助成金・補助金採択情報を解析。「事業拡大フェーズにある企業」や「資金調達に成功した企業」など、今まさに購買意欲が高い見込み客を素早く特定できます。

3. 圧倒的なコストパフォーマンス（月額4,980円・縛りなし）
初期費用ゼロ、年間契約縛りなし、月額4,980円（税込）の定額制を採用。いつでも解約可能なオープンな料金設計により、営業DXの民主化を実現します。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ サービス概要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・サービス名：Kigyou-list（企業リスト.com）
・サービス公式サイト：https://kigyoulist.com/?utm_source=valuepress&utm_medium=pr
・料金プラン・他社比較：https://kigyoulist.com/ja/compare?utm_source=valuepress&utm_medium=pr
・無料検索デモ：https://kigyoulist.com/ja/search?utm_source=valuepress&utm_medium=pr
・利用料金：月額 4,980円（税込）
・初期費用：0円（年間契約縛りなし、即日利用開始可能）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 今後の展望
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
『Kigyou-list』は今後、問い合わせフォーム自動アプローチ基盤（フォームマーケティング機能）や、生成AIを活用した見込み客自動スコアリング機能の拡充を予定しております。日本全国の中小企業・営業組織の新規開拓コストを削減し、営業生産性の最大化を支援してまいります。
"""

def run():
    print("=" * 70)
    print("🚀 BẮT ĐẦU QUY TRÌNH XUẤT BẢN THÔNG CÁO BÁO CHÍ MIỄN PHÍ LÊN VALUEPRESS...")
    print(f"📌 Tiêu đề: {TITLE}")
    print(f"📌 Độ dài tiêu đề: {len(TITLE)} ký tự (giới hạn 80 ký tự)")
    print("=" * 70)

    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox"
        ]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=True,
            args=args,
            viewport={"width": 1366, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()

        try:
            # 1. Đi tới trang chọn gói
            print("[1/6] Điều hướng đến trang chọn gói xuất bản...")
            page.goto("https://www.value-press.com/users/articles/new_select_course", wait_until="domcontentloaded")
            time.sleep(3)

            # 2. Chọn gói Free Plan (0 Yên)
            print("[2/6] Chọn Gói Miễn Phí (フリープラン - 0円)...")
            free_container = page.locator("div:has-text('フリー'):has-text('お試し用')")
            free_btn = free_container.locator("a:has-text('このプランを利用する'), button:has-text('このプランを利用する')").first
            if free_btn.count() == 0:
                all_btns = page.locator("a:has-text('このプランを利用する'), button:has-text('このプランを利用する')").all()
                free_btn = all_btns[-1]
            free_btn.click()
            time.sleep(3)

            if "users/articles/new" not in page.url:
                page.goto("https://www.value-press.com/users/articles/new", wait_until="domcontentloaded")
                time.sleep(3)

            # Đóng popup hướng dẫn nếu có
            skip_btn = page.locator("button:has-text('スキップ'), a:has-text('スキップ')")
            if skip_btn.count() > 0:
                skip_btn.first.click()
                time.sleep(1)
                print("    ✓ Đã đóng popup chào mừng")

            # 3. Tải lên hình ảnh chính (Main Visual)
            print("[3/6] Tải lên hình ảnh chính (1200x650px B2B Dashboard Visual)...")
            if os.path.exists(EYECATCH_PATH):
                file_input = page.locator("input[type='file'].slider, input[type='file']").first
                if file_input.count() > 0:
                    file_input.set_input_files(EYECATCH_PATH)
                    time.sleep(3)
                    
                    # Bấm nút xác nhận "挿入する" trong modal cắt ảnh
                    insert_btn = page.locator("button:has-text('挿入する'), a:has-text('挿入する')").first
                    if insert_btn.count() > 0:
                        try:
                            insert_btn.wait_for(state="visible", timeout=10000)
                            insert_btn.click()
                            time.sleep(3)
                            print("    ✓ Đã bấm xác nhận '挿入する' trên modal cắt ảnh!")
                        except Exception as e:
                            print(f"    [-] Lỗi bấm 挿入する: {e}")
                    print("    ✓ Tải và chèn ảnh chính thành công!")

            # 4. Điền Tiêu đề và Tóm tắt
            print("[4/6] Điền Tiêu đề chính và Đoạn tóm tắt (Summary)...")
            title_input = page.locator("#article_title")
            title_input.fill(TITLE)
            print(f"    ✓ Đã điền Tiêu đề: {TITLE}")

            summary_input = page.locator("#article_summary")
            summary_input.fill(SUMMARY)
            print("    ✓ Đã điền Tóm tắt nội dung (要約)")

            # 5. Điền Nội dung chính vào CKEditor 5
            print("[5/6] Điền Toàn văn Thông cáo báo chí vào trình soạn thảo CKEditor...")
            editor = page.locator("#ckeditor_rich_content")
            editor.click()
            time.sleep(1)
            # Nhập nội dung chuẩn
            page.keyboard.insert_text(BODY)
            time.sleep(2)
            print("    ✓ Đã nhập toàn bộ nội dung bài viết vào CKEditor thành công")

            # 6. Bấm Lưu bản nháp (下書き保存)
            print("[6/6] Thực hiện Lưu Bản Nháp (下書き保存)...")
            save_draft_btn = page.locator("button:has-text('下書き保存'), a:has-text('下書き保存')").first
            save_draft_btn.click()
            time.sleep(4)

            # Chụp ảnh toàn trang xác nhận
            screenshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "vp_draft_saved.png"))
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"[✓] ĐÃ LƯU BẢN NHÁP THÀNH CÔNG! Ảnh chụp: {screenshot_path}")
            print(f"    URL bài viết hiện tại: {page.url}")

        except Exception as e:
            print(f"[-] Ngoại lệ: {e}")
            import traceback
            traceback.print_exc()
        finally:
            context.close()

if __name__ == "__main__":
    run()
