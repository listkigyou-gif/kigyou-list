'use client';

import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Coins, 
  ShieldCheck, 
  Building2, 
  TrendingUp,
  Info,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/db';

interface Props {
  company: Company;
  locale: string;
}

export function CompanyWorkplaceMetrics({ company, locale }: Props) {
  const hasInsured = company.insured_employee_count !== null && company.insured_employee_count !== undefined && company.insured_employee_count > 0;
  const hasAge = company.avg_age !== null && company.avg_age !== undefined && Number(company.avg_age) > 0;
  const hasYears = company.avg_service_years !== null && company.avg_service_years !== undefined && Number(company.avg_service_years) > 0;
  const hasSalary = company.avg_annual_salary !== null && company.avg_annual_salary !== undefined && Number(company.avg_annual_salary) > 0;
  const hasBuilding = Boolean(company.building_name && company.building_slug);

  // If none of these data points exist, don't render empty clutter
  if (!hasInsured && !hasAge && !hasYears && !hasSalary && !hasBuilding) {
    return null;
  }

  // Formatting helpers
  const formatSalary = (val: number) => {
    if (locale === 'en') {
      return `¥${(val / 100).toFixed(1)}M JPY`;
    }
    if (locale === 'vi') {
      return `${(val / 100).toFixed(1)} triệu Yên`;
    }
    return `${val.toLocaleString('ja-JP')}万円`;
  };

  const title = locale === 'en' 
    ? 'Human Capital & Workplace Indicators' 
    : locale === 'vi' 
    ? 'Chỉ số Vốn Con người & Môi trường Làm việc' 
    : '人的資本・就業環境指標';

  const subtitle = locale === 'en'
    ? 'Official workforce statistics synced from Japan National Pension Organization & Ministry of Health, Labour and Welfare (MHLW).'
    : locale === 'vi'
    ? 'Dữ liệu nhân sự chính thức từ Cơ quan Hưu trí Nhật Bản (Bảo hiểm Xã hội/Phúc lợi 厚生年金) và Bộ Y tế, Lao động & Phúc lợi (MHLW).'
    : '日本年金機構（厚生年金保険適用事業所）および厚生労働省（職場情報総合サイト）の公表データに基づく正規就業指標です。';

  const officialBadge = locale === 'en'
    ? 'Government Disclosed'
    : locale === 'vi'
    ? 'Dữ liệu Quốc gia'
    : '公的機関公表データ';

  return (
    <section 
      id="workforce" 
      className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-24"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-5 border-b border-slate-150 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-semibold text-[#1B4F8A] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 rounded">
                {officialBadge}
              </span>
            </h2>
          </div>
        </div>

        {/* Building tag if present */}
        {hasBuilding && (
          <Link
            href={`/${locale}/building/${company.building_slug}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs self-start sm:self-auto"
            title={company.building_name || ''}
          >
            <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <span className="truncate max-w-[200px]">{company.building_name}</span>
          </Link>
        )}
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
        {subtitle}
      </p>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Insured Employees (被保険者数 - 厚生年金) */}
        <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {locale === 'en' ? 'Insured Employees' : locale === 'vi' ? 'Nhân sự đóng BHXH' : '厚生年金 被保険者数'}
            </span>
            <Users className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
          </div>
          <div className="mt-1">
            {hasInsured ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {company.insured_employee_count?.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {locale === 'en' ? 'members' : locale === 'vi' ? 'người' : '名'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {locale === 'en' ? 'Japan Pension Service' : locale === 'vi' ? 'Cơ quan Hưu trí Nhật Bản' : '日本年金機構 公表'}
            </span>
          </div>
        </div>

        {/* 2. Average Salary (平均年間給与) */}
        <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {locale === 'en' ? 'Avg Annual Salary' : locale === 'vi' ? 'Thu nhập bình quân' : '平均年間給与'}
            </span>
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1">
            {hasSalary ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatSalary(Number(company.avg_annual_salary))}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {locale === 'en' ? 'Securities Report / Est.' : locale === 'vi' ? 'Báo cáo chứng khoán / Ước tính' : '有価証券報告書・推計'}
            </span>
          </div>
        </div>

        {/* 3. Average Age (従業員の平均年齢) */}
        <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {locale === 'en' ? 'Average Age' : locale === 'vi' ? 'Độ tuổi trung bình' : '従業員 平均年齢'}
            </span>
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-1">
            {hasAge ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {Number(company.avg_age).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {locale === 'en' ? 'yrs old' : locale === 'vi' ? 'tuổi' : '歳'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {locale === 'en' ? 'MHLW Workplace Portal' : locale === 'vi' ? 'Bộ Lao động (MHLW)' : '厚生労働省 職場情報'}
            </span>
          </div>
        </div>

        {/* 4. Average Service Years (平均勤続年数) */}
        <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {locale === 'en' ? 'Avg Service Years' : locale === 'vi' ? 'Số năm gắn bó' : '平均継続勤務年数'}
            </span>
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-1">
            {hasYears ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {Number(company.avg_service_years).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {locale === 'en' ? 'years' : locale === 'vi' ? 'năm' : '年'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {locale === 'en' ? 'MHLW Workplace Portal' : locale === 'vi' ? 'Bộ Lao động (MHLW)' : '厚生労働省 職場情報'}
            </span>
          </div>
        </div>
      </div>

      {/* Official Data Provenance Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {locale === 'en'
              ? 'Data verified against Japanese Government gBizINFO & MHLW open registries.'
              : locale === 'vi'
              ? 'Dữ liệu được đối soát trực tiếp từ Cổng dữ liệu quốc gia gBizINFO & Bộ Y tế, Lao động Nhật Bản.'
              : '経済産業省gBizINFO・厚生労働省・日本年金機構の公表データを基に自動同期しています。'}
          </span>
        </div>
        <span className="hidden sm:inline font-mono tabular-nums text-[10px]">
          法人番号: {company.corporate_number}
        </span>
      </div>
    </section>
  );
}

