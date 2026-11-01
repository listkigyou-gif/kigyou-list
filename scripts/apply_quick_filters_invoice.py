# -*- coding: utf-8 -*-
"""
apply_quick_filters_invoice.py
Applies Lựa chọn 2: 5 quick filter chips with invoice filter across frontend and backend.
"""
import sys

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_crlf = '\r\n' in content
    # Work with normalized LF for safe replacement
    normalized = content.replace('\r\n', '\n')
    
    for old, new in replacements:
        old_norm = old.replace('\r\n', '\n')
        new_norm = new.replace('\r\n', '\n')
        if old_norm not in normalized:
            print(f"[ERROR] Target string not found in {path}:\n{repr(old_norm[:80])}...")
            return False
        normalized = normalized.replace(old_norm, new_norm, 1)

    if original_crlf:
        final_content = normalized.replace('\n', '\r\n')
    else:
        final_content = normalized

    with open(path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"[SUCCESS] Updated {path}")
    return True

# 1. frontend/src/lib/db.ts
db_path = "frontend/src/lib/db.ts"
db_replacements = [
    (
        """  has_bidding?: boolean;
  has_award?: boolean;""",
        """  has_bidding?: boolean;
  has_invoice?: boolean;
  has_award?: boolean;"""
    ),
    (
        """  if (filters.has_patent) {
    whereClauses.push(isPG
      ? "c.has_patent = true"
      : "c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '特許')");
  }
  if (filters.has_financials) {""",
        """  if (filters.has_patent) {
    whereClauses.push(isPG
      ? "c.has_patent = true"
      : "c.corporate_number IN (SELECT bs.corporate_number FROM business_signals bs WHERE bs.signal_type = '特許')");
  }
  if (filters.has_invoice) {
    whereClauses.push(isPG ? "c.has_invoice = true" : "c.has_invoice = 1");
  }
  if (filters.has_financials) {"""
    )
]

# 2. frontend/src/app/api/search/route.ts
route_path = "frontend/src/app/api/search/route.ts"
route_replacements = [
    (
        """    if (searchParams.get("bidding") === "true") filters.has_bidding = true;
    if (searchParams.get("award") === "true") filters.has_award = true;""",
        """    if (searchParams.get("bidding") === "true") filters.has_bidding = true;
    if (searchParams.get("invoice") === "true") filters.has_invoice = true;
    if (searchParams.get("award") === "true") filters.has_award = true;"""
    )
]

# 3. frontend/src/app/[locale]/search/page.tsx
search_page_path = "frontend/src/app/[locale]/search/page.tsx"
search_page_replacements = [
    (
        """  const hasHiring = searchParamsVal.hiring === 'true';
  const hasSubsidy = searchParamsVal.subsidy === 'true';
  const hasBidding = searchParamsVal.bidding === 'true';
  const hasFinancials = searchParamsVal.financials === 'true';""",
        """  const hasHiring = searchParamsVal.hiring === 'true';
  const hasSubsidy = searchParamsVal.subsidy === 'true';
  const hasBidding = searchParamsVal.bidding === 'true';
  const hasInvoice = searchParamsVal.invoice === 'true';
  const hasFinancials = searchParamsVal.financials === 'true';"""
    ),
    (
        """    has_hiring: hasHiring,
    has_subsidy: hasSubsidy,
    has_bidding: hasBidding,
    has_award: hasAward,""",
        """    has_hiring: hasHiring,
    has_subsidy: hasSubsidy,
    has_bidding: hasBidding,
    has_invoice: hasInvoice ? true : undefined,
    has_award: hasAward,"""
    ),
    (
        """    hasHiring,
    hasSubsidy,
    hasBidding,
    hasFinancials,""",
        """    hasHiring,
    hasSubsidy,
    hasBidding,
    hasInvoice,
    hasFinancials,"""
    )
]

# 4. frontend/src/components/SearchClientContainer.tsx
client_container_path = "frontend/src/components/SearchClientContainer.tsx"
client_container_replacements = [
    (
        """    hasHiring?: boolean;
    hasSubsidy?: boolean;
    hasBidding?: boolean;
    minEstYear?: number;""",
        """    hasHiring?: boolean;
    hasSubsidy?: boolean;
    hasBidding?: boolean;
    hasInvoice?: boolean;
    minEstYear?: number;"""
    ),
    (
        """  const [hasHiring, setHasHiring] = useState(!!initialFilters.hasHiring);
  const [hasSubsidy, setHasSubsidy] = useState(!!initialFilters.hasSubsidy);
  const [hasBidding, setHasBidding] = useState(!!initialFilters.hasBidding);
  const [minEstYear, setMinEstYear] = useState(initialFilters.minEstYear);""",
        """  const [hasHiring, setHasHiring] = useState(!!initialFilters.hasHiring);
  const [hasSubsidy, setHasSubsidy] = useState(!!initialFilters.hasSubsidy);
  const [hasBidding, setHasBidding] = useState(!!initialFilters.hasBidding);
  const [hasInvoice, setHasInvoice] = useState(!!initialFilters.hasInvoice);
  const [minEstYear, setMinEstYear] = useState(initialFilters.minEstYear);"""
    ),
    (
        """    if (initialFilters.hasHiring) initialParams.set("hiring", "true");
    if (initialFilters.hasSubsidy) initialParams.set("subsidy", "true");
    if (initialFilters.hasBidding) initialParams.set("bidding", "true");
    if (initialFilters.minEstYear != null) initialParams.set("min_establishment_year", String(initialFilters.minEstYear));""",
        """    if (initialFilters.hasHiring) initialParams.set("hiring", "true");
    if (initialFilters.hasSubsidy) initialParams.set("subsidy", "true");
    if (initialFilters.hasBidding) initialParams.set("bidding", "true");
    if (initialFilters.hasInvoice) initialParams.set("invoice", "true");
    if (initialFilters.minEstYear != null) initialParams.set("min_establishment_year", String(initialFilters.minEstYear));"""
    ),
    (
        """    const newHasHiring = overrides.hasHiring !== undefined ? overrides.hasHiring : hasHiring;
    const newHasSubsidy = overrides.hasSubsidy !== undefined ? overrides.hasSubsidy : hasSubsidy;
    const newHasBidding = overrides.hasBidding !== undefined ? overrides.hasBidding : hasBidding;
    const newMinEstYear = overrides.minEstYear !== undefined ? overrides.minEstYear : minEstYear;""",
        """    const newHasHiring = overrides.hasHiring !== undefined ? overrides.hasHiring : hasHiring;
    const newHasSubsidy = overrides.hasSubsidy !== undefined ? overrides.hasSubsidy : hasSubsidy;
    const newHasBidding = overrides.hasBidding !== undefined ? overrides.hasBidding : hasBidding;
    const newHasInvoice = overrides.hasInvoice !== undefined ? overrides.hasInvoice : hasInvoice;
    const newMinEstYear = overrides.minEstYear !== undefined ? overrides.minEstYear : minEstYear;"""
    ),
    (
        """    if (newHasHiring) apiParams.set("hiring", "true");
    if (newHasSubsidy) apiParams.set("subsidy", "true");
    if (newHasBidding) apiParams.set("bidding", "true");
    if (newMinEstYear != null) apiParams.set("min_establishment_year", String(newMinEstYear));""",
        """    if (newHasHiring) apiParams.set("hiring", "true");
    if (newHasSubsidy) apiParams.set("subsidy", "true");
    if (newHasBidding) apiParams.set("bidding", "true");
    if (newHasInvoice) apiParams.set("invoice", "true");
    if (newMinEstYear != null) apiParams.set("min_establishment_year", String(newMinEstYear));"""
    ),
    (
        """      if (newHasHiring) browserParams.set("hiring", "true");
      if (newHasSubsidy) browserParams.set("subsidy", "true");
      if (newHasBidding) browserParams.set("bidding", "true");
      if (newMinEstYear != null) browserParams.set("min_establishment_year", String(newMinEstYear));""",
        """      if (newHasHiring) browserParams.set("hiring", "true");
      if (newHasSubsidy) browserParams.set("subsidy", "true");
      if (newHasBidding) browserParams.set("bidding", "true");
      if (newHasInvoice) browserParams.set("invoice", "true");
      if (newMinEstYear != null) browserParams.set("min_establishment_year", String(newMinEstYear));"""
    ),
    (
        """      if (newHasHiring) browserParams.set("hiring", "true");
      if (newHasSubsidy) browserParams.set("subsidy", "true");
      if (newHasBidding) browserParams.set("bidding", "true");
      if (newMinEstYear != null) browserParams.set("min_establishment_year", String(newMinEstYear));""",
        """      if (newHasHiring) browserParams.set("hiring", "true");
      if (newHasSubsidy) browserParams.set("subsidy", "true");
      if (newHasBidding) browserParams.set("bidding", "true");
      if (newHasInvoice) browserParams.set("invoice", "true");
      if (newMinEstYear != null) browserParams.set("min_establishment_year", String(newMinEstYear));"""
    ),
    (
        """    if (updates.bidding !== undefined) {
      setHasBidding(!!updates.bidding);
    }
    if (updates.min_establishment_year !== undefined) {""",
        """    if (updates.bidding !== undefined) {
      setHasBidding(!!updates.bidding);
    }
    if (updates.invoice !== undefined) {
      setHasInvoice(!!updates.invoice);
    }
    if (updates.min_establishment_year !== undefined) {"""
    ),
    (
        """      if (updates.bidding !== undefined) overrides.hasBidding = !!updates.bidding;
      if (updates.min_establishment_year !== undefined) overrides.minEstYear = updates.min_establishment_year ? parseInt(updates.min_establishment_year, 10) : undefined;""",
        """      if (updates.bidding !== undefined) overrides.hasBidding = !!updates.bidding;
      if (updates.invoice !== undefined) overrides.hasInvoice = !!updates.invoice;
      if (updates.min_establishment_year !== undefined) overrides.minEstYear = updates.min_establishment_year ? parseInt(updates.min_establishment_year, 10) : undefined;"""
    ),
    (
        """            hasHiring={hasHiring}
            hasSubsidy={hasSubsidy}
            hasBidding={hasBidding}
            minEstYear={minEstYear}""",
        """            hasHiring={hasHiring}
            hasSubsidy={hasSubsidy}
            hasBidding={hasBidding}
            hasInvoice={hasInvoice}
            minEstYear={minEstYear}"""
    ),
    (
        """            hasHiring={hasHiring}
            hasSubsidy={hasSubsidy}
            hasBidding={hasBidding}
            minEstYear={minEstYear}""",
        """            hasHiring={hasHiring}
            hasSubsidy={hasSubsidy}
            hasBidding={hasBidding}
            hasInvoice={hasInvoice}
            minEstYear={minEstYear}"""
    ),
    (
        """          const activeFiltersCount = [
            keyword, prefCode, city, indCode, minEmp, maxEmp, minCap, maxCap,
            hasHiring, hasSubsidy, hasBidding, minEstYear, maxEstYear,""",
        """          const activeFiltersCount = [
            keyword, prefCode, city, indCode, minEmp, maxEmp, minCap, maxCap,
            hasHiring, hasSubsidy, hasBidding, hasInvoice, minEstYear, maxEstYear,"""
    ),
    (
        """                {hasBidding && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 text-xs font-semibold shadow-2xs">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{t.search.bidding}</span>
                    <button type="button" onClick={() => handleFilterChange({ bidding: false }, true)} className="p-0.5 rounded-full hover:bg-amber-200/60 dark:hover:bg-amber-900 transition-colors cursor-pointer" title="Remove"><X className="w-3 h-3 text-amber-700 dark:text-amber-300" /></button>
                  </span>
                )}""",
        """                {hasBidding && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 text-xs font-semibold shadow-2xs">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{t.search.bidding}</span>
                    <button type="button" onClick={() => handleFilterChange({ bidding: false }, true)} className="p-0.5 rounded-full hover:bg-amber-200/60 dark:hover:bg-amber-900 transition-colors cursor-pointer" title="Remove"><X className="w-3 h-3 text-amber-700 dark:text-amber-300" /></button>
                  </span>
                )}
                {hasInvoice && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800 text-xs font-semibold shadow-2xs">
                    <FileCheck2 className="w-3 h-3 text-[#1B4F8A] dark:text-blue-400" />
                    <span>{locale === 'en' ? 'Invoice Registered' : locale === 'vi' ? 'Đã đăng ký Invoice' : '適格インボイス登録'}</span>
                    <button type="button" onClick={() => handleFilterChange({ invoice: false }, true)} className="p-0.5 rounded-full hover:bg-blue-200/60 dark:hover:bg-blue-800 transition-colors cursor-pointer" title="Remove"><X className="w-3 h-3 text-blue-700 dark:text-blue-300" /></button>
                  </span>
                )}"""
    )
]

# 5. frontend/src/components/SearchSidebar.tsx
sidebar_path = "frontend/src/components/SearchSidebar.tsx"
sidebar_replacements = [
    (
        """  hasHiring: boolean;
  hasSubsidy: boolean;
  hasBidding: boolean;
  minEstYear?: number;""",
        """  hasHiring: boolean;
  hasSubsidy: boolean;
  hasBidding: boolean;
  hasInvoice?: boolean;
  minEstYear?: number;"""
    ),
    (
        """  hasHiring,
  hasSubsidy,
  hasBidding,
  minEstYear,""",
        """  hasHiring,
  hasSubsidy,
  hasBidding,
  hasInvoice = false,
  minEstYear,"""
    ),
    (
        """  const activeCount = [
    prefCode, city, indCode, minEmp, maxEmp, minCap, maxCap,
    hasHiring, hasSubsidy, hasBidding, minEstYear, maxEstYear,""",
        """  const activeCount = [
    prefCode, city, indCode, minEmp, maxEmp, minCap, maxCap,
    hasHiring, hasSubsidy, hasBidding, hasInvoice, minEstYear, maxEstYear,"""
    ),
    (
        """        else if (key === "bidding") updates.bidding = val === "true";
        else if (key === "min_establishment_year") updates.min_establishment_year = val;""",
        """        else if (key === "bidding") updates.bidding = val === "true";
        else if (key === "invoice") updates.invoice = val === "true";
        else if (key === "min_establishment_year") updates.min_establishment_year = val;"""
    ),
    (
        """        bidding: hasBidding ? "true" : undefined,
        min_establishment_year: minEstYear != null ? String(minEstYear) : undefined,""",
        """        bidding: hasBidding ? "true" : undefined,
        invoice: hasInvoice ? "true" : undefined,
        min_establishment_year: minEstYear != null ? String(minEstYear) : undefined,"""
    ),
    (
        """        bidding: false,
        min_establishment_year: null,""",
        """        bidding: false,
        invoice: false,
        min_establishment_year: null,"""
    ),
    (
        """              {/* Bidding (GEPS) */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasBidding}
                  onChange={(e) => navigate({ bidding: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{locale === 'ja' ? '官公庁入札・落札実績あり (GEPS)' : locale === 'vi' ? 'Trúng thầu cơ quan chính phủ (GEPS)' : 'Public Procurement & Bids (GEPS)'}</span>
              </label>""",
        """              {/* Bidding (GEPS) */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasBidding}
                  onChange={(e) => navigate({ bidding: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{locale === 'ja' ? '官公庁入札・落札実績あり (GEPS)' : locale === 'vi' ? 'Trúng thầu cơ quan chính phủ (GEPS)' : 'Public Procurement & Bids (GEPS)'}</span>
              </label>

              {/* Invoice Registered */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white py-1">
                <input
                  type="checkbox"
                  checked={hasInvoice}
                  onChange={(e) => navigate({ invoice: e.target.checked ? "true" : null }, true)}
                  className="w-4 h-4 rounded text-[#1B4F8A] focus:ring-[#1B4F8A] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                />
                <span>{locale === 'ja' ? '適格請求書発行事業者（インボイス登録）' : locale === 'vi' ? 'Đã đăng ký doanh nghiệp Invoice' : 'Qualified Invoice Issuer'}</span>
              </label>"""
    )
]

# 6. frontend/src/app/[locale]/page.tsx
home_page_path = "frontend/src/app/[locale]/page.tsx"
home_page_replacements = [
    (
        """            {/* Quick Intent Filter Chips (Tối giản thanh lịch, xóa bỏ emoji chìa khóa 🔑) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto text-xs text-slate-500 dark:text-slate-400 mb-8">
              <span className="font-semibold text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider mr-1">
                {isJa ? "人気の絞り込み:" : isVi ? "Bộ lọc phổ biến:" : "Quick Filters:"}
              </span>
              <Link 
                href={`/${locale}/search?contact_form=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "お問い合わせフォームあり" : isVi ? "Có biểu mẫu liên hệ" : "Contact Form Available"}
              </Link>
              <Link 
                href={`/${locale}/search?hiring=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "求人活動中" : isVi ? "Đang tuyển dụng" : "Actively Hiring"}
              </Link>
              <Link 
                href={`/${locale}/search?subsidy=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "補助金受給企業" : isVi ? "Nhận trợ cấp" : "Subsidy Recipients"}
              </Link>
              <Link 
                href={`/${locale}/search?bidding=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "公共入札実績" : isVi ? "Đấu thầu công" : "Public Bidders"}
              </Link>
            </div>""",
        """            {/* Quick Intent Filter Chips (Tối giản thanh lịch chuẩn B2B) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs text-slate-500 dark:text-slate-400 mb-8">
              <span className="font-semibold text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider mr-1">
                {isJa ? "条件から探す:" : isVi ? "Bộ lọc theo tiêu chí:" : "Quick Filter by:"}
              </span>
              <Link 
                href={`/${locale}/search?contact_form=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "お問い合わせフォームあり" : isVi ? "Có biểu mẫu liên hệ" : "Contact Form Available"}
              </Link>
              <Link 
                href={`/${locale}/search?hiring=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "求人募集中" : isVi ? "Đang tuyển dụng" : "Actively Hiring"}
              </Link>
              <Link 
                href={`/${locale}/search?invoice=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "適格インボイス登録" : isVi ? "Đăng ký Invoice" : "Qualified Invoice"}
              </Link>
              <Link 
                href={`/${locale}/search?subsidy=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "補助金受給" : isVi ? "Nhận trợ cấp" : "Subsidies"}
              </Link>
              <Link 
                href={`/${locale}/search?bidding=true`} 
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-[#1B4F8A] hover:text-[#1B4F8A] dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400 dark:hover:text-blue-400 font-medium transition-colors text-[11px]"
              >
                {isJa ? "公共入札実績" : isVi ? "Đấu thầu công" : "Public Bids"}
              </Link>
            </div>"""
    )
]

success = True
success &= update_file(db_path, db_replacements)
success &= update_file(route_path, route_replacements)
success &= update_file(search_page_path, search_page_replacements)
success &= update_file(client_container_path, client_container_replacements)
success &= update_file(sidebar_path, sidebar_replacements)
success &= update_file(home_page_path, home_page_replacements)

if not success:
    print("[ERROR] One or more replacements failed.")
    sys.exit(1)
else:
    print("[ALL DONE] All 6 files updated successfully!")
