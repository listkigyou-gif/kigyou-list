# -*- coding: utf-8 -*-
"""
Script cập nhật Hero Section trang chủ theo Phương án 1 (Hạ tầng Dữ liệu Uy tín):
- Eyebrow: 国税庁公表データ準拠 ｜ 全国500万社の法人情報データベース
- H1: 全国500万社の企業情報を、もっと身近でオープンに。/ 信用調査から営業リスト作成まで、信頼できる一次データを。
- Subtitle: 国税庁の法人公表データや公的オープンデータを独自に統合...
- CTA Nút 2: 機能・料金プランを見る (vào /compare)
"""
import sys

def main():
    path = 'frontend/src/app/[locale]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Eyebrow
    old_eyebrow = """              <span>
                {isJa 
                  ? "国内最大級 500万社データベース × 完全自動フォーム営業" 
                  : isVi 
                  ? "Cơ sở dữ liệu 5 Triệu Doanh Nghiệp × Tự Động Hóa Gửi Form B2B" 
                  : "Japan 5M+ Company Database × Automated Form Outreach"}
              </span>"""

    new_eyebrow = """              <span>
                {isJa 
                  ? "国税庁公表データ準拠 ｜ 全国500万社の法人情報データベース" 
                  : isVi 
                  ? "Dữ liệu công bố từ Cơ quan Thuế ｜ Cơ sở dữ liệu 5 triệu pháp nhân Nhật Bản" 
                  : "National Tax Agency Data ｜ Japan 5M+ Corporate Database"}
              </span>"""

    # 2. H1
    old_h1 = """            {/* H1 Main Heading: Chuẩn SEO Exact Match cho Google & Bing */}
            <h1 id="hero-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.35] text-slate-900 dark:text-white mb-4">
              {isJa ? (
                <>
                  日本全国500万社の<span className="text-[#1B4F8A] dark:text-blue-400">企業リスト・企業データ・営業リスト</span>を、次の一手へ。<br className="hidden sm:inline" />
                  高確度ターゲティングから<span className="text-[#1B4F8A] dark:text-blue-400">自動フォーム営業</span>までワンストップ。
                </>
              ) : isVi ? (
                <>
                  Dữ liệu 5 triệu doanh nghiệp Nhật Bản cho chiến lược bán hàng B2B.<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Lọc khách hàng mục tiêu</span> đến <span className="text-[#1B4F8A] dark:text-blue-400">gửi Form tự động</span> toàn diện.
                </>
              ) : (
                <>
                  Power Your Sales Pipeline with 5M+ Japanese Companies.<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Precision Targeting</span> to <span className="text-[#1B4F8A] dark:text-blue-400">Automated Form Outreach</span>.
                </>
              )}
            </h1>"""

    new_h1 = """            {/* H1 Main Heading: Chuẩn SEO B2B Nhật Bản & Hạ tầng Dữ liệu Uy tín */}
            <h1 id="hero-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.35] text-slate-900 dark:text-white mb-4">
              {isJa ? (
                <>
                  全国500万社の企業情報を、<span className="text-[#1B4F8A] dark:text-blue-400">もっと身近でオープンに</span>。<br className="hidden sm:inline" />
                  信用調査から営業リスト作成まで、<span className="text-[#1B4F8A] dark:text-blue-400">信頼できる一次データ</span>を。
                </>
              ) : isVi ? (
                <>
                  Thông tin 5 triệu doanh nghiệp Nhật Bản, <span className="text-[#1B4F8A] dark:text-blue-400">minh bạch và toàn diện hơn</span>.<br className="hidden sm:inline" />
                  Từ <span className="text-[#1B4F8A] dark:text-blue-400">thẩm định tín dụng</span> đến <span className="text-[#1B4F8A] dark:text-blue-400">lập danh sách bán hàng</span> chuẩn xác.
                </>
              ) : (
                <>
                  Making Japan&apos;s 5M+ Company Data <span className="text-[#1B4F8A] dark:text-blue-400">Open &amp; Accessible</span>.<br className="hidden sm:inline" />
                  From <span className="text-[#1B4F8A] dark:text-blue-400">Credit Screening</span> to <span className="text-[#1B4F8A] dark:text-blue-400">Targeted Sales Prospecting</span>.
                </>
              )}
            </h1>"""

    # 3. Subtitle
    old_sub = """            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              {isJa
                ? "国税庁・法務省・公的オープンデータに直結した法人データベース。求人・助成金・入札・特許などの最新営業意図シグナルで確度の高い企業を抽出し、AIによる安全なフォーム営業自動配信で新規商談を最大化します。"
                : isVi
                ? "Cơ sở dữ liệu kết nối trực tiếp với Cơ quan Thuế và Bộ Tư pháp Nhật Bản. Trích xuất chính xác các doanh nghiệp đang tuyển dụng, nhận trợ cấp, trúng thầu công để tiếp cận chào hàng an toàn."
                : "Official government-linked database with 5 million verified companies. Target businesses with active hiring, subsidies, and public bids with automated safe outreach."}
            </p>"""

    new_sub = """            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              {isJa
                ? "国税庁の法人公表データや公的オープンデータを独自に統合。会社概要・適格請求書（インボイス）・決算推移・求人動向までを瞬時に検索・照会できます。日々の取引先調査から新規開拓のリスト作成まで、ビジネスの確かな基盤としてご活用いただけます。"
                : isVi
                ? "Tích hợp dữ liệu công khai từ Cơ quan Thuế và dữ liệu mở quốc gia Nhật Bản. Tra cứu nhanh chóng hồ sơ công ty, hóa đơn hợp lệ (Invoice), tài chính và tuyển dụng, phục vụ từ kiểm tra đối tác đến phát triển thị trường mới."
                : "Directly integrated with official National Tax Agency records and public datasets. Seamlessly lookup corporate profiles, qualified invoices, multi-year financials, and hiring signals for daily due diligence and sales prospecting."}
            </p>"""

    # 4. CTA Buttons
    old_cta = """            {/* Dual Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}/search`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>{isJa ? "企業データベースを検索する" : isVi ? "Khám phá Cơ sở dữ liệu 5M cty" : "Explore Corporate Database"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/${locale}/form-marketing`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isJa ? "自動フォーム営業の詳細を見る" : isVi ? "Tìm hiểu dịch vụ Gửi Form tự động" : "Learn About Form Outreach"}</span>
              </Link>
            </div>"""

    new_cta = """            {/* Dual Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}/search`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>{isJa ? "企業データベースを検索する" : isVi ? "Tra cứu dữ liệu 5 triệu doanh nghiệp" : "Explore Corporate Database"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/${locale}/compare`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs sm:text-sm text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <span>{isJa ? "機能・料金プランを見る" : isVi ? "Xem tính năng & Bảng giá" : "View Features & Pricing"}</span>
              </Link>
            </div>"""

    for name, old, new in [('Eyebrow', old_eyebrow, new_eyebrow), ('H1', old_h1, new_h1), ('Subtitle', old_sub, new_sub), ('CTA', old_cta, new_cta)]:
        if old in text:
            text = text.replace(old, new)
            print(f"[+] Replaced {name} successfully.")
        else:
            print(f"[-] Could not find {name} block!")
            sys.exit(1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

    print("[SUCCESS] All homepage hero texts updated successfully!")

if __name__ == '__main__':
    main()

