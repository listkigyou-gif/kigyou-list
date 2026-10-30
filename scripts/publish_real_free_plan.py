import os
import sys
import time

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".valuepress_user_profile"))
eyecatch_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "press_releases", "eyecatch_01.jpg"))

TITLE = "【国内最大級500万社】法人DB『Kigyou-list』、求人・助成金インテントデータに対応"

SUMMARY = (
    "国内最大級500万件超の法人オープンデータを統合するB2B営業支援プラットフォーム"
    "『Kigyou-list（kigyoulist.com）』が大型アップデートを実施。"
    "ハローワーク求人データおよび政府助成金の採択シグナルを抽出可能にし、"
    "月額4,980円（税込）・契約期間縛りなしで提供を開始いたしました。"
    "初期費用ゼロで企業の新規開拓コストを最大90%削減します。"
)

BODY_HTML = """
<p>■ サービス開発・提供の背景</p>
<p>昨今のB2B市場において、新規顧客開拓（アウトバウンド営業）の効率化は企業の死活問題となっています。しかし、従来の法人リスト販売サービスは「年間契約縛り（30万〜100万円単位の前払い）」や「1件数十円の従量課金」が主流であり、予算の限られた中小企業やスタートアップにとって大きな参入障壁となっていました。</p>
<p>また、単なる社名や電話番号だけのリストでは成約率が低下しており、「今、自社サービスを必要としている企業（インテントデータ）」へのピンポイントアプローチが強く求められています。</p>
<p>こうした課題を解決するため、『Kigyou-list（kigyoulist.com）』は、国内最大級となる500万社以上のオープンデータを網羅し、月額4,980円（税込）・年縛りなしで利用できる次世代の法人データベースへと大型アップデートいたしました。</p>
<br>
<p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p>■ 『Kigyou-list』の3つの革新的な特徴</p>
<p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p>1. 国内最大級500万社を網羅するデータ鮮度と信頼性<br>
国税庁法人番号公表サイト、経済産業省gBizINFO、官公庁オープンデータを独自技術で名寄せ・リアルタイム統合。最新の企業活動状況を反映した高精度な法人リストを提供します。</p>
<p>2. 求人・助成金シグナルを捉える「インテントデータ」機能<br>
ハローワークの最新求人募集情報や、政府・自治体の助成金・補助金採択情報を解析。「事業拡大フェーズにある企業」や「資金調達に成功した企業」など、今まさに購買意欲が高い見込み客を素早く特定できます。</p>
<p>3. 圧倒的なコストパフォーマンス（月額4,980円・縛りなし）<br>
初期費用ゼロ、年間契約縛りなし、月額4,980円（税込）の定額制を採用。いつでも解約可能なオープンな料金設計により、営業DXの民主化を実現します。</p>
<br>
<p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p>■ サービス概要</p>
<p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p>・サービス名：Kigyou-list（kigyoulist.com）<br>
・サービス公式サイト：https://kigyoulist.com/?utm_source=valuepress&utm_medium=pr<br>
・料金プラン・他社比較：https://kigyoulist.com/ja/compare?utm_source=valuepress&utm_medium=pr<br>
・無料検索デモ：https://kigyoulist.com/ja/search?utm_source=valuepress&utm_medium=pr<br>
・利用料金：月額 4,980円（税込）<br>
・初期費用：0円（年間契約縛りなし、即日利用開始可能）</p>
<br>
<p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p>■ 今後の展望</p>
<p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
<p>『Kigyou-list』は今後、問い合わせフォーム自動アプローチ基盤（フォームマーケティング機能）や、生成AIを活用した見込み客自動スコアリング機能の拡充を予定しております。日本全国の中小企業・営業組織の新規開拓コストを削減し、営業生産性の最大化を支援してまいります。</p>
"""

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
    
    # 1. Go to Free Plan URL
    print("Navigating to Free Plan editor (users/free_course_articles/new)...")
    page.goto("https://www.value-press.com/users/free_course_articles/new", wait_until="domcontentloaded")
    time.sleep(3)
    
    skip_btn = page.locator("button:has-text('スキップ'), a:has-text('スキップ')")
    if skip_btn.count() > 0:
        skip_btn.first.click()
        time.sleep(1)
        
    # 2. Upload banner with kigyoulist.com
    print("Uploading banner with kigyoulist.com branding...")
    file_input = page.locator("input[type='file'].slider, input[type='file']").first
    file_input.set_input_files(eyecatch_path)
    time.sleep(6)
    
    insert_btn = page.locator("div.vue-cropper-applybtn")
    if insert_btn.count() > 0:
        insert_btn.first.click()
        time.sleep(4)
        print("  ✓ Banner inserted successfully!")
        
    # 3. Fill Title & Summary
    print("Filling Title & Summary...")
    page.locator("#article_title").fill(TITLE)
    page.locator("#article_summary").fill(SUMMARY)
    time.sleep(1)
    print("  ✓ Title & Summary filled")
    
    # 4. Fill Body into CKEditor
    print("Filling Body text into CKEditor...")
    page.evaluate("""(html) => {
        const el = document.querySelector('#ckeditor_rich_content');
        if (el && el.ckeditorInstance) {
            el.ckeditorInstance.setData(html);
        }
    }""", BODY_HTML)
    time.sleep(2)
    print("  ✓ Body text filled")
    
    # 5. Save Draft
    print("Saving draft...")
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
    print("  ✓ Free Plan draft saved! Article URL:", page.url)
    
    # 6. Proceed to Step 2
    print("Clicking '配信先、日時を設定する' (Proceed to Step 2)...")
    page.locator("a:has-text('配信先、日時を設定する'), button:has-text('配信先、日時を設定する')").first.click()
    time.sleep(4)
    
    # 7. Step 2 configuration
    print("Configuring Step 2 settings...")
    page.locator("#exaggerated_expression_confirmation_status_not_applicable").click()
    time.sleep(1)
    page.locator("#unpublished_url_flg_id_not_included").click()
    time.sleep(1)
    
    page.select_option("select#article_genre_id", value="2") # ネットサービス
    time.sleep(1)
    page.select_option("select#article_category_id", value="2") # サービス
    time.sleep(1)
    print("  ✓ Step 2 configured successfully!")
    
    # 8. Proceed to Step 3 Confirmation
    print("Clicking '配信内容を確認する' (Proceed to Step 3 Confirmation)...")
    page.locator("a:has-text('配信内容を確認する'), button:has-text('配信内容を確認する')").first.click()
    time.sleep(5)
    
    print("Step 3 URL:", page.url)
    screen_path = "c:/kigyou-list/scripts/real_free_step3_review.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Real Free Plan Step 3 screenshot saved to:", screen_path)
    
    context.close()
