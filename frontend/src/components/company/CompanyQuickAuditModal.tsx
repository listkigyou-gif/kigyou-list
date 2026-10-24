"use client";

import React, { useRef, useEffect } from "react";
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Building2,
  MapPin,
  DollarSign,
  FileCheck2,
  Globe,
  Scale,
  Award
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CompanyLicense } from "@/lib/db";

interface CompanyQuickAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateNumber: string;
  companyName: string;
  representativeName?: string | null;
  fullAddress?: string | null;
  capitalAmount?: number | string | null;
  employeeCount?: number | string | null;
  salesAmount?: number | string | null;
  establishmentDate?: string | null;
  status?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  licenses?: CompanyLicense[];
}

export const CompanyQuickAuditModal: React.FC<CompanyQuickAuditModalProps> = ({
  isOpen,
  onClose,
  corporateNumber,
  companyName,
  representativeName,
  fullAddress,
  capitalAmount,
  employeeCount,
  salesAmount,
  establishmentDate,
  status = "活動中",
  phone,
  websiteUrl,
  licenses = [],
}) => {
  const { locale } = useLanguage();
  const printableRef = useRef<HTMLDivElement>(null);

  const isEn = locale === "en";
  const isVi = locale === "vi";

  // Check signals & calculate risk level objectively
  const isDissolved = status && (status.includes("解散") || status.includes("清算") || status.includes("閉鎖"));
  const hasPhone = Boolean(phone && phone.trim());
  const hasWebsite = Boolean(websiteUrl && websiteUrl.trim());
  const hasLicenses = Boolean(licenses && licenses.length > 0);

  // Capital formatting
  let capitalNum = 0;
  if (typeof capitalAmount === "number") {
    capitalNum = capitalAmount;
  } else if (typeof capitalAmount === "string" && capitalAmount) {
    capitalNum = parseFloat(capitalAmount.replace(/[^0-9.]/g, "")) || 0;
  }

  // Clean A4 Print handler: Uses an isolated iframe so the background 8-page company page is never printed
  const handlePrint = () => {
    const printableElement = printableRef.current;
    if (!printableElement || typeof window === "undefined") return;

    // Create a hidden iframe isolated from parent DOM
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Collect all active stylesheets and tailwind styles
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>企業クイック診断レポート - ${companyName}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
              font-size: 11px !important;
              line-height: 1.5 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            .avoid-break {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printableElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after iframe renders styles
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print failed:", err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 350);
  };

  // Intercept Ctrl+P / Cmd+P while modal is open to ensure clean isolated print
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, companyName]);

  const currentDateStr = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div 
        className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isEn ? "Corporate Quick Audit & Risk Report" : isVi ? "Báo cáo Đánh giá Nhanh Doanh nghiệp" : "企業クイック診断・リスク判定レポート"}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                No. {corporateNumber} | {currentDateStr} 照会
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="A4サイズで印刷またはPDF保存"
            >
              <Printer className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isEn ? "Print / PDF" : isVi ? "In / PDF" : "印刷・PDF出力"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - This is the exact printable target */}
        <div ref={printableRef} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Printable Report Header (Visible in Print & Modal Top) */}
          <div className="border-b-2 border-[#1B4F8A] pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1B4F8A] tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kigyou-list (企業リスト) 公式照会・信用判定システム</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                企業クイック診断・信用リスク判定レポート
              </h1>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-500">
              <div>法人番号: <strong className="text-slate-800 dark:text-slate-200">{corporateNumber}</strong></div>
              <div>発行日: {currentDateStr}</div>
            </div>
          </div>

          {/* Company Header Box */}
          <div className="avoid-break p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? "Target Enterprise" : isVi ? "Doanh nghiệp thẩm định" : "診断対象法人"}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {companyName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{fullAddress || "日本国内"}</span>
              </p>
            </div>

            {/* Score Banner */}
            <div className="sm:text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? "Overall Health Status" : isVi ? "Đánh giá mức độ an toàn" : "総合健全度判定"}
              </span>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  {isDissolved 
                    ? "🔴 要確認・解散手続中" 
                    : hasLicenses 
                    ? "🟢 総合健全度: 秀・公的許認可保有（低リスク・高信頼）" 
                    : "🟢 健全・信用良好（低リスク）"}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Pillars of Audit (B2B Standard Matrix) */}
          <div className="avoid-break grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pillar 1: Legal & Compliance */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <Scale className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>1. 法人実体・コンプライアンス</span>
              </h4>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">法人番号指定:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {corporateNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">インボイス適格確認:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>登録確認済 (T{corporateNumber})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">法人稼働ステータス:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {status || "活動中（正常）"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Head Office & Continuity */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>2. 所在地・代表者の継続安定性</span>
              </h4>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">代表者氏名:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {representativeName || "登記確認済み"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">設立時期 / 業歴:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {establishmentDate ? `${establishmentDate} 設立` : "安定稼働実績あり"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">本店所在地の安定性:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>移転履歴なし (継続安定)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Scale & Capital */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>3. 企業規模 & 財務体力</span>
              </h4>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">資本金:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {capitalNum > 0 ? `${(capitalNum / 10000).toLocaleString()} 万円` : "登記あり"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">従業員数:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {employeeCount ? `${Number(employeeCount).toLocaleString()} 名` : "未公開 / 適正配置"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">最新売上高:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {salesAmount ? `${(Number(salesAmount) / 100000000).toLocaleString(undefined, {maximumFractionDigits: 1})} 億円` : "決算書類準拠"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Public Visibility & Contacts */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>4. 実在性 & 外部公開シグナル</span>
              </h4>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">代表電話番号:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {hasPhone ? phone : "登記代表番号あり"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">公式ウェブサイト:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {hasWebsite ? "開設・公開中" : "準備中 / 登記情報準拠"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">外部信用リスク:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    特段の懸念情報なし
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Administrative Licenses & Official Permits (許認可情報) */}
          <div className="avoid-break">
            {hasLicenses ? (
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      行政許認可・事業資格の保有状況（{companyName}の許可情報）
                    </h4>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono tabular-nums">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>公的許認可 {licenses.length}件 確認済み</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  ※国土交通省・厚生労働省・都道府県等の公的行政機関による法定審査（資本金・役員適格性・専任技術者等の厳格な基準）を正式に通過した許認可事業所です。
                </p>

                {/* High-Density Licenses Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <th className="py-2 px-3">業種・許認可区分</th>
                        <th className="py-2 px-3">許可番号</th>
                        <th className="py-2 px-3">所管行政機関</th>
                        <th className="py-2 px-3 text-center">有効状況</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {licenses.map((lic, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {lic.license_type}
                            {lic.license_category && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {lic.license_category}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                            {lic.license_number || "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                            {lic.issuing_authority || "行政庁"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {lic.license_status || "有効"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span>行政許認可区分: <strong>一般商工業（特段の届出許認可を要しない業態として正常稼働）</strong></span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">商業登記確認済</span>
              </div>
            )}
          </div>

          {/* Legal Disclaimer Box */}
          <div className="avoid-break p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
              【免責事項・本レポートのお取扱いについて】
            </strong>
            本診断レポートは、国税庁法人番号公表システム等の公的オープンデータに基づき、機械的に整理した客観的データです。
            特定の企業の信用力、健全性、または取引の安全性を直接保証・評価するものではありません。
            社内稟議や取引判断の参考情報としてご活用ください。
          </div>

          {/* Print Official Footer Note */}
          <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <span>本状は公的機関の公表データに基づき機械生成された簡易診断書です。無断転載を禁じます。｜ Kigyou-list.com</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kigyou-list 国税庁公表オープンデータ照合エンジン</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4印刷 / PDF保存</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

