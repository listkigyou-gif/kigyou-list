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
  CheckCircle2,
  Award,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/db';

interface Props {
  company: Company;
  locale: string;
  hiringDetails?: Record<string, any> | null;
}

export function CompanyWorkplaceMetrics({ company, locale, hiringDetails }: Props) {
  const hasInsured = company.insured_employee_count !== null && company.insured_employee_count !== undefined && company.insured_employee_count > 0;
  const hasAge = company.avg_age !== null && company.avg_age !== undefined && Number(company.avg_age) > 0;
  const hasYears = company.avg_service_years !== null && company.avg_service_years !== undefined && Number(company.avg_service_years) > 0;
  
  const hasAuditedSalary = company.avg_annual_salary !== null && company.avg_annual_salary !== undefined && Number(company.avg_annual_salary) > 0;
  const hiringSalaryText = hiringDetails?.hiring_salary_text;
  const estAnnualSalary = hiringDetails?.estimated_annual_salary;
  const hasHiringSalary = Boolean(hiringSalaryText || estAnnualSalary);
  const hasSalary = hasAuditedSalary || hasHiringSalary;

  const hasBuilding = Boolean(company.building_name && company.building_slug);
  const hasWelfare = Boolean(
    hiringDetails?.annual_holidays || 
    (hiringDetails?.monthly_overtime !== null && hiringDetails?.monthly_overtime !== undefined) || 
    hiringDetails?.has_retirement_benefit || 
    hiringDetails?.has_childcare_leave || 
    hiringDetails?.has_labor_union
  );

  // If none of these data points exist, don't render empty clutter
  if (!hasInsured && !hasAge && !hasYears && !hasSalary && !hasBuilding && !hasWelfare) {
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
            ) : company.employee_count ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {company.employee_count?.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {locale === 'en' ? 'employees' : locale === 'vi' ? 'nhân sự' : '名'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
          </div>
        </div>

        {/* 2. Average Salary (平均年間給与) / Two-Tier Fallback */}
        <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">
              {hasAuditedSalary 
                ? (locale === 'en' ? 'Avg Annual Salary' : locale === 'vi' ? 'Thu nhập bình quân' : '平均年間給与')
                : (locale === 'en' ? 'Hiring Salary Level' : locale === 'vi' ? 'Khung lương tuyển dụng' : '採用給与水準')}
            </span>
            <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1">
            {hasAuditedSalary ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatSalary(Number(company.avg_annual_salary))}
                </span>
              </div>
            ) : estAnnualSalary ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {estAnnualSalary}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">万円</span>
              </div>
            ) : hiringDetails?.wages ? (
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate" title={hiringDetails.wages}>
                {hiringDetails.wages}
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
            {hiringSalaryText && !hasAuditedSalary && (
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate" title={hiringSalaryText}>
                {hiringSalaryText}
              </span>
            )}
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
            ) : hiringDetails?.has_retirement_benefit ? (
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                退職金制度あり
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-400">-</span>
            )}
          </div>
        </div>
      </div>

      {/* White Company & Statutory Welfare Badges */}
      {hasWelfare && (
        <div className="mt-4 pt-3.5 border-t border-slate-150 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{locale === 'en' ? 'Workplace Benefits & Environment' : locale === 'vi' ? 'Môi trường Làm việc & Chế độ Phúc lợi' : '就業環境・福利厚生制度'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hiringDetails?.annual_holidays && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>年間休日 {hiringDetails.annual_holidays}日</span>
                {hiringDetails.weekly_holiday_type && (
                  <span className="text-[10px] font-normal opacity-85">（{hiringDetails.weekly_holiday_type}）</span>
                )}
              </div>
            )}

            {hiringDetails?.monthly_overtime !== null && hiringDetails?.monthly_overtime !== undefined && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>月平均残業 {hiringDetails.monthly_overtime}時間</span>
                {Number(hiringDetails.monthly_overtime) <= 10 && (
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-normal">（残業極少）</span>
                )}
              </div>
            )}

            {hiringDetails?.has_retirement_benefit && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                退職金制度あり
              </span>
            )}

            {hiringDetails?.has_childcare_leave && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                育児休業取得実績あり
              </span>
            )}

            {hiringDetails?.has_labor_union && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                労働組合あり
              </span>
            )}

            {hiringDetails?.teinen_system && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                定年制: {hiringDetails.teinen_system}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

