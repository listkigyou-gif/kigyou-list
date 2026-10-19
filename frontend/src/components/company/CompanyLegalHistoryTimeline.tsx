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
    locale === 'en' ? 'Corporate Registry History (NTA Official System)' :
    locale === 'vi' ? 'Lịch sử thay đổi pháp lý chính thức (Tổng cục Thuế NTA)' :
    '主な変更履歴（国税庁 法人番号公表システム）'
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
      {/* Header with Kachi-iro Navy Accent & NTA Badge */}
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

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <ShieldCheck className="w-3.5 h-3.5" />
            {officialBadge}
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
            {events.length} {locale === 'en' ? 'records' : locale === 'vi' ? 'mốc sự kiện' : '件'}
          </span>
        </div>
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
        <div className="relative pl-6 sm:pl-7 space-y-5 before:absolute before:left-2 sm:before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {displayedEvents.map((event, idx) => {
            const isInvoice = event.eventType === 'invoice_registration';
            const isEst = event.eventType === 'establishment';

            return (
              <div key={event.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div className={`absolute -left-6 sm:-left-7 top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 bg-white dark:bg-[#161B22] ${
                  isInvoice 
                    ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400' 
                    : isEst 
                    ? 'border-[#1B4F8A] text-[#1B4F8A] dark:border-blue-400 dark:text-blue-400' 
                    : 'border-slate-400 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isInvoice ? 'bg-emerald-600 dark:bg-emerald-400' :
                    isEst ? 'bg-[#1B4F8A] dark:bg-blue-400' :
                    'bg-slate-400 dark:bg-slate-500'
                  }`} />
                </div>

                {/* Event Card Content */}
                <div className="bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3 sm:p-3.5 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-slate-900 dark:text-slate-200 tabular-nums">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {formatDateDisplay(event.date)}
                      </span>

                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isInvoice 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60' 
                          : isEst 
                          ? 'bg-blue-50 text-[#1B4F8A] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60' 
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {getEventBadge(event)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{locale === 'en' ? 'Verified' : locale === 'vi' ? 'Đã xác minh' : '登記確認済'}</span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {getEventTitle(event)}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {getEventDetails(event)}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    <span>{event.source}</span>
                    <span className="tabular-nums">法人番号: {corporateNumber}</span>
                  </div>
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

      {/* Clean Attribution Footer - Zero Outbound Links to keep users 100% on Kigyou-list */}
      <div className="mt-5 pt-3.5 border-t border-slate-150 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            {locale === 'en' 
              ? 'Source: Japan National Tax Agency Corporate Number & Qualified Invoice Publication System (Official Registry Sync)'
              : locale === 'vi' 
              ? 'Nguồn: Dữ liệu công bố từ Cổng Mã số Pháp nhân & Hệ thống Hóa đơn Hợp lệ - Tổng cục Thuế Quốc gia Nhật Bản (Đồng bộ đăng ký thương mại)'
              : '出典：国税庁 法人番号公表システム・適格請求書発行事業者公表サイト（商業登記データ同期）'}
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
          法人番号: {corporateNumber}
        </span>
      </div>
    </section>
  );
}
