"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Send, Sparkles, ShieldCheck, CheckCircle2, Clock, 
  ArrowRight, FileText, Phone, Mail, Building2, User, 
  ChevronDown, Check, Zap, Target, BarChart3,
  ExternalLink, Loader2, AlertCircle, Award, Layers
} from "lucide-react";
import Link from "next/link";

export default function FormMarketingPage() {
  const { locale } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Enterprise Custom Inquiry Form states
  const [selectedVolume, setSelectedVolume] = useState<"10k" | "20k" | "50k" | "custom">("10k");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !email) {
      setErrorMsg(
        isJa
          ? "必須項目（会社名、お名前、メールアドレス）を入力してください。"
          : isVi
          ? "Vui lòng nhập các trường bắt buộc (Tên công ty, Họ tên, Email)."
          : "Please enter all required fields."
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const volumeLabels = {
      "10k": "10,000件〜20,000件 (大口プラン)",
      "20k": "20,000件〜50,000件 (大規模配信)",
      "50k": "50,000件以上 / 定期配信",
      "custom": "自社保有リスト・その他カスタム要件"
    };

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FORM_DM_CAMPAIGN",
          company_name: companyName,
          person_in_charge: contactName,
          requester_email: email,
          mobile_number: phone,
          locale,
          message: `【フォーム営業代行 大口・エンタープライズご相談】
■ 希望ボリューム: ${volumeLabels[selectedVolume]}
■ 相談内容・商材概要:
${message || "未入力"}`
        })
      });

      if (!res.ok) throw new Error("Failed to submit inquiry");
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        isJa
          ? "送信に失敗しました。時間をおいて再試行してください。"
          : isVi
          ? "Gửi yêu cầu thất bại. Vui lòng thử lại sau."
          : "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: isJa
        ? "問い合わせフォーム営業は特定商取引法などの法律上問題ありませんか？"
        : isVi
        ? "Gửi Form DM có vi phạm luật chống spam hay luật Tokushoho tại Nhật không?"
        : "Is contact form outreach compliant with Japanese anti-spam regulations?",
      a: isJa 
        ? "はい、法令を遵守した設計を行っております。送信文面には特定商取引法に基づく発信者情報（会社名・担当者名・連絡先）および送信停止（オプトアウト）案内を必ず明記します。また、当社のAIシステムにより「営業目的の連絡お断り」と明記されている企業を自動除外するため、クレームリスクを最小化しています。"
        : isVi
        ? "Hoàn toàn hợp pháp và tuân thủ đúng Luật giao dịch thương mại đặc định (特定商取引法) của Nhật Bản. Mỗi thông điệp gửi đi đều ghi rõ thông tin pháp nhân người gửi và câu hướng dẫn từ chối nhận tin (Opt-out). Đặc biệt, hệ thống AI của chúng tôi tự động quét và bỏ qua các công ty có ghi chú 'Cấm chào hàng' (営業お断り)."
        : "Yes, fully compliant with Japanese laws. Every message contains complete sender corporate disclosure and an explicit opt-out notice. Additionally, our AI automatically filters out forms with anti-sales disclaimers."
    },
    {
      q: isJa
        ? "テレアポやメール営業（メルマガ）と何が違うのですか？"
        : isVi
        ? "Điểm khác biệt lớn nhất so với Telesales và Cold Email là gì?"
        : "How does this compare to Cold Email and Telesales?",
      a: isJa
        ? "メルマガや代表メール（info@宛）はスパムフィルターや受付で埋もれがちですが、Webサイトのお問い合わせフォームは【見込み客からの連絡窓口】であるため、社内の担当部署や決裁者（役員・部長クラス）が必ず目を通します。そのため閲覧率が50%〜90%と圧倒的に高く、アポイント獲得単価を大幅に削減できます。"
        : isVi
        ? "Email gửi hòm thư chung (info@) thường bị lễ tân bỏ qua hoặc rơi vào mục Spam. Ngược lại, Form liên hệ trên website là kênh đón khách hàng nên luôn được Ban Giám đốc, Trưởng phòng Kinh doanh hoặc CSKH kiểm tra kỹ lưỡng. Tỷ lệ mở thực tế đạt 50% - 90%, mang lại số lượng cuộc hẹn cao gấp nhiều lần."
        : "Unlike general info@ inboxes that get flooded with spam, corporate contact forms are designated inquiry channels actively monitored by executives and managers, resulting in 50%-90% read rates."
    },
    {
      q: isJa
        ? "文面がまだ完成していないのですが、どうすればよいですか？"
        : isVi
        ? "Chúng tôi chưa có kịch bản chào hàng tiếng Nhật chuẩn thì có được hỗ trợ không?"
        : "Can you help optimize our Japanese pitch template?",
      a: isJa
        ? "管理画面内に日本のビジネスマナーに対応した「業種別テンプレート」を複数ご用意しております。自社のサービス概要や会社名を当てはめるだけで、誰でも効果的なアプローチ文面を簡単に作成いただけます。また、作成された文面は配信開始前に運営スタッフが特定商取引法やNGワードの事前審査を行いますので、安心してご利用いただけます。"
        : isVi
        ? "Trong trang quản trị (Dashboard) có sẵn thư viện mẫu kịch bản Kính ngữ (Keigo) chuẩn theo từng ngành nghề. Bạn chỉ cần điền tên sản phẩm là có thể kích hoạt. Ngoài ra, đội ngũ quản trị sẽ rà soát tuân thủ luật Tokushoho và từ khóa cấm trước khi hệ thống bắt đầu phát hành."
        : "Our dashboard provides pre-built Japanese business etiquette (Keigo) templates. All submitted scripts undergo compliance verification prior to dispatch."
    },
    {
      q: isJa
        ? "送信結果やレポートはどのように確認できますか？"
        : isVi
        ? "Sau khi gửi xong, báo cáo kết quả được cung cấp như thế nào?"
        : "How is the delivery proof delivered?",
      a: isJa
        ? "配信開始後、管理画面のダッシュボード上でリアルタイムに送信進捗が反映されます。配信完了後は、送信企業名、法人番号、送信日時、対象フォームURL、送信ステータスを記載した詳細なエクセル/CSVレポートをワンクリックでダウンロード可能です。"
        : isVi
        ? "Ngay khi bắt đầu gửi, tiến độ sẽ cập nhật trực tiếp trên Dashboard. Khi hoàn tất, bạn có thể tải về file Excel/CSV chi tiết gồm: Tên doanh nghiệp, Mã số thuế, Thời gian gửi, URL form và trạng thái gửi thành công."
        : "Live progress updates are shown directly on your dashboard. Upon completion, download full CSV reports containing corporate numbers, company names, form URLs, exact timestamps, and delivery logs."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-[#1B4F8A]/20 font-sans">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION: Authoritative Japan B2B Header */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1117]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* B2B Eyebrow Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 text-xs font-bold mb-6 tracking-wide shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400 animate-pulse" />
                <span>
                  {isJa
                    ? "国内500万社DB連携 × 完全オンライン自動フォーム営業プラットフォーム"
                    : isVi
                    ? "Database 5 Triệu Doanh nghiệp × Tự động hóa Form Outreach B2B"
                    : "5M+ Verified Companies × Self-Serve Contact Form Outreach SaaS"}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] mb-6">
                {isJa ? (
                  <>
                    問い合わせフォーム営業を、<br />
                    <span className="text-[#1B4F8A] dark:text-blue-400">
                      オンラインで最短即日スタート。
                    </span>
                  </>
                ) : isVi ? (
                  <>
                    Tiếp cận trực tiếp ban lãnh đạo doanh nghiệp Nhật với<br />
                    <span className="text-[#1B4F8A] dark:text-blue-400">
                      Nền tảng Tự động Gửi Form Marketing B2B
                    </span>
                  </>
                ) : (
                  <>
                    Scale Your B2B Meetings in Japan with<br />
                    <span className="text-[#1B4F8A] dark:text-blue-400">
                      Self-Serve Form Outreach Platform
                    </span>
                  </>
                )}
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
                {isJa
                  ? "テレアポの受付ブロックやメールの迷惑フォルダを完全回避。500万社データベースからターゲット企業を抽出し、管理画面から自社の営業文面を即時設定。運営による事前法令・NGワード審査で、安全かつ効率的な新規商談創出を実現します。"
                  : isVi
                  ? "Vượt qua bộ lọc spam và lễ tân. Lọc tệp khách hàng từ 5 triệu doanh nghiệp, tự soạn kịch bản và kích hoạt chiến dịch ngay trên hệ thống. Đội ngũ kiểm duyệt tuân thủ Tokushoho và nội dung trước khi gửi để đảm bảo an toàn tuyệt đối."
                  : "Bypass gatekeepers and spam filters. Filter hyper-targeted prospects from 5M+ records, set up your pitch template, and dispatch automatically with our safety & compliance verification."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/${locale}/dashboard?tab=formCampaigns`}
                  className="px-6 py-3.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isJa
                      ? "今すぐ配信キャンペーンを設定する"
                      : isVi
                      ? "Thiết lập chiến dịch gửi ngay"
                      : "Launch Campaign Now"}
                  </span>
                </Link>
                <Link
                  href={`/${locale}/search?contact_form=true`}
                  className="px-6 py-3.5 rounded-lg font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <span>
                    {isJa
                      ? "フォーム対象企業を検索"
                      : isVi
                      ? "Khám phá danh sách có Form"
                      : "Search Companies with Forms"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Key Trust Metrics Bar (B2B Spec Matrix) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800">
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">5,070,000+</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "収録法人データベース" : isVi ? "Dữ liệu pháp nhân toàn Nhật" : "Total Companies in DB"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-[#1B4F8A] dark:text-blue-400">235,000+</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "フォームURL常時解析済" : isVi ? "Form liên hệ sẵn sàng gửi" : "Verified Form URLs"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">50〜90%</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "平均開封・閲覧率" : isVi ? "Tỷ lệ mở & đọc thực tế" : "Average Read Rate"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-200">¥16.1〜</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{isJa ? "送信完了単価 (最安水準)" : isVi ? "Chi phí gửi từ 16.1 JPY/form" : "Cost per form from 16.1 JPY"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE: Why Form DM > Cold Email & Telesales */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
              {isJa ? "他アウトバウンド手法との決定的な違い" : isVi ? "So sánh Form DM với các kênh Outbound khác tại Nhật" : "Why Form Outreach Beats Traditional Channels"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              {isJa
                ? "テレアポ・代表メール営業の課題をすべて解決する次世代の営業アプローチです。"
                : isVi
                ? "Giải quyết triệt để vấn đề bị lễ tân chặn hay email rơi vào hộp thư rác."
                : "A modern B2B acquisition strategy designed to bypass spam filters and gatekeepers."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white dark:bg-[#161B22] rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xs text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                  <th className="p-4 sm:p-5 font-bold text-slate-700 dark:text-slate-300">{isJa ? "比較項目" : isVi ? "Tiêu chí" : "Metric"}</th>
                  <th className="p-4 sm:p-5 font-medium text-slate-500 dark:text-slate-400">{isJa ? "代表メール (info@)" : isVi ? "Cold Email (info@)" : "Cold Email"}</th>
                  <th className="p-4 sm:p-5 font-medium text-slate-500 dark:text-slate-400">{isJa ? "テレアポ (架電)" : isVi ? "Telesales (Gọi điện)" : "Cold Calling"}</th>
                  <th className="p-4 sm:p-5 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 border-l border-r border-blue-200/80 dark:border-blue-900/60">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                      {isJa ? "Kigyou-List フォーム営業" : isVi ? "Gửi Form DM (Kigyou-List)" : "Kigyou-List Form DM"}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "閲覧・到達率" : isVi ? "Tỷ lệ đọc / Mở" : "Read / Open Rate"}</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">3% 〜 5% (迷惑メール化)</td>
                  <td className="p-4 sm:p-5 text-amber-600 dark:text-amber-400">10% 〜 20% (受付ブロック)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    50% 〜 90% (決裁者必読)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "アプローチ単価" : isVi ? "Chi phí tiếp cận / lượt" : "Cost per touch"}</td>
                  <td className="p-4 sm:p-5">¥1 〜 ¥3</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">¥200 〜 ¥350 / 呼</td>
                  <td className="p-4 sm:p-5 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    ¥16.1 〜 ¥19.6 / 送信完了
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "アポ獲得率 (CVR)" : isVi ? "Tỷ lệ chốt cuộc hẹn" : "Meeting CVR"}</td>
                  <td className="p-4 sm:p-5 text-slate-500">0.05% 〜 0.1%</td>
                  <td className="p-4 sm:p-5">0.5% 〜 1.0%</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    0.5% 〜 2.0% (高レスポンス)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "自社リソース負荷" : isVi ? "Gánh nặng nhân sự nội bộ" : "In-house Workload"}</td>
                  <td className="p-4 sm:p-5">中 (配信リスト管理・SPF)</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">極めて大 (担当者の疲弊)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    数分で完了 (完全オンライン完結)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold">{isJa ? "クレーム防止対策" : isVi ? "Phòng chống khiếu nại" : "Complaint Prevention"}</td>
                  <td className="p-4 sm:p-5">ドメイン汚染リスク大</td>
                  <td className="p-4 sm:p-5">ガチャ切り・苦情リスク</td>
                  <td className="p-4 sm:p-5 font-bold text-[#1B4F8A] dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/20 border-l border-r border-blue-200/60 dark:border-blue-900/40">
                    AI自動除外 ＆ 運営事前審査
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 CORE FEATURES */}
        <section className="py-16 bg-slate-50/60 dark:bg-[#12161E] border-t border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                {isJa ? "Kigyou-list が選ばれる4つの強み" : isVi ? "4 Ưu điểm độc quyền của Nền tảng Gửi Form Kigyou-List" : "4 Pillars of Kigyou-List Form Outreach SaaS"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                {isJa
                  ? "高い反響率と法令遵守の両立を支えるセルフサービステクノロジー。"
                  : isVi
                  ? "Tối ưu hóa chuyển đổi và bảo vệ uy tín thương hiệu bằng quy trình tự động hóa chuẩn xác."
                  : "Enterprise-grade safety, precision targeting, and high conversion safeguards."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Feature 1 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "AI「営業お断り」自動検知・除外フィルター" : isVi ? "AI Tự động bỏ qua Form 'Cấm chào hàng'" : "AI Anti-Spam Disclaimer Detector"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "フォーム周辺にある「営業目的の連絡はお断り」「セールス禁止」などの免責文言をAIが事前解析。該当する企業には自動的に送信をスキップし、貴社のブランド価値を保全します。"
                      : isVi
                      ? "Thuật toán AI tự động quét nội dung trang form. Nếu phát hiện các câu cảnh báo như '営業お断り' (Cấm quảng cáo), bot sẽ lập tức bỏ qua để đảm bảo an toàn tuyệt đối cho thương hiệu của bạn."
                      : "Our AI scans DOM for anti-sales keywords before submitting, automatically skipping non-compliant forms to protect your brand reputation."}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "運営スタッフによる事前法令・NGワード審査" : isVi ? "Duyệt kịch bản tuân thủ Pháp luật & Từ khóa cấm" : "Human Compliance & Tokushoho Review"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "送信前に特定商取引法に基づく発信者情報やオプトアウト案内の記載を専任スタッフが迅速にチェック（最短2〜4時間）。法令違反や過度な売り込みトラブルを未然に防止します。"
                      : isVi
                      ? "Trước khi gửi, chuyên viên sẽ kiểm duyệt kịch bản để đảm bảo đầy đủ thông tin pháp nhân người gửi và câu từ chối nhận tin (opt-out), tránh mọi rủi ro vi phạm pháp luật Nhật Bản."
                      : "Every submitted campaign is reviewed by our compliance specialists within 2-4 hours to ensure Tokushoho and opt-out regulations are strictly met."}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "500万社DBから高精度ターゲティング" : isVi ? "Nhắm chọn đối tượng mục tiêu từ 5 triệu doanh nghiệp" : "Hyper-Targeting from 5M+ Enterprise DB"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "JSIC中分類業界コード、資本金、従業員規模、都道府県、求人・助成金シグナルを組み合わせ、本当に貴社の商品を必要としている企業だけを狙い撃ちできます。"
                      : isVi
                      ? "Kết hợp ngành nghề JSIC, số vốn, số nhân viên, tỉnh thành, tín hiệu tuyển dụng (HelloWork) hoặc nhận trợ cấp nhà nước để nhắm đúng các công ty có ngân sách và nhu cầu thực tế."
                      : "Filter by JSIC industry codes, capital amount, employee headcounts, prefecture, and hiring signals to target high-budget buyers."}
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                    {isJa ? "リアルタイム管理画面 & CSV証跡レポート" : isVi ? "Báo cáo minh bạch 100% kèm Log & Bằng chứng" : "Live Dashboard & 100% Audit Logs"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {isJa
                      ? "送信進捗は管理画面でリアルタイムに確認可能。送信完了後は企業名、法人番号、送信日時、フォームURLを網羅したCSVレポートをいつでもダウンロードいただけます。"
                      : isVi
                      ? "Theo dõi tiến độ gửi trực tiếp trên giao diện quản trị. Tải về file báo cáo chi tiết gồm tên công ty, link form, thời điểm gửi, kết quả xác nhận bất cứ lúc nào."
                      : "Track delivery progress live in your dashboard. Download comprehensive CSV audit files including timestamps and URLs upon completion."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[#1B4F8A] dark:text-blue-400 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold mb-3">
              <span>{isJa ? "シンプル＆成果重視の料金体系" : isVi ? "Bảng giá minh bạch - Không phí ẩn" : "Transparent Pricing - No Hidden Fees"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
              {isJa ? "送信ボリューム別プラン" : isVi ? "Các gói chiến dịch gửi Form" : "Outreach Volume Packages"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              {isJa ? "初期費用ゼロ・月額固定費ゼロ。管理画面から即座にお申し込み・文面設定いただけます。" : isVi ? "Không phí khởi tạo, không phí duy trì. Tự lên kịch bản và kích hoạt trực tiếp từ hệ thống." : "Zero setup fees, zero monthly commitments. Pure pay-as-you-go delivery."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* 1,000 Plan */}
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {isJa ? "1,000 件プラン" : isVi ? "Gói Starter 1.000 Form" : "Starter (1,000 Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isJa ? "まずは効果検証・テスト送信に最適" : isVi ? "Thử nghiệm phản hồi thị trường" : "Ideal for testing product-market fit"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">¥19,600</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="line-through text-slate-400 text-xs">¥28,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px]">
                    30% OFF
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-semibold mb-6">
                  {isJa ? "単価: 19.6円 / 送信完了" : isVi ? "19.6 JPY / form gửi thành công" : "19.6 JPY / delivered form"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "ターゲット企業リスト抽出" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "Target list filtering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "AI営業お断り自動除外" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI anti-sales form skip"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "業種別テンプレート活用" : isVi ? "Thư viện mẫu kịch bản chuẩn Keigo" : "Industry templates library"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "運営による事前法令・NGワード審査" : isVi ? "Kiểm duyệt tuân thủ Tokushoho" : "Pre-dispatch compliance check"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "リアルタイム進捗 ＆ CSVレポート" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "Realtime logs & CSV report"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="mt-8 w-full py-2.5 rounded-lg font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block"
              >
                {isJa ? "このプランで配信設定する" : isVi ? "Cấu hình gói Starter" : "Select Starter"}
              </Link>
            </div>

            {/* 3,000 Plan (RECOMMENDED) */}
            <div className="bg-white dark:bg-[#161B22] border-2 border-[#1B4F8A] dark:border-blue-500 rounded-xl p-6 sm:p-7 shadow-xs flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1B4F8A] text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs whitespace-nowrap">
                {isJa ? "推奨・一番人気の標準プラン" : isVi ? "Phổ biến & Tối ưu nhất" : "RECOMMENDED & BEST VALUE"}
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1B4F8A] dark:text-blue-400 mb-1">
                  {isJa ? "3,000 件プラン" : isVi ? "Gói Standard 3.000 Form" : "Standard (3,000 Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isJa ? "本格的なリード獲得・商談創出に" : isVi ? "Đạt lượng chuyển đổi cuộc hẹn ổn định" : "Optimal for scalable lead generation"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-[#1B4F8A] dark:text-blue-400">¥48,300</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="line-through text-slate-400 text-xs">¥69,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px]">
                    30% OFF
                  </span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">
                  {isJa ? "単価: 16.1円 / 送信完了 (業界最安級)" : isVi ? "16.1 JPY / form (Tiết kiệm tối đa)" : "16.1 JPY / delivered form (Save 42%)"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "ターゲット企業リスト抽出" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "Target list filtering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "AI営業お断り自動除外" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI anti-sales form skip"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isJa ? "企業名・住所などの自動差し込みタグ対応" : isVi ? "Tự động chèn {company_name}, {location}" : "Dynamic placeholder tags"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "優先スピード審査（最短2時間）" : isVi ? "Ưu tiên kiểm duyệt trong 2 giờ" : "Priority 2-hour compliance check"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "リアルタイム進捗 ＆ CSVレポート" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "Realtime logs & CSV report"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="mt-8 w-full py-2.5 rounded-lg font-bold text-xs text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs text-center transition-all block active:scale-[0.98]"
              >
                {isJa ? "このプランで今すぐ始める" : isVi ? "Bắt đầu với gói Standard" : "Launch Standard"}
              </Link>
            </div>

            {/* 5,000+ Plan */}
            <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {isJa ? "5,000 件プラン" : isVi ? "Gói Enterprise 5.000 Form" : "Enterprise (5,000+ Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isJa ? "大量アプローチで商談数を最大化" : isVi ? "Quy mô lớn, chi phí trên mỗi form rẻ nhất" : "Maximum appointment pipeline volume"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">¥69,300</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="line-through text-slate-400 text-xs">¥99,000</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-[10px]">
                    30% OFF
                  </span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">
                  {isJa ? "単価: 13.8円 / 送信完了 (最安値レート)" : isVi ? "13.8 JPY / form (Mức giá tốt nhất)" : "13.8 JPY / delivered form (Best rate)"}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "ターゲット企業リスト抽出" : isVi ? "Lọc tệp khách hàng từ 5M DB" : "Target list filtering"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "AI営業お断り自動除外" : isVi ? "AI quét bỏ qua form cấm quảng cáo" : "AI anti-sales form skip"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "自動差し込みタグ＆高度な除外設定" : isVi ? "Hỗ trợ tùy biến nâng cao" : "Advanced filter & tags"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "最優先審査 ＆ 分割配信スケジュール対応" : isVi ? "Chia lịch gửi tối ưu theo ngày" : "Priority scheduling"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "リアルタイム進捗 ＆ CSVレポート" : isVi ? "Báo cáo CSV và theo dõi trực tiếp" : "Realtime logs & CSV report"}</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="mt-8 w-full py-2.5 rounded-lg font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block"
              >
                {isJa ? "このプランで配信設定する" : isVi ? "Cấu hình gói Enterprise" : "Select Enterprise"}
              </Link>
            </div>
          </div>

          {/* Enterprise notice & Cross-link to Data Pricing */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            {isJa ? (
              <>
                <p>
                  ※ 10,000件以上の大口配信や、請求書払い（月末締め翌月末払い）をご希望の場合は、
                  <a href="#contact-form" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold ml-1">
                    下記の大口・カスタム窓口
                  </a>
                  よりお気軽にご相談ください。
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  ※ 企業データベースの閲覧やCSV抽出のみをご希望の場合は、
                  <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 underline font-medium ml-1">
                    企業データ料金プラン
                  </Link>
                  をご確認ください。
                </p>
              </>
            ) : isVi ? (
              <>
                <p>
                  ※ Đối với nhu cầu gửi trên 10.000 Form hoặc thanh toán bằng hóa đơn công ty (Invoice), vui lòng liên hệ tại
                  <a href="#contact-form" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold ml-1">
                    Mục tư vấn Doanh nghiệp lớn
                  </a>.
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  ※ Nếu bạn chỉ có nhu cầu tra cứu và xuất danh sách CSV, vui lòng xem
                  <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 underline font-medium ml-1">
                    Bảng giá Dữ liệu Doanh nghiệp
                  </Link>.
                </p>
              </>
            ) : (
              <>
                <p>
                  For enterprise volume (10,000+ forms) or invoice billing, please contact our
                  <a href="#contact-form" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold ml-1">
                    Enterprise Consultation desk
                  </a>.
                </p>
                <p className="text-slate-400 dark:text-slate-500">
                  If you only need corporate search and CSV list exports, please view our
                  <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 underline font-medium ml-1">
                    Corporate Data Pricing Plans
                  </Link>.
                </p>
              </>
            )}
          </div>
        </section>

        {/* 4-STEP WORKFLOW */}
        <section className="py-16 bg-slate-50/60 dark:bg-[#12161E] border-t border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                {isJa ? "お申し込みから配信開始までの流れ" : isVi ? "Quy trình triển khai 4 bước tự động" : "Simple 4-Step Self-Serve Workflow"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                {isJa ? "管理画面からオンライン完結。最短即日でターゲット企業へのアプローチを開始できます。" : isVi ? "Thực hiện hoàn toàn trực tuyến trên hệ thống, bắt đầu tiếp cận khách hàng chỉ trong ngày." : "Setup entirely online. Launch your outbound campaign in as fast as same-day."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 01</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "ターゲット抽出・リスト指定" : isVi ? "Lọc đối tượng mục tiêu" : "Filter Target Prospects"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "500万社データベースから業種、地域、企業規模、キーワードなどの条件を指定し、アプローチ対象企業を抽出。" : isVi ? "Lọc tệp doanh nghiệp theo ngành nghề, vốn điều lệ, số nhân sự, tỉnh thành hoặc tín hiệu kinh doanh." : "Select target industry, geography, and headcounts from our 5M+ database."}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 02</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "配信メッセージの作成" : isVi ? "Soạn thảo kịch bản chào hàng" : "Compose Pitch Message"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "管理画面上で営業文面を入力。業種別テンプレートを活用し、会社名や住所の自動差し込みタグも設定可能。" : isVi ? "Tự nhập nội dung hoặc chọn mẫu có sẵn, hỗ trợ tự động chèn tên công ty người nhận." : "Craft your pitch copy using industry templates with dynamic company name tags."}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 03</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "オンライン決済 & 運営審査" : isVi ? "Thanh toán & Kiểm duyệt" : "Checkout & Compliance Review"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "オンラインで決済完了後、特定商取引法遵守・オプトアウト記載や営業NG規約を専任スタッフが速やかに審査（最短2〜4時間）。" : isVi ? "Thanh toán trực tuyến. Đội ngũ quản trị kiểm tra tính tuân thủ pháp luật và từ khóa cấm trong 2-4 giờ." : "Instant checkout. Our team verifies Tokushoho compliance within 2 to 4 hours."}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <div className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 mb-1.5 uppercase tracking-wide">STEP 04</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isJa ? "自動配信開始 & リアルタイム管理" : isVi ? "Tự động gửi & Báo cáo real-time" : "Automated Sending & Live Logs"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {isJa ? "AI自動除外を用いて安全に配信。送信完了結果やログは管理画面からリアルタイムで確認・CSVダウンロード可能。" : isVi ? "Hệ thống tự động gửi an toàn qua proxy Nhật. Khách hàng theo dõi tiến độ và tải file CSV trên Dashboard." : "Safe residential proxy dispatching with auto-skip. Audit CSV logs available on dashboard."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ENTERPRISE & CUSTOM INQUIRY FORM */}
        <section id="contact-form" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs">
            
            {/* Self-serve hint banner */}
            <div className="mb-7 p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#1B4F8A] dark:text-blue-300 font-medium">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {isJa
                    ? "1,000件〜5,000件の通常プランは、管理画面から今すぐオンライン完結で配信設定いただけます。"
                    : isVi
                    ? "Các gói tiêu chuẩn từ 1.000 đến 5.000 Form có thể thiết lập trực tiếp trên Dashboard."
                    : "Standard packages (1k - 5k forms) can be launched directly online via your Dashboard."}
                </span>
              </div>
              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                className="px-3.5 py-1.5 rounded-md bg-[#1B4F8A] hover:bg-[#163e6d] text-white font-semibold text-xs shrink-0 transition-colors shadow-2xs"
              >
                {isJa ? "管理画面へ進む" : isVi ? "Mở Dashboard" : "Go to Dashboard"}
              </Link>
            </div>

            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold mb-2">
                {isJa ? "法人・エンタープライズ窓口" : isVi ? "Dành cho Khách hàng Doanh nghiệp lớn" : "Enterprise Inquiries"}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                {isJa ? "大口配信（10,000件以上）・カスタム要件のご相談" : isVi ? "Tư vấn Gói lớn (>10.000 Form) & Hóa đơn công ty" : "Enterprise Volume & Custom Inquiries"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                {isJa
                  ? "月間1万件以上の大規模配信、貴社保有リストへの配信、請求書払い（Paid/後払い）などのご要望はこちらよりお気軽にご相談ください。"
                  : isVi
                  ? "Doanh nghiệp có nhu cầu gửi trên 10.000 form/tháng, gửi trên danh sách riêng hoặc thanh toán hóa đơn công ty (Invoice) vui lòng để lại thông tin."
                  : "Share your high-volume requirements (10,000+ forms), custom targeting lists, or invoice billing needs."}
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {isJa ? "お問い合わせありがとうございます" : isVi ? "Cảm ơn bạn đã gửi yêu cầu!" : "Thank You For Your Request!"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isJa
                    ? "担当者よりご入力いただいたメールアドレス宛に、1営業日以内に大口ボリューム向けのお見積り・進行スケジュールをご案内いたします。"
                    : isVi
                    ? "Chúng tôi đã ghi nhận yêu cầu. Chuyên viên tư vấn sẽ liên hệ lại với bạn trong vòng 24 giờ làm việc."
                    : "Our enterprise sales specialist will contact you via email within 1 business day."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Volume Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {isJa ? "想定送信ボリューム / ご希望要件" : isVi ? "Quy mô số lượng dự kiến / Nhu cầu" : "Estimated Target Volume"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("10k")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "10k"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">10,000〜20,000件</div>
                      <div className="text-[10px] opacity-75">単価相談可</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("20k")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "20k"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">20,000〜50,000件</div>
                      <div className="text-[10px] opacity-75">特別割引適用</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("50k")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "50k"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">50,000件以上</div>
                      <div className="text-[10px] opacity-75">定期配信・API連携</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVolume("custom")}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVolume === "custom"
                          ? "border-[#1B4F8A] bg-blue-50/70 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-semibold">自社リスト配信</div>
                      <div className="text-[10px] opacity-75">カスタム要件</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {isJa ? "貴社名 *" : isVi ? "Tên công ty của bạn *" : "Company Name *"}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder={isJa ? "例: 株式会社〇〇" : isVi ? "Ví dụ: Công ty Cổ phần ABC" : "e.g. Acme Corp"}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                      {isJa ? "ご担当者様名 *" : isVi ? "Họ tên người phụ trách *" : "Contact Name *"}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder={isJa ? "例: 山田 太郎" : isVi ? "Ví dụ: Nguyễn Văn A" : "e.g. John Doe"}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                      {isJa ? "メールアドレス *" : isVi ? "Email nhận báo giá *" : "Business Email *"}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                      {isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="03-1234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-350 mb-1">
                    {isJa ? "ご要望・商材概要・ご質問内容" : isVi ? "Yêu cầu chi tiết, sản phẩm chào hàng hoặc câu hỏi" : "Requirements & Offer Overview"}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={
                      isJa
                        ? "希望件数、対象業種・地域、請求書払い希望、貴社保有リストの利用有無などをご記入ください。"
                        : isVi
                        ? "Mô tả số lượng mong muốn, tệp khách hàng hoặc yêu cầu thanh toán hóa đơn..."
                        : "Please describe your desired volume, targeting criteria, or invoice billing preferences."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-xs sm:text-sm text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isJa ? "大口・カスタム要件を相談する" : isVi ? "Gửi yêu cầu tư vấn Doanh nghiệp" : "Submit Enterprise Inquiry"}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1.5">
              {isJa ? "よくあるご質問 (FAQ)" : isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isJa ? "問い合わせフォーム営業に関する主な疑問にお答えします。" : isVi ? "Giải đáp các thắc mắc về tính an toàn và hiệu quả của dịch vụ." : "Common questions about safety, delivery, and conversion rates."}
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-800 dark:text-white hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
