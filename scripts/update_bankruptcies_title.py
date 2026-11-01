# -*- coding: utf-8 -*-
import sys

def main():
    path = 'frontend/src/app/[locale]/status/bankruptcies/[[...slug]]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    target = """  const title = isVi
    ? `Danh sách doanh nghiệp phá sản, giải thể, thanh lý tại ${prefLabel} 【${ymLabel}】 | Kigyou-list`
    : isEn
    ? `List of Bankruptcies, Dissolved & Liquidated Companies in ${prefLabel} [${ymLabel}] | Kigyou-list`
    : `${prefLabel}の倒産・解散・清算結了企業一覧【${ymLabel}】 | Kigyou-list`;

  const description = isVi
    ? `Cơ sở dữ liệu thông tin đăng ký thay đổi doanh nghiệp: giải thể, phá sản, hoàn tất thanh lý tại ${prefLabel}. Tra cứu mã số doanh nghiệp, tên công ty, địa chỉ và ngày giải thể phục vụ quản trị rủi ro tín dụng.`
    : isEn
    ? `Database of corporate bankruptcies, dissolutions, and liquidations registered in ${prefLabel}. Complete coverage of corporate numbers, trade names, locations, and dissolution dates for credit risk screening.`
    : `${prefLabel}における企業の解散、清算結了、閉鎖等の異動登記速報データベースです。法人番号、商号、所在地、事由発生年月日を網羅。与信管理、債権回収、取引先リスク審査に最適。`;"""

    replacement = """  const title = isVi
    ? `【${ymLabel}】Danh sách doanh nghiệp phá sản, giải thể tại ${prefLabel} 【Điều tra tín dụng・Báo cáo nợ xấu】 | Kigyou-list`
    : isEn
    ? `[${ymLabel}] Corporate Bankruptcies & Dissolutions in ${prefLabel} | Credit Risk Intelligence | Kigyou-list`
    : `【${ymLabel}】${prefLabel}の倒産・破産・解散企業一覧【信用調査・倒産速報】 | Kigyou-list`;

  const description = isVi
    ? `【${currentYear} mới nhất】Cơ sở dữ liệu thông tin thay đổi doanh nghiệp: giải thể, phá sản, hoàn tất thanh lý tại ${prefLabel}. Tra cứu mã số pháp nhân, tên công ty, địa chỉ và ngày giải thể phục vụ quản trị rủi ro tín dụng và phòng ngừa nợ xấu.`
    : isEn
    ? `[${currentYear} Latest] Database of corporate bankruptcies, dissolutions, and liquidations registered in ${prefLabel}. Complete coverage of corporate numbers, trade names, addresses, and dissolution dates for credit risk assessment.`
    : `【${currentYear}年最新】${prefLabel}における企業の倒産・破産・解散・清算結了等の異動登記速報データベースです。法人番号、商号、所在地、事由発生年月日を網羅。与信管理、債権回収、取引先信用リスク審査に最適。`;"""

    if target in text:
        text = text.replace(target, replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("[+] Successfully updated bankruptcies title & description!")
    else:
        print("[-] Target not found in bankruptcies page!")
        sys.exit(1)

if __name__ == '__main__':
    main()
