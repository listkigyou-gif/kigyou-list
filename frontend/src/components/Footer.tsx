"use client";

import React from "react";
import { LogoIcon } from "./LogoIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "./LocaleLink";
import {
  Building2,
  Activity,
  SendHorizontal,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Lock,
} from "lucide-react";

const socialChannels = [
  {
    name: "X (Twitter)",
    handle: "@kigyoulist",
    href: "https://x.com/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Note.com",
    handle: "kigyoulist",
    href: "https://note.com/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 2H4.5A2.5 2.5 0 002 4.5v15A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0019.5 2zm-4.7 14.8h-2.3l-4-6.6v6.6H6.2V7.2h2.3l4 6.6V7.2h2.3v9.6z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "kigyoulist",
    href: "https://www.facebook.com/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
      </svg>
    ),
  },
  {
    name: "Qiita",
    handle: "@listkigyou",
    href: "https://qiita.com/listkigyou",
    icon: (
      <span className="text-[9px] font-black tracking-tighter leading-none">Qiita</span>
    ),
  },
  {
    name: "Zenn",
    handle: "@kigyoulist",
    href: "https://zenn.dev/kigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.5 4h19a.5.5 0 0 1 .5.5v1.2a.5.5 0 0 1-.18.39L6.5 18.5H21a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2.5a.5.5 0 0 1-.5-.5v-1.2a.5.5 0 0 1 .18-.39L17.5 5.5H3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
      </svg>
    ),
  },
];

export const Footer: React.FC = () => {
  const { t, locale } = useLanguage();

  return (
    <footer data-nosnippet className="bg-slate-50 border-t border-slate-200 dark:bg-[#0D1117] dark:border-slate-800 transition-colors mt-auto pb-24 md:pb-12 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 1. Multi-Column Sitemap: 4 Perfectly Balanced Columns (6 Links Each) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-xs">
          
          {/* Column 1: Database & Directory */}
          <div className="space-y-3.5">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {locale === "en" ? "Data & Directory" : locale === "vi" ? "Dữ liệu & Tra cứu" : "データベース・企業検索"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 font-normal">
              <li>
                <LocaleLink href="/search" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Corporate Search" : locale === "vi" ? "Tìm kiếm doanh nghiệp" : "企業詳細検索"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/licenses" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>{locale === "en" ? "Government Licenses Hub" : locale === "vi" ? "Hub Giấy phép Quốc gia" : "公的許認可・士業登録ハブ"}</span>
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-1 rounded">51万件</span>
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/invoice" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Batch Invoice Checker" : locale === "vi" ? "Tra cứu Invoice hàng loạt" : "インボイス一括照会"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/directory#regions" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "47 Prefectures Directory" : locale === "vi" ? "Danh bạ 47 Tỉnh thành" : "全国47都道府県別一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/directory#industries" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "JSIC Industry Directory" : locale === "vi" ? "Phân loại ngành JSIC" : "JSIC産業分類別一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/search?subsidy=true&bidding=true" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Public Bids & Subsidies" : locale === "vi" ? "Trúng thầu công & Trợ cấp" : "官公庁入札・補助金受給"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/search" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "5-Year Financial Trends" : locale === "vi" ? "Xu hướng tài chính 5 năm" : "5年決算トレンド・業績"}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Column 2: Real-time Business Signals Hubs */}
          <div className="space-y-3.5">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                {locale === "en" ? "Real-Time Signals" : locale === "vi" ? "Tín hiệu biến động" : "法人動向・速報ハブ"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 font-normal">
              <li>
                <LocaleLink href="/new-companies" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Newly Incorporated Companies" : locale === "vi" ? "Công ty mới thành lập" : "新設法人・新規設立企業速報"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/changes/relocation" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Head Office Relocations" : locale === "vi" ? "Đổi trụ sở & văn phòng" : "本社移転・所在地変更速報"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/jobs/latest" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Actively Hiring Companies" : locale === "vi" ? "Doanh nghiệp tuyển dụng gấp" : "求人募集中・新着採用速報"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/changes/merger" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "M&A & Name Changes" : locale === "vi" ? "Đổi tên công ty & Sáp nhập" : "商号変更・企業合併一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/status/bankruptcies" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Dissolutions & Closures" : locale === "vi" ? "Giải thể & Phá sản" : "倒産・解散・清算結了速報"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/search?hiring=true" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Hiring Intent Signal Search" : locale === "vi" ? "Tìm kiếm theo tín hiệu tuyển dụng" : "採用意欲シグナル検索"}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Sales Solutions & Pricing */}
          <div className="space-y-3.5">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <SendHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {locale === "en" ? "Sales & Solutions" : locale === "vi" ? "Giải pháp & Bảng giá" : "営業支援・DX機能"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 font-normal">
              <li>
                <LocaleLink href="/form-marketing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Form DM Automation" : locale === "vi" ? "Tự động gửi Form Marketing" : "フォーム自動営業 (Form DM)"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/watchlist" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Company Watchlist & Alerts" : locale === "vi" ? "Theo dõi & Cảnh báo biến động" : "企業監視・変動検知アラート"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/pricing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Bulk CSV Export" : locale === "vi" ? "Xuất danh sách CSV" : "法人リストCSV一括出力"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/developer" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Developer API & MCP Server" : locale === "vi" ? "API & MCP Server" : "開発者向け AI / REST API"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/pricing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Pricing Plans (Free to Pro)" : locale === "vi" ? "Bảng giá dịch vụ" : "料金プラン一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/compare" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Service Comparison" : locale === "vi" ? "So sánh với đối thủ" : "他社サービス徹底比較"}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Support */}
          <div className="space-y-3.5">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                {locale === "en" ? "Legal & Trust" : locale === "vi" ? "Pháp lý & Hỗ trợ" : "サポート・法務規約"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400 font-normal">
              <li>
                <LocaleLink href="/contact" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Contact Support" : locale === "vi" ? "Hỗ trợ & Liên hệ" : "お問い合わせ・サポート"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/opt-out" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Company Info Opt-Out" : locale === "vi" ? "Yêu cầu ẩn thông tin" : "情報掲載停止 (オプトアウト)"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/terms" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Terms of Service" : locale === "vi" ? "Điều khoản dịch vụ" : "利用規約"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/privacy" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Privacy Policy (APPI Compliant)" : locale === "vi" ? "Chính sách bảo mật" : "プライバシーポリシー"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/tokushoho" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Specified Commercial Transactions" : locale === "vi" ? "Luật giao dịch thương mại đặc định" : "特定商取引法に基づく表記"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/unsubscribe" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Email Unsubscribe" : locale === "vi" ? "Hủy nhận email" : "メール配信解除"}
                </LocaleLink>
              </li>
            </ul>
          </div>

        </div>

        {/* 2. Streamlined Trust & Compliance Strip (Horizontal Minimalist Ribbon) */}
        <div className="py-3 px-4 rounded-lg bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-900 dark:text-slate-200">国税庁データ連携</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-1.5 hidden sm:inline">法人番号準拠</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-900 dark:text-slate-200">インボイス制度対応</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-1.5 hidden sm:inline">適格請求書発行</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-900 dark:text-slate-200">Stripe 決済保護</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-1.5 hidden sm:inline">PCI DSS Level 1</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-900 dark:text-slate-200">SSL/TLS 256bit 暗号化</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-1.5 hidden sm:inline">APPI法令遵守</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar: Brand Logo, Legal Operator & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <LocaleLink href="/" className="flex items-center gap-2 active:scale-98 transition-transform">
              <div className="w-6 h-6 rounded-md bg-[#1B4F8A] flex items-center justify-center shadow-xs shrink-0">
                <LogoIcon className="w-3 h-3 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm">
                Kigyou<span className="text-[#1B4F8A] dark:text-blue-400">-list</span>
              </span>
            </LocaleLink>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {locale === "en"
                ? "Operated by TQC Inc. (Tokyo, Japan) · 5M+ Verified Corporate Intelligence"
                : locale === "vi"
                ? "Vận hành bởi TQC Inc. (Tokyo) · Dữ liệu 5M+ doanh nghiệp Nhật Bản"
                : "運営会社: TQC株式会社 (東京都豊島区) · 国内最大級500万社法人データ基盤"}
            </span>
          </div>

          {/* Social Channels */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
              Official:
            </span>
            <div className="flex items-center gap-1.5">
              {socialChannels.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${item.name} (${item.handle})`}
                  aria-label={`${item.name} - ${item.handle}`}
                  className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] hover:border-[#1B4F8A] dark:hover:text-blue-400 dark:hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all shadow-2xs"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            &copy; 2022 - {new Date().getFullYear()} TQC Inc. / Kigyou-list. {t.footer.rights}
          </div>
        </div>

      </div>
    </footer>
  );
};
