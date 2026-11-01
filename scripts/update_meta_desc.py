# -*- coding: utf-8 -*-
import sys

def main():
    path = 'frontend/src/app/[locale]/company/[id]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    target = "    const kpiText = metaKpis.length > 0 ? `。${metaKpis.join('、')}` : '';\n\n    return `【${currentYear}年最新】${companyName}${kanaPart}（${prefectureName || '日本'}）の企業概要・信用調査。法人番号:${company.corporate_number}・インボイス:${invoiceNumber}${kpiText}。財務諸表・役員・連絡先を無料掲載中。`;"

    replacement = "    const kpiSummary = metaKpis.length > 0 ? `【${metaKpis.join(' / ')}】` : '';\n\n    return `【${currentYear}年最新】${companyName}${kanaPart}${kpiSummary}。所在地:${prefectureName || '日本'}。法人番号:${company.corporate_number}・適格請求書(インボイス)。会社概要、決算財務、役員、信用調査データを無料公開。`;"

    if target in text:
        text = text.replace(target, replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("[+] Successfully updated company meta description!")
    else:
        print("[-] Target not found!")
        sys.exit(1)

if __name__ == '__main__':
    main()
