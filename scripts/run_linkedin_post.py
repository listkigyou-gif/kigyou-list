import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))

def run_post(text: str, image_path: str, comment_link: str):
    print("=" * 65)
    print("🚀 Đang tiến hành đăng bài viết mở màn lên LinkedIn...")
    print("=" * 65)
    
    with sync_playwright() as p:
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox"
        ]
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        page = context.pages[0] if context.pages else context.new_page()
        
        print("[1/6] Điều hướng tới https://www.linkedin.com/feed/ ...")
        page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
        time.sleep(5)
        
        page.screenshot(path="scripts/linkedin_step1_feed.png")
        print("  -> Đã vào Feed thành công.")
        
        # Click "Start a post" / "投稿を開始"
        print("[2/6] Mở khung soạn thảo bài viết...")
        start_post_selectors = [
            'button:has-text("Start a post")',
            'button:has-text("投稿を開始")',
            'button.share-box-feed-entry__trigger',
            'div.share-box-feed-entry button',
            'span:has-text("Start a post")',
            'span:has-text("投稿を開始")'
        ]
        
        clicked = False
        for sel in start_post_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    el.click()
                    clicked = True
                    print(f"  -> Clicked: {sel}")
                    break
            except Exception:
                continue
                
        if not clicked:
            # Fallback by evaluating click
            page.evaluate('''() => {
                const btn = document.querySelector('button.share-box-feed-entry__trigger') || 
                            Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start a post') || b.innerText.includes('投稿を開始'));
                if (btn) btn.click();
            }''')
            
        time.sleep(3)
        page.screenshot(path="scripts/linkedin_step2_modal.png")
        
        # Nhập text
        print("[3/6] Nhập nội dung bài viết...")
        editor_selectors = [
            'div[role="textbox"]',
            'div.editor-content div.ql-editor',
            'div[data-placeholder*="want to talk about"]',
            'div[data-placeholder*="投稿を作成"]'
        ]
        
        editor = None
        for sel in editor_selectors:
            try:
                ed = page.locator(sel).first
                if ed.is_visible(timeout=3000):
                    editor = ed
                    print(f"  -> Found editor: {sel}")
                    break
            except Exception:
                continue
                
        if not editor:
            print("[-] Không tìm thấy editor!")
            context.close()
            return False
            
        editor.click()
        time.sleep(1)
        page.keyboard.insert_text(text)
        time.sleep(2)
        page.screenshot(path="scripts/linkedin_step3_text.png")
        
        # Upload ảnh
        if image_path and os.path.exists(image_path):
            print(f"[4/6] Đính kèm hình ảnh: {image_path} ...")
            # Tìm input file hoặc click nút Media
            file_input = page.locator('input[type="file"]').first
            has_input = False
            try:
                if file_input.count() > 0:
                    file_input.set_input_files(image_path)
                    has_input = True
            except Exception:
                pass
                
            if not has_input:
                media_btns = [
                    'button[aria-label*="Add media"]',
                    'button[aria-label*="メディア"]',
                    'button[aria-label*="写真"]',
                    'button:has(svg[data-test-icon="image-medium"])',
                    'button:has(svg[data-test-icon="image-fill-small"])'
                ]
                for mb in media_btns:
                    try:
                        m_el = page.locator(mb).first
                        if m_el.is_visible(timeout=2000):
                            m_el.click()
                            time.sleep(2)
                            page.locator('input[type="file"]').first.set_input_files(image_path)
                            has_input = True
                            break
                    except Exception:
                        continue
                        
            time.sleep(4)
            page.screenshot(path="scripts/linkedin_step4_media_upload.png")
            
            # Click Next / Done trong modal media
            next_btns = [
                'button:has-text("Next")',
                'button:has-text("次へ")',
                'button.share-box-footer__primary-btn',
                'div.share-box-footer button.artdeco-button--primary'
            ]
            for nb in next_btns:
                try:
                    b = page.locator(nb).first
                    if b.is_visible(timeout=3000):
                        b.click()
                        print("  -> Bấm Next/次へ trong media modal.")
                        time.sleep(2)
                        break
                except Exception:
                    continue
                    
        page.screenshot(path="scripts/linkedin_step5_ready_to_post.png")
        
        # Bấm Post
        print("[5/6] Tiến hành xuất bản (Click Post)...")
        post_selectors = [
            'button.share-actions__primary-action',
            'button:has-text("Post")',
            'button:has-text("投稿")',
            'button.artdeco-button--primary:has-text("Post")',
            'button.artdeco-button--primary:has-text("投稿")'
        ]
        
        posted = False
        for ps in post_selectors:
            try:
                p_btn = page.locator(ps).first
                if p_btn.is_visible(timeout=3000) and p_btn.is_enabled():
                    p_btn.click()
                    posted = True
                    print(f"  -> Clicked Post: {ps}")
                    break
            except Exception:
                continue
                
        if not posted:
            page.evaluate('''() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const postBtn = btns.find(b => (b.innerText.trim() === 'Post' || b.innerText.trim() === '投稿') && !b.disabled);
                if (postBtn) postBtn.click();
            }''')
            
        print("  -> Đang chờ LinkedIn xử lý và hiển thị lên Feed (8s)...")
        time.sleep(8)
        page.screenshot(path="scripts/linkedin_step6_published.png")
        
        # Gửi First Comment
        if comment_link:
            print("[6/6] Tự động gửi First Comment chứa liên kết...")
            try:
                # Tìm nút Comment ở post đầu tiên
                comment_btn = page.locator('button.comment-button, button:has-text("Comment"), button:has-text("コメント")').first
                if comment_btn.is_visible(timeout=5000):
                    comment_btn.click()
                    time.sleep(2)
                    
                    comment_box = page.locator('div.comments-comment-box__editor, div.ql-editor[role="textbox"], div[aria-label*="Add a comment"], div[aria-label*="コメントを追加"]').first
                    if comment_box.is_visible(timeout=5000):
                        comment_box.click()
                        time.sleep(1)
                        page.keyboard.insert_text(f"詳細な他社比較データと500万社の無料検索デモはこちらから👇\n{comment_link}")
                        time.sleep(2)
                        
                        submit_c = page.locator('button.comments-comment-box__submit-button, button:has-text("Comment"):not(.comment-button), button:has-text("コメント"):not(.comment-button)').first
                        if submit_c.is_visible(timeout=3000):
                            submit_c.click()
                            print("  -> Đã gửi First Comment thành công!")
                            time.sleep(3)
                            page.screenshot(path="scripts/linkedin_step7_commented.png")
            except Exception as e_c:
                print(f"  -> Chú thích First Comment: {e_c}")
                
        print("\n" + "=" * 65)
        print("🎉 XUẤT BẢN THÀNH CÔNG BÀI VIẾT LÊN LINKEDIN!")
        print("=" * 65)
        context.close()
        return True

if __name__ == "__main__":
    post_text = (
        "【営業DXの真実】「法人名簿は月3万〜10万円が相場」という常識、まだ信じていませんか？\n\n"
        "新規開拓やインサイドセールス（IS）チームで、最も重い固定費になりやすいのが「法人リストツールの年間契約縛り」です。\n\n"
        "■ 従来の法人名簿サービスが抱える課題：\n"
        "・月額30,000円〜100,000円の高額コスト\n"
        "・1年間の年間契約縛り（途中解約不可）\n"
        "・ダウンロード件数や閲覧上限による追加課金\n\n"
        "■ Kigyou-list（企業リスト.com）が選ばれる理由：\n"
        "✅ 月額たったの 4,980円（税込）\n"
        "✅ 年間契約の縛りなし（いつでも解約・再開可能）\n"
        "✅ 全国500万社超（国税庁公表法人100%）に無制限アクセス\n"
        "✅ ハローワーク求人・助成金受給・官公庁入札の「シグナル営業」対応\n"
        "✅ AI問い合わせフォーム自動送信（1件あたり16.1円の圧倒的費用対効果）\n\n"
        "「必要な時だけ使って、成果を最大化する」\n"
        "新しい時代のB2B営業基盤をぜひご体験ください。\n\n"
        "詳細な機能比較および500万社の検索デモは【最初のコメント欄】に掲載しています👇\n"
        "---\n"
        "#営業DX #法人リスト #インサイドセールス #新規開拓 #B2Bマーケティング #KigyouList #企業リスト"
    )
    img = r"C:\Users\admin\.gemini\antigravity-ide\brain\d9896013-af63-44e9-b2a5-b9bf802d5608\linkedin_eyecatch_art1_1791642324925.jpg"
    link = "https://kigyoulist.com/ja/compare?utm_source=linkedin&utm_medium=social&utm_campaign=launch_post"
    run_post(post_text, img, link)
