'use client';

import React, { useState } from 'react';
import { LegalHistoryEvent } from '@/lib/ntaHistory';
import { 
  History, 
  ShieldCheck, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2
} from 'lucide-react';

interface Props {
  corporateNumber: string;
  companyName: string;
  events: LegalHistoryEvent[];
  locale: string;
  translations: {
    title?: string;
    desc?: string;
    officialBadge?: string;
    emptyText?: string;
    viewNtaOfficial?: string;
    viewNtaInvoice?: string;
  };
}

export function CompanyLegalHistoryTimeline({
  corporateNumber,
  companyName,
  events,
  locale,
  translations,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const title = translations.title || (
    locale === 'en' ? 'Corporate Change History' :
    locale === 'vi' ? 'Lịch sử thay đổi pháp lý' :
    '主な変更履歴'
  );

  const desc = translations.desc || (
    locale === 'en' ? 'Official change history records regarding corporate name, registered address, and legal entity designations synced with Japan National Tax Agency.' :
    locale === 'vi' ? 'Hồ sơ biến động tên doanh nghiệp, địa chỉ trụ sở và đăng ký pháp nhân được đồng bộ chính thức từ Web-API Tổng cục Thuế Quốc gia Nhật Bản (国税庁).' :
    '国税庁の適格請求書発行事業者公表Web-APIおよび法人番号システムより、本企業の商号・所在地・登記区分の変更履歴を公式照会しています。'
  );

  const officialBadge = translations.officialBadge || (
    locale === 'en' ? 'NTA Web-API Verified' :
    locale === 'vi' ? 'Web-API Quốc thuế chính thức' :
    '国税庁 Web-API公式連携'
  );

  const emptyText = translations.emptyText || (
    locale === 'en' ? 'No past change records found. Current registration information has been maintained since incorporation.' :
    locale === 'vi' ? 'Chưa ghi nhận biến động pháp lý nào. Thông tin đăng ký hiện tại được duy trì liên tục từ ngày thành lập.' :
    '現在記録されている変更履歴はありません。設立時からの登録内容を継続しています。'
  );

  const displayedEvents = expanded ? events : events.slice(0, 4);
  const hasMore = events.length > 4;

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (locale === 'ja') {
        return `${parts[0]}年${parts[1]}月${parts[2]}日`;
      } else if (locale === 'vi') {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }
    return dateStr;
  };

  const getEventBadge = (event: LegalHistoryEvent) => {
    if (locale === 'en') return event.eventBadgeEn;
    if (locale === 'vi') return event.eventBadgeVi;
    return event.eventBadgeJa;
  };

  const getEventTitle = (event: LegalHistoryEvent) => {
    if (locale === 'en') return event.titleEn;
    if (locale === 'vi') return event.titleVi;
    return event.titleJa;
  };

  const getEventDetails = (event: LegalHistoryEvent) => {
    if (locale === 'en') return event.detailsEn;
    if (locale === 'vi') return event.detailsVi;
    return event.detailsJa;
  };

  return (
    <section 
      id="history" 
      className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-20"
      aria-label={title}
    >
      {/* Header with Kachi-iro Navy Accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {title}
            </h2>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          {events.length} {locale === 'en' ? 'records' : locale === 'vi' ? 'mốc sự kiện' : '件の記録'}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
        {desc}
      </p>

      {/* Timeline Stream */}
      {events.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-7 space-y-4 before:absolute before:left-2 sm:before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {displayedEvents.map((event, idx) => {
            const isInvoice = event.eventType === 'invoice_registration' || event.eventType === 'invoice_change';
            const isEst = event.eventType === 'establishment' || event.eventType === 'new_establishment';
            const isRepChange = event.eventType === 'representative_change';
            const isBankruptcy = event.eventType === 'bankruptcy';
            const isMerger = event.eventType === 'merger';
            const isRelocation = event.eventType === 'address_change' || event.eventType === 'relocation';

            // Determine border & badge colors based on B2B design guidelines
            let nodeBorderClass = 'border-slate-400 text-slate-500 dark:border-slate-600 dark:text-slate-400';
            let dotClass = 'bg-slate-400 dark:bg-slate-500';
            let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

            if (isRepChange) {
              nodeBorderClass = 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400';
              dotClass = 'bg-purple-600 dark:bg-purple-400';
              badgeClass = 'bg-purple-50 text-purple-750 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 font-semibold';
            } else if (isInvoice) {
              nodeBorderClass = 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400';
              dotClass = 'bg-emerald-600 dark:bg-emerald-400';
              badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-medium';
            } else if (isBankruptcy) {
              nodeBorderClass = 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400';
              dotClass = 'bg-rose-600 dark:bg-rose-400';
              badgeClass = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-semibold';
            } else if (isMerger) {
              nodeBorderClass = 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400';
              dotClass = 'bg-indigo-600 dark:bg-indigo-400';
              badgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 font-medium';
            } else if (isRelocation) {
              nodeBorderClass = 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400';
              dotClass = 'bg-sky-600 dark:bg-sky-400';
              badgeClass = 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 font-medium';
            } else if (isEst) {
              nodeBorderClass = 'border-[#1B4F8A] text-[#1B4F8A] dark:border-blue-400 dark:text-blue-400';
              dotClass = 'bg-[#1B4F8A] dark:bg-blue-400';
              badgeClass = 'bg-blue-50 text-[#1B4F8A] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 font-medium';
            }

            return (
              <div key={event.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div className={`absolute -left-6 sm:-left-7 top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 bg-white dark:bg-[#161B22] ${nodeBorderClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                </div>

                {/* Event Card Content */}
                <div className="bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3 sm:p-3.5 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold font-mono text-slate-900 dark:text-slate-200 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {formatDateDisplay(event.date)}
                      </span>

                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${badgeClass}`}>
                        {getEventBadge(event)}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      {event.source}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {getEventTitle(event)}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {getEventDetails(event)}
                  </p>

                  {/* Diff Box for Representative / Corporate changes */}
                  {(event.oldValue || event.newValue) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {event.oldValue && (
                        <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wider">
                            {locale === 'en' ? 'Previous / Before:' : locale === 'vi' ? 'Trước thay đổi:' : '変更前:'}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 line-through decoration-slate-400/80 break-words">
                            {event.oldValue}
                          </span>
                        </div>
                      )}
                      {event.newValue && (
                        <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5 uppercase tracking-wider">
                            {locale === 'en' ? 'Current / After:' : locale === 'vi' ? 'Sau thay đổi:' : '変更後:'}
                          </span>
                          <span className="text-slate-900 dark:text-slate-100 font-semibold break-words">
                            {event.newValue}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* External Source Link */}
                  {event.sourceUrl && (
                    <div className="mt-2 text-right">
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B4F8A] dark:text-blue-400 hover:underline"
                      >
                        <span>{locale === 'en' ? 'Official Registry Source' : locale === 'vi' ? 'Xem nguồn công bố chính thức' : '公表ソースを確認'}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show more toggle button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span>{expanded ? (locale === 'en' ? 'Show less' : locale === 'vi' ? 'Thu gọn' : '閉じる') : (locale === 'en' ? `Show all ${events.length} records` : locale === 'vi' ? `Xem toàn bộ ${events.length} mốc lịch sử` : `すべての変更履歴を表示 (${events.length}件)`)}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </section>
  );
}
