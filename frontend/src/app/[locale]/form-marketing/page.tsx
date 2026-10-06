"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Send, Sparkles, ShieldCheck, CheckCircle2, Clock, 
  ArrowRight, FileText, Phone, Mail, Building2, User, 
  HelpCircle, ChevronDown, Check, Zap, Target, BarChart3,
  ExternalLink, Loader2, AlertCircle, Award
} from "lucide-react";
import Link from "next/link";

export default function FormMarketingPage() {
  const { locale } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // Form states
  const [selectedPlan, setSelectedPlan] = useState<"1k" | "3k" | "5k">("3k");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !email) {
      setErrorMsg(isJa ? "必須項目（会社名、お名前、メールアドレス）を入力してください。" : isVi ? "Vui lòng nhập các trường bắt buộc (Tên công ty, Họ tên, Email)." : "Please enter all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const planNames = {
      "1k": "1,000件スターター (¥28,000)",
      "3k": "3,000件スタンダード (¥69,000) [人気No.1]",
      "5k": "5,000件エンタープライズ (¥99,000)"
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
          message: `【問い合わせフォーム営業代行 お問い合わせ】
■ 希望プラン: ${planNames[selectedPlan]}
■ ターゲット希望業界・地域: ${targetIndustry || "未定"}
■ 提案内容・相談内容:
${message || "未入力（専任スタッフと相談希望）"}`
        })
      });

      if (!res.ok) throw new Error("Failed to submit inquiry");
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(isJa ? "送信に失敗しました。時間をおいて再試行してください。" : isVi ? "Gửi yêu cầu thất bại. Vui lòng thử lại sau." : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: isJa ? "問い合わせフォーム営業は特定商取引法などの法律上問題ありませんか？" : isVi ? "Gửi Form DM có vi phạm luật chống spam hay luật Tokushoho tại Nhật không?" : "Is contact form outreach compliant with Japanese anti-spam regulations?",
      a: isJa 
        ? "はい、法令を遵守した設計を行っております。送信文面には特定商取引法に基づく発信者情報（会社名・担当者名・連絡先）および送信停止（オプトアウト）案内を必ず明記します。また、当社のAIシステムにより「営業目的の連絡お断り」と明記されている企業を自動除外するため、クレームリスクを最小化しています。"
        : isVi
        ? "Hoàn toàn hợp pháp và tuân thủ đúng Luật giao dịch thương mại đặc định (特定商取引法) của Nhật Bản. Mỗi thông điệp gửi đi đều ghi rõ thông tin pháp nhân người gửi và câu hướng dẫn từ chối nhận tin (Opt-out). Đặc biệt, hệ thống AI của chúng tôi tự động quét và bỏ qua các công ty có ghi chú 'Cấm chào hàng' (営業お断り)."
        : "Yes, fully compliant with Japanese laws. Every message contains complete sender corporate disclosure and an explicit opt-out notice. Additionally, our AI automatically filters out forms with anti-sales disclaimers."
    },
    {
      q: isJa ? "テレアポやメール営業（メルマガ）と何が違うのですか？" : isVi ? "Điểm khác biệt lớn nhất so với Telesales và Cold Email là gì?" : "How does this compare to Cold Email and Telesales?",
      a: isJa
        ? "メルマガや代表メール（info@宛）はスパムフィルターや受付で埋もれがちですが、Webサイトのお問い合わせフォームは【見込み客からの連絡窓口】であるため、社内の担当部署や決裁者（役員・部長クラス）が必ず目を通します。そのため閲覧率が50%〜90%と圧倒的に高く、アポイント獲得単価を大幅に削減できます。"
        : isVi
        ? "Email gửi hòm thư chung (info@) thường bị lễ tân bỏ qua hoặc rơi vào mục Spam. Ngược lại, Form liên hệ trên website là kênh đón khách hàng nên luôn được Ban Giám đốc, Trưởng phòng Kinh doanh hoặc CSKH kiểm tra kỹ lưỡng. Tỷ lệ mở thực tế đạt 50% - 90%, mang lại số lượng cuộc hẹn cao gấp nhiều lần."
        : "Unlike general info@ inboxes that get flooded with spam, corporate contact forms are designated inquiry channels actively monitored by executives and managers, resulting in 50%-90% read rates."
    },
    {
      q: isJa ? "文面がまだ完成していないのですが、相談できますか？" : isVi ? "Chúng tôi chưa có kịch bản chào hàng tiếng Nhật chuẩn thì có được hỗ trợ không?" : "Can you help optimize our Japanese pitch template?",
      a: isJa
        ? "もちろん可能です。日本のビジネス慣習・敬語に精通したスタッフが、貴社の強みや商材をヒアリングし、開封率・返信率を最大化するアプローチ文面をご提案・添削いたします。"
        : isVi
        ? "Chắc chắn có. Đội ngũ chuyên gia am hiểu văn hóa kinh doanh và Kính ngữ (Keigo) Nhật Bản sẽ hỗ trợ tư vấn, chỉnh sửa kịch bản chào hàng của bạn để tối ưu tỷ lệ phản hồi và tránh vi phạm văn hóa."
        : "Yes, our bilingual B2B copywriters will review and optimize your message in natural Japanese business etiquette (Keigo) to maximize conversion."
    },
    {
      q: isJa ? "送信完了後のレポートはどのように確認できますか？" : isVi ? "Sau khi gửi xong, báo cáo kết quả được cung cấp như thế nào?" : "How is the delivery proof delivered?",
      a: isJa
        ? "送信完了後、送信先企業名、法人番号、送信日時、お問い合わせフォームURL、送信ステータスを記載した詳細なエクセル/CSVレポートを納品いたします。"
        : isVi
        ? "Sau khi hoàn tất chiến dịch, bạn sẽ nhận được file Excel/CSV chi tiết gồm: Tên doanh nghiệp, Mã số thuế法人番号, Thời gian gửi, URL form và trạng thái xác nhận gửi thành công."
        : "Upon campaign completion, you receive a full spreadsheet report containing corporate numbers, company names, form URLs, exact timestamps, and delivery confirmation logs."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500/20">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200/70 dark:border-slate-800/80 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-indigo-950/20 dark:via-[#0D1117] dark:to-[#0D1117]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6 shadow-xs animate-in fade-in duration-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>{isJa ? "国内最大級500万社データベース連携" : isVi ? "Kết nối trực tiếp Database 5 Triệu Doanh nghiệp Nhật" : "Direct Integration with 5M+ Japan Companies"}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.2] mb-6">
                {isJa ? (
                  <>
                    アポイント獲得を最短化する<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      問い合わせフォーム営業代行
                    </span>
                  </>
                ) : isVi ? (
                  <>
                    Tối đa hóa cuộc hẹn B2B tại Nhật với<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      Dịch Vụ Gửi Form Doanh Nghiệp (DFY)
                    </span>
                  </>
                ) : (
                  <>
                    Scale Your B2B Meetings in Japan with<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      Automated Form DM Outreach
                    </span>
                  </>
                )}
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-350 leading-relaxed mb-8 max-w-2xl mx-auto">
                {isJa
                  ? "テレアポの受付ブロックやメールの迷惑フォルダを完全回避。500万社のデータベースからターゲット企業を厳選し、お問い合わせフォームへ安全・確実に営業メッセージをお届けします。"
                  : isVi
                  ? "Vượt qua lễ tân và bộ lọc spam. Hệ thống tự động lọc tệp khách hàng mục tiêu từ 5 triệu doanh nghiệp và gửi thông điệp chào hàng trực tiếp vào Form liên hệ với tỷ lệ mở 50% - 90%."
                  : "Bypass gatekeepers and spam folders. Filter hyper-targeted prospects from 5M+ corporate records and deliver your pitch straight into decision-maker inboxes."}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3.5">
                <a
                  href="#contact-form"
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isJa ? "今すぐ無料相談・お見積り" : isVi ? "Nhận báo giá & Tư vấn miễn phí" : "Get Free Quote & Consultation"}</span>
                </a>
                <Link
                  href={`/${locale}/search?contact_form=true`}
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <span>{isJa ? "フォーム対象企業を検索" : isVi ? "Khám phá danh sách có Form" : "Search Companies with Forms"}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Trust Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">5,070,000+</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isJa ? "収録法人データベース" : isVi ? "Dữ liệu pháp nhân toàn Nhật" : "Total Companies in DB"}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">60,000+</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isJa ? "フォームURL常時解析済" : isVi ? "Form liên hệ sẵn sàng gửi" : "Verified Form URLs"}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">50〜90%</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isJa ? "平均開封・閲覧率" : isVi ? "Tỷ lệ mở & đọc thực tế" : "Average Read Rate"}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">¥20〜</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isJa ? "業界最安水準 送信単価" : isVi ? "Chi phí gửi từ 20 JPY/form" : "Cost per form from 20 JPY"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE: Why Form DM > Cold Email & Telesales */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
              {isJa ? "他アウトバウンド手法との決定的な違い" : isVi ? "So sánh Form DM với các kênh Outbound khác tại Nhật" : "Why Form Outreach Beats Traditional Channels"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isJa
                ? "テレアポ・代表メール営業の課題をすべて解決する次世代の営業アプローチです。"
                : isVi
                ? "Giải quyết triệt để vấn đề bị lễ tân chặn hay email rơi vào hộp thư rác."
                : "A modern B2B acquisition strategy designed to bypass spam filters and gatekeepers."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white dark:bg-[#161B22] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <th className="p-4 sm:p-5 font-bold text-slate-600 dark:text-slate-350">{isJa ? "比較項目" : isVi ? "Tiêu chí" : "Metric"}</th>
                  <th className="p-4 sm:p-5 font-bold text-slate-500 dark:text-slate-400">{isJa ? "代表メール (info@)" : isVi ? "Cold Email (info@)" : "Cold Email"}</th>
                  <th className="p-4 sm:p-5 font-bold text-slate-500 dark:text-slate-400">{isJa ? "テレアポ (架電)" : isVi ? "Telesales (Gọi điện)" : "Cold Calling"}</th>
                  <th className="p-4 sm:p-5 font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 border-l border-r border-indigo-200 dark:border-indigo-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      {isJa ? "問い合わせフォーム営業代行" : isVi ? "Gửi Form DM (Kigyou-List)" : "Kigyou-List Form DM"}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-bold">{isJa ? "閲覧・到達率" : isVi ? "Tỷ lệ đọc / Mở" : "Read / Open Rate"}</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">3% 〜 5% (迷惑メール化)</td>
                  <td className="p-4 sm:p-5 text-amber-600 dark:text-amber-400">10% 〜 20% (受付ブロック)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-indigo-50/30 dark:bg-indigo-950/20 border-l border-r border-indigo-200 dark:border-indigo-800">
                    50% 〜 90% (決裁者必読)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold">{isJa ? "アプローチ単価" : isVi ? "Chi phí tiếp cận / lượt" : "Cost per touch"}</td>
                  <td className="p-4 sm:p-5">¥1 〜 ¥3</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">¥200 〜 ¥350 / 呼</td>
                  <td className="p-4 sm:p-5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 border-l border-r border-indigo-200 dark:border-indigo-800">
                    ¥20 〜 ¥28 / 送信完了
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold">{isJa ? "アポ獲得率 (CVR)" : isVi ? "Tỷ lệ chốt cuộc hẹn" : "Meeting CVR"}</td>
                  <td className="p-4 sm:p-5 text-slate-500">0.05% 〜 0.1%</td>
                  <td className="p-4 sm:p-5">0.5% 〜 1.0%</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-indigo-50/30 dark:bg-indigo-950/20 border-l border-r border-indigo-200 dark:border-indigo-800">
                    0.5% 〜 2.0% (高レスポンス)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold">{isJa ? "自社リソース負荷" : isVi ? "Gánh nặng nhân sự nội bộ" : "In-house Workload"}</td>
                  <td className="p-4 sm:p-5">中 (配信リスト管理・SPF)</td>
                  <td className="p-4 sm:p-5 text-rose-600 dark:text-rose-400">極めて大 (担当者の疲弊)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-indigo-50/30 dark:bg-indigo-950/20 border-l border-r border-indigo-200 dark:border-indigo-800">
                    完全ゼロ（丸投げOK）
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold">{isJa ? "クレーム防止対策" : isVi ? "Phòng chống khiếu nại" : "Complaint Prevention"}</td>
                  <td className="p-4 sm:p-5">ドメイン汚染リスク大</td>
                  <td className="p-4 sm:p-5">ガチャ切り・苦情リスク</td>
                  <td className="p-4 sm:p-5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 border-l border-r border-indigo-200 dark:border-indigo-800">
                    AI営業お断り自動除外
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 CORE FEATURES */}
        <section className="py-16 bg-slate-100/50 dark:bg-[#12161E] border-t border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                {isJa ? "Kigyou-list が選ばれる4つの安心理由" : isVi ? "4 Ưu điểm độc quyền của Dịch vụ Gửi Form Kigyou-List" : "4 Pillars of Kigyou-List Form DM Excellence"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {isJa
                  ? "ただ送信するだけでなく、安全・安心に反響を最大化するテクノロジーとサポート。"
                  : isVi
                  ? "Không chỉ gửi form tự động, chúng tôi bảo vệ uy tín và tối đa hóa chuyển đổi cho bạn."
                  : "Enterprise-grade safety, precision targeting, and high conversion safeguards."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {isJa ? "AI「営業お断り」自動検知・除外フィルター" : isVi ? "AI Tự động bỏ qua các Form 'Cấm chào hàng'" : "AI Anti-Spam Disclaimer Detector"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    {isJa
                      ? "フォーム周辺にある「営業目的の連絡はお断り」「セールス禁止」などの免責文言をAIが事前解析。該当する企業には自動的に送信をスキップし、貴社のブランド価値を保全します。"
                      : isVi
                      ? "Thuật toán AI tự động quét nội dung trang form. Nếu phát hiện các câu cảnh báo như '営業お断り' (Cấm quảng cáo), bot sẽ lập tức bỏ qua để đảm bảo an toàn tuyệt đối cho thương hiệu của bạn."
                      : "Our AI scans DOM for anti-sales keywords before submitting, automatically skipping non-compliant forms to protect your brand reputation."}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {isJa ? "日本ビジネス敬語・文面コンサルティング" : isVi ? "Tư vấn & Kiểm tra Kính ngữ (Keigo) B2B chuẩn xác" : "B2B Japanese Keigo Copy Optimization"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    {isJa
                      ? "フォーム経由の連絡において最も重要な「突然の連絡に対する丁寧なお詫び」と「特定商取引法遵守の表示」を網羅。成約率の高いプロ仕様の文面作成を支援します。"
                      : isVi
                      ? "Bao gồm đầy đủ các câu chào hỏi chuẩn mực, xin phép liên hệ lịch sự, và câu từ chối nhận tin (opt-out). Tối ưu hóa từng câu chữ để giám đốc người Nhật cảm thấy được tôn trọng."
                      : "Includes polite apologies for contacting via web forms and full Tokushoho disclosures, crafted to resonate with Japanese corporate executives."}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {isJa ? "500万社DBから高精度ターゲティング" : isVi ? "Nhắm chọn đối tượng mục tiêu từ 5 triệu doanh nghiệp" : "Hyper-Targeting from 5M+ Enterprise DB"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    {isJa
                      ? "JSIC中分類業界コード、資本金、従業員規模、都道府県、求人・助成金シグナルを組み合わせ、本当に貴社の商品を必要としている企業だけを狙い撃ちできます。"
                      : isVi
                      ? "Kết hợp ngành nghề JSIC, số vốn, số nhân viên, tỉnh thành, tín hiệu tuyển dụng (HelloWork) hoặc nhận trợ cấp nhà nước để nhắm đúng các công ty có ngân sách và nhu cầu thực tế."
                      : "Filter by JSIC industry codes, capital amount, employee headcounts, prefecture, and hiring signals to target high-budget buyers."}
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {isJa ? "送信完了レポート納品（証跡の透明性）" : isVi ? "Báo cáo minh bạch 100% kèm Log & Bằng chứng" : "100% Transparent Delivery Audit Logs"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    {isJa
                      ? "送信した企業名、法人番号、送信日時、対象フォームURLを網羅したCSVレポートを納品。ブラックボックスになりがちな営業代行を完全な透明性で提供します。"
                      : isVi
                      ? "Bàn giao danh sách chi tiết gồm tên công ty, link form, thời điểm gửi, kết quả xác nhận. Không có tình trạng báo khống số lượng, hoàn toàn minh bạch."
                      : "Detailed spreadsheet containing company names, corporate numbers, timestamps, and target URLs delivered upon completion."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold mb-3">
              <span>{isJa ? "シンプル＆成果重視の料金体系" : isVi ? "Bảng giá minh bạch - Không phí ẩn" : "Transparent Pricing - No Hidden Fees"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
              {isJa ? "送信ボリューム別プラン" : isVi ? "Các gói chiến dịch gửi Form" : "Outreach Volume Packages"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isJa ? "初期費用ゼロ・月額固定費ゼロ。送信完了件数に応じた明朗会計です。" : isVi ? "Không phí khởi tạo, không phí duy trì. Chi phí tính theo số lượng form tiếp cận." : "Zero setup fees, zero monthly commitments. Pure pay-as-you-go delivery."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 1,000 Plan */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {isJa ? "1,000 件プラン" : isVi ? "Gói Starter 1.000 Form" : "Starter (1,000 Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isJa ? "まずは効果検証・テスト送信に最適" : isVi ? "Thử nghiệm phản hồi thị trường" : "Ideal for testing product-market fit"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">¥28,000</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="text-xs text-slate-500 font-semibold mb-6">
                  {isJa ? "単価: 28円 / 送信完了" : isVi ? "28 JPY / form gửi thành công" : "28 JPY / delivered form"}
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
                    <span>{isJa ? "文面ひな形・基本チェック" : isVi ? "Kiểm tra ngữ pháp & kính ngữ cơ bản" : "Standard Keigo copy review"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "送信完了CSVレポート納品" : isVi ? "Báo cáo chi tiết file CSV" : "Delivery CSV report"}</span>
                  </li>
                </ul>
              </div>

              <a
                href="#contact-form"
                onClick={() => setSelectedPlan("1k")}
                className="mt-8 w-full py-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block"
              >
                {isJa ? "このプランを選択する" : isVi ? "Chọn gói Starter" : "Select Starter"}
              </a>
            </div>

            {/* 3,000 Plan (RECOMMENDED) */}
            <div className="bg-white dark:bg-[#1C2128] border-2 border-indigo-600 dark:border-indigo-500 rounded-3xl p-6 sm:p-7 shadow-xl shadow-indigo-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                {isJa ? "★ 一番人気・推奨プラン" : isVi ? "★ Phổ biến & Tối ưu nhất" : "★ MOST POPULAR & BEST VALUE"}
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                  {isJa ? "3,000 件プラン" : isVi ? "Gói Standard 3.000 Form" : "Standard (3,000 Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isJa ? "本格的なリード獲得・商談創出に" : isVi ? "Đạt lượng chuyển đổi cuộc hẹn ổn định" : "Optimal for scalable lead generation"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">¥69,000</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">
                  {isJa ? "単価: 23円 / 送信完了 (約18%お得)" : isVi ? "23 JPY / form (Tiết kiệm 18%)" : "23 JPY / delivered form (Save 18%)"}
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
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isJa ? "文面プロ添削・A/Bテスト文面作成支援" : isVi ? "Tư vấn & Tối ưu kịch bản A/B Test" : "Full A/B test copywriting assistance"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "送信完了CSVレポート納品" : isVi ? "Báo cáo chi tiết file CSV" : "Delivery CSV report"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "優先配信スケジュール設定" : isVi ? "Ưu tiên lịch gửi trong ngày" : "Priority sending schedule"}</span>
                  </li>
                </ul>
              </div>

              <a
                href="#contact-form"
                onClick={() => setSelectedPlan("3k")}
                className="mt-8 w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 text-center transition-all block active:scale-[0.98]"
              >
                {isJa ? "このプランを申し込む" : isVi ? "Chọn gói Standard" : "Select Standard"}
              </a>
            </div>

            {/* 5,000+ Plan */}
            <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {isJa ? "5,000 件プラン" : isVi ? "Gói Enterprise 5.000 Form" : "Enterprise (5,000+ Forms)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  {isJa ? "大量アプローチで商談数を最大化" : isVi ? "Quy mô lớn, chi phí trên mỗi form rẻ nhất" : "Maximum appointment pipeline volume"}
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">¥99,000</span>
                  <span className="text-xs text-slate-400">({isJa ? "税抜" : isVi ? "chưa VAT" : "excl. tax"})</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-6">
                  {isJa ? "単価: 19.8円 / 送信完了 (最安値レート)" : isVi ? "19.8 JPY / form (Mức giá tốt nhất)" : "19.8 JPY / delivered form (Best rate)"}
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
                    <span>{isJa ? "専任コンサルタントによる文面全面作成" : isVi ? "Chuyên viên soạn thảo toàn bộ kịch bản" : "Dedicated copywriter & strategic review"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "送信完了CSVレポート納品" : isVi ? "Báo cáo chi tiết file CSV" : "Delivery CSV report"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{isJa ? "10,000件超のカスタム対応可" : isVi ? "Hỗ trợ gói trên 10.000 form theo yêu cầu" : "Custom enterprise volume discounts"}</span>
                  </li>
                </ul>
              </div>

              <a
                href="#contact-form"
                onClick={() => setSelectedPlan("5k")}
                className="mt-8 w-full py-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center transition-colors block"
              >
                {isJa ? "このプランを選択する" : isVi ? "Chọn gói Enterprise" : "Select Enterprise"}
              </a>
            </div>
          </div>
        </section>

        {/* 4-STEP WORKFLOW */}
        <section className="py-16 bg-slate-100/50 dark:bg-[#12161E] border-t border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                {isJa ? "お申し込みから配信完了までの流れ" : isVi ? "Quy trình triển khai 4 bước tinh gọn" : "Simple 4-Step Execution Workflow"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {isJa ? "最短2営業日でターゲット企業へ配信開始可能です。" : isVi ? "Bắt đầu tiếp cận tệp khách hàng mục tiêu chỉ sau 2 ngày làm việc." : "Launch your outbound campaign in as fast as 2 business days."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
                <div className="text-2xl font-black text-indigo-600 font-mono mb-2">STEP 01</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                  {isJa ? "相談・ターゲット選定" : isVi ? "Tư vấn & Lọc danh sách" : "Consultation & Filtering"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isJa ? "商材に合わせて業界、地域、企業規模などのターゲット条件をヒアリング。" : isVi ? "Xác định chân dung khách hàng mục tiêu: ngành nghề, số vốn, địa bàn." : "Define target industry, geography, and company size from our DB."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
                <div className="text-2xl font-black text-indigo-600 font-mono mb-2">STEP 02</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                  {isJa ? "アプローチ文面作成・校正" : isVi ? "Soạn thảo kịch bản Keigo" : "Copywriting & Keigo Review"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isJa ? "返信率を高める件名・本文の作成を専任スタッフがサポート。" : isVi ? "Chuyên gia rà soát kính ngữ, câu mở đầu và nội dung hấp dẫn." : "Craft high-converting subject and body copy compliant with Tokushoho."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
                <div className="text-2xl font-black text-indigo-600 font-mono mb-2">STEP 03</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                  {isJa ? "AI自動除外・安全送信" : isVi ? "AI lọc cấm QC & Gửi tự động" : "Safe AI-Monitored Dispatch"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isJa ? "「営業お断り」企業を自動除外しながら、高速・安全にフォームへ送信。" : isVi ? "Bot tự động gửi qua proxy Nhật Bản, tự động bỏ qua form cấm chào hàng." : "Headless browser dispatching via Japanese residential proxies with auto-skip."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C2128] border border-slate-200/80 dark:border-slate-800 shadow-sm relative">
                <div className="text-2xl font-black text-indigo-600 font-mono mb-2">STEP 04</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                  {isJa ? "レポート納品・反響獲得" : isVi ? "Báo cáo & Nhận phản hồi" : "Delivery Audit & Direct Leads"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isJa ? "送信先URL・日時の一覧レポートを納品。返信は貴社のメールへ直接届きます。" : isVi ? "Nhận file báo cáo chi tiết. Khách hàng quan tâm sẽ phản hồi thẳng vào email của bạn." : "Receive full CSV logs. Interested prospects reply directly to your inbox."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* INQUIRY & ORDER FORM */}
        <section id="contact-form" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                {isJa ? "無料お見積り・お問い合わせ" : isVi ? "Đăng ký tư vấn chiến dịch & Báo giá" : "Get Free Quote & Consultation"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {isJa
                  ? "商材のターゲット層やご予算に合わせて、最適なアプローチプランをご提案いたします。"
                  : isVi
                  ? "Để lại thông tin, đội ngũ chuyên gia sẽ liên hệ tư vấn tệp doanh nghiệp và báo giá chi tiết."
                  : "Share your target requirements and our specialists will prepare an optimal campaign proposal."}
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {isJa ? "お問い合わせありがとうございます" : isVi ? "Cảm ơn bạn đã gửi yêu cầu!" : "Thank You For Your Request!"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-350 max-w-md mx-auto">
                  {isJa
                    ? "担当者よりご入力いただいたメールアドレス宛に、24時間以内に詳細なスケジュール・文面確認・お見積りをご案内いたします。"
                    : isVi
                    ? "Chúng tôi đã ghi nhận yêu cầu. Chuyên viên tư vấn sẽ liên hệ lại với bạn trong vòng 24 giờ làm việc."
                    : "Our outbound sales consultant will reach out via email within 24 business hours."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Plan Selection Buttons */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    {isJa ? "ご希望の送信件数" : isVi ? "Gói số lượng mong muốn" : "Target Volume Package"}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("1k")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedPlan === "1k"
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">1,000 件</div>
                      <div className="text-xs opacity-75">¥28,000</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("3k")}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        selectedPlan === "3k"
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">3,000 件</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">¥69,000 (人気)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan("5k")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedPlan === "5k"
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">5,000 件</div>
                      <div className="text-xs opacity-75">¥99,000</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
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
                        className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
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
                        className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isJa ? "メールアドレス *" : isVi ? "Email nhận báo cáo *" : "Business Email *"}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="03-1234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "ターゲット希望業種・地域" : isVi ? "Ngành nghề & Khu vực doanh nghiệp mong muốn" : "Target Industry & Location"}
                  </label>
                  <input
                    type="text"
                    placeholder={isJa ? "例: 東京都のIT受託開発企業、従業員30名以上" : isVi ? "Ví dụ: Công ty IT tại Tokyo, quy mô > 30 nhân viên" : "e.g. IT companies in Tokyo, >30 employees"}
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "提案商材・ご相談内容" : isVi ? "Sản phẩm/dịch vụ chào hàng & Yêu cầu cụ thể" : "Your Pitch Offer & Requirements"}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={
                      isJa
                        ? "アプローチしたい商材の概要や、ご質問・ご要望があればご記入ください。"
                        : isVi
                        ? "Mô tả dịch vụ bạn muốn chào hoặc những thắc mắc cần tư vấn."
                        : "Describe your service offer, value proposition, or specific questions."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isJa ? "無料相談・お見積りを送信する" : isVi ? "Gửi thông tin tư vấn & Nhận báo giá" : "Submit Request & Get Quote"}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              {isJa ? "よくあるご質問 (FAQ)" : isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isJa ? "問い合わせフォーム営業代行に関する主な疑問にお答えします。" : isVi ? "Giải đáp các thắc mắc về tính an toàn và hiệu quả của dịch vụ." : "Common questions about safety, delivery, and conversion rates."}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
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
