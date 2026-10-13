import os
import sys
import json
import time

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

raw_cookies = [
  {
    "domain": ".linkedin.com",
    "expirationDate": 1823414342.406387,
    "hostOnly": False,
    "httpOnly": False,
    "name": "bcookie",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "\"v=2&cbf43697-5724-4940-8891-b069727008fd\""
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1823414342.40651,
    "hostOnly": False,
    "httpOnly": True,
    "name": "bscookie",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "\"v=1&202605261251317b9f5a4a-9a93-44ed-88eb-5da18052709fAQG87tVBvCQrNgdp2FEHxAUcf-48A_KS\""
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1807002412.206358,
    "hostOnly": False,
    "httpOnly": False,
    "name": "li_gc",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "MTswOzE3OTE0NTA0MTI7MjswMjGcq65faCz9EfnxL5A1d+Ge+yiPs5SZflcI1feUtSheiw=="
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1793087943,
    "hostOnly": False,
    "httpOnly": False,
    "name": "timezone",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "Asia/Bangkok"
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1807430343,
    "hostOnly": False,
    "httpOnly": False,
    "name": "li_theme",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "light"
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1807430343,
    "hostOnly": False,
    "httpOnly": False,
    "name": "li_theme_set",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "app"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1799650053.001049,
    "hostOnly": False,
    "httpOnly": False,
    "name": "li_sugr",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "d911086c-a78e-4dbc-ba40-d689368406ef"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1799415820.246276,
    "hostOnly": False,
    "httpOnly": False,
    "name": "_guid",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "dbf094f9-ff81-4f86-b4e5-977329d34182"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1794231820.467949,
    "hostOnly": False,
    "httpOnly": False,
    "name": "AnalyticsSyncHistory",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AQLt0ttzk0uYSgAAAaEmDhsfaDi8E9huqW6nsOkz-gM1sVQlAMSTicjoH5vb7c8IbhtHsMpPHc0bLs8dls9v-w"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1823175821.554772,
    "hostOnly": False,
    "httpOnly": True,
    "name": "dfpfpt",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "5bf4fbaf90db4028ac4f957bfff04522"
  },
  {
    "domain": ".linkedin.com",
    "hostOnly": False,
    "httpOnly": False,
    "name": "AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": True,
    "storeId": "0",
    "value": "1"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1794304654,
    "hostOnly": False,
    "httpOnly": False,
    "name": "aam_uuid",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "30831334690188332363874686813298567655"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1807261697,
    "hostOnly": False,
    "httpOnly": False,
    "name": "AMCV_14215E3D5995C57C0A495C55%40AdobeOrg",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "-637568504%7CMCIDTS%7C20738%7CMCMID%7C30281987269149784633822016887861008940%7CMCAAMLH-1792314497%7C3%7CMCAAMB-1792314497%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1791716897s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C-1099127179"
  },
  {
    "domain": "www.linkedin.com",
    "expirationDate": 1823361175,
    "hostOnly": True,
    "httpOnly": False,
    "name": "li_alerts",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "e30="
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1794304653.705994,
    "hostOnly": False,
    "httpOnly": False,
    "name": "lms_ads",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AQG8yoIFMdZ-LAAAAaEqZW38yZVdzA-BOpMwm5ox8FMW2jw-BClMP9dRt4MLCwJrZFkq3nz_5_hFN88bJvJdycVk2Mgta_Wz"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1794304653.706281,
    "hostOnly": False,
    "httpOnly": False,
    "name": "lms_analytics",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AQG8yoIFMdZ-LAAAAaEqZW38yZVdzA-BOpMwm5ox8FMW2jw-BClMP9dRt4MLCwJrZFkq3nz_5_hFN88bJvJdycVk2Mgta_Wz"
  },
  {
    "domain": ".linkedin.com",
    "hostOnly": False,
    "httpOnly": True,
    "name": "fptctx2",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": True,
    "storeId": "0",
    "value": "AQFs6vByV3naFlLiwNK08KarhbLy90%252fLSvU%252fQhbipfESnAfz4ruWtC8fF3ek9Wb%252fhgAFjsCQQpwuHUTMWtdu5YPoxzjY%252f0gC5YyT%252bLSmwDlIohS35VfxBUZu4OsSd3RTw52PeCLdQMQmjOYyGz8XTQuWUZGlo9NwhgqBbxod%252fky11NQVMf%252fNp4ZLRA7t7zTPAf%252fRT26zvArBR11ZaRu5PejC0S3szMKH0nDwTDzyrofQwCSkBR6NbXY5CtWBqBKfbl6Fb4n9lKjTetMGZXZPLydV7byThxoXaKpV8JB9cFLgmCLgt1pjHqOdTrzVRKleGUaxKqdJpMs0eursgsBRf1%252f5%252fTp4K%252fGG2hURnRqRNEAuZo4Lr%252fzk3aj9cFAus1C3aP0%253d"
  },
  {
    "domain": "www.linkedin.com",
    "expirationDate": 1792470661.765797,
    "hostOnly": True,
    "httpOnly": False,
    "name": "fid",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "AQGOdg2r47ZyKQAAAaEzhzQrF6B6U2GZObM5EY5-6Ral_y32kl4KSHVEM8-zRMBqnxzHUTyOvagxjg"
  },
  {
    "domain": "www.linkedin.com",
    "expirationDate": 1807420390,
    "hostOnly": True,
    "httpOnly": False,
    "name": "g_state",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "{\"i_l\":1,\"i_t\":1791954787275,\"i_p\":1791875590558}"
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1823404493.544365,
    "hostOnly": False,
    "httpOnly": True,
    "name": "li_rm",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AQH0yn7h8JDqagAAAaEzr1w00IB96sDyL185UBFcPMTi1imhOfiYBgm8rN_0V4Rck6o4tCyGOrufYnj93wv_a0c_g85aK9llX1TlYs4l5LMB75K5tnKSNMUmfudIUvEyao_l0iGiiTO5zFUTYMY-ycB1Cexm3eeoeaxMjGgmMO5aKPwOC7IhuU3ddoFfTqfkKnDKz3dCqNaUyfA6ak-4TxGd7ykWx7De4hbx_8seHoVbxQtR3xeN5x7u3Bo7ouYHrN4hN_Sqnq7UWwiMfUma2z_vNYb_BnR2vCVF4Zk-rn1O5m8izPXlv79QJbCCcvoAoVcaOPDPxMnDPmMU4QluFQ"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1799644493.544802,
    "hostOnly": False,
    "httpOnly": False,
    "name": "liap",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "true"
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1823404493.544919,
    "hostOnly": False,
    "httpOnly": True,
    "name": "li_at",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AQEDAWWD_twBTqZnAAABoTOvW_QAAAGhV7vf9E0AM1XKyAIG9_t0d8xz1IcrQc5sd1S_mQQbnqg1jiQumAMCpc7GShDo3y8DnKSM791t3HmeM7YQHz47uSv6TIs4o5Vqa-ZUnXgcgnN5CO99w1gQEsO1"
  },
  {
    "domain": ".www.linkedin.com",
    "expirationDate": 1799644493.544976,
    "hostOnly": False,
    "httpOnly": False,
    "name": "JSESSIONID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "\"ajax:1702713995042566764\""
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1823414342.406149,
    "hostOnly": False,
    "httpOnly": False,
    "name": "sdui_ver",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "sdui-flagship:0.2.82+SduiFlagship0"
  },
  {
    "domain": ".linkedin.com",
    "hostOnly": False,
    "httpOnly": False,
    "name": "lang",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": True,
    "storeId": "0",
    "value": "v=2&lang=vi-vn"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1794460497.347379,
    "hostOnly": False,
    "httpOnly": True,
    "name": "UserMatchHistory",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AQKZRqDL8Pa0SAAAAaEzr2slXAAHC8_OBdp5_XJMFhoqhAreZRhd1HXi6HPNFsds846gogiJeSAUd05iWSjiHQsa8CmZ0fidneyVHzvBfufn8r5RoL4QLJGNPYz3PlrueCn2r8jyE06wJfWWzR288QvajIPgqKqtAA3467tdECr-b4yhB_RoiYs9GA1Lhd270jRz5jbv_QIt-dIw0yOajkjSphTgK2q8L4HZ72TikzNjfmYwO50Ey38Z5RZaLrujbhkL94rxRgeJ5RUSiXdfMcru2o4A9boNbD5atA81F38jXQKzjg-_8-IH0H5ASKmrKH--6BQUIulzNYPpA2T9hpOedd3W2JE0apJ-ISpPNMVOe9DrMw"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1791879573.518967,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__cf_bm",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "Qk0kiML1haP8XXgTSCcVmtMWylhChL0QRGCB24rvD2U-1791877772.471596-1.0.1.1-9ZYlLENcx4pjkuuw944UVbl_4Pd_rkWz8pQCPVCzzwl7ESC6U.2Szfcd9xwffpI7N2m2fiPJkGu3LbSrxnVEUqxg4TeJ8xLNib8.p3I_43aE4xFVOzc8opB87VniXjfP"
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1807429893.525318,
    "hostOnly": False,
    "httpOnly": False,
    "name": "li_mc",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "MTswOzE3OTE4Nzc4OTI7MjswMjExhh75Ky33m23TvrZYVCdHcTqBx5c0yPg6YIDP4kBE5A=="
  },
  {
    "domain": ".linkedin.com",
    "expirationDate": 1791911782.358157,
    "hostOnly": False,
    "httpOnly": False,
    "name": "lidc",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "\"b=OB76:s=O:r=O:a=O:p=O:g=3386:u=10:x=1:i=1791878345:t=1791911781:v=2:sig=AQF5yfD5avX1izGo2T3jDYTToanUo1I3\""
  }
]

def format_cookie_for_playwright(c):
    pc = {
        "name": c["name"],
        "value": c["value"],
        "path": c.get("path", "/"),
        "secure": c.get("secure", False),
        "httpOnly": c.get("httpOnly", False),
    }
    # Domain or url
    domain = c.get("domain", "")
    if domain:
        pc["domain"] = domain
    if "expirationDate" in c:
        pc["expires"] = float(c["expirationDate"])
        
    same_site = c.get("sameSite", "").lower()
    if same_site == "no_restriction":
        pc["sameSite"] = "None"
    elif same_site in ["lax", "strict"]:
        pc["sameSite"] = same_site.capitalize()
    return pc

def setup_new_profile():
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".linkedin_user_profile"))
    state_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "linkedin_auth_state.json"))
    
    formatted_cookies = [format_cookie_for_playwright(c) for c in raw_cookies]
    
    print("=" * 65)
    print("🔄 ĐANG LƯU HỒ SƠ TÀI KHOẢN LINKEDIN MỚI...")
    print(f"Thư mục lưu trữ: {profile_dir}")
    print(f"Tổng số cookies nạp vào: {len(formatted_cookies)}")
    print("=" * 65)
    
    with sync_playwright() as p:
        # Khởi chạy browser với persistent context để ghi đè vĩnh viễn
        args = ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            channel="chrome",
            headless=True,
            args=args,
            viewport={"width": 1280, "height": 900}
        )
        
        # Thêm cookies vào context
        context.add_cookies(formatted_cookies)
        
        page = context.pages[0] if context.pages else context.new_page()
        print("[*] Đang điều hướng đến https://www.linkedin.com/feed/ để kiểm tra xác thực...")
        page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
        time.sleep(5)
        
        print(f"URL hiện tại: {page.url}")
        print(f"Tiêu đề trang: {page.title()}")
        
        screenshot_path = os.path.join(os.path.dirname(__file__), "new_linkedin_profile_feed.png")
        page.screenshot(path=screenshot_path)
        print(f"[+] Đã chụp màn hình xác nhận: {screenshot_path}")
        
        # Lưu state JSON ra file dự phòng
        context.storage_state(path=state_file)
        print(f"[+] Đã lưu file state dự phòng: {state_file}")
        
        if "feed" in page.url and "login" not in page.url:
            print("\n" + "=" * 65)
            print("🎉 TÀI KHOẢN LINKEDIN MỚI ĐÃ ĐƯỢC XÁC THỰC VÀ LƯU VĨNH VIỄN THÀNH CÔNG!")
            print("=" * 65)
        else:
            print("[-] Cần kiểm tra lại: URL chưa vào được Feed.")
            
        context.close()

if __name__ == "__main__":
    setup_new_profile()
