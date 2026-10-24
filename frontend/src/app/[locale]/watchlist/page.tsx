"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ArrowRight,
  Activity,
  FileCheck2,
  Briefcase,
  Users,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  Zap,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

export default function WatchlistLandingPage() {
  const { locale } = useLanguage();
  const { isLoggedIn, setAuthModalOpen } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Interactive Demo State
  const [activeTab, setActiveTab] = useState<string>("all");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  const sampleEvents = [
    {
      id: 1,
      category: "invoice",
      categoryLabel: "インボイス失効警告",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      companyName: "大和産業株式会社",
      corporateNumber: "1010001088921",
      date: "本日 08:15",
      title: "適格請求書発行事業者の登録取消（失効）を検知",
      description: "国税庁インボイス公表サイトにて「大和産業株式会社」の登録取消・失効が公表されました。仕入税額控除の対象外となる重大リスクがあります。",
      oldVal: "登録済 (T1010001088921)",
      newVal: "登録取消・失効 (免税事業者転落)",
      source: "国税庁 適格請求書発行事業者公表Web-API"
    },
    {
      id: 2,
      category: "representative",
      categoryLabel: "代表者変更",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
      companyName: "株式会社日立製作所",
      corporateNumber: "7010001008844",
      date: "2026-10-21",
      title: "代表執行役 執行役社長兼CEOの異動・就任公表",
      description: "「株式会社日立製作所」における代表取締役・執行役社長の交代が金融庁EDINET臨時報告書にて公表されました。",
      oldVal: "東原 敏昭 (前代表執行役)",
      newVal: "小島 啓二 (現代表執行役 執行役社長兼CEO)",
      source: "金融庁 EDINET 臨時報告書 / 東証開示"
    },
    {
      id: 3,
      category: "relocation",
      categoryLabel: "本店移転",
      badgeColor: "bg-blue-50 text-[#1B4F8A] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      companyName: "日本テクノロジーズ株式会社",
      corporateNumber: "2010001054321",
      date: "2026-10-18",
      title: "本店所在地変更登記の公表",
      description: "事業規模拡大に伴う本店移転登記が完了しました。契約書および請求書の送付先更新が必要です。",
      oldVal: "東京都千代田区神田錦町1-1",
      newVal: "東京都港区六本木6-10-1 六本木ヒルズ森タワー",
      source: "法務局 商業登記情報 / 国税庁法人番号公表"
    },
    {
      id: 4,
      category: "hiring",
      categoryLabel: "新着求人",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      companyName: "株式会社共立メンテナンス",
      corporateNumber: "1010001014427",
      date: "2026-10-10",
      title: "求人募集中・積極採用企業の公表速報",
      description: "東京都千代田区の「株式会社共立メンテナンス」が公式採用ページまたはハローワークにて新規求人を公開中です。",
      oldVal: null,
      newVal: null,
      source: "ハローワーク / 公式採用ページ収集"
    },
    {
      id: 5,
      category: "bankruptcies",
      categoryLabel: "倒産・閉鎖",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      companyName: "東洋物流株式会社",
      corporateNumber: "5010001099887",
      date: "2026-10-05",
      title: "破産手続開始・解散登記の公表",
      description: "東京地方裁判所において破産手続開始の決定を受け、登記記録が閉鎖されました。至急売掛金・債権の保全確認を行ってください。",
      oldVal: "活動中 (正常営業)",
      newVal: "破産手続開始 / 登記記録閉鎖",
      source: "官報・法務局商業登記公告"
    }
  ];

  const filteredDemoEvents = activeTab === "all" 
    ? sampleEvents 
    : sampleEvents.filter(e => e.category === activeTab);

  const handleCtaClick = () => {
    if (isLoggedIn) {
      window.location.href = `/${locale}/dashboard?tab=watchlist`;
    } else {
      setAuthModalOpen(true);
    }
  };

  const faqs = [
    {
      q: isJa 
        ? "本当に100社まで無料ですか？後から料金が発生しますか？" 
        : isVi 
        ? "Có thực sự miễn phí 100 công ty không? Có phát sinh phí sau này không?" 
        : "Is it really free for up to 100 companies? Will I be charged later?",
      a: isJa
        ? "はい、最大100社まで完全無料（無料枠）で常時監視いただけます。クレジットカード登録も一切不要です。監視対象が100社を超える大規模なエンタープライズ与信管理をご希望の場合のみ、有料プランへのアップグレードをご検討ください。"
        : isVi
        ? "Hoàn toàn miễn phí theo dõi tối đa 100 công ty và không yêu cầu thẻ tín dụng. Chỉ khi bạn cần theo dõi danh mục trên 100 doanh nghiệp quy mô lớn mới cần nâng cấp gói trả phí."
        : "Yes, monitoring up to 100 companies is 100% free with no credit card required. Paid plans are only needed if your watchlist exceeds 100 entities."
    },
    {
      q: isJa
        ? "インボイス（適格請求書）の失効データはどれくらいの頻度で更新されますか？"
        : isVi
        ? "Dữ liệu thu hồi hóa đơn Invoice được cập nhật với tần suất nào?"
        : "How frequently is the invoice revocation data updated?",
      a: isJa
        ? "国税庁の適格請求書発行事業者公表Web-APIと毎日直接照合を実施しています。国税庁による公表後、最速で当日または翌朝の自動巡回で失効を検知し、ご登録メールアドレスへ速報通知します。"
        : isVi
        ? "Hệ thống đối soát trực tiếp hàng ngày với Web-API Cục thuế Quốc gia Nhật Bản (NTA). Ngay sau khi Cục thuế công bố thu hồi, hệ thống sẽ phát hiện và bắn email cảnh báo vào sáng hôm sau."
        : "We sync daily with the National Tax Agency (NTA) Qualified Invoice Web-API. Revocations are detected and notified to your registered email immediately."
    },
    {
      q: isJa
        ? "代表者交代（社長就任）の情報ソースは何ですか？"
        : isVi
        ? "Nguồn dữ liệu thay đổi Giám đốc đại diện là từ đâu?"
        : "What is the data source for representative changes?",
      a: isJa
        ? "上場企業4,000社については金融庁EDINETの『臨時報告書（代表取締役の異動）』をリアルタイムで直接解析しています。非上場企業については経済産業省gBizINFOおよび法務局商業登記の公表履歴を定期対照して捕捉しています。"
        : isVi
        ? "Với 4.000 công ty niêm yết, hệ thống phân tích trực tiếp Báo cáo bất thường (臨時報告書) từ FSA EDINET theo thời gian thực. Với công ty chưa niêm yết, đối soát qua gBizINFO Bộ Kinh tế và dữ liệu Pháp vụ cục."
        : "For listed companies, we parse FSA EDINET Extraordinary Reports in real-time. For private companies, we cross-reference METI gBizINFO and commercial registration filings."
    },
    {
      q: isJa
        ? "監視リストに登録した企業情報は他社に公開されますか？"
        : isVi
        ? "Danh sách công ty tôi theo dõi có bị lộ cho người khác không?"
        : "Is my monitored watchlist visible to others?",
      a: isJa
        ? "いいえ、お客様が監視リストに登録した企業情報は完全に暗号化・保護されており、第三者や他のユーザーに公開されることは一切ありません。自社専用のプライベート与信管理スペースとして安全にご利用いただけます。"
        : isVi
        ? "Không. Toàn bộ danh sách doanh nghiệp theo dõi được mã hóa riêng tư cho từng tài khoản, tuyệt đối không ai khác có thể nhìn thấy."
        : "No, your monitored watchlist is strictly private and encrypted. It is never shared or displayed to third parties."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#161B22]/70 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li>
              <Link href={`/${locale}`} className="hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors">
                {isJa ? "ホーム" : isVi ? "Trang chủ" : "Home"}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-slate-400" /></li>
            <li className="font-semibold text-slate-800 dark:text-slate-200">
              {isJa ? "企業監視・重要変動検知アラート" : isVi ? "Giám sát & Cảnh báo biến động" : "Corporate Watchlist & Alerts"}
            </li>
          </ol>
        </div>
      </nav>

      <main className="flex-1 pb-20">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/60 to-white dark:from-[#161B22] dark:via-[#0D1117] dark:to-[#161B22]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#1B4F8A] border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-2xs">
              <Bell className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{isJa ? "企業監視・重要変動検知エンジン" : isVi ? "Cỗ Máy Giám Sát & Cảnh Báo Doanh Nghiệp" : "Corporate Intelligence & Alert Engine"}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{isJa ? "無料枠: 最大100社" : isVi ? "Miễn phí: 100 Công ty" : "Free 100 Companies"}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isJa ? (
                <>
                  取引先の「まさか」を未然に防ぐ。<br className="hidden sm:inline" />
                  企業監視・重要変動検知プラットフォーム
                </>
              ) : isVi ? (
                <>
                  Bảo vệ doanh nghiệp trước rủi ro đối tác.<br className="hidden sm:inline" />
                  Nền Tảng Giám Sát & Cảnh Báo Biến Động Doanh Nghiệp Tự Động
                </>
              ) : (
                <>
                  Stay Ahead of Critical Counterparty Risks.<br className="hidden sm:inline" />
                  Automated Corporate Watchlist & Alert Platform
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="max-w-3xl mx-auto text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {isJa
                ? "適格請求書（インボイス）の失効・取消、代表取締役の交代、本店移転、倒産・解散登記、採用活動を毎日自動巡回。国税庁Web-APIおよび金融庁EDINETと連携し、異動発生時に即時メールでお知らせします。"
                : isVi
                ? "Tự động theo dõi thu hồi số hóa đơn Invoice, đổi Giám đốc đại diện, chuyển trụ sở, phá sản và tuyển dụng mỗi ngày. Liên kết trực tiếp Cục thuế NTA & FSA EDINET, gửi email cảnh báo ngay trong ngày."
                : "Automated daily tracking for invoice revocations, CEO transitions, relocations, bankruptcies, and hiring signals. Directly integrated with NTA Web-API & FSA EDINET with instant email alerts."}
            </p>

            {/* Micro-Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {isJa ? "国税庁Web-API直接連携" : isVi ? "Liên kết Web-API Quốc thuế" : "Direct NTA Web-API Sync"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                {isJa ? "金融庁EDINET臨時報告書捕捉" : isVi ? "Báo cáo bất thường EDINET" : "FSA EDINET Real-Time"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                {isJa ? "毎朝8:00 自動メール速報" : isVi ? "Email cảnh báo 8:00 sáng" : "8:00 AM Automated Digest"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                {isJa ? "100社まで完全無料（クレカ不要）" : isVi ? "Miễn phí 100 công ty" : "Free 100 Co. (No Credit Card)"}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-[#1B4F8A] hover:bg-[#143D6C] shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isLoggedIn 
                    ? (isJa ? "見守り管理ダッシュボードを開く" : isVi ? "Mở Dashboard Giám Sát" : "Open Watchlist Dashboard")
                    : (isJa ? "今すぐ無料で100社を見守り登録する" : isVi ? "Đăng ký theo dõi 100 công ty miễn phí" : "Start Watching 100 Companies Free")}
                </span>
              </button>

              <Link
                href={`/${locale}/invoice`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#151B22] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs"
              >
                <FileCheck2 className="w-4 h-4 text-slate-500" />
                <span>{isJa ? "インボイス一括照会ツールを試す" : isVi ? "Dùng thử tra cứu Invoice" : "Try Batch Invoice Tool"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Interactive Timeline Demo Mockup */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/80 uppercase">
                  Live Preview
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {isJa ? "最新変動タイムラインの動作イメージ" : isVi ? "Mô phỏng dòng thời gian biến động thực tế" : "Real-Time Change Timeline Preview"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isJa ? "管理画面で実際に表示されるタイムラインを体験できます。タブを切り替えて各イベントの通知内容をご確認ください。" : "Switch tabs below to preview each event alert format."}
                </p>
              </div>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>自動同期中（国税庁・EDINET）</span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", labelJa: "すべて (5件)" },
                { id: "invoice", labelJa: "インボイス失効警告" },
                { id: "representative", labelJa: "代表者変更" },
                { id: "relocation", labelJa: "本店移転" },
                { id: "hiring", labelJa: "新着求人" },
                { id: "bankruptcies", labelJa: "倒産・閉鎖" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 dark:bg-[#151B22] dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  {tab.labelJa}
                </button>
              ))}
            </div>

            {/* Event Cards Stream */}
            <div className="space-y-3">
              {filteredDemoEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#0D1117]/60 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ev.badgeColor}`}>
                        {ev.categoryLabel}
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {ev.companyName}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        法人番号: {ev.corporateNumber}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.date}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5">
                    {ev.description}
                  </p>

                  {(ev.oldVal || ev.newVal) && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1 font-mono">
                      {ev.oldVal && (
                        <div className="text-slate-500 flex items-start gap-1.5">
                          <span className="font-semibold text-rose-600 shrink-0 font-sans">変更前:</span>
                          <span className="line-through">{ev.oldVal}</span>
                        </div>
                      )}
                      {ev.newVal && (
                        <div className="text-slate-800 dark:text-slate-200 flex items-start gap-1.5 font-medium">
                          <span className="font-semibold text-emerald-600 shrink-0 font-sans">変更後:</span>
                          <span className="text-slate-900 dark:text-white font-bold">{ev.newVal}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>情報ソース: {ev.source}</span>
                    <span className="text-[#1B4F8A] dark:text-blue-400 font-semibold inline-flex items-center gap-0.5">
                      企業詳細を照合 ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 6 Core Monitoring Pillars (6 Trụ Cột Giám Sát Chuyên Sâu) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#1B4F8A] dark:text-blue-400 uppercase tracking-wider">
              6 Core Intelligence Pillars
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isJa ? "検知・監視する6つの重要シグナル" : isVi ? "6 Trụ cột giám sát biến động chuyên sâu" : "6 Critical Event Categories Tracked Daily"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              企業の信用状態、コンプライアンス、営業機会に関わるあらゆる公式変動を網羅。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-rose-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200/80 dark:border-rose-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  1. インボイス失効・取消検知
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  取引開始時に有効だったT番号も、後に免税事業者への転落や未払いで失効するケースが多発しています。国税庁Web-APIから失効を当日検知し、消費税仕入税額控除の適用否認（自社負担）を防ぎます。
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                主な対象: 経理部・財務部・税務調査対策
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-200/80 dark:border-purple-800">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  2. 代表取締役・役員の異動速報
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  金融庁EDINET臨時報告書（上場企業）および公式登記を直接追跡。新社長就任のタイミングで祝電・挨拶を送ることで競合に先駆けて良好な関係を構築。役員交代に伴う経営方針の変化も察知します。
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                主な対象: 営業企画・役員室・キーマン開拓
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-200/80 dark:border-blue-800">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  3. 本店移転・商号変更の追跡
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  法人の社名変更やオフィスの移転登記を即日補足。旧住所への請求書誤配や契約書の所在地相違を防止。オフィス移転に伴う什器・ITインフラ・通信回線の提案タイミングも捉えられます。
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-[#1B4F8A] dark:text-blue-400">
                主な対象: 総務・法務・オフィス移転営業
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-rose-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200/80 dark:border-rose-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  4. 倒産・清算・解散登記の速報
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  破産手続開始、特別清算、解散登記の公表をキャッチ。取引先が夜逃げ・破産する前の兆候を早期に検知し、売掛金の即時回収や取引限度額の縮小など、与信管理と債権保全を素早く行えます。
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                主な対象: 与信管理・審査部・債権回収
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/80 dark:border-emerald-800">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  5. 新着求人・積極採用シグナル
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  ハローワークおよび公式採用ページから最新の採用募集を検知。人材採用に予算を投じている「成長中・資金力のある企業」を素早く特定し、人材紹介・SaaS・福利厚生サービスの高成約アプローチを実現します。
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                主な対象: 人材業界・HRテック・B2B営業
              </div>
            </div>

            {/* Pillar 6 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200/80 dark:border-amber-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  6. 新設法人・新規設立企業速報
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  毎週登記される全国の新設企業データを自動集計。設立直後は銀行口座開設、オフィス什器、税理士、Webサイト制作など需要の塊です。競合がまだ接触していない設立直後の段階で最速アプローチが可能です。
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                主な対象: 士業・OA機器・Web制作・新規開拓
              </div>
            </div>
          </div>
        </section>

        {/* 4. Comparison Table (手作業 vs Kigyou-list) */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isJa ? "従来の手作業管理との圧倒的な違い" : "Why Modern B2B Teams Choose Automated Watchlist"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              毎月の確認工数を90%削減し、見落としによる損失リスクをゼロにします。
            </p>
          </div>

          <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="py-3.5 px-5">比較項目</th>
                    <th className="py-3.5 px-5 text-slate-500">従来の手動チェック（Excel・個別照会）</th>
                    <th className="py-3.5 px-5 bg-blue-50/60 dark:bg-blue-950/30 text-[#1B4F8A] dark:text-blue-300 font-bold">
                      Kigyou-list 企業監視エンジン
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">インボイス確認工数</td>
                    <td className="py-4 px-5 text-slate-500">毎月国税庁サイトで1社ずつ手入力（膨大な時間）</td>
                    <td className="py-4 px-5 bg-blue-50/40 dark:bg-blue-950/20 font-bold text-emerald-600 dark:text-emerald-400">
                      毎朝自動照合。失効時のみメールでお知らせ（工数ゼロ）
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">失効・倒産への対応速度</td>
                    <td className="py-4 px-5 text-slate-500">税務調査や未払いで発覚するまで気づけない</td>
                    <td className="py-4 px-5 bg-blue-50/40 dark:bg-blue-950/20 font-bold text-slate-900 dark:text-white">
                      公表当日〜翌朝に即座に通知（最速の対応が可能）
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">代表者・役員交代の把握</td>
                    <td className="py-4 px-5 text-slate-500">ニュースや噂レベルでしか知ることができない</td>
                    <td className="py-4 px-5 bg-blue-50/40 dark:bg-blue-950/20 font-bold text-slate-900 dark:text-white">
                      金融庁EDINET臨時報告書・商業登記から直接捕捉
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">導入コスト・初期費用</td>
                    <td className="py-4 px-5 text-slate-500">大手帝国系データベースは年間数十万〜数百万円</td>
                    <td className="py-4 px-5 bg-blue-50/40 dark:bg-blue-950/20 font-bold text-emerald-600 dark:text-emerald-400">
                      100社まで初期費用0円・完全無料（クレカ登録不要）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. 3-Step Setup Guide */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Simple 3-Step Onboarding
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isJa ? "かんたん3ステップで見守りを開始" : "Get Started in 3 Easy Steps"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 relative">
              <div className="text-3xl font-black text-slate-200 dark:text-slate-800 mb-2">01</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                無料アカウント作成 (10秒)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Googleログインまたはメールアドレスのワンタイム認証で即座に完了。クレジットカード登録は不要です。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 relative">
              <div className="text-3xl font-black text-slate-200 dark:text-slate-800 mb-2">02</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                取引先企業を登録 (最大100社)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                企業名検索、またはお手元のExcelからインボイス番号・法人番号をまとめてコピペして一括登録できます。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 relative">
              <div className="text-3xl font-black text-slate-200 dark:text-slate-800 mb-2">03</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                翌朝から自動見守りスタート
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                システムが365日バックグラウンドで監視。登録企業に異動が発生した時だけ、朝8:00に速報メールでお知らせします。
              </p>
            </div>
          </div>
        </section>

        {/* 6. FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#1B4F8A] dark:text-blue-400" />
              <span>よくあるご質問 (FAQ)</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-[#1B4F8A] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                      Q
                    </span>
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${faqOpenIndex === idx ? "rotate-180" : ""}`} />
                </button>
                {faqOpenIndex === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 7. Bottom CTA Banner */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#1B4F8A] via-[#143D6C] to-[#0F2D52] text-white shadow-xl relative overflow-hidden text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-blue-200">
                100% Free Tier • Max 100 Companies
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
                取引先のインボイス失効・倒産・役員異動を、<br />
                今日から自動で見守りませんか？
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                毎月の手作業確認から解放され、重要な税務・与信リスクを見逃さない安心の管理体制を手に入れましょう。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-[#1B4F8A] bg-white hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-[#1B4F8A]" />
                <span>
                  {isLoggedIn 
                    ? "見守り管理ダッシュボードを開く" 
                    : "今すぐ無料で100社を見守り登録する"}
                </span>
              </button>

              <Link
                href={`/${locale}/invoice`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>インボイス一括照会を試す</span>
              </Link>
            </div>

            <div className="pt-2 text-[11px] text-blue-200/80">
              ※ クレジットカード登録不要 • いつでも解除可能 • 国税庁Web-API公表データ直接連携
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
