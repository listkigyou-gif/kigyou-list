'use client';

import React, { useState } from 'react';
import { CompanyLicense } from '@/lib/db';
import { 
  Award, 
  ShieldCheck, 
  Calendar, 
  ExternalLink, 
  Building2, 
  Phone, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  UserCheck,
  TrendingUp,
  Percent,
  FileText
} from 'lucide-react';

interface Props {
  corporateNumber: string;
  companyName: string;
  licenses: CompanyLicense[];
  locale: string;
}

export function CompanyLicensesSection({
  corporateNumber,
  companyName,
  licenses,
  locale,
}: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!licenses || licenses.length === 0) {
    return null;
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return null;
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

  const displayedLicenses = expanded ? licenses : licenses.slice(0, 3);
  const hasMore = licenses.length > 3;

  return (
    <section 
      aria-labelledby="licenses-heading" 
      className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-5 sm:p-6 shadow-sm mb-6 transition-colors"
      style={{ fontFeatureSettings: '"palt"' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 id="licenses-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {locale === 'en' 
                ? 'Corporate Licenses & Certifications' 
                : locale === 'vi' 
                ? 'Giấy phép kinh doanh & Chứng nhận hành nghề' 
                : '保有許認可・事業登録情報'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <ShieldCheck className="w-3.5 h-3.5" />
            {locale === 'en' ? 'Official Registry Data' : locale === 'vi' ? 'Dữ liệu cấp phép chính thức' : '官公庁公認登録データ'}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {licenses.length} {locale === 'en' ? 'licenses' : locale === 'vi' ? 'giấy phép' : '件'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
        {locale === 'en'
          ? 'Official administrative licenses issued by government bodies (Ministry of Land, Infrastructure, Transport and Tourism, and Ministry of Health, Labour and Welfare). Synced with open government registry databases.'
          : locale === 'vi'
          ? 'Giấy phép hành chính và đăng ký kinh doanh chính thức từ cơ quan nhà nước Nhật Bản (Bộ Đất đai Xây dựng MLIT và Bộ Y tế - Lao động MHLW), được đồng bộ với cơ sở dữ liệu mở quốc gia.'
          : '国土交通省（建設業許可）および厚生労働省（労働者派遣・有料職業紹介）等の管轄官公庁に正式届出・登録されている許認可情報です。公認オープンデータと連携し最新の法的認可状況を掲載しています。'}
      </p>

      {/* Licenses List */}
      <div className="space-y-4">
        {displayedLicenses.map((lic, idx) => {
          let specialtiesData: any = null;
          if (lic.specialties_json) {
            try {
              specialtiesData = JSON.parse(lic.specialties_json);
            } catch {
              specialtiesData = null;
            }
          }

          const isConstruction = lic.license_type === '建設業許可';
          const isDispatch = lic.license_type === '労働者派遣事業';
          const isPlacement = lic.license_type === '有料職業紹介事業';

          // Type badge styling
          const typeBadgeClass = isConstruction
            ? 'bg-blue-50 text-[#1B4F8A] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
            : isDispatch
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';

          return (
            <div 
              key={lic.id || idx}
              className="bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 transition-colors"
            >
              {/* Top Row: Type, Number, Status, Copy */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${typeBadgeClass}`}>
                    {lic.license_type}
                  </span>
                  {lic.license_category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {lic.license_category}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {lic.license_status || '有効'}
                  </span>
                </div>

                {lic.source_url && (
                  <a
                    href={lic.source_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-[11px] text-[#1B4F8A] dark:text-blue-400 hover:underline"
                  >
                    <span>{locale === 'en' ? 'Official Verification' : locale === 'vi' ? 'Nguồn thẩm tra' : '官公庁公表データ照会'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* License Number & Main Info */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-wide">
                    {lic.license_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(lic.license_number, idx)}
                    title={locale === 'en' ? 'Copy license number' : locale === 'vi' ? 'Sao chép mã số' : '許可番号をコピー'}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 rounded transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Details Grid: Authority, Date, Representative, Office Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">
                    {locale === 'en' ? 'Authority:' : locale === 'vi' ? 'Cơ quan cấp:' : '管轄行政機関:'}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    {lic.issuing_authority}
                  </span>
                </div>

                {lic.issue_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {locale === 'en' ? 'Issued on:' : locale === 'vi' ? 'Ngày cấp:' : '許可・交付日:'}
                    </span>
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-200">
                      {formatDateDisplay(lic.issue_date)}
                    </span>
                  </div>
                )}

                {lic.representative_name && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {locale === 'en' ? 'Representative:' : locale === 'vi' ? 'Đại diện / Chủ nhiệm:' : '代表・専任責任者:'}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {lic.representative_name}
                    </span>
                  </div>
                )}

                {lic.office_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {locale === 'en' ? 'Office Phone:' : locale === 'vi' ? 'SĐT văn phòng:' : '届出電話番号:'}
                    </span>
                    <a 
                      href={`tel:${lic.office_phone}`}
                      className="font-mono tabular-nums font-medium text-[#1B4F8A] dark:text-blue-400 hover:underline"
                    >
                      {lic.office_phone}
                    </a>
                  </div>
                )}

                {lic.registered_address && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">
                      {locale === 'en' ? 'Registered Office:' : locale === 'vi' ? 'Địa chỉ đăng ký:' : '登録事業所所在地:'}
                    </span>
                    <span className="text-slate-800 dark:text-slate-300">
                      {lic.registered_address}
                    </span>
                  </div>
                )}
              </div>

              {/* Specialized Section for Construction (29 Specialties) */}
              {isConstruction && specialtiesData && typeof specialtiesData === 'object' && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {locale === 'en' ? 'Permitted Construction Specialties:' : locale === 'vi' ? 'Các chuyên ngành xây dựng được cấp phép:' : '許可業種区分（建設29業種）:'}
                    </span>
                    {Object.keys(specialtiesData).filter(k => k !== '所在地').length > 0 && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {Object.keys(specialtiesData).filter(k => k !== '所在地').length} 業種保有
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(specialtiesData).map(([key, val]: [string, any]) => {
                      if (key === '所在地') return null;
                      const isTokutei = val === '特定';
                      return (
                        <span 
                          key={key}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${
                            isTokutei
                              ? 'bg-blue-50 text-[#1B4F8A] border-blue-200 font-semibold dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                              : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <span>{key}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                            isTokutei 
                              ? 'bg-[#1B4F8A] text-white dark:bg-blue-600' 
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {val}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specialized Section for Worker Dispatch (MHLW Jinzai) */}
              {isDispatch && specialtiesData && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                    {locale === 'en' ? 'Worker Dispatch Operating Metrics (MHLW Compliance):' : locale === 'vi' ? 'Chỉ số hoạt động phái cử (Bộ Y tế Lao động công khai):' : '労働者派遣事業 運営開示指標（厚生労働省）:'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {specialtiesData.office_name && (
                      <div className="bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">事業所名</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {specialtiesData.office_name}
                        </span>
                      </div>
                    )}
                    {specialtiesData.billing_rate_avg && (
                      <div className="bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">派遣料金の平均額</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {specialtiesData.billing_rate_avg}
                        </span>
                      </div>
                    )}
                    {specialtiesData.wage_rate_avg && (
                      <div className="bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">派遣労働者賃金平均</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {specialtiesData.wage_rate_avg}
                        </span>
                      </div>
                    )}
                    {specialtiesData.margin_rate && (
                      <div className="bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">マージン率</span>
                        <span className="font-mono tabular-nums font-bold text-[#1B4F8A] dark:text-blue-400 flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {specialtiesData.margin_rate}
                        </span>
                      </div>
                    )}
                  </div>
                  {specialtiesData.labor_agreement && (
                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/40 p-2 rounded border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">労使協定の締結:</span>
                      <span>{specialtiesData.labor_agreement}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Specialized Section for Fee-charging Placement */}
              {isPlacement && specialtiesData && specialtiesData.office_name && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {locale === 'en' ? 'Registered Placement Office:' : locale === 'vi' ? 'Văn phòng giới thiệu việc làm đăng ký:' : '職業紹介届出事業所:'}
                  </span>
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200/80 dark:border-slate-800">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{specialtiesData.office_name}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse Button */}
      {hasMore && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>{locale === 'en' ? 'Show Less' : locale === 'vi' ? 'Thu gọn' : '閉じる'}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>
                  {locale === 'en' 
                    ? `Show All ${licenses.length} Licenses` 
                    : locale === 'vi' 
                    ? `Xem toàn bộ ${licenses.length} giấy phép` 
                    : `すべての許認可を表示（残り ${licenses.length - 3} 件）`}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
