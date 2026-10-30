'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Coins, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Clock, 
  Building2, 
  MapPin, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  Download,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { CorporateRankingItem } from '@/lib/db';
import { ExportCSVButton } from '@/components/ExportCSVButton';

interface Props {
  items: CorporateRankingItem[];
  activeType: 'salary' | 'tenure' | 'employees';
  locale: string;
  prefectureCode?: string;
}

export function RankingHubView({ items, activeType, locale, prefectureCode }: Props) {
  const currentYear = new Date().getFullYear();

  const config = {
    salary: {
      title: locale === 'en' 
        ? `Top Companies by Average Annual Salary (${currentYear})` 
        : locale === 'vi' 
        ? `Bảng Xếp Hạng Thu Nhập Bình Quân Doanh Nghiệp (${currentYear})` 
        : `【${currentYear}年最新】全国企業の平均年間給与ランキング`,
      subtitle: locale === 'en'
        ? 'Official average annual remuneration disclosed in annual securities reports filed with the Financial Services Agency (FSA EDINET).'
        : locale === 'vi'
        ? 'Dữ liệu thu nhập bình quân năm trích xuất từ Báo cáo Chứng khoán có kiểm toán nộp Cơ quan Dịch vụ Tài chính Nhật Bản (FSA EDINET).'
        : '金融庁EDINET有価証券報告書の公式開示データに基づく、日本全国の正規従業員における平均年間給与ランキングです。',
      sourceBadge: '金融庁EDINET開示データ',
      metricLabel: '平均年間給与',
      icon: <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      colorClass: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    tenure: {
      title: locale === 'en' 
        ? `Top White Companies by Average Service Years (${currentYear})` 
        : locale === 'vi' 
        ? `Bảng Xếp Hạng Doanh Nghiệp Uy Tín - Thâm Niên Gắn Bó (${currentYear})` 
        : `【${currentYear}年最新】全国ホワイト企業ランキング・平均勤続年数`,
      subtitle: locale === 'en'
        ? 'Workforce longevity and retention indicators published by the Ministry of Health, Labour and Welfare (MHLW).'
        : locale === 'vi'
        ? 'Chỉ số đo lường mức độ đãi ngộ và thời gian gắn bó của nhân viên chính thức công bố bởi Bộ Y tế, Lao động & Phúc lợi Nhật Bản (MHLW).'
        : '厚生労働省「職場情報総合サイト」公表データに基づく、正社員の平均継続勤務年数ランキング。長期安定雇用と定着率を誇るホワイト企業を網羅。',
      sourceBadge: '厚労省 職場情報公表',
      metricLabel: '正社員 平均勤続年数',
      icon: <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    employees: {
      title: locale === 'en' 
        ? `Top Corporations by Insured Employees (${currentYear})` 
        : locale === 'vi' 
        ? `Bảng Xếp Hạng Quy Mô Nhân Sự Đóng BHXH (${currentYear})` 
        : `【${currentYear}年最新】全国企業の厚生年金被保険者数ランキング`,
      subtitle: locale === 'en'
        ? 'Exact insured workforce counts verified via Japan Pension Service official corporate registers.'
        : locale === 'vi'
        ? 'Quy mô lao động đóng Bảo hiểm Xã hội (Phúc lợi 厚生年金) chính thức từ Cơ quan Hưu trí Nhật Bản.'
        : '日本年金機構（厚生年金保険適用事業所公表情報）に基づく、正規被保険者数による企業規模ランキングです。実態に即した真の企業規模を可視化。',
      sourceBadge: '日本年金機構 公表データ',
      metricLabel: '厚生年金 被保険者数',
      icon: <Users className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />,
      colorClass: 'text-[#1B4F8A] bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    }
  }[activeType];

  const getRankBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-white font-bold font-mono text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-300 dark:ring-amber-700">
          1
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-400 text-white font-bold font-mono text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs ring-2 ring-slate-300 dark:ring-slate-600">
          2
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-600 text-white font-bold font-mono text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs ring-2 ring-orange-400 dark:ring-orange-800">
          3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold font-mono text-xs sm:text-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
        {pos}
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-slate-100 dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <Link
          href={`/${locale}/ranking/salary${prefectureCode ? '?prefecture=' + prefectureCode : ''}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeType === 'salary'
              ? 'bg-white dark:bg-slate-800 text-[#1B4F8A] dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>平均年収ランキング</span>
        </Link>

        <Link
          href={`/${locale}/ranking/tenure${prefectureCode ? '?prefecture=' + prefectureCode : ''}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeType === 'tenure'
              ? 'bg-white dark:bg-slate-800 text-[#1B4F8A] dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>ホワイト企業（勤続年数）</span>
        </Link>

        <Link
          href={`/${locale}/ranking/employees${prefectureCode ? '?prefecture=' + prefectureCode : ''}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeType === 'employees'
              ? 'bg-white dark:bg-slate-800 text-[#1B4F8A] dark:text-blue-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>厚生年金被保険者数</span>
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-150 dark:border-slate-800">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${config.colorClass}`}>
                {config.icon}
                <span>{config.sourceBadge}</span>
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                掲載: {items.length}社
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {config.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          {/* CSV Export Action Button with Credits */}
          <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              全社リスト（電話・役員・所在地）を一括取得
            </span>
            <ExportCSVButton
              totalCount={items.length}
              keyword={activeType}
              filters={{ ranking_type: activeType, prefecture_code: prefectureCode }}
            />
          </div>
        </div>

        {/* Feature summary indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-center sm:text-left">
          <div>
            <span className="text-[11px] text-slate-400 block">データ信頼性</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>公的機関・有報準拠</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">対象企業規模</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              全国主要法人・上場
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">更新周期</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              定期自動差分同期
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">商談・採用活用</span>
            <span className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 block mt-0.5">
              CSV出力 & 営業直通
            </span>
          </div>
        </div>
      </div>

      {/* Ranking List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.ranking_type}-${item.rank_position}-${item.corporate_number}`}
            className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 hover:border-[#1B4F8A] dark:hover:border-blue-500 transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            {/* Left: Rank + Company Info */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {getRankBadge(item.rank_position)}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {item.prefecture_name && (
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {item.prefecture_name}
                    </span>
                  )}
                  {item.industry_name && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.industry_name}
                    </span>
                  )}
                  {item.badge_label && (
                    <span className="text-[10px] font-semibold text-[#1B4F8A] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 px-1.5 py-0.5 rounded">
                      {item.badge_label}
                    </span>
                  )}
                </div>

                <Link
                  href={`/${locale}/company/${item.corporate_number}`}
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors line-clamp-1 block"
                >
                  {item.company_name}
                </Link>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                  <span>法人番号: {item.corporate_number}</span>
                  {item.city_name && <span>所在地: {item.city_name}</span>}
                </div>
              </div>
            </div>

            {/* Right: Metric Values + Detail Link */}
            <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {item.metric_value.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {item.metric_unit}
                  </span>
                </div>
                {item.secondary_metric_value !== null && item.secondary_metric_value !== undefined && item.secondary_metric_label && (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {item.secondary_metric_label}: {item.secondary_metric_value > 0 ? `+${item.secondary_metric_value}` : item.secondary_metric_value}
                  </span>
                )}
              </div>

              <Link
                href={`/${locale}/company/${item.corporate_number}`}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#1B4F8A] text-slate-400 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 flex items-center justify-center transition-colors"
                title="企業詳細を見る"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
