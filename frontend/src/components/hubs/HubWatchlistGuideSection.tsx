import React from "react";
import Link from "next/link";
import { ArrowRight, Bell, Search } from "lucide-react";

interface HubWatchlistGuideSectionProps {
  locale: string;
  category: "bankruptcy" | "relocation" | "merger" | "establishment";
  prefectureCode?: string;
  prefectureName?: string;
}

const KEY_INDUSTRIES = [
  { code: "39", name: "情報サービス業" },
  { code: "06", name: "総合工事業" },
  { code: "68", name: "不動産取引業" },
  { code: "72", name: "専門サービス業" },
  { code: "44", name: "道路貨物運送業" },
  { code: "76", name: "飲食店" },
];

const MAJOR_AREAS = [
  { code: "13", name: "東京都" },
  { code: "27", name: "大阪府" },
  { code: "23", name: "愛知県" },
  { code: "14", name: "神奈川県" },
  { code: "40", name: "福岡県" },
  { code: "01", name: "北海道" },
];

const KEY_LICENSES = [
  { slug: "kensetsu", ja: "建設業許可企業", en: "Construction Licenses" },
  { slug: "takken", ja: "宅建業免許企業", en: "Real Estate Licenses" },
  { slug: "haken", ja: "労働者派遣事業", en: "Staffing Agencies" },
  { slug: "tokutei", ja: "特定技能登録支援機関", en: "Specified Skilled Support" },
  { slug: "shigyo", ja: "士業・監査法人等", en: "Certified Professionals" },
];

export default function HubWatchlistGuideSection({
  locale,
  category,
  prefectureCode,
  prefectureName,
}: HubWatchlistGuideSectionProps) {
  const isJa = locale === "ja";

  const signalHref =
    category === "bankruptcy"
      ? `/${locale}/changes/relocation`
      : `/${locale}/status/bankruptcies`;

  return (
    <div className="mt-10 space-y-6">
      {/* 1. 3-Step Free Partner Risk Monitoring Guide & Quick Lookup */}
      <section className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-[#60A5FA] mb-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>
                {isJa
                  ? "与信管理・競合リサーチ機能（10社まで無料）"
                  : "Partner Risk & Competitor Alerts (Up to 10 Companies Free)"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isJa
                ? "特定の取引先・競合の異動（倒産・移転・商号変更）を自動検知"
                : "Monitor Specific Partners for Dissolutions, Relocations & Name Changes"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {isJa
                ? "一覧で毎回探す必要はありません。取引先や見込み顧客を監視リストへ登録しておくと、登記異動やインボイス登録の変化を毎日自動で検知します。"
                : "Register partners or competitors once to automatically track corporate registry changes, dissolutions, and invoice status daily."}
            </p>
          </div>
          <Link
            href={`/${locale}/watchlist`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded bg-[#1B4F8A] hover:bg-[#163F70] text-white text-xs sm:text-sm font-medium transition-colors shrink-0"
          >
            <span>
              {isJa ? "無料で監視リストを作成（最大10社）" : "Create Free Watchlist (10 Free)"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Clean Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-5">
          <div className="p-4 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-[#1B4F8A] dark:text-[#60A5FA] mb-1 tabular-nums">
              STEP 01
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              {isJa ? "1クリックで監視リストへ追加" : "1-Click Add to Watchlist"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "一覧の「監視に追加」ボタン、または全国560万社検索から取引先・競合企業を登録します（無料枠10社）。"
                : "Click Watch on any card or search all 5.6M Japanese corporations to add up to 10 companies for free."}
            </p>
          </div>

          <div className="p-4 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-[#1B4F8A] dark:text-[#60A5FA] mb-1 tabular-nums">
              STEP 02
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              {isJa ? "毎朝の公的データ更新と自動照合" : "Daily Official Registry Sync"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "国税庁法人番号・商業登記・適格請求書（インボイス）データを毎日自動チェックします。"
                : "Automatically cross-checks NTA Corporate Number, registry events, and Qualified Invoice status daily."}
            </p>
          </div>

          <div className="p-4 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-[#1B4F8A] dark:text-[#60A5FA] mb-1 tabular-nums">
              STEP 03
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              {isJa ? "解散・移転・商号変更を即座に把握" : "Immediate Change Visibility"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "与信リスクの早期察知や、本店移転・新設企業へのタイムリーな営業アプローチに活用できます。"
                : "Detect credit risks early and identify office relocations or newly incorporated prospects immediately."}
            </p>
          </div>
        </div>

        {/* Quick Partner Verification Form (Progressive HTML form -> /search?q=...) */}
        <form
          action={`/${locale}/search`}
          method="GET"
          className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2.5"
        >
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            {isJa ? "取引先の現状をすぐ確認:" : "Check a specific company:"}
          </span>
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              required
              placeholder={
                isJa
                  ? "企業名または13桁の法人番号を入力して詳細ページ・監視設定へ"
                  : "Enter company name or 13-digit Corporate Number"
              }
              className="w-full pl-8 pr-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1B4F8A] dark:focus:border-[#60A5FA]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded border border-[#1B4F8A] dark:border-[#60A5FA] text-[#1B4F8A] dark:text-[#60A5FA] hover:bg-[#F0F4F9] dark:hover:bg-[#1B4F8A]/15 text-xs font-medium transition-colors shrink-0"
          >
            <span>{isJa ? "法人データを照会" : "Verify Company"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* 2. Core 4 Essentials Strip */}
      <section className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-md p-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
          {isJa
            ? "Kigyou-list 厳選4大機能 ― 迷わず使える法人インテリジェンス"
            : "Core 4 Capabilities on Kigyou-list"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href={`/${locale}/search`}
            className="block p-3.5 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isJa ? "1. 560万社 検索・CSV出力" : "1. 5.6M Search & CSV"}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {isJa
                ? "業種・地域・従業員数・財務情報から営業リストを作成"
                : "Filter nationwide firms by industry, region, scale & financials"}
            </p>
          </Link>

          <Link
            href={signalHref}
            className="block p-3.5 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isJa ? "2. 日次 企業異動シグナル" : "2. Daily Event Signals"}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {isJa
                ? "倒産・解散・本店移転・合併・新設法人の最新動向"
                : "Daily updates on dissolutions, relocations, mergers & startups"}
            </p>
          </Link>

          <Link
            href={`/${locale}/watchlist`}
            className="block p-3.5 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isJa ? "3. 取引先 監視（10社無料）" : "3. Free Partner Watchlist"}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {isJa
                ? "登録企業の登記変更・インボイス異動を自動で検知"
                : "Auto-track up to 10 key partners or competitors for free"}
            </p>
          </Link>

          <Link
            href={`/${locale}/pricing`}
            className="block p-3.5 rounded bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isJa ? "4. B2B 営業アプローチ連携" : "4. B2B Outreach & Plans"}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {isJa
                ? "フォーム営業・CRM連携・監視上限拡張プランを確認"
                : "Form outreach, CSV quota & expanded monitoring tiers"}
            </p>
          </Link>
        </div>
      </section>

      {/* 3. Internal Link Matrix (Regional Active Companies & Industry Hubs) */}
      <section className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-md p-5">
        {prefectureCode && prefectureName ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isJa
                  ? `${prefectureName}のアクティブ企業・代替取引先を探す`
                  : `Explore Active Companies in ${prefectureName}`}
              </h2>
              <Link
                href={`/${locale}/area/${prefectureCode}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4F8A] dark:text-[#60A5FA] hover:underline"
              >
                <span>
                  {isJa ? `${prefectureName}の企業一覧を見る` : `All ${prefectureName} Companies`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {KEY_INDUSTRIES.map((ind) => (
                <Link
                  key={ind.code}
                  href={`/${locale}/industry/${ind.code}/location/${prefectureCode}`}
                  className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] hover:text-[#1B4F8A] dark:hover:text-[#60A5FA] transition-colors"
                >
                  {prefectureName} × {ind.name}
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isJa
                    ? `${prefectureName}の公的許認可・登録企業ハブ`
                    : `Licensed & Registered Firms in ${prefectureName}`}
                </span>
                <Link
                  href={`/${locale}/licenses`}
                  className="text-xs font-medium text-[#1B4F8A] dark:text-[#60A5FA] hover:underline"
                >
                  {isJa ? "公的許認可ハブ一覧 →" : "All License Hubs →"}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {KEY_LICENSES.map((lic) => (
                  <Link
                    key={lic.slug}
                    href={`/${locale}/license/${lic.slug}/${prefectureCode}`}
                    className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] hover:text-[#1B4F8A] dark:hover:text-[#60A5FA] transition-colors"
                  >
                    {prefectureName} × {isJa ? lic.ja : lic.en}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              {isJa ? "関連データハブ・主要地域の法人一覧" : "Related Data Hubs & Major Regions"}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/status/bankruptcies`}
                className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
              >
                {isJa ? "倒産・解散企業一覧" : "Bankruptcies & Dissolutions"}
              </Link>
              <Link
                href={`/${locale}/changes/relocation`}
                className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
              >
                {isJa ? "本店移転企業一覧" : "Office Relocations"}
              </Link>
              <Link
                href={`/${locale}/changes/merger`}
                className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
              >
                {isJa ? "合併・商号変更一覧" : "Mergers & Rebrands"}
              </Link>
              <Link
                href={`/${locale}/new-companies`}
                className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
              >
                {isJa ? "新設法人一覧" : "New Companies"}
              </Link>
              <Link
                href={`/${locale}/licenses`}
                className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
              >
                {isJa ? "公的許認可・士業ハブ" : "Licensed Businesses Hub"}
              </Link>
              {KEY_LICENSES.map((lic) => (
                <Link
                  key={lic.slug}
                  href={`/${locale}/license/${lic.slug}`}
                  className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
                >
                  {isJa ? lic.ja : lic.en}
                </Link>
              ))}
              {MAJOR_AREAS.map((area) => (
                <Link
                  key={area.code}
                  href={`/${locale}/area/${area.code}`}
                  className="px-3 py-1.5 rounded text-xs bg-[#F8FAFC] dark:bg-[#161B22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#1B4F8A] dark:hover:border-[#60A5FA] transition-colors"
                >
                  {area.name}の企業一覧
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
