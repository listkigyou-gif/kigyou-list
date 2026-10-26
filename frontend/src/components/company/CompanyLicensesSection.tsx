'use client';

import React, { useState } from 'react';
import { CompanyLicense } from '@/lib/db';
import { Copy, Check, Award } from 'lucide-react';

interface Props {
  corporateNumber: string;
  companyName: string;
  licenses: CompanyLicense[];
  locale: string;
}

export function CompanyLicensesSection({
  corporateNumber: _corporateNumber,
  companyName,
  licenses,
  locale,
}: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentTime] = useState(() => Date.now());

  if (!licenses || licenses.length === 0) {
    return null;
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  /**
   * Hiển thị ngày hết hạn (満了日) & trạng thái giấy phép:
   * CHỈ sử dụng dữ liệu chính thức do API / cơ quan hành chính cung cấp trong lic.valid_until.
   * Tuyệt đối không tự suy đoán ngày từ issue_date vì mỗi ngành nghề có luật định thời hạn khác nhau (ví dụ: Ryokan là vô thời hạn).
   */
  const resolveExpiration = (lic: CompanyLicense) => {
    if (lic.valid_until && lic.valid_until.trim() !== '') {
      const parts = lic.valid_until.split('-');
      if (parts.length === 3) {
        const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const isExpired = expDate.getTime() < currentTime;
        return { 
          displayDate: `${parts[0]}/${parts[1]}/${parts[2]}`, 
          isExpired,
          statusLabel: isExpired ? (lic.license_status || '満了') : (lic.license_status || '有効')
        };
      }
      return { 
        displayDate: lic.valid_until, 
        isExpired: false, 
        statusLabel: lic.license_status || '有効' 
      };
    }

    // Nếu cơ quan nhà nước không cấp valid_until (giấy phép vô thời hạn / duy trì theo điều kiện hoạt động):
    return { 
      displayDate: null, 
      isExpired: lic.license_status === '失効' || lic.license_status === '取消',
      statusLabel: lic.license_status || '有効'
    };
  };


  return (
    <section 
      aria-labelledby="licenses-heading" 
      className="bg-white dark:bg-[#151B22] border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-5 sm:p-6 shadow-sm mb-6 transition-colors"
      style={{ fontFeatureSettings: '"palt"' }}
    >
      {/* Alarmbox-style Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <h2 
            id="licenses-heading" 
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
          >
            {locale === 'en' 
              ? `${companyName} Licenses & Permits` 
              : locale === 'vi' 
              ? `Thông tin giấy phép của ${companyName}` 
              : `${companyName}の許可情報`}
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          {licenses.length} {locale === 'en' ? 'records' : locale === 'vi' ? 'mục' : '件'}
        </span>
      </div>

      {/* Alarmbox-style Data Table */}
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-slate-200/90 dark:border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
              <th scope="col" className="px-3.5 py-2.5">
                {locale === 'en' ? 'Facility / Office' : locale === 'vi' ? 'Cơ sở / Tên chi nhánh' : '施設・事業所名'}
              </th>
              <th scope="col" className="px-3.5 py-2.5">
                {locale === 'en' ? 'License Category' : locale === 'vi' ? 'Loại ngành cấp phép' : '業種区分'}
              </th>
              <th scope="col" className="px-3.5 py-2.5">
                {locale === 'en' ? 'License Number' : locale === 'vi' ? 'Số giấy phép' : '許可番号'}
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-center">
                {locale === 'en' ? 'Issue Date' : locale === 'vi' ? 'Ngày cấp' : '許可日'}
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-center">
                {locale === 'en' ? 'Expiration' : locale === 'vi' ? 'Hết hạn / Hiệu lực' : '満了日'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 bg-white dark:bg-[#151B22]">
            {licenses.map((lic, idx) => {
              let specialtiesData: any = null;
              if (lic.specialties_json) {
                try {
                  specialtiesData = JSON.parse(lic.specialties_json);
                } catch {
                  specialtiesData = null;
                }
              }

              // Extract office / facility name
              let officeName = companyName;
              if (specialtiesData && specialtiesData.office_name) {
                officeName = specialtiesData.office_name;
              } else if (specialtiesData && specialtiesData.事務所名 && specialtiesData.事務所名 !== '本店') {
                officeName = `${companyName} (${specialtiesData.事務所名})`;
              }

              // Build concise category & specialties summary
              let categoryLabel = lic.license_type;
              let subSpecialtiesText = '';

              if (lic.license_type === '建設業許可') {
                if (lic.license_category) {
                  categoryLabel = `建設業 (${lic.license_category.replace('知事免許', '知事').replace('大臣許可', '大臣')})`;
                } else {
                  categoryLabel = '建設業';
                }

                if (specialtiesData && typeof specialtiesData === 'object') {
                  const specKeys = Object.keys(specialtiesData).filter(k => k !== '所在地');
                  if (specKeys.length > 0) {
                    const preview = specKeys.slice(0, 4).map(k => `${k}(${specialtiesData[k] === '特定' ? '特' : '一'})`).join('、');
                    subSpecialtiesText = specKeys.length > 4 
                      ? `${preview} 他 計${specKeys.length}業種` 
                      : preview;
                  }
                }
              } else if (lic.license_type === '労働者派遣事業') {
                categoryLabel = '労働者派遣事業';
                if (specialtiesData && specialtiesData.margin_rate) {
                  subSpecialtiesText = `マージン率: ${specialtiesData.margin_rate}`;
                }
              } else if (lic.license_type === '有料職業紹介事業') {
                categoryLabel = '有料職業紹介事業';
              } else if (lic.license_type === '宅地建物取引業') {
                categoryLabel = '宅地建物取引業';
                if (lic.license_category) {
                  categoryLabel = `宅地建物取引業 (${lic.license_category.replace('免許', '')})`;
                }
              } else if (lic.license_type === '古物商許可') {
                categoryLabel = '古物商許可';
                if (specialtiesData && specialtiesData.区分) {
                  subSpecialtiesText = specialtiesData.区分;
                }
              } else if (lic.license_type === '登録支援機関') {
                categoryLabel = '登録支援機関 (特定技能)';
                if (specialtiesData && specialtiesData.supported_languages) {
                  subSpecialtiesText = `対応言語: ${specialtiesData.supported_languages}`;
                }
              } else if (['税理士法人', '監査法人', '弁護士法人', '行政書士法人', '司法書士法人', '社会保険労務士法人', '弁理士法人'].includes(lic.license_type)) {
                categoryLabel = `${lic.license_type} (法定資格)`;
                if (specialtiesData && specialtiesData.statutory_act) {
                  subSpecialtiesText = specialtiesData.statutory_act;
                }
              }

              return (
                <tr 
                  key={lic.id || idx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Facility / Office Name */}
                  <td className="px-3.5 py-3 align-top">
                    <span className="font-semibold text-slate-850 dark:text-slate-150 block text-[13px] leading-snug">
                      {officeName}
                    </span>
                    {lic.registered_address && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate max-w-[280px]" title={lic.registered_address}>
                        {lic.registered_address}
                      </span>
                    )}
                  </td>

                  {/* License Category */}
                  <td className="px-3.5 py-3 align-top whitespace-nowrap">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block text-xs">
                      {categoryLabel}
                    </span>
                    {subSpecialtiesText && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                        {subSpecialtiesText}
                      </span>
                    )}
                  </td>

                  {/* License Number with inline Copy */}
                  <td className="px-3.5 py-3 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {lic.license_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(lic.license_number, idx)}
                        title={locale === 'en' ? 'Copy number' : locale === 'vi' ? 'Sao chép' : '許可番号をコピー'}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 rounded transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="px-3.5 py-3 align-top text-center font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
                    {formatDateDisplay(lic.issue_date)}
                  </td>

                  {/* Expiration Date / Status */}
                  <td className="px-3.5 py-3 align-top text-center font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
                    {(() => {
                      const exp = resolveExpiration(lic);
                      if (exp.displayDate) {
                        return (
                          <span className={exp.isExpired ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}>
                            {exp.displayDate}
                          </span>
                        );
                      }
                      const status = exp.statusLabel || '有効';
                      const isNormal = status === '有効';
                      return (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          isNormal 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                        }`}>
                          {status}
                        </span>
                      );
                    })()}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
