"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Building2, 
  Database, 
  Handshake, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  Search, 
  Mail, 
  Phone, 
  User, 
  Sparkles,
  Send,
  Clock,
  Lock,
  FileSpreadsheet,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Briefcase,
  ExternalLink,
  Check,
  FileText,
  FileEdit,
  EyeOff
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { trackLeadGenerated } from "@/lib/gtag";

type InquiryCategory = "form_marketing" | "api_data" | "company_manage" | "billing_enterprise" | "general_partner";

export default function ContactPage() {
  const { locale } = useLanguage();
  const isVi = locale === "vi";
  const isJa = locale === "ja";

  const [activeCategory, setActiveCategory] = useState<InquiryCategory>("general_partner");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [botTrap, setBotTrap] = useState("");
  const turnstileContainerId = "contact-turnstile-container";

  // Category: Company Lookup States
  const [lookupCorpNum, setLookupCorpNum] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundCompany, setFoundCompany] = useState<{ corporate_number: string; company_name: string; prefecture_name?: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Category: Company Manage Dual-Path Sub-Modes
  const [companyManageSubTab, setCompanyManageSubTab] = useState<"direct_inquiry" | "claim">("direct_inquiry");
  const [directInquiryType, setDirectInquiryType] = useState<"update" | "hide" | "other">("update");

  // Common Form States
  const [formData, setFormData] = useState({
    company_name: "",
    department_role: "",
    name: "",
    email: "",
    phone: "",
    // Form Marketing specific
    form_send_scale: "3,000〜10,000件（標準推奨）",
    form_support_need: "営業文面の作成・添削支援も希望",
    // API & Data specific
    data_scale: "API連携（CRM/SFA常時クエリ連携）",
    data_format: "REST API + Webhook",
    // Billing & Enterprise specific
    plan_interest: "Enterpriseプラン（無制限・専任サポート）",
    invoice_term: "月末締め翌月末払い（請求書払い）",
    // General / Partner specific
    subject: "",
    message: "",
    agree_privacy: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  // Cloudflare Turnstile Widget Initialization
  useEffect(() => {
    let widgetId: string | null = null;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADokowo7EluaA6K4";

    const renderWidget = () => {
      const container = document.getElementById(turnstileContainerId);
      if (container && (window as any).turnstile) {
        try {
          container.innerHTML = "";
          widgetId = (window as any).turnstile.render(`#${turnstileContainerId}`, {
            sitekey: siteKey,
            language: locale,
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            "error-callback": () => {
              setTurnstileToken("");
            },
            "expired-callback": () => {
              setTurnstileToken("");
            }
          });
        } catch (err) {
          console.error("Turnstile render error:", err);
        }
      }
    };

    const scriptId = "cloudflare-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadContactTurnstileCallback";
      script.async = true;
      script.defer = true;
      (window as any).onloadContactTurnstileCallback = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }

    return () => {
      if (widgetId !== null && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetId);
        } catch {}
      }
    };
  }, [locale, activeCategory]);

  // Company Lookup for Category: company_manage
  const handleLookupCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = lookupCorpNum.trim().replace(/\D/g, "");
    if (cleanNum.length !== 13) {
      setLookupError(
        isJa 
          ? "13桁の半角数字で国税庁法人番号を入力してください。" 
          : isVi 
          ? "Vui lòng nhập đúng 13 số mã số pháp nhân (Corporate Number)." 
          : "Please enter the 13-digit corporate number."
      );
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setFoundCompany(null);

    try {
      const res = await fetch(`/api/companies?corporate_number=${cleanNum}`);
      const data = await res.json();
      if (res.ok && data.found && data.company) {
        setFoundCompany({
          corporate_number: cleanNum,
          company_name: data.company.company_name,
          prefecture_name: data.company.prefecture_name,
        });
      } else {
        setLookupError(
          isJa 
            ? "該当する企業が見つかりませんでした。法人番号をご確認いただくか、一般窓口よりお問い合わせください。" 
            : isVi 
            ? "Không tìm thấy doanh nghiệp phù hợp với mã số pháp nhân này." 
            : "No company found with this corporate number."
        );
      }
    } catch {
      setLookupError(
        isJa ? "通信エラーが発生しました。時間をおいて再試行してください。" : "Lỗi kết nối. Vui lòng thử lại sau."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // Submit Inquiry Form
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    if (!formData.agree_privacy) {
      setResultMsg({
        type: "error",
        text: isJa 
          ? "個人情報の取り扱いおよび利用規約への同意が必要です。" 
          : isVi 
          ? "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật." 
          : "Please accept our Privacy Policy and Terms of Service.",
      });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.company_name.trim() || !formData.message.trim()) {
      setResultMsg({
        type: "error",
        text: isJa 
          ? "貴社名、お名前、メールアドレス、お問い合わせ内容をご入力ください。" 
          : isVi 
          ? "Vui lòng điền đầy đủ các trường bắt buộc (Công ty, Họ tên, Email, Nội dung)." 
          : "Please fill in all required fields.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Map category to API type
      const typeMap: Record<InquiryCategory, string> = {
        form_marketing: "form_marketing",
        api_data: "api",
        billing_enterprise: "billing",
        general_partner: "general",
        company_manage: "company_manage",
      };

      // Format message according to category context
      let compiledMessage = "";
      if (activeCategory === "company_manage") {
        const typeTitle = directInquiryType === "hide"
          ? "【掲載取り下げ・非公開（オプトアウト）申請】※個人情報保護法（APPI）準拠"
          : directInquiryType === "update"
          ? "【掲載情報の修正依頼（公式サイトURL・連絡先・基本情報）】"
          : "【掲載情報に関するお問い合わせ】";
        compiledMessage = [
          typeTitle,
          lookupCorpNum.trim() ? `【対象法人番号】${lookupCorpNum.trim()}` : "",
          formData.department_role ? `【部署・役職】${formData.department_role}` : "",
          `\n【申請・修正内容の詳細】\n${formData.message}`,
        ].filter(Boolean).join("\n");
      } else if (activeCategory === "form_marketing") {
        compiledMessage = [
          `【お問い合わせ種別】セルフ型フォーム営業・配信代行のご相談`,
          formData.department_role ? `【部署・役職】${formData.department_role}` : "",
          `【想定配信規模】${formData.form_send_scale}`,
          `【ご希望の支援内容】${formData.form_support_need}`,
          `\n【ご相談内容の詳細】\n${formData.message}`,
        ].filter(Boolean).join("\n");
      } else if (activeCategory === "api_data") {
        compiledMessage = [
          `【お問い合わせ種別】法人API・データ一括購入のご相談`,
          formData.department_role ? `【部署・役職】${formData.department_role}` : "",
          `【想定連携形態】${formData.data_scale}`,
          `【ご希望フォーマット】${formData.data_format}`,
          `\n【ご相談内容の詳細】\n${formData.message}`,
        ].filter(Boolean).join("\n");
      } else if (activeCategory === "billing_enterprise") {
        compiledMessage = [
          `【お問い合わせ種別】料金プラン・見積書・請求書払いのご相談`,
          formData.department_role ? `【部署・役職】${formData.department_role}` : "",
          `【ご検討プラン】${formData.plan_interest}`,
          `【希望お支払い条件】${formData.invoice_term}`,
          `\n【ご相談内容の詳細】\n${formData.message}`,
        ].filter(Boolean).join("\n");
      } else {
        compiledMessage = [
          `【お問い合わせ種別】業務提携・一般お問い合わせ`,
          formData.department_role ? `【部署・役職】${formData.department_role}` : "",
          formData.subject ? `【件名】${formData.subject}` : "",
          `\n【お問い合わせ詳細】\n${formData.message}`,
        ].filter(Boolean).join("\n");
      }

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeMap[activeCategory],
          corporate_number: activeCategory === "company_manage" ? (lookupCorpNum.trim() || undefined) : undefined,
          company_name: formData.company_name.trim(),
          person_in_charge: formData.name.trim(),
          requester_email: formData.email.trim(),
          mobile_number: formData.phone.trim(),
          message: compiledMessage,
          bot_trap: botTrap,
          turnstileToken,
          locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        trackLeadGenerated(activeCategory, formData.company_name.trim());
        setResultMsg({
          type: "success",
          text: data.message || (
            isJa 
              ? "お問い合わせを受け付けました。ご入力いただいたメールアドレス宛に受付完了メールをお送りいたしました。通常1〜2営業日以内に専任担当者よりご連絡差し上げます。" 
              : isVi 
              ? "Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ lại trong vòng 1-2 ngày làm việc." 
              : "Inquiry submitted successfully. Our team will contact you within 1-2 business days."
          ),
        });
        setFormData({
          company_name: "",
          department_role: "",
          name: "",
          email: "",
          phone: "",
          form_send_scale: "3,000〜10,000件（標準推奨）",
          form_support_need: "営業文面の作成・添削支援も希望",
          data_scale: "API連携（CRM/SFA常時クエリ連携）",
          data_format: "REST API + Webhook",
          plan_interest: "Enterpriseプラン（無制限・専任サポート）",
          invoice_term: "月末締め翌月末払い（請求書払い）",
          subject: "",
          message: "",
          agree_privacy: false,
        });
      } else {
        setResultMsg({
          type: "error",
          text: data.error || (isJa ? "送信に失敗しました。時間をおいて再試行してください。" : "Gửi thất bại. Vui lòng thử lại."),
        });
      }
    } catch {
      setResultMsg({
        type: "error",
        text: isJa ? "通信エラーが発生しました。ネットワーク環境をご確認ください。" : "Lỗi kết nối mạng.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Japanese FAQ Data
  const faqList = isJa ? [
    {
      q: "お問い合わせから利用開始までどのくらい時間がかかりますか？",
      a: "セルフ型フォーム営業や通常プランのCSVダウンロードは、Web上でお申し込み後、即座にご利用可能です。法人API連携やカスタムデータ抽出、請求書払いでのご契約につきましては、お問い合わせ後1〜2営業日以内に専任担当者よりご案内・アカウント発行をいたします。",
    },
    {
      q: "請求書払い（掛け払い・月末締め翌月末払い）や見積書の発行は可能ですか？",
      a: "はい、可能です。法人契約（Proプラン、Enterpriseプラン、フォーム営業チケットの大口購入）において、貴社指定フォーマットの見積書・請求書・領収書の発行および銀行振込による月締め払いに対応しております。「料金・お見積り・請求書払い」タブよりお申し付けください。",
    },
    {
      q: "フォーム営業の反響率（開封率）や特定電子メール法への対応はどうなっていますか？",
      a: "Kigyou-Listのフォームマーケティングは、AIによる高精度な企業問い合わせフォーム送信により、開封・読了率50%〜90%を実現しています。また、送信不可ドメインの自動除外、配信停止希望（オプトアウト）文面の自動付与など、特定電子メール法および関連法規を徹底遵守した設計となっております。",
    },
    {
      q: "自社の企業情報を修正したい、または検索結果から非公開（削除）にしたい場合は？",
      a: "「自社情報の管理・公式認証・非公開」タブより貴社の法人番号（13桁）を検索してください。自社ページより公式オーナー認証（本人確認コードOTP）を完了いただくことで、PR情報・最新連絡先の即時反映や、検索結果からの非公開（オプトアウト）をワンストップで安全に行っていただけます。",
    },
    {
      q: "APIの仕様書やテスト接続用のトライアルキーは提供してもらえますか？",
      a: "はい、可能です。貴社の想定クエリ規模やCRM/SFA連携要件（Salesforce, Hubspot, kintone等）をヒアリングの上、APIドキュメントおよびテスト用環境をご案内いたします。「法人API・データ一括購入」タブよりご相談ください。",
    },
  ] : isVi ? [
    {
      q: "Sau khi gửi liên hệ, bao lâu thì tôi có thể bắt đầu sử dụng?",
      a: "Dịch vụ gửi Form B2B tự động và tải CSV có thể sử dụng ngay sau khi đăng ký tài khoản. Đối với gói tích hợp API doanh nghiệp, xuất dữ liệu tùy chỉnh hoặc thanh toán theo hóa đơn, đội ngũ tư vấn sẽ hỗ trợ kích hoạt trong vòng 1-2 ngày làm việc.",
    },
    {
      q: "Kigyou-list có hỗ trợ xuất hóa đơn doanh nghiệp (Invoicing) và báo giá chính thức không?",
      a: "Có, chúng tôi hỗ trợ cấp báo giá (Quotation), hợp đồng và thanh toán qua chuyển khoản ngân hàng định kỳ hàng tháng cho các khách hàng doanh nghiệp gói Pro, Enterprise hoặc mua gói gửi Form số lượng lớn.",
    },
    {
      q: "Hiệu quả của dịch vụ Gửi Form tiếp cận B2B và quy định pháp lý ra sao?",
      a: "Tỷ lệ tiếp cận và mở đọc thực tế qua biểu mẫu liên hệ đạt từ 50% đến 90%. Hệ thống tích hợp sẵn tính năng tự động loại trừ các doanh nghiệp từ chối nhận quảng cáo (Opt-out list) và tuân thủ chặt chẽ Đạo luật Email Quảng cáo của Nhật Bản.",
    },
    {
      q: "Làm thế nào để cập nhật hoặc yêu cầu ẩn thông tin công ty khỏi Kigyou-list?",
      a: "Vui lòng chọn tab 'Quản lý thông tin & Xác thực chính chủ', nhập mã số pháp nhân 13 số để mở trang quản lý. Sau khi xác thực mã OTP qua email công ty, bạn có thể tự cập nhật hoặc chọn ẩn hồ sơ khỏi kết quả tìm kiếm.",
    },
    {
      q: "Tôi có thể nhận tài liệu API và dùng thử khóa API không?",
      a: "Có, chúng tôi cung cấp đầy đủ tài liệu API RESTful và môi trường Sandbox thử nghiệm cho khách hàng doanh nghiệp có nhu cầu tích hợp vào CRM (Salesforce, Hubspot, kintone...).",
    },
  ] : [
    {
      q: "How long does it take from inquiry to service activation?",
      a: "Self-service form marketing and standard CSV exports are available immediately upon signup. For Enterprise API integration, custom data dumps, and invoice billing, our team will assist you within 1-2 business days.",
    },
    {
      q: "Do you support corporate invoicing and official quotations?",
      a: "Yes. For corporate plans (Pro, Enterprise, bulk form outreach credits), we issue official quotations, invoices (bank transfer on month-end payment terms), and receipts.",
    },
    {
      q: "What is the read rate of form marketing and how is legal compliance handled?",
      a: "Our automated form outreach reaches 50%-90% read rates among Japanese executives and managers. It includes automatic opt-out handling and full compliance with Japan's Act on Regulation of Transmission of Specified Electronic Mail.",
    },
    {
      q: "How can we update our company info or request listing removal (opt-out)?",
      a: "Use the 'Company Management & Verification' tab to enter your 13-digit corporate number. After OTP verification to your corporate email, you can update information or request delisting securely.",
    },
    {
      q: "Can you provide API documentation and a trial key?",
      a: "Yes. After discussing your query volume and CRM requirements, we provide comprehensive API documentation and sandbox access.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 font-sans antialiased selection:bg-[#1B4F8A]/15 selection:text-[#1B4F8A]">
      <Header />

      <main className="flex-1">
        {/* ========================================================
            1. HERO SECTION (Synchronized with Homepage /ja)
            ======================================================== */}
        <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-18 bg-white dark:bg-[#0D1117] border-b border-slate-200/90 dark:border-slate-800">
          {/* Subtle grid pattern background matching /ja */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#161b22_1px,transparent_1px),linear-gradient(to_bottom,#161b22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
            {/* Kicker Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold mb-5 tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1B4F8A] dark:bg-blue-400 animate-pulse" />
              <span>
                {isJa 
                  ? "国内最大級 500万社データベース × 法人営業DX" 
                  : isVi 
                  ? "Cơ Sở Dữ Liệu 5 Triệu Doanh Nghiệp × Tự Động Hóa B2B" 
                  : "Japan 5M+ Corporate Database × B2B Sales Automation"}
              </span>
            </div>

            {/* H1 Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.25] text-slate-900 dark:text-white mb-5">
              {isJa ? (
                <>
                  お問い合わせ・法人導入ご相談<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">専任コンサルタント</span>
                  が迅速に対応いたします
                </>
              ) : isVi ? (
                <>
                  Liên hệ & Tư vấn Doanh nghiệp<br className="hidden sm:inline" />
                  <span className="text-[#1B4F8A] dark:text-blue-400">Đội ngũ chuyên gia</span>
                  sẵn sàng hỗ trợ
                </>
              ) : (
                <>
                  Contact & Corporate Inquiries<br className="hidden sm:inline" />
                  Dedicated support for your <span className="text-[#1B4F8A] dark:text-blue-400">B2B growth</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {isJa
                ? "セルフ型フォーム営業のご相談・文面添削、500万社データベースAPI・データ抽出、自社情報の公式認証・非公開申請、請求書払いなど、各種ご用命を承っております。"
                : isVi
                ? "Tư vấn dịch vụ gửi form tự động, tích hợp API 5 triệu doanh nghiệp, xác thực chính chủ hồ sơ công ty hoặc yêu cầu báo giá doanh nghiệp."
                : "Inquire about automated form marketing, 5M+ company database API feeds, corporate profile management, or enterprise custom invoicing."}
            </p>

            {/* Trust Bar (3 Pillars) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "1〜2営業日以内の回答" : isVi ? "Phản hồi trong 1-2 ngày" : "1-2 Business Days"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isJa ? "平日9:30〜18:00専任対応" : isVi ? "Hỗ trợ giờ hành chính" : "Weekday Dedicated Desk"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "安心のセキュリティ" : isVi ? "Bảo mật an toàn cao" : "Secure Communication"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isJa ? "SSL暗号化 & 個人情報保護" : isVi ? "Mã hóa SSL 256-bit" : "256-bit SSL & Privacy"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-[#161B22]/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "法人取引・請求書払い" : isVi ? "Hóa đơn & Báo giá B2B" : "Corporate Billing"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isJa ? "後払い・機密保持（NDA）" : isVi ? "Chuyển khoản & Hợp đồng" : "Invoice Terms & NDA"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. MAIN CONTENT AREA
            ======================================================== */}
        <section className="py-10 lg:py-14 max-w-5xl mx-auto px-4 sm:px-6">
          
          {/* 5 Inquiry Category Tabs */}
          <div className="mb-8">
            <div className="text-center sm:text-left mb-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {isJa ? "STEP 1: お問い合わせ種別を選択してください" : isVi ? "BƯỚC 1: Chọn mục đích liên hệ" : "STEP 1: Select Inquiry Category"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              
              {/* Tab 1: General & Partnerships (DEFAULT & FIRST) */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("general_partner");
                  setResultMsg(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeCategory === "general_partner"
                    ? "border-[#1B4F8A] bg-[#1B4F8A]/5 dark:bg-blue-950/30 shadow-xs ring-2 ring-[#1B4F8A]/20"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    activeCategory === "general_partner"
                      ? "bg-[#1B4F8A] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    <Handshake className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {isJa ? "業務提携・ご意見・その他窓口" : isVi ? "Hợp tác, Góp ý & Yêu cầu khác" : "Partner & General"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {isJa ? "ご意見・サービス要望・苦情・B2B協業・一般相談" : isVi ? "Góp ý, khiếu nại, phản hồi, hợp tác B2B & hỗ trợ" : "Feedback, complaints, strategic alliance & general support"}
                  </p>
                </div>
                <span className={`text-[11px] font-bold mt-2.5 inline-flex items-center gap-1 ${
                  activeCategory === "general_partner" ? "text-[#1B4F8A] dark:text-blue-400" : "text-slate-400"
                }`}>
                  {isJa ? "選択中" : "Select"} <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Tab 2: Form Marketing (Clean without HOT/NEW badge) */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("form_marketing");
                  setResultMsg(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeCategory === "form_marketing"
                    ? "border-[#1B4F8A] bg-[#1B4F8A]/5 dark:bg-blue-950/30 shadow-xs ring-2 ring-[#1B4F8A]/20"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    activeCategory === "form_marketing"
                      ? "bg-[#1B4F8A] text-white"
                      : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                  }`}>
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {isJa ? "フォーム営業・配信代行" : isVi ? "Gửi Form tự động B2B" : "Form Outreach"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {isJa ? "セルフ配信・文面添削・大口送信相談" : isVi ? "Tiếp cận 50-90% mở, viết kịch bản chào hàng" : "Automated B2B outreach & copy advisory"}
                  </p>
                </div>
                <span className={`text-[11px] font-bold mt-2.5 inline-flex items-center gap-1 ${
                  activeCategory === "form_marketing" ? "text-[#1B4F8A] dark:text-blue-400" : "text-slate-400"
                }`}>
                  {isJa ? "選択中" : "Select"} <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Tab 3: API & Bulk Data */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("api_data");
                  setResultMsg(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeCategory === "api_data"
                    ? "border-[#1B4F8A] bg-[#1B4F8A]/5 dark:bg-blue-950/30 shadow-xs ring-2 ring-[#1B4F8A]/20"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    activeCategory === "api_data"
                      ? "bg-[#1B4F8A] text-white"
                      : "bg-blue-50 dark:bg-blue-950/50 text-[#1B4F8A] dark:text-blue-400"
                  }`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {isJa ? "法人API・データ一括購入" : isVi ? "Tích hợp API & Data" : "API & Data Feed"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {isJa ? "500万社DB抽出・CRM連携・差分フィード" : isVi ? "Trích xuất CSV lớn, đồng bộ CRM liên tục" : "5M DB dumps & real-time REST API"}
                  </p>
                </div>
                <span className={`text-[11px] font-bold mt-2.5 inline-flex items-center gap-1 ${
                  activeCategory === "api_data" ? "text-[#1B4F8A] dark:text-blue-400" : "text-slate-400"
                }`}>
                  {isJa ? "選択中" : "Select"} <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Tab 4: Company Ownership & Opt-out */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("company_manage");
                  setResultMsg(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeCategory === "company_manage"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/20"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    activeCategory === "company_manage"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {isJa ? "自社情報管理・公式認証" : isVi ? "Xác thực chính chủ" : "Company Claim"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {isJa ? "公式認証バッジ・PR更新・非公開申請" : isVi ? "Tích xanh xác minh, cập nhật hoặc ẩn hồ sơ" : "Official badge, updates, & delist opt-out"}
                  </p>
                </div>
                <span className={`text-[11px] font-bold mt-2.5 inline-flex items-center gap-1 ${
                  activeCategory === "company_manage" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                }`}>
                  {isJa ? "専用窓口へ" : "Open"} <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              {/* Tab 5: Pricing & Enterprise Billing */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("billing_enterprise");
                  setResultMsg(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  activeCategory === "billing_enterprise"
                    ? "border-[#1B4F8A] bg-[#1B4F8A]/5 dark:bg-blue-950/30 shadow-xs ring-2 ring-[#1B4F8A]/20"
                    : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    activeCategory === "billing_enterprise"
                      ? "bg-[#1B4F8A] text-white"
                      : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {isJa ? "料金・見積・請求書払い" : isVi ? "Báo giá & Hóa đơn B2B" : "Billing & Enterprise"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {isJa ? "Enterpriseプラン・後払い・見積書発行" : isVi ? "Gói doanh nghiệp, hợp đồng thanh toán sau" : "Custom quotation & invoice terms"}
                  </p>
                </div>
                <span className={`text-[11px] font-bold mt-2.5 inline-flex items-center gap-1 ${
                  activeCategory === "billing_enterprise" ? "text-[#1B4F8A] dark:text-blue-400" : "text-slate-400"
                }`}>
                  {isJa ? "選択中" : "Select"} <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>

          {/* Feedback Status Alert */}
          {resultMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-start gap-3 border mb-6 shadow-2xs ${
                resultMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
              }`}
            >
              {resultMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">
                <span className="font-bold block mb-0.5">
                  {resultMsg.type === "success" ? (isJa ? "送信が完了いたしました" : "Thành công") : (isJa ? "ご確認をお願いいたします" : "Lỗi")}
                </span>
                {resultMsg.text}
              </div>
            </div>
          )}

          {/* Main Card Container */}
          <div className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm">
            
            {/* =======================================================
                VIEW A: COMPANY PROFILE MANAGEMENT (CLAIM / OPT-OUT)
                ======================================================= */}
            {activeCategory === "company_manage" ? (
              <div className="space-y-8">
                <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2 border border-emerald-200 dark:border-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isJa ? "企業関係者・公式オーナー様専用窓口" : isVi ? "Cổng quản lý dành riêng cho doanh nghiệp" : "Verified Corporate Owners Desk"}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {isJa ? "自社情報の管理・公式認証・非公開（オプトアウト）申請" : isVi ? "Quản lý hồ sơ, Cấp tích xanh & Yêu cầu ẩn thông tin" : "Corporate Claims, Official Verification & Delisting"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {isJa
                      ? "Kigyou-Listでは、個人情報保護法（APPI）に基づき、登録情報の修正や掲載取り下げ（オプトアウト）の直接申請を【ログイン不要】で常時受付しております。また、公式オーナー認証を行うことで、PRメッセージ掲載や自社情報のリアルタイム管理も完全無料でご利用いただけます。"
                      : isVi
                      ? "Kigyou-list tiếp nhận các yêu cầu đính chính thông tin và gỡ bỏ trang trực tiếp theo Luật Bảo vệ Thông tin Cá nhân Nhật Bản (APPI) mà không cần đăng nhập. Ngoài ra, bạn cũng có thể xác thực chính chủ để đăng PR và tự quản trị trang miễn phí."
                      : "We accept information correction and delisting requests in compliance with Japan's APPI regulations without requiring account registration, as well as official corporate owner verification for real-time profile management."}
                  </p>

                  {/* Dual-Path Mode Switcher */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCompanyManageSubTab("direct_inquiry")}
                      className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        companyManageSubTab === "direct_inquiry"
                          ? "bg-white dark:bg-slate-900 text-[#1B4F8A] dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0 text-[#1B4F8A] dark:text-blue-400" />
                      <span>{isJa ? "【ログイン不要】情報修正・非公開申請（直接受付）" : "Gửi yêu cầu sửa/gỡ không cần đăng nhập"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanyManageSubTab("claim")}
                      className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        companyManageSubTab === "claim"
                          ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{isJa ? "【公式認証・PR掲載】公式オーナー認証（自社管理）" : "Xác minh chính chủ & Đăng PR (Tự quản lý)"}</span>
                    </button>
                  </div>
                </div>

                {/* SUB-PATH A: DIRECT APPI INQUIRY / OPT-OUT FORM (NO LOGIN REQUIRED) */}
                {companyManageSubTab === "direct_inquiry" ? (
                  <form onSubmit={handleSubmitInquiry} className="space-y-6 animate-in fade-in duration-200">
                    {/* Inquiry Type Radio Cards */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                        {isJa ? "申請・ご希望の種別" : "Loại yêu cầu"} <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          directInquiryType === "update"
                            ? "bg-blue-50/70 dark:bg-blue-950/40 border-[#1B4F8A] dark:border-blue-600 text-[#1B4F8A] dark:text-blue-300"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          <input
                            type="radio"
                            name="directInquiryType"
                            value="update"
                            checked={directInquiryType === "update"}
                            onChange={() => setDirectInquiryType("update")}
                            className="mt-0.5 text-[#1B4F8A] focus:ring-[#1B4F8A]"
                          />
                          <div className="text-xs">
                            <span className="block font-bold text-slate-900 dark:text-white mb-0.5">
                              {isJa ? "掲載情報の修正・追加依頼" : "Yêu cầu đính chính / bổ sung thông tin"}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                              {isJa ? "公式サイトURL、代表電話番号、代表者名、所在地等の最新化" : "Cập nhật website, số điện thoại, người đại diện..."}
                            </span>
                          </div>
                        </label>

                        <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          directInquiryType === "hide"
                            ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-600 dark:border-rose-700 text-rose-800 dark:text-rose-300"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          <input
                            type="radio"
                            name="directInquiryType"
                            value="hide"
                            checked={directInquiryType === "hide"}
                            onChange={() => setDirectInquiryType("hide")}
                            className="mt-0.5 text-rose-600 focus:ring-rose-600"
                          />
                          <div className="text-xs">
                            <span className="block font-bold text-slate-900 dark:text-white mb-0.5">
                              {isJa ? "掲載取り下げ・非公開（オプトアウト）" : "Yêu cầu gỡ bỏ trang (Opt-out)"}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                              {isJa ? "個人情報保護法に基づき、検索結果からの非公開（掲載停止）を申請" : "Ẩn trang khỏi công cụ tìm kiếm theo luật APPI"}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Company Name & Corporate Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa ? "対象の貴社名（会社名）" : "Tên công ty"} <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="例: 株式会社〇〇"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa ? "法人番号（13桁・任意）" : "Mã số pháp nhân 13 số (Tùy chọn)"}
                        </label>
                        <input
                          type="text"
                          maxLength={13}
                          value={lookupCorpNum}
                          onChange={(e) => setLookupCorpNum(e.target.value)}
                          placeholder="例: 1010001000001"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                        />
                      </div>
                    </div>

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa ? "ご担当者様氏名" : "Họ và tên người gửi"} <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="例: 山田 太郎"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa ? "ご連絡先メールアドレス" : "Email liên hệ"} <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="例: yamada@example.co.jp"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                        />
                      </div>
                    </div>

                    {/* Phone & Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa ? "お電話番号（任意）" : "Số điện thoại liên hệ (Tùy chọn)"}
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="例: 03-1234-5678"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa ? "部署・役職（任意）" : "Bộ phận / Chức vụ"}
                        </label>
                        <input
                          type="text"
                          value={formData.department_role}
                          onChange={(e) => setFormData({ ...formData, department_role: e.target.value })}
                          placeholder="例: 広報部 / 総務部 / 経営企画"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                        />
                      </div>
                    </div>

                    {/* Details / Message */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {directInquiryType === "hide"
                          ? (isJa ? "非公開申請の理由・対象ページの詳細" : "Lý do và chi tiết yêu cầu gỡ bỏ trang")
                          : (isJa ? "修正・追加を希望される内容の詳細" : "Nội dung cần đính chính / bổ sung")} <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={directInquiryType === "hide"
                          ? (isJa ? "非公開をご希望される理由や、対象企業ページのURLをご記入ください。" : "Nhập lý do hoặc URL trang cần ẩn.")
                          : (isJa ? "【修正・追加をご希望の項目】\n・公式サイトURL: https://...\n・代表電話番号: 03-...\n・代表者名: ...\n等の具体的な最新情報をご記入ください。" : "Nhập chi tiết các trường thông tin cần sửa...")}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-medium leading-relaxed focus:ring-2 focus:ring-[#1B4F8A]"
                      />
                    </div>

                    {/* Privacy acceptance */}
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="agree_privacy_direct"
                        required
                        checked={formData.agree_privacy}
                        onChange={(e) => setFormData({ ...formData, agree_privacy: e.target.checked })}
                        className="mt-0.5 rounded text-[#1B4F8A] focus:ring-[#1B4F8A]"
                      />
                      <label htmlFor="agree_privacy_direct" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        <span>{isJa ? "個人情報の取り扱いおよび" : "Tôi đồng ý với "}</span>
                        <Link href={`/${locale}/privacy`} target="_blank" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold">
                          {isJa ? "プライバシーポリシー" : "Chính sách bảo mật"}
                        </Link>
                        <span>{isJa ? "に同意して申請します。" : " và Điều khoản sử dụng."}</span>
                      </label>
                    </div>

                    {/* Turnstile Container */}
                    <div id={turnstileContainerId} className="my-2"></div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>{isJa ? "申請内容を送信する（無料・直接受付）" : "Gửi yêu cầu (Miễn phí)"}</span>
                    </button>
                  </form>
                ) : (
                  /* SUB-PATH B: OFFICIAL OWNER VERIFICATION & PR (SELF-MANAGED) */
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          {isJa 
                            ? "貴社の法人番号（13桁）を入力して、自社管理パネルを検索してください" 
                            : isVi 
                            ? "Nhập mã số pháp nhân 13 số (国税庁法人番号) để tìm trang quản lý công ty:" 
                            : "Enter your 13-digit corporate number to open the verification panel:"}
                        </label>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {isJa 
                            ? "※ 法人番号が不明な場合は、国税庁法人番号公表サイトまたは国税庁発行書類をご確認ください。" 
                            : isVi 
                            ? "※ Mã số pháp nhân do Cơ quan Thuế Quốc gia Nhật Bản cấp." 
                            : "※ Available via Japan National Tax Agency Corporate Number Publication Site."}
                        </p>
                      </div>

                      <form onSubmit={handleLookupCompany} className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            maxLength={13}
                            value={lookupCorpNum}
                            onChange={(e) => setLookupCorpNum(e.target.value)}
                            placeholder="例: 1010001000001"
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={lookupLoading}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span>{isJa ? "企業ページを検索" : isVi ? "Tìm doanh nghiệp" : "Search Company"}</span>
                        </button>
                      </form>

                      {lookupError && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>{lookupError}</span>
                        </div>
                      )}

                      {foundCompany && (
                        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono">
                              <Check className="w-3 h-3" /> 法人番号: {foundCompany.corporate_number}
                            </div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">
                              {foundCompany.company_name}
                            </h4>
                            {foundCompany.prefecture_name && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                                所在地: {foundCompany.prefecture_name}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/${locale}/company/${foundCompany.corporate_number}?claim=1`}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{isJa ? "公式管理・認証パネルを開く →" : isVi ? "Mở bảng quản lý chính chủ →" : "Open Verification Panel →"}</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* 3 Steps Visual Guide */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                        {isJa ? "お手続きの流れ（3ステップ）" : isVi ? "Quy trình thực hiện (3 bước)" : "Verification Workflow (3 Steps)"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center justify-center mb-2.5">
                            1
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isJa ? "自社ページを開く" : isVi ? "Tìm mã số & mở hồ sơ" : "Open Company Profile"}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {isJa
                              ? "上記で検索した自社ページへ進み、「公式オーナー認証・情報管理」ボタンをクリックします。"
                              : isVi
                              ? "Tra cứu mã số pháp nhân và nhấn nút xác thực chính chủ trên trang chi tiết công ty."
                              : "Navigate to your company profile and click the Claim/Manage Profile button."}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center justify-center mb-2.5">
                            2
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isJa ? "公式メール宛に認証" : isVi ? "Xác thực mã OTP email" : "Email OTP Verification"}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {isJa
                              ? "会社ドメインの公式メールアドレス宛に届く6桁のワンタイムパスワード（OTP）を入力して認証を完了。"
                              : isVi
                              ? "Nhận mã OTP gồm 6 chữ số gửi về địa chỉ email công ty để hoàn tất xác thực."
                              : "Enter the 6-digit one-time password sent to your official company email."}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center justify-center mb-2.5">
                            3
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isJa ? "情報更新または非公開" : isVi ? "Cập nhật hoặc Ẩn dữ liệu" : "Update or Opt-out"}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {isJa
                              ? "公式認証バッジの獲得、PR文・電話番号・URLの編集、または掲載取り下げ（非公開）を安全に実行。"
                              : isVi
                              ? "Nhận huy hiệu xác thực, cập nhật số điện thoại, website, thông tin tuyển dụng hoặc chọn ẩn."
                              : "Earn the official verified badge, update contact info and PR text, or request delisting."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional assistance note */}
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-3">
                      <HelpCircle className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                          {isJa ? "法人番号が不明な場合やメールを受信できない場合" : "Cần hỗ trợ thêm về xác thực?"}
                        </span>
                        {isJa
                          ? "代表印の印鑑証明書や登記簿謄本による手動確認にも対応しております。その場合は「業務提携・その他窓口」タブより直接運営事務局へご連絡ください。"
                          : "Nếu bạn không thể xác thực tự động qua email công ty, vui lòng gửi yêu cầu qua tab 'Hợp tác & Yêu cầu khác' kèm thông tin để bộ phận hỗ trợ xác minh thủ công."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* =======================================================
                  VIEW B: STANDARD B2B INQUIRY FORM (TABS 1, 2, 4, 5)
                  ======================================================= */
              <form onSubmit={handleSubmitInquiry} className="space-y-6">
                
                {/* Form Header Header */}
                <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#1B4F8A] dark:text-blue-400 text-xs font-bold mb-2 border border-blue-200 dark:border-blue-900">
                    <Sparkles className="w-3.5 h-3.5" />
                    {activeCategory === "form_marketing" && (isJa ? "セルフ型フォーム営業・配信代行のご相談" : "Form Marketing Consultation")}
                    {activeCategory === "api_data" && (isJa ? "法人API・データ一括購入・抽出のご相談" : "Corporate API & Data Purchase")}
                    {activeCategory === "billing_enterprise" && (isJa ? "料金プラン・お見積り・請求書払いのご相談" : "Pricing, Quotation & Enterprise Billing")}
                    {activeCategory === "general_partner" && (isJa ? "業務提携・ご意見・その他窓口" : "General Inquiries, Feedback & Partnerships")}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {activeCategory === "form_marketing" && (isJa ? "フォーム営業・配信代行のお問い合わせ" : "B2B Form Outreach Advisory")}
                    {activeCategory === "api_data" && (isJa ? "法人API・データ抽出・連携のお問い合わせ" : "Enterprise API & Data Advisory")}
                    {activeCategory === "billing_enterprise" && (isJa ? "料金プラン・お見積り・請求書払いのお問い合わせ" : "Enterprise Quotation & Invoicing")}
                    {activeCategory === "general_partner" && (isJa ? "業務提携・ご意見・一般お問い合わせ" : "General Inquiries & Partnerships")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {activeCategory === "general_partner"
                      ? (isJa
                          ? "サービスへのご意見・ご要望・苦情・取材・業務提携・その他のお問い合わせを承ります。専任担当者より原則1〜2営業日以内にご連絡差し上げます。"
                          : isVi
                          ? "Tiếp nhận ý kiến đóng góp, khiếu nại, phản hồi, hợp tác truyền thông và các yêu cầu khác. Đội ngũ chuyên môn sẽ phản hồi trong 1-2 ngày làm việc."
                          : "We welcome feedback, complaints, press inquiries, partnerships, and general requests. Our team will get back to you within 1-2 business days.")
                      : (isJa
                          ? "必要事項をご記入の上、送信してください。専任の担当者より1〜2営業日以内に詳細資料・お見積り等をご連絡申し上げます。"
                          : isVi
                          ? "Vui lòng điền thông tin bên dưới. Đội ngũ chuyên môn sẽ liên hệ lại kèm tài liệu và báo giá trong 1-2 ngày làm việc."
                          : "Please provide the details below. Our team will get back to you with documentation and quotation within 1-2 business days.")}
                  </p>
                </div>

                {/* Company & Department Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>{isJa ? "貴社名 / 組織名（個人の場合は「個人」と入力）" : isVi ? "Tên công ty / Cá nhân" : "Company / Organization Name"}</span>
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.2 rounded">
                        {isJa ? "必須" : "Required"}
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder={isJa ? "例: 株式会社サンプル" : "e.g. Sample Corp"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>{isJa ? "ご所属 部署・役職" : isVi ? "Bộ phận / Chức vụ" : "Department / Title"}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium px-1.5 py-0.2 rounded">
                        {isJa ? "任意" : "Optional"}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.department_role}
                      onChange={(e) => setFormData({ ...formData, department_role: e.target.value })}
                      placeholder={isJa ? "例: 営業企画部 部長 / 経営企画室" : "e.g. Sales Director"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>
                </div>

                {/* Name & Email Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>{isJa ? "ご担当者様 氏名" : isVi ? "Họ và tên người phụ trách" : "Contact Name"}</span>
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.2 rounded">
                        {isJa ? "必須" : "Required"}
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isJa ? "例: 山田 太郎" : "e.g. Taro Yamada"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>{isJa ? "メールアドレス（企業ドメイン推奨）" : isVi ? "Email doanh nghiệp" : "Business Email"}</span>
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.2 rounded">
                        {isJa ? "必須" : "Required"}
                      </span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isJa ? "yamada@company.co.jp" : "name@company.com"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{isJa ? "お電話番号" : isVi ? "Số điện thoại liên hệ" : "Phone Number"}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium px-1.5 py-0.2 rounded">
                      {isJa ? "任意" : "Optional"}
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={isJa ? "03-1234-5678（日中連絡が可能な番号）" : "03-1234-5678"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>

                {/* ===================================================
                    CATEGORY-SPECIFIC TAILORED FIELDS
                    =================================================== */}
                
                {/* 1. If Form Marketing */}
                {activeCategory === "form_marketing" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {isJa ? "想定の送信・アプローチ件数" : "Estimated Target Volume"}
                      </label>
                      <select
                        value={formData.form_send_scale}
                        onChange={(e) => setFormData({ ...formData, form_send_scale: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                      >
                        <option value="〜3,000件（トライアル）">〜3,000件（トライアル導入）</option>
                        <option value="3,000〜10,000件（標準推奨）">3,000〜10,000件（標準推奨）</option>
                        <option value="10,000〜50,000件（本格営業展開）">10,000〜50,000件（本格営業展開）</option>
                        <option value="50,000件以上（大口エンタープライズ）">50,000件以上（大口エンタープライズ）</option>
                        <option value="まずは適切な規模を相談したい">まずは適切な規模を相談したい</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {isJa ? "ご希望の支援・サポート内容" : "Requested Service Scope"}
                      </label>
                      <select
                        value={formData.form_support_need}
                        onChange={(e) => setFormData({ ...formData, form_support_need: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                      >
                        <option value="営業文面の作成・添削支援も希望">反響率を高める営業文面の作成・添削支援も希望</option>
                        <option value="意図シグナルを活用したターゲット企業選定支援">意図シグナルを活用したターゲット企業選定支援</option>
                        <option value="セルフ配信ツールの操作デモ・レクチャー">セルフ配信ツールの操作デモ・レクチャー</option>
                        <option value="定期配信代行（月額フルサポート）">定期配信代行（月額フルサポート）</option>
                        <option value="大口送信ボリュームディスカウントの相談">大口送信ボリュームディスカウントの相談</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 2. If API & Bulk Data */}
                {activeCategory === "api_data" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {isJa ? "ご検討のデータ規模・連携形態" : "Integration Format"}
                      </label>
                      <select
                        value={formData.data_scale}
                        onChange={(e) => setFormData({ ...formData, data_scale: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                      >
                        <option value="API連携（CRM/SFA常時クエリ連携）">API連携（CRM/SFA常時クエリ連携）</option>
                        <option value="スポット一括ダウンロード（1万件〜5万件）">スポット一括ダウンロード（1万件〜5万件）</option>
                        <option value="特定業界・地域カスタム抽出（5万件〜50万件）">特定業界・地域カスタム抽出（5万件〜50万件）</option>
                        <option value="日本全国全件データ購入（500万社）">日本全国全件データ購入（500万社マスター）</option>
                        <option value="定期データフィード（毎月差分更新）">定期データフィード（毎月差分更新）</option>
                        <option value="その他・PoC（検証検証）のご相談">その他・PoC（検証検証）のご相談</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {isJa ? "ご希望の提供フォーマット" : "Output Delivery Format"}
                      </label>
                      <select
                        value={formData.data_format}
                        onChange={(e) => setFormData({ ...formData, data_format: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                      >
                        <option value="REST API + Webhook">REST API + Webhook</option>
                        <option value="CSV / Excel形式">CSV / Excel形式</option>
                        <option value="JSON / Parquet形式">JSON / Parquet形式</option>
                        <option value="クラウドストレージ直接連携（S3 / GCS）">クラウドストレージ直接連携（S3 / GCS）</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 3. If Pricing & Enterprise Billing */}
                {activeCategory === "billing_enterprise" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {isJa ? "ご検討中のプラン・ご契約形態" : "Target Plan"}
                      </label>
                      <select
                        value={formData.plan_interest}
                        onChange={(e) => setFormData({ ...formData, plan_interest: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                      >
                        <option value="Enterpriseプラン（無制限・専任サポート）">Enterpriseプラン（無制限・専任サポート）</option>
                        <option value="Proプラン（月次 / 年間契約）">Proプラン（月次 / 年間契約）</option>
                        <option value="Starterプラン（年間一括契約）">Starterプラン（年間一括契約）</option>
                        <option value="フォーム営業チケットまとめ買い（5万〜50万通）">フォーム営業チケットまとめ買い（5万〜50万通）</option>
                        <option value="複数アカウント・チームライセンス導入">複数アカウント・チームライセンス導入</option>
                        <option value="その他カスタム契約">その他カスタム契約</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        {isJa ? "ご希望のお支払い条件" : "Payment Terms"}
                      </label>
                      <select
                        value={formData.invoice_term}
                        onChange={(e) => setFormData({ ...formData, invoice_term: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A]"
                      >
                        <option value="月末締め翌月末払い（請求書払い・銀行振込）">月末締め翌月末払い（請求書払い・銀行振込）</option>
                        <option value="年間一括前払い（請求書払い）">年間一括前払い（請求書払い・割引適用）</option>
                        <option value="クレジットカード決済（法人カード）">クレジットカード決済（法人カード）</option>
                        <option value="見積書・発注書・請求書の発行希望">見積書・発注書・請求書の発行希望</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. If General / Partner */}
                {activeCategory === "general_partner" && (
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span>{isJa ? "件名" : isVi ? "Tiêu đề" : "Subject"}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium px-1.5 py-0.2 rounded">
                        {isJa ? "任意" : "Optional"}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={isJa ? "例: 貴社データベースとのサービス連携について / 取材のお申し込み" : "Subject"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>
                )}

                {/* Main Message Textarea */}
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{isJa ? "お問い合わせ・ご相談内容の詳細" : isVi ? "Chi tiết nội dung liên hệ" : "Detailed Inquiry"}</span>
                    <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-1.5 py-0.2 rounded">
                      {isJa ? "必須" : "Required"}
                    </span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      activeCategory === "form_marketing"
                        ? (isJa
                            ? "ご検討の商材やサービスの概要、アプローチしたいターゲット業界・地域、現在の課題やご希望の開始時期などをご自由にご記入ください。"
                            : "Vui lòng mô tả sản phẩm dịch vụ, nhóm khách hàng B2B mục tiêu cần gửi form...")
                        : activeCategory === "api_data"
                        ? (isJa
                            ? "データ利用の目的、想定クエリ頻度、必要な項目（電話番号、所在地、売上高、求人シグナル等）、ご予算感などをご記入ください。"
                            : "Mô tả mục đích tích hợp API, số lượng truy vấn, các trường dữ liệu cần...")
                        : activeCategory === "billing_enterprise"
                        ? (isJa
                            ? "導入検討時期、ご希望のアカウント数、請求書送付先、その他社内稟議に必要な要件などをご記入ください。"
                            : "Yêu cầu báo giá, số lượng tài khoản cần mua, thông tin xuất hóa đơn...")
                        : (isJa
                            ? "お問い合わせの詳細をご自由にご記入ください。不具合のご報告の場合は、発生したページURLや操作手順を記載いただけますと幸いです。"
                            : "Chi tiết yêu cầu của bạn...")
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-xs leading-relaxed font-medium focus:ring-2 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>

                {/* Sales Outreach Rejection Notice */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{isJa ? "営業・セールス目的のご連絡に関するお願い" : isVi ? "Lưu ý về email chào hàng & quảng cáo" : "Notice on Sales Outreach"}</span>
                  </p>
                  <p>
                    {isJa
                      ? "※ 当フォームを利用した営業メール・協業を装った一方的な売り込み・ダイレクトセールスは一切お断りしております。送信された場合でも返信・対応はいたしかねます。"
                      : isVi
                      ? "※ Chúng tôi từ chối tiếp nhận mọi hình thức chào hàng, quảng cáo dịch vụ qua biểu mẫu này. Mọi tin nhắn chào hàng sẽ không được phản hồi."
                      : "※ Unsolicited sales pitches and promotional outreach sent via this form will be strictly ignored and not replied to."}
                  </p>
                </div>

                {/* Honeypot field (hidden from real users, caught by bots) */}
                <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
                  <input
                    type="text"
                    name="bot_trap"
                    tabIndex={-1}
                    autoComplete="off"
                    value={botTrap}
                    onChange={(e) => setBotTrap(e.target.value)}
                  />
                </div>

                {/* Cloudflare Turnstile CAPTCHA Widget */}
                <div className="flex justify-center my-2 min-h-[65px]">
                  <div id={turnstileContainerId}></div>
                </div>

                {/* Japanese B2B Privacy Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.agree_privacy}
                      onChange={(e) => setFormData({ ...formData, agree_privacy: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-[#1B4F8A] focus:ring-[#1B4F8A] cursor-pointer"
                    />
                    <span>
                      {isJa ? (
                        <>
                          当社の
                          <Link href={`/${locale}/privacy`} target="_blank" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold hover:opacity-80">
                            個人情報の取り扱い（プライバシーポリシー）
                          </Link>
                          および
                          <Link href={`/${locale}/terms`} target="_blank" className="text-[#1B4F8A] dark:text-blue-400 underline font-semibold hover:opacity-80">
                            利用規約
                          </Link>
                          に同意の上、送信します。
                        </>
                      ) : isVi ? (
                        <>
                          Tôi đã đọc và đồng ý với
                          <Link href={`/${locale}/privacy`} target="_blank" className="text-[#1B4F8A] underline font-semibold ml-1">
                            Chính sách bảo mật
                          </Link>
                          và
                          <Link href={`/${locale}/terms`} target="_blank" className="text-[#1B4F8A] underline font-semibold ml-1">
                            Điều khoản dịch vụ
                          </Link>.
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link href={`/${locale}/privacy`} target="_blank" className="text-[#1B4F8A] underline font-semibold">
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link href={`/${locale}/terms`} target="_blank" className="text-[#1B4F8A] underline font-semibold">
                            Terms of Service
                          </Link>.
                        </>
                      )}
                    </span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={submitting || !formData.agree_privacy}
                  className="w-full py-3.5 bg-[#1B4F8A] hover:bg-[#143D6C] text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isJa ? "送信処理中..." : isVi ? "Đang gửi..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {isJa 
                          ? "利用規約に同意して問い合わせを送信する（無料）" 
                          : isVi 
                          ? "Gửi thông tin liên hệ (Miễn phí)" 
                          : "Submit Inquiry (Free)"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  {isJa
                    ? "※ 送信後、自動受付メールがご入力いただいたメールアドレス宛に届きます。"
                    : isVi
                    ? "※ Email xác nhận tự động sẽ được gửi ngay sau khi hoàn tất."
                    : "※ An automatic confirmation email will be sent immediately upon submission."}
                </p>
              </form>
            )}
          </div>

          {/* ========================================================
              3. CORPORATE DESK & OPERATING INFO BOX
              ======================================================== */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isJa ? "運営事務局" : "Management Desk"}
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Kigyou-List 運営事務局
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isJa 
                  ? "日本全国500万社法人データベース & フォーム営業自動化プラットフォーム" 
                  : "National Corporate Database & B2B Sales Automation"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isJa ? "公式サポート窓口" : "Direct Email"}
              </span>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                <a 
                  href="mailto:contact@kigyoulist.com" 
                  className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline font-mono"
                >
                  contact@kigyoulist.com
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isJa ? "※ 24時間受付（順次返信）" : "※ 24/7 accepted, processed on weekdays"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isJa ? "営業時間・対応方針" : "Business Hours"}
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                平日 9:30 〜 18:00
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isJa 
                  ? "土日・祝日・年末年始を除く。通常1〜2営業日以内に専任担当者より回答" 
                  : "Excluding weekends & Japanese national holidays."}
              </p>
            </div>
          </div>

          {/* ========================================================
              4. FAQ ACCORDION SECTION (よくあるご質問)
              ======================================================== */}
          <div className="mt-14">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>FAQ</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {isJa ? "よくあるご質問（FAQ）" : isVi ? "Câu hỏi thường gặp" : "Frequently Asked Questions"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isJa 
                  ? "お問い合わせ前によく寄せられるご質問と回答を掲載しております。" 
                  : "Quick answers to common questions about our platform and services."}
              </p>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              {faqList.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#161B22] overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950 dark:text-blue-400 text-xs font-black flex items-center justify-center shrink-0">
                          Q
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {item.q}
                        </span>
                      </div>
                      <div className="text-slate-400 shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-4.5 sm:pb-4.5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            A
                          </span>
                          <div className="flex-1">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
}
