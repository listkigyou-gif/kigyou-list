import React from 'react';
import Link from 'next/link';
import { 
  Building2, MapPin, Calendar, ExternalLink, ArrowRight, 
  Sparkles, ShieldCheck, Briefcase, AlertTriangle, RefreshCw, Layers
} from 'lucide-react';
import { HubDynamicEvent } from '@/lib/db';
import { resolvePrefecture } from '@/lib/hubUtils';

interface CompanyHubBacklinksProps {
  corporateNumber: string;
  companyName: string;
  prefectureCode?: string | null;
  prefectureName?: string | null;
  establishmentDate?: string | null;
  status?: string | null;
  hasHiring?: boolean;
  locale: string;
  recentEvents: HubDynamicEvent[];
}

export const CompanyHubBacklinks: React.FC<CompanyHubBacklinksProps> = ({
  corporateNumber,
  companyName,
  prefectureCode,
  prefectureName,
  establishmentDate,
  status,
  hasHiring,
  locale,
  recentEvents,
}) => {
  const pref = resolvePrefecture(prefectureCode || prefectureName);
  const prefName = pref ? pref.nameJa : (prefectureName || '全国');
  const prefSlug = pref ? pref.slug : '';

  const isClosed = status === '解散' || status === '閉鎖';
  const hasEstDate = Boolean(establishmentDate && establishmentDate >= '2020-01-01');

  // Identify specific events associated with this company
  const hasRelocationEvent = recentEvents.some(e => e.event_category === 'relocation');
  const hasMergerEvent = recentEvents.some(e => e.event_category === 'merger');
  const hasBankruptciesEvent = isClosed || recentEvents.some(e => e.event_category === 'bankruptcies');
  const hasHiringEvent = hasHiring || recentEvents.some(e => e.event_category === 'hiring');
  const hasNewEstEvent = hasEstDate || recentEvents.some(e => e.event_category === 'new_establishment');

  return (
    <section 
      id="dynamic-hubs" 
      className="bg-white border border-slate-200/90 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-20"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {locale === 'en' ? 'Related Databases & Change Hubs' : locale === 'vi' ? 'Cơ sở dữ liệu liên quan & Cổng biến động' : '関連データベース・異動速報ハブ'}
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          {locale === 'en' ? 'Automated Sync' : locale === 'vi' ? 'Đồng bộ tự động' : '自動更新ハブ'}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
        {companyName}に関連する公的異動登記および{prefName}の各カテゴリ別データベースへの直通インデックスです。
        最新の法人登記データや採用活動の動向を各ハブにて毎日自動更新しています。
      </p>

      {/* 1. Verified Active Event Badges (If any active event exists) */}
      {(hasRelocationEvent || hasMergerEvent || hasBankruptciesEvent || hasHiringEvent || hasNewEstEvent) && (
        <div className="mb-5 p-3.5 rounded-lg bg-[#F0F4F9] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
          <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>検知された企業シグナル & 掲載ハブ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {hasRelocationEvent && (
              <Link
                href={`/${locale}/changes/relocation${prefSlug ? '/' + prefSlug : ''}`}
                className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#151B22] border border-blue-200/80 dark:border-blue-900/60 hover:border-[#1B4F8A] text-slate-800 dark:text-slate-200 hover:text-[#1B4F8A] transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1B4F8A]" />
                  <span className="font-semibold">本店移転登記あり</span>
                </div>
                <span className="text-[11px] text-[#1B4F8A] dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                  {prefName}の移転一覧 ➔
                </span>
              </Link>
            )}

            {hasNewEstEvent && (
              <Link
                href={`/${locale}/new-companies${prefSlug ? '/' + prefSlug : ''}`}
                className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#151B22] border border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-600 text-slate-800 dark:text-slate-200 hover:text-emerald-700 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-semibold">新設法人登記確認済</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                  {prefName}の新設一覧 ➔
                </span>
              </Link>
            )}

            {hasHiringEvent && (
              <Link
                href={`/${locale}/jobs/latest${prefSlug ? '/' + prefSlug : ''}`}
                className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#151B22] border border-emerald-200/80 dark:border-emerald-900/60 hover:border-emerald-600 text-slate-800 dark:text-slate-200 hover:text-emerald-700 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-semibold">積極採用・求人中</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                  {prefName}の採用企業 ➔
                </span>
              </Link>
            )}

            {hasBankruptciesEvent && (
              <Link
                href={`/${locale}/status/bankruptcies${prefSlug ? '/' + prefSlug : ''}`}
                className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#151B22] border border-rose-200/80 dark:border-rose-900/60 hover:border-rose-600 text-slate-800 dark:text-slate-200 hover:text-rose-700 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span className="font-semibold">解散・清算等の登記あり</span>
                </div>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 group-hover:underline flex items-center gap-0.5">
                  倒産・解散一覧 ➔
                </span>
              </Link>
            )}

            {hasMergerEvent && (
              <Link
                href={`/${locale}/changes/merger${prefSlug ? '/' + prefSlug : ''}`}
                className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#151B22] border border-blue-200/80 dark:border-blue-900/60 hover:border-[#1B4F8A] text-slate-800 dark:text-slate-200 hover:text-[#1B4F8A] transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1B4F8A]" />
                  <span className="font-semibold">商号変更履歴あり</span>
                </div>
                <span className="text-[11px] text-[#1B4F8A] dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                  商号変更一覧 ➔
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 2. Comprehensive 5-Category Hub Cross-Links for this Prefecture */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {prefName}の関連カテゴリー速報ハブ
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {/* Card 1: New Companies */}
          <Link
            href={`/${locale}/new-companies${prefSlug ? '/' + prefSlug : ''}`}
            className="p-3 rounded-lg border border-slate-200/80 hover:border-[#1B4F8A] dark:border-slate-800 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {prefName}の新設法人一覧
              </span>
              <span className="text-[10px] text-slate-400">
                新規設立・法人番号指定速報
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 ml-2" />
          </Link>

          {/* Card 2: Relocations */}
          <Link
            href={`/${locale}/changes/relocation${prefSlug ? '/' + prefSlug : ''}`}
            className="p-3 rounded-lg border border-slate-200/80 hover:border-[#1B4F8A] dark:border-slate-800 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {prefName}の本社移転企業一覧
              </span>
              <span className="text-[10px] text-slate-400">
                所在地変更・オフィス移転速報
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 ml-2" />
          </Link>

          {/* Card 3: Hiring */}
          <Link
            href={`/${locale}/jobs/latest${prefSlug ? '/' + prefSlug : ''}`}
            className="p-3 rounded-lg border border-slate-200/80 hover:border-[#1B4F8A] dark:border-slate-800 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {prefName}の求人募集中企業一覧
              </span>
              <span className="text-[10px] text-slate-400">
                積極採用・ハローワーク新着
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 ml-2" />
          </Link>

          {/* Card 4: Bankruptcies */}
          <Link
            href={`/${locale}/status/bankruptcies${prefSlug ? '/' + prefSlug : ''}`}
            className="p-3 rounded-lg border border-slate-200/80 hover:border-rose-500 dark:border-slate-800 dark:hover:border-rose-500 bg-slate-50/50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block group-hover:text-rose-600 dark:group-hover:text-rose-400">
                {prefName}の解散・倒産企業一覧
              </span>
              <span className="text-[10px] text-slate-400">
                清算結了・商業登記閉鎖速報
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 shrink-0 ml-2" />
          </Link>

          {/* Card 5: Merger */}
          <Link
            href={`/${locale}/changes/merger${prefSlug ? '/' + prefSlug : ''}`}
            className="p-3 rounded-lg border border-slate-200/80 hover:border-[#1B4F8A] dark:border-slate-800 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                {prefName}の商号変更・M&A一覧
              </span>
              <span className="text-[10px] text-slate-400">
                社名変更・組織再編登記速報
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 ml-2" />
          </Link>

          {/* Card 6: Prefecture Directory Hub */}
          {pref && (
            <Link
              href={`/${locale}/area/${pref.code}`}
              className="p-3 rounded-lg border border-slate-200/80 hover:border-[#1B4F8A] dark:border-slate-800 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400">
                  {prefName}の企業名鑑総合一覧
                </span>
                <span className="text-[10px] text-slate-400">
                  地域全企業データベース
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 shrink-0 ml-2" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
