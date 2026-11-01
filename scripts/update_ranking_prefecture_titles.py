# -*- coding: utf-8 -*-
"""
Cập nhật Dynamic Title & Description theo Tỉnh Thành cho 3 trang Xếp Hạng:
- /ranking/salary
- /ranking/tenure
- /ranking/employees
"""
import sys

def update_salary():
    path = 'frontend/src/app/[locale]/ranking/salary/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Add PREFECTURES and getPrefectureLabel imports
    if 'import { PREFECTURES, getPrefectureLabel }' not in text:
        text = text.replace(
            'import { getCorporateRankings, CorporateRankingItem } from "@/lib/db";',
            'import { getCorporateRankings, CorporateRankingItem } from "@/lib/db";\nimport { PREFECTURES, getPrefectureLabel } from "@/lib/hubUtils";'
        )

    old_meta = """  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();

  const title = locale === "en"
    ? `Top Japanese Companies by Salary (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Thu Nhập Cao Nhất Nhật Bản (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国企業の平均年間給与ランキングTOP50 | Kigyou-list`;

  const description = locale === "en"
    ? `Official ranking of Japanese corporations by average annual salary based on audited securities reports filed with the Financial Services Agency (FSA). Export full lists with corporate numbers and contacts.`
    : locale === "vi"
    ? `Bảng xếp hạng thu nhập bình quân năm của các tập đoàn hàng đầu Nhật Bản trích xuất từ Báo cáo tài chính FSA EDINET có kiểm toán. Cho phép tải danh sách CSV có số điện thoại và ban giám đốc.`
    : `金融庁EDINET開示の有価証券報告書に基づく全国企業の平均年間給与ランキングTOP50。役員名、公式電話番号、被保険者数、所在地を含む法人リストのCSV一括ダウンロードに対応。`;"""

    new_meta = """  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();
  const prefCode = resolvedSearch.prefecture;
  const prefMeta = prefCode ? (PREFECTURES.find((p) => p.code === prefCode) || null) : null;
  const prefLabel = getPrefectureLabel(prefMeta, locale);
  const isTargetPref = Boolean(prefMeta);

  const title = locale === "en"
    ? `${isTargetPref ? prefLabel + ': ' : ''}Top Companies by Salary (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Thu Nhập Cao Nhất tại ${prefLabel} (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】${prefLabel}${isTargetPref ? '' : '企業'}の平均年間給与ランキングTOP50 | Kigyou-list`;

  const description = locale === "en"
    ? `Official ranking of corporations in ${prefLabel} by average annual salary based on audited securities reports filed with the Financial Services Agency (FSA). Export full lists with corporate numbers and contacts.`
    : locale === "vi"
    ? `Bảng xếp hạng thu nhập bình quân năm của các tập đoàn hàng đầu tại ${prefLabel} trích xuất từ Báo cáo tài chính FSA EDINET có kiểm toán. Cho phép tải danh sách CSV có số điện thoại và ban giám đốc.`
    : `金融庁EDINET開示の有価証券報告書に基づく${prefLabel}${isTargetPref ? '' : '企業'}の平均年間給与ランキングTOP50。役員名、公式電話番号、被保険者数、所在地を含む法人リストのCSV一括ダウンロードに対応。`;"""

    if old_meta in text:
        text = text.replace(old_meta, new_meta)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("[+] Successfully updated salary ranking meta!")
    else:
        print("[-] Old meta block not found in salary ranking page!")
        sys.exit(1)

def update_tenure():
    path = 'frontend/src/app/[locale]/ranking/tenure/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    if 'import { PREFECTURES, getPrefectureLabel }' not in text:
        text = text.replace(
            'import { getCorporateRankings } from "@/lib/db";',
            'import { getCorporateRankings } from "@/lib/db";\nimport { PREFECTURES, getPrefectureLabel } from "@/lib/hubUtils";'
        )

    old_meta = """  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();

  const title = locale === "en"
    ? `Top White Companies by Service Tenure (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Thâm Niên Cao Nhất Nhật Bản (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国ホワイト企業・平均勤続年数TOP100 | Kigyou-list`;

  const description = locale === "en"
    ? `Official ranking of Japanese corporations by average tenure of regular employees published by the Ministry of Health, Labour and Welfare (MHLW). Discover companies with high retention and worker satisfaction.`
    : locale === "vi"
    ? `Bảng xếp hạng các doanh nghiệp uy tín (White Company) có thời gian gắn bó và thâm niên nhân viên cao nhất Nhật Bản công bố bởi Bộ Y tế, Lao động & Phúc lợi (MHLW). Xuất danh sách CSV đầy đủ.`
    : `厚生労働省「職場情報総合サイト」公表データに基づく全国ホワイト企業・正社員平均勤続年数ランキングTOP100。高い定着率と安定雇用を誇る優良法人の電話番号、役員名、被保険者数を含むCSV出力に対応。`;"""

    new_meta = """  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();
  const prefCode = resolvedSearch.prefecture;
  const prefMeta = prefCode ? (PREFECTURES.find((p) => p.code === prefCode) || null) : null;
  const prefLabel = getPrefectureLabel(prefMeta, locale);
  const isTargetPref = Boolean(prefMeta);

  const title = locale === "en"
    ? `${isTargetPref ? prefLabel + ': ' : ''}Top White Companies by Service Tenure (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Thâm Niên Cao Nhất tại ${prefLabel} (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】${prefLabel}ホワイト企業・平均勤続年数TOP100 | Kigyou-list`;

  const description = locale === "en"
    ? `Official ranking of corporations in ${prefLabel} by average tenure of regular employees published by the Ministry of Health, Labour and Welfare (MHLW). Discover companies with high retention and worker satisfaction.`
    : locale === "vi"
    ? `Bảng xếp hạng các doanh nghiệp uy tín (White Company) có thời gian gắn bó và thâm niên nhân viên cao nhất tại ${prefLabel} công bố bởi Bộ Y tế, Lao động & Phúc lợi (MHLW). Xuất danh sách CSV đầy đủ.`
    : `厚生労働省「職場情報総合サイト」公表データに基づく${prefLabel}ホワイト企業・正社員平均勤続年数ランキングTOP100。高い定着率と安定雇用を誇る優良法人の電話番号、役員名、被保険者数を含むCSV出力に対応。`;"""

    if old_meta in text:
        text = text.replace(old_meta, new_meta)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("[+] Successfully updated tenure ranking meta!")
    else:
        print("[-] Old meta block not found in tenure ranking page!")
        sys.exit(1)

def update_employees():
    path = 'frontend/src/app/[locale]/ranking/employees/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    if 'import { PREFECTURES, getPrefectureLabel }' not in text:
        text = text.replace(
            'import { getCorporateRankings } from "@/lib/db";',
            'import { getCorporateRankings } from "@/lib/db";\nimport { PREFECTURES, getPrefectureLabel } from "@/lib/hubUtils";'
        )

    old_meta = """  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();

  const title = locale === "en"
    ? `Top Japanese Corporations by Employees (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Quy Mô Nhân Sự Lớn Nhất (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】全国企業の厚生年金被保険者数TOP100 | Kigyou-list`;

  const description = locale === "en"
    ? `Official corporate size ranking based on the verified number of insured regular employees published by the Japan Pension Service. Screen large enterprises, corporate groups, and subsidiaries with CSV export.`
    : locale === "vi"
    ? `Bảng xếp hạng quy mô doanh nghiệp Nhật Bản theo số lượng nhân sự tham gia Bảo hiểm Phúc lợi 厚生年金 từ Cơ quan Hưu trí Nhật Bản. Xuất danh sách CSV gồm ban lãnh đạo và số điện thoại.`
    : `日本年金機構（厚生年金適用事業所公表情報）に基づく全国企業の厚生年金被保険者数ランキングTOP100。実質的な正規雇用規模を正確に把握できる法人リストのCSV一括ダウンロードに対応。`;"""

    new_meta = """  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "ja";
  const currentYear = new Date().getFullYear();
  const prefCode = resolvedSearch.prefecture;
  const prefMeta = prefCode ? (PREFECTURES.find((p) => p.code === prefCode) || null) : null;
  const prefLabel = getPrefectureLabel(prefMeta, locale);
  const isTargetPref = Boolean(prefMeta);

  const title = locale === "en"
    ? `${isTargetPref ? prefLabel + ': ' : ''}Top Corporations by Employees (${currentYear}) | Kigyou-list`
    : locale === "vi"
    ? `Top Doanh Nghiệp Quy Mô Nhân Sự Lớn Nhất tại ${prefLabel} (${currentYear}) | Kigyou-list`
    : `【${currentYear}年最新】${prefLabel}${isTargetPref ? '' : '企業'}の厚生年金被保険者数TOP100 | Kigyou-list`;

  const description = locale === "en"
    ? `Official corporate size ranking based on the verified number of insured regular employees in ${prefLabel} published by the Japan Pension Service. Screen large enterprises, corporate groups, and subsidiaries with CSV export.`
    : locale === "vi"
    ? `Bảng xếp hạng quy mô doanh nghiệp tại ${prefLabel} theo số lượng nhân sự tham gia Bảo hiểm Phúc lợi 厚生年金 từ Cơ quan Hưu trí Nhật Bản. Xuất danh sách CSV gồm ban lãnh đạo và số điện thoại.`
    : `日本年金機構（厚生年金適用事業所公表情報）に基づく${prefLabel}${isTargetPref ? '' : '企業'}の厚生年金被保険者数ランキングTOP100。実質的な正規雇用規模を正確に把握できる法人リストのCSV一括ダウンロードに対応。`;"""

    if old_meta in text:
        text = text.replace(old_meta, new_meta)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("[+] Successfully updated employees ranking meta!")
    else:
        print("[-] Old meta block not found in employees ranking page!")
        sys.exit(1)

if __name__ == '__main__':
    update_salary()
    update_tenure()
    update_employees()
