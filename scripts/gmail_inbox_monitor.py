import sys
import os
import imaplib
import email
from email.header import decode_header
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

GMAIL_USER = os.getenv("GMAIL_MONITOR_USER", "listkigyou@gmail.com")
GMAIL_APP_PASS = os.getenv("GMAIL_MONITOR_APP_PASSWORD", "dxnrmdtrdjhnwmsk")

def parse_header_str(header_val):
    if not header_val:
        return ""
    try:
        decoded_fragments = decode_header(header_val)
    except Exception:
        return str(header_val)
    parts = []
    for fragment, encoding in decoded_fragments:
        if isinstance(fragment, bytes):
            enc = encoding
            if not enc or enc.lower() in ("unknown-8bit", "x-unknown"):
                enc = "utf-8"
            try:
                parts.append(fragment.decode(enc, errors="ignore"))
            except Exception:
                parts.append(fragment.decode("utf-8", errors="ignore"))
        else:
            parts.append(str(fragment))
    return "".join(parts)

def get_body(msg):
    try:
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    charset = part.get_content_charset() or "utf-8"
                    return part.get_payload(decode=True).decode(charset, errors="ignore")
        else:
            charset = msg.get_content_charset() or "utf-8"
            return msg.get_payload(decode=True).decode(charset, errors="ignore")
    except Exception:
        pass
    return ""

def scan_mailbox(search_keywords=["PRESSNOW", "pressnow", "プレスナウ", "prform", "free-pressrelease", "zero-press", "pr-free"], check_folders=["INBOX", "[Gmail]/Spam"]):
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_USER, GMAIL_APP_PASS)
        print("=" * 70)
        print(f"📬 ĐÃ KẾT NỐI HỘP THƯ GMAIL: {GMAIL_USER}")
        print("=" * 70)

        found_target = []

        for folder in check_folders:
            status, _ = mail.select(f'"{folder}"')
            if status != "OK":
                continue
            
            _, messages = mail.search(None, "ALL")
            if not messages or not messages[0]:
                continue
            
            msg_ids = messages[0].split()
            scan_ids = msg_ids[-30:]
            
            for mid in reversed(scan_ids):
                try:
                    res, data = mail.fetch(mid, "(RFC822)")
                    if res != "OK":
                        continue
                    msg = email.message_from_bytes(data[0][1])
                    subject = parse_header_str(msg.get("Subject", ""))
                    from_sender = parse_header_str(msg.get("From", ""))
                    to_rcpt = parse_header_str(msg.get("To", ""))
                    date_str = msg.get("Date", "")

                    for kw in search_keywords:
                        if kw.lower() in subject.lower() or kw.lower() in from_sender.lower():
                            body = get_body(msg)
                            found_target.append({
                                "folder": folder,
                                "id": mid.decode(),
                                "date": date_str,
                                "from": from_sender,
                                "to": to_rcpt,
                                "subject": subject,
                                "body": body
                            })
                            break
                except Exception as ex:
                    continue

        if found_target:
            print(f"🎉 TÌM THẤY {len(found_target)} EMAIL TỪ CÁC CỔNG BÁO CHÍ:")
            print("=" * 70)
            for item in found_target:
                print(f"📁 Thư mục   : {item['folder']}")
                print(f"📌 Tiêu đề   : {item['subject']}")
                print(f"🕒 Ngày gửi  : {item['date']}")
                print(f"👤 Người gửi : {item['from']}")
                print(f"📝 Nội dung:\n{item['body'].strip()[:800]}\n...")
                print("-" * 70)
        else:
            print("⏳ Hiện tại chưa có email phản hồi mới từ PRESSNOW trong INBOX hoặc SPAM.")
            print("👉 Ban biên tập PRESSNOW sẽ xem xét và phản hồi trong giờ làm việc (9:00 - 18:00 Nhật Bản).")

        mail.logout()
        return found_target
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return []

if __name__ == "__main__":
    scan_mailbox()
