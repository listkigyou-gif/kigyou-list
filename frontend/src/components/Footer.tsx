"use client";

import React from "react";
import { LogoIcon } from "./LogoIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LocaleLink } from "./LocaleLink";
import {
  Building2,
  SendHorizontal,
  Scale,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2
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
    name: "LinkedIn",
    handle: "userkigyoulist",
    href: "https://www.linkedin.com/in/userkigyoulist",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
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
        {/* Multi-Column Sitemap (4 Columns B2B SaaS Standard) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10 pt-4 text-xs">
          
          {/* Column 1: Database & Search */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>
                {locale === "en" ? "Data & Search" : locale === "vi" ? "Dữ liệu & Tìm kiếm" : "企業データ・検索"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
              <li>
                <LocaleLink href="/search" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Advanced Search" : locale === "vi" ? "Tìm kiếm chi tiết" : "企業詳細検索"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/directory" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "47 Prefectures Directory" : locale === "vi" ? "47 Tỉnh thành Nhật Bản" : "47都道府県別一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/directory" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "JSIC Industry Directory" : locale === "vi" ? "Phân loại ngành JSIC" : "JSIC産業分類別一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/search" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>{locale === "en" ? "Hiring Intent Signals" : locale === "vi" ? "Tín hiệu tuyển dụng" : "求人・採用シグナル検索"}</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1 rounded">HOT</span>
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/search" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Subsidies & Grants" : locale === "vi" ? "Trợ cấp & Đấu thầu công" : "補助金受給・官公庁入札"}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <SendHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {locale === "en" ? "Sales Solutions" : locale === "vi" ? "Giải pháp B2B" : "営業ソリューション"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
              <li>
                <LocaleLink href="/form-marketing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>{locale === "en" ? "Form DM Automation" : locale === "vi" ? "Tự động gửi Form DM" : "フォーム自動営業 (Form DM)"}</span>
                  <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full">NEW</span>
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/pricing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Bulk CSV Export" : locale === "vi" ? "Xuất danh sách CSV" : "法人リストCSV一括出力"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/developer" className="hover:text-cyan-600 dark:hover:text-cyan-400 text-cyan-700 dark:text-cyan-400 font-semibold transition-colors flex items-center gap-1.5">
                  <span>{locale === "en" ? "AI / REST API & MCP" : locale === "vi" ? "AI / REST API & MCP Server" : "開発者・AI基盤 / API"}</span>
                  <span className="text-[9px] bg-cyan-600 text-white font-bold px-1 rounded">API</span>
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/search" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "5-Year Financial Trends" : locale === "vi" ? "Xu hướng tài chính 5 năm" : "5年決算トレンド可視化"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/dashboard" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Official Profile Claim" : locale === "vi" ? "Quản lý hồ sơ chính thức" : "企業公式オーナー管理"}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Service & Comparison */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                {locale === "en" ? "Service & Pricing" : locale === "vi" ? "Dịch vụ & So sánh" : "サービス案内・比較"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
              <li>
                <LocaleLink href="/pricing" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors font-semibold">
                  {locale === "en" ? "Pricing Plans (Free to Enterprise)" : locale === "vi" ? "Bảng giá (Từ Free đến Enterprise)" : "料金プラン一覧"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/compare" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Competitor Comparison" : locale === "vi" ? "So sánh với đối thủ" : "他社サービス徹底比較"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/contact" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Help & Contact Us" : locale === "vi" ? "Hỗ trợ & Liên hệ" : "お問い合わせ・サポート"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/opt-out" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Company Info Opt-out" : locale === "vi" ? "Yêu cầu ẩn thông tin" : "情報掲載停止 (オプトアウト)"}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/unsubscribe" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                  {locale === "en" ? "Email Unsubscribe" : locale === "vi" ? "Hủy nhận email" : "メール配信解除"}
                </LocaleLink>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>
                {locale === "en" ? "Legal & Trust" : locale === "vi" ? "Pháp lý & Tuân thủ" : "法務・コンプライアンス"}
              </span>
            </h3>
            <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
              <li>
                <LocaleLink href="/tokushoho" className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors font-medium">
                  {locale === "en" ? "Act on Specified Commercial Transactions" : locale === "vi" ? "Luật giao dịch thương mại đặc định" : "特定商取引法に基づく表記"}
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
                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {locale === "en"
                    ? "Registered invoice system compliant. Providing trusted open corporate intelligence."
                    : locale === "vi"
                    ? "Hệ thống hóa đơn hợp chuẩn khấu trừ thuế Nhật Bản. Dữ liệu mở minh bạch & đáng tin cậy."
                    : "適格請求書発行事業者登録対応。国税庁法人番号公表データに基づく適正な情報提供。"}
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. B2B Trust & Compliance Badges */}
        <div className="pt-8 pb-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">国税庁データ連携</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">法人番号公表サイト準拠</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">インボイス制度対応</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">適格請求書・領収書即時発行</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Stripe 決済保護</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">PCI DSS レベル1認定暗号化</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#151B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <Lock className="w-4 h-4 text-teal-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">SSL/TLS 256bit 暗号化</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">個人情報保護法厳格遵守</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Bar: Brand Logo, Social Channels & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <LocaleLink href="/" className="flex items-center gap-2.5 active:scale-98 transition-transform">
              <div className="w-7 h-7 rounded-lg bg-[#1B4F8A] flex items-center justify-center shadow-xs shrink-0">
                <LogoIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
                Kigyou<span className="text-[#1B4F8A] dark:text-blue-400">-list</span>
              </span>
            </LocaleLink>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {locale === "en"
                ? "Japan's Leading Open Corporate Intelligence Platform"
                : locale === "vi"
                ? "Nền tảng dữ liệu doanh nghiệp mở hàng đầu Nhật Bản"
                : "国内最大級500万件の法人オープンデータ基盤"}
            </span>
          </div>

          {/* Social Channels */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
              Official Channels:
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
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#1B4F8A] hover:border-[#1B4F8A] dark:hover:text-blue-400 dark:hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-150 shadow-2xs"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            &copy; 2022 - {new Date().getFullYear()} Kigyou-list. {t.footer.rights}
          </div>
        </div>

      </div>
    </footer>
  );
};
