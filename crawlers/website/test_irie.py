import re

def to_half_width(text):
    if not text:
        return ""
    text = str(text)
    zenkaku = "０１２３４５６７８９－ー（）＠．，"
    hankaku = "0123456789--()@.,"
    trans_table = str.maketrans(zenkaku, hankaku)
    text = text.translate(trans_table)
    return text.strip()

# Sample text from http://irie-kanagata.jp/company
sample_text = """
ホーム会社案内業務内容製品求人情報お問い合わせ有限会社 入江金型工業所〒444-0951愛知県岡崎市北野町字畔北82-2北野桝塚駅から約徒歩5分伊勢湾岸自動車道豊田東ICから約車10分0564-34-3878※営業電話はお断りしております0564-34-3877Copyright  2026 有限会社入江金型工業所
"""

def parse_page_text_optimized(text: str) -> dict:
    text = to_half_width(text)
    
    data = {
        "phone_number": "",
        "fax_number": "",
        "email_address": "",
        "capital_amount": "",
        "employee_count": "",
        "representative_name": "",
        "business_summary": ""
    }
    
    # Prefix-based regex
    PHONE_PATTERN = re.compile(
        r'(?:TEL|Tel|電話番号|電話|ＴＥＬ)\s*[：:・\.]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})',
        re.IGNORECASE
    )
    FAX_PATTERN = re.compile(
        r'(?:Fax|FAX|ファックス|F\.?A\.?X\.?)\s*[：:・\.]?[ 　]*(0\d{1,4}[-－]?\d{1,4}[-－]?\d{4})',
        re.IGNORECASE
    )
    
    phone_match = PHONE_PATTERN.search(text)
    if phone_match:
        data["phone_number"] = phone_match.group(1)
        
    fax_match = FAX_PATTERN.search(text)
    if fax_match:
        data["fax_number"] = fax_match.group(1)
        
    # Fallback: Find general phone/fax numbers if not extracted yet
    all_numbers = []
    # Find all phone-like patterns
    for m in re.finditer(r'(0\d{1,4}[-－]\d{1,4}[-－]\d{4})', text):
        num = m.group(1)
        start_pos = max(0, m.start() - 30)
        context_text = text[start_pos:m.start()].lower()
        
        is_fax = any(k in context_text for k in ["fax", "ファックス", "ｆａｘ", "📠"])
        all_numbers.append((num, is_fax))
        
    # Assign based on context
    if not data["phone_number"]:
        # Find first non-fax number
        for num, is_fax in all_numbers:
            if not is_fax:
                data["phone_number"] = num
                break
        # Fallback to first number if still empty
        if not data["phone_number"] and all_numbers:
            data["phone_number"] = all_numbers[0][0]
            
    if not data["fax_number"]:
        # Find first fax-labeled number
        for num, is_fax in all_numbers:
            if is_fax:
                data["fax_number"] = num
                break
        # Fallback: if we have multiple numbers, assign the second one to fax if fax is empty and it's different
        if not data["fax_number"] and len(all_numbers) > 1:
            for num, is_fax in all_numbers:
                if num != data["phone_number"]:
                    data["fax_number"] = num
                    break
                    
    return data

res = parse_page_text_optimized(sample_text)
print("Parsed result:")
print(f"  Phone: {res['phone_number']}")
print(f"  Fax:   {res['fax_number']}")
