# -*- coding: utf-8 -*-
"""
apply_guide_integration.py
Integrates /guide and 5 articles into Header, Footer, Homepage, next.config.ts, and sitemap.ts
"""
import sys

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_crlf = '\r\n' in content
    normalized = content.replace('\r\n', '\n')
    
    for old, new in replacements:
        old_norm = old.replace('\r\n', '\n')
        new_norm = new.replace('\r\n', '\n')
        if old_norm not in normalized:
            print(f"[ERROR] Target string not found in {path}:\n{repr(old_norm[:80])}...")
            return False
        normalized = normalized.replace(old_norm, new_norm, 1)

    final_content = normalized.replace('\n', '\r\n') if original_crlf else normalized

    with open(path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"[SUCCESS] Updated {path}")
    return True

# 1. Header.tsx
header_path = "frontend/src/components/Header.tsx"
header_replacements = [
    # Desktop nav
    (
        """            <LocaleLink
              href="/pricing"
              prefetch={true}
              className={`whitespace-nowrap transition-colors py-1 ${
                isNavActive("/pricing")
                  ? "text-[#1B4F8A] dark:text-blue-400 font-bold"
                  : "text-slate-600 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400"
              }`}
            >
              {t.header.pricing}
            </LocaleLink>""",
        """            <LocaleLink
              href="/guide"
              prefetch={true}
              className={`whitespace-nowrap transition-colors py-1 ${
                isNavActive("/guide")
                  ? "text-[#1B4F8A] dark:text-blue-400 font-bold"
                  : "text-slate-600 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400"
              }`}
            >
              {locale === 'en' ? "Sales Guides" : locale === 'vi' ? "Cẩm nang B2B" : "営業ガイド"}
            </LocaleLink>

            <LocaleLink
              href="/pricing"
              prefetch={true}
              className={`whitespace-nowrap transition-colors py-1 ${
                isNavActive("/pricing")
                  ? "text-[#1B4F8A] dark:text-blue-400 font-bold"
                  : "text-slate-600 hover:text-[#1B4F8A] dark:text-slate-300 dark:hover:text-blue-400"
              }`}
            >
              {t.header.pricing}
            </LocaleLink>"""
    ),
    # Mobile drawer nav
    (
        """            <LocaleLink 
              href="/compare" 
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 py-1"
            >
              {locale === "en" ? "Service Comparison" : locale === "vi" ? "So sánh dịch vụ" : "他社サービス比較"}
            </LocaleLink>""",
        """            <LocaleLink 
              href="/guide" 
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 py-1"
            >
              {locale === "en" ? "Sales Guides" : locale === "vi" ? "Cẩm nang B2B" : "営業ガイド"}
            </LocaleLink>

            <LocaleLink 
              href="/compare" 
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-slate-700 hover:text-[#1B4F8A] dark:text-slate-300 py-1"
            >
              {locale === "en" ? "Service Comparison" : locale === "vi" ? "So sánh dịch vụ" : "他社サービス比較"}
            </LocaleLink>"""
    )
]

# 2. Footer.tsx
footer_path = "frontend/src/components/Footer.tsx"
footer_replacements = [
    (
        """              <li>
                <LocaleLink href="/tools/ai-sales-list" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>{locale === "en" ? "AI & ChatGPT Sales Lists" : locale === "vi" ? "Tạo danh sách bằng AI & ChatGPT" : "AI・ChatGPT営業リスト作成"}</span>
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-1 rounded">HOT</span>
                </LocaleLink>
              </li>""",
        """              <li>
                <LocaleLink href="/guide" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1 font-bold">
                  <span>{locale === "en" ? "B2B Sales Guides Hub" : locale === "vi" ? "Cẩm nang B2B & Bí quyết bán hàng" : "営業ノウハウ・活用ガイド一覧"}</span>
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-1 rounded">HOT</span>
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/guide/ai-sales-list" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "AI & ChatGPT Sales Lists" : locale === "vi" ? "Tạo danh sách bằng AI & ChatGPT" : "AI・ChatGPT営業リスト作成"}
                </LocaleLink>
              </li>"""
    )
]

# 3. Homepage page.tsx
home_path = "frontend/src/app/[locale]/page.tsx"
home_replacements = [
    (
        """                <Link href={`/${locale}/form-marketing`} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 hover:underline pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{isJa ? "詳細を見る" : isVi ? "Xem chi tiết" : "Learn More"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>""",
        """                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link href={`/${locale}/form-marketing`} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 hover:underline">
                    <span>{isJa ? "詳細を見る" : isVi ? "Xem chi tiết" : "Learn More"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link href={`/${locale}/guide/form-marketing-tips`} className="text-[11px] font-semibold text-slate-500 hover:text-[#1B4F8A] dark:hover:text-blue-400 inline-flex items-center gap-0.5">
                    <span>{isJa ? "返信率UPガイド ➔" : isVi ? "Bí quyết tăng phản hồi ➔" : "Outreach Tips ➔"}</span>
                  </Link>
                </div>"""
    )
]

# 4. next.config.ts
config_path = "frontend/next.config.ts"
config_replacements = [
    (
        """  async redirects() {
    return [
      {
        source: '/:locale(ja|en|vi)/blog/:path*',
        destination: '/:locale/form-marketing',
        permanent: true,
      },
      {
        source: '/:locale(ja|en|vi)/blog',
        destination: '/:locale/form-marketing',
        permanent: true,
      },
    ];
  },""",
        """  async redirects() {
    return [
      {
        source: '/:locale(ja|en|vi)/tools/ai-sales-list',
        destination: '/:locale/guide/ai-sales-list',
        permanent: true,
      },
      {
        source: '/tools/ai-sales-list',
        destination: '/ja/guide/ai-sales-list',
        permanent: true,
      },
      {
        source: '/:locale(ja|en|vi)/blog/:path*',
        destination: '/:locale/guide',
        permanent: true,
      },
      {
        source: '/:locale(ja|en|vi)/blog',
        destination: '/:locale/guide',
        permanent: true,
      },
    ];
  },"""
    )
]

# 5. sitemap.ts
sitemap_path = "frontend/src/app/sitemap.ts"
sitemap_replacements = [
    (
        """      corePages.push({
        url: `${baseUrl}/${loc}/tools/ai-sales-list`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.95,
      });""",
        """      corePages.push({
        url: `${baseUrl}/${loc}/guide`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/guide/ai-sales-list`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.95,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/guide/excel-sales-list-template`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.90,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/guide/form-marketing-tips`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.90,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/guide/bankruptcy-signs-check`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.90,
      });
      corePages.push({
        url: `${baseUrl}/${loc}/guide/edinet-salary-ranking-utilization`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.90,
      });"""
    )
]

success = True
success &= update_file(header_path, header_replacements)
success &= update_file(footer_path, footer_replacements)
success &= update_file(home_path, home_replacements)
success &= update_file(config_path, config_replacements)
success &= update_file(sitemap_path, sitemap_replacements)

if not success:
    print("[ERROR] One or more replacements failed.")
    sys.exit(1)
else:
    print("[ALL DONE] All 5 files updated successfully!")
