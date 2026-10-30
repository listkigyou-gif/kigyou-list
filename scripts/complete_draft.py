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

TITLE = "【国内最大級500万社】法人DB『Kigyou-list』、求人・助成金インテントデータに対応"

SUMMARY = (
    "国内最大級500万件超の法人オープンデータを統合するB2B営業支援プラットフォーム"
    "『Kigyou-list（kigyoulist.com）』が大型アップデートを実施。"
    "ハローワーク求人データおよび政府助成金の採択シグナルを抽出可能にし、"
    "月額4,980円（税込）・契約期間縛りなしで提供を開始いたしました。"
    "初期費用ゼロで企業の新規開拓コストを最大90%削減します。"
)

BODY = """■ サービス開発・提供の背景
昨今のB2B市場において、新規顧客開拓（アウトバウンド営業）の効率化は企業の死活問題となっています。しかし、従来の法人リスト販売サービスは「年間契約縛り（30万〜100万円単位の前払い）」や「1件数十円の従量課金」が主流であり、予算の限られた中小企業やスタートアップにとって大きな参入障壁となっていました。

また、単なる社名や電話番号だけのリストでは成約率が低下しており、「今、自社サービスを必要としている企業（インテントデータ）」へのピンポイントアプローチが強く求められています。

こうした課題を解決するため、『Kigyou-list（kigyoulist.com）』は、国内最大級となる500万社以上のオープンデータを網羅し、月額4,980円（税込）・年縛りなしで利用できる次世代の法人データベースへと大型アップデートいたしました。

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
・サービス名：Kigyou-list（kigyoulist.com）
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
    
    # Go to the draft edit page directly
    print("Navigating to draft edit page...")
    page.goto("https://www.value-press.com/users/articles/382296/edit", wait_until="domcontentloaded")
    time.sleep(3)
    
    # 1. Fill title
    print("Filling Title...")
    title_inp = page.locator("#article_title")
    title_inp.fill(TITLE)
    time.sleep(1)
    print("  ✓ Title filled:", TITLE)
    
    # 2. Fill summary
    print("Filling Summary...")
    sum_inp = page.locator("#article_summary")
    sum_inp.fill(SUMMARY)
    time.sleep(1)
    print("  ✓ Summary filled")
    
    # 3. Fill body via CKEditor
    print("Filling Body text into CKEditor...")
    editor = page.locator("#ckeditor_rich_content")
    editor.click()
    time.sleep(1)
    page.keyboard.insert_text(BODY)
    time.sleep(2)
    print("  ✓ Body filled")
    
    # 4. Save draft
    print("Clicking Save Draft (下書き保存)...")
    save_btn = page.locator("a:has-text('下書き保存'), button:has-text('下書き保存')").first
    save_btn.click()
    time.sleep(4)
    print("  ✓ Draft saved!")
    
    # 5. Take screenshot
    screen_path = "c:/kigyou-list/scripts/draft_full_saved.png"
    page.screenshot(path=screen_path, full_page=True)
    print("Full page screenshot saved to:", screen_path)
    print("Current URL:", page.url)
    
    context.close()
