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
    page.goto("https://www.value-press.com/users/free_course_articles/382297/confirm", wait_until="domcontentloaded")
    time.sleep(3)
    
    print("Loaded confirm page:", page.url)
    
    # 1. Tìm element '次へ進む'
    next_btns = page.locator("a:has-text('次へ進む'), button:has-text('次へ進む'), div:has-text('次へ進む')")
    print("Found '次へ進む' count:", next_btns.count())
    for i in range(next_btns.count()):
        el = next_btns.nth(i)
        txt = el.inner_text().strip()
        print(f"[{i}] tag: {el.evaluate('e => e.tagName')} class: {el.evaluate('e => e.className')} text: {txt}")
        if txt == "次へ進む":
            print(f"Clicking next_btn [{i}]...")
            el.click()
            time.sleep(2)
            break
            
    # 2. Kiểm tra lại trạng thái của nút '#apply-confirm'
    btn_info = page.evaluate("""() => {
        const btn = document.querySelector('#apply-confirm');
        if (!btn) return { exists: false };
        return {
            exists: true,
            disabled: btn.disabled,
            className: btn.className,
            text: btn.innerText,
            offsetParent: btn.offsetParent !== null
        };
    }""")
    print("Button #apply-confirm status after closing popup:", btn_info)
    
    # 3. Nếu còn disabled, kiểm tra xem có checkbox hay điều kiện gì không
    if btn_info.get('disabled'):
        checkboxes = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]')).map(c => ({
                id: c.id,
                name: c.name,
                checked: c.checked,
                visible: c.offsetWidth > 0
            }));
        }""")
        print("Checkboxes on confirm page:", checkboxes)
        
        # Kiểm tra event listeners hoặc thuộc tính kích hoạt của #apply-confirm
        # Có thể người dùng phải scroll xuống cuối trang để enable?
        print("Scrolling to bottom...")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        btn_info_after_scroll = page.evaluate("""() => {
            const btn = document.querySelector('#apply-confirm');
            return btn ? { disabled: btn.disabled } : null;
        }""")
        print("After scroll #apply-confirm status:", btn_info_after_scroll)

    # 4. Nếu enable, tiến hành click!
    apply_btn = page.locator("#apply-confirm")
    if apply_btn.count() > 0 and not page.evaluate("() => document.querySelector('#apply-confirm').disabled"):
        print("Clicking #apply-confirm to finalize reservation!")
        apply_btn.click()
        time.sleep(5)
        print("After click URL:", page.url)
        page.screenshot(path="c:/kigyou-list/scripts/submitted_result.png", full_page=True)
    else:
        print("Checking force click or javascript trigger if allowed...")
        page.screenshot(path="c:/kigyou-list/scripts/confirm_after_next.png", full_page=True)

    context.close()
