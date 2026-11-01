# -*- coding: utf-8 -*-
"""
Cập nhật H1 trang chủ theo Lựa chọn A (Semantic Word Chunking + Ngắt dòng chủ động):
- Dòng 1: 全国500万社の企業情報を、もっと身近でオープンに。
- Dòng 2: 信用調査から営業リスト作成まで、
- Dòng 3 (Visual Anchor): 信頼できる一次データを。 (màu xanh thương hiệu #1B4F8A)
- Bọc từng cụm từ vào inline-block để chống tuyệt đối lỗi gãy đôi từ (泣き別れ) trên mobile.
"""
import sys

def main():
    path = 'frontend/src/app/[locale]/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    target = """            {/* H1 Main Heading: Chuẩn SEO B2B Nhật Bản & Hạ tầng Dữ liệu Uy tín */}
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

    replacement = """            {/* H1 Main Heading: Chuẩn SEO B2B Nhật Bản & Hạ tầng Dữ liệu Uy tín (Semantic Word Chunking) */}
            <h1 id="hero-heading" className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-bold tracking-tight leading-[1.4] text-slate-900 dark:text-white mb-4">
              {isJa ? (
                <>
                  <span className="block mb-1 sm:mb-1.5">
                    <span className="inline-block">全国500万社の企業情報を、</span>
                    <span className="inline-block">もっと身近でオープンに。</span>
                  </span>
                  <span className="block">
                    <span className="inline-block">信用調査から営業リスト作成まで、</span>
                    <br className="hidden sm:inline" />
                    <span className="inline-block text-[#1B4F8A] dark:text-blue-400 font-extrabold">
                      信頼できる一次データを。
                    </span>
                  </span>
                </>
              ) : isVi ? (
                <>
                  <span className="block mb-1 sm:mb-1.5">
                    <span className="inline-block">Thông tin 5 triệu doanh nghiệp Nhật Bản,</span>{" "}
                    <span className="inline-block text-[#1B4F8A] dark:text-blue-400">minh bạch và toàn diện hơn</span>.
                  </span>
                  <span className="block">
                    <span className="inline-block">Từ thẩm định tín dụng đến lập danh sách bán hàng chuẩn xác.</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="block mb-1 sm:mb-1.5">
                    <span className="inline-block">Making Japan&apos;s 5M+ Company Data</span>{" "}
                    <span className="inline-block text-[#1B4F8A] dark:text-blue-400">Open &amp; Accessible</span>.
                  </span>
                  <span className="block">
                    <span className="inline-block">From Credit Screening to Targeted Sales Prospecting.</span>
                  </span>
                </>
              )}
            </h1>"""

    if target in text:
        text = text.replace(target, replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print("[+] Successfully updated H1 with semantic chunking!")
    else:
        print("[-] Target H1 block not found in page.tsx!")
        sys.exit(1)

if __name__ == '__main__':
    main()
