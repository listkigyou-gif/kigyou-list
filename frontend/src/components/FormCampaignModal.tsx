"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Send, CheckCircle2, ShieldCheck, Sparkles, Building2, 
  User, Mail, Phone, ArrowRight, FileText, Check, Loader2, 
  ExternalLink, CreditCard, Layers, Coins
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  currentFilters?: any;
}

const PRESET_TEMPLATES = [
  {
    id: "b2b_saas",
    nameJa: "【B2Bサービス・SaaS】業務効率化・コスト削減提案",
    nameVi: "【B2B SaaS】Đề xuất giải pháp tối ưu chi phí & nghiệp vụ",
    nameEn: "【B2B SaaS】Operational Efficiency & Cost Reduction Pitch",
    subject: "【ご提案】貴社の業務効率化・コスト削減を支援するソリューションのご案内",
    body: `{{company_name}}
営業責任者様 / ご担当者様

貴社のWebサイト問い合わせ窓口より大変恐れ入ります。
[貴社名] の [ご担当者名] と申します。

貴社の事業効率化およびコスト最適化をご支援できるサービスのご案内でお問い合わせいたしました。
現在、多くの企業様において業務工数削減や受注率向上などの成果を実現しております。

もし少しでもご興味をお持ちいただけましたら、事例資料の送付またはオンライン（Zoom等で15分ほど）にて詳細をご紹介させていただけますと幸いです。

▼ サービス概要・詳細はこちら：
[貴社サービスURL]

ご多忙の折恐縮ではございますが、ご検討のほど何卒よろしくお願い申し上げます。
--------------------------------------------------
※特定商取引法に基づく表記：配信停止をご希望の場合は大変恐縮ですが本返信にてお知らせください。
[貴社名] / 担当: [ご担当者名]
Email: [返信用メールアドレス]
TEL: [電話番号]
--------------------------------------------------`
  },
  {
    id: "it_offshore",
    nameJa: "【IT受託・開発】エンジニア不足解消・受託開発案内",
    nameVi: "【Phần mềm & IT Outsourcing】Cung cấp kỹ sư & gia công phần mềm",
    nameEn: "【IT Outsourcing】Software Development & Dedicated Team",
    subject: "【エンジニア不足の解消】高スキル人材によるラボ型開発・システム受託のご案内",
    body: `{{company_name}}
開発責任者様 / DX推進ご担当者様

突然のご連絡失礼いたします。
[貴社名] の [ご担当者名] と申します。

弊社では、日本国内および海外トップクラスのエンジニアチームによる【Webシステム・スマホアプリ・AI受託開発】を提供しております。
通常比30〜40%のコストメリットとスピード納品で、多数の企業様の開発リソース不足を解消しております。

現在抱えていらっしゃる開発案件や保守運用の外注化について、概算見積もりやポートフォリオをご案内可能です。
ご興味をお持ちいただけましたら、まずはオンラインにてご挨拶を兼ねてお話しできれば幸いです。

▼ 開発実績・会社概要：
[貴社WebサイトURL]
--------------------------------------------------
※配信不要な場合は大変お手数ですがその旨ご返信ください。以降の連絡を停止いたします。
[貴社名] / 担当: [ご担当者名]
Email: [返信用メールアドレス]
--------------------------------------------------`
  },
  {
    id: "recruiting",
    nameJa: "【採用・人材】即戦力中途採用・完全成功報酬のご提案",
    nameVi: "【Tuyển dụng】Cung cấp nhân sự chất lượng cao - Phí thành công",
    nameEn: "【Recruiting】Direct Sourcing & Executive Search Pitch",
    subject: "【完全成功報酬】貴社の優秀層採用・人材不足を解消する採用支援のご案内",
    body: `{{company_name}}
採用ご責任者様 / 人事担当者様

Webサイトより突然のご連絡にて失礼いたします。
[貴社名] の [ご担当者名] と申します。

貴社の事業拡大に伴う採用活動にお役立ていただければと思い、ご連絡いたしました。
弊社は即戦力人材に特化した採用支援を行っており、【完全成功報酬型】のため初期費用・月額費用は一切かかりません。

現在の募集状況や採用課題について、15分ほど情報交換の機会を頂戴できますと幸いです。
--------------------------------------------------
[貴社名] / 担当: [ご担当者名]
Email: [返信用メールアドレス]
--------------------------------------------------`
  }
];

export const FormCampaignModal: React.FC<FormCampaignModalProps> = ({
  isOpen,
  onClose,
  totalCount,
  currentFilters = {}
}) => {
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, isLoggedIn, setAuthModalOpen } = useAuth();
  const isJa = locale === "ja";
  const isVi = locale === "vi";

  const [customCount, setCustomCount] = useState<number>(200);
  const [formCredits, setFormCredits] = useState<{ balance: number; total_purchased: number; total_used: number }>({
    balance: 0,
    total_purchased: 0,
    total_used: 0
  });
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [pitchSubject, setPitchSubject] = useState(PRESET_TEMPLATES[0].subject);
  const [pitchMessage, setPitchMessage] = useState(PRESET_TEMPLATES[0].body);
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && user?.email) {
      setEmail(user.email);
    }
  }, [isLoggedIn, user?.email]);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetch("/api/user/form-credits")
        .then(res => res.json())
        .then(data => {
          if (data?.credits) {
            setFormCredits(data.credits);
            if (data.credits.balance > 0) {
              setCustomCount(Math.min(data.credits.balance, 250));
            }
          }
        })
        .catch(err => console.error("Failed to load credits in modal:", err));
    }
  }, [isOpen, isLoggedIn]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (found) {
      setPitchSubject(found.subject);
      setPitchMessage(found.body);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyName || !contactName || !pitchSubject || !pitchMessage) {
      setErrorMsg(
        isJa 
          ? "必須項目（会社名、お名前、メールアドレス、件名、本文）をご入力ください。" 
          : isVi 
          ? "Vui lòng nhập các mục bắt buộc (Tên công ty, Họ tên, Email, Tiêu đề, Nội dung)." 
          : "Please fill in all required fields."
      );
      return;
    }

    if (customCount < 100) {
      setErrorMsg(
        isJa 
          ? "1キャンペーンあたりの配信件数は最低100件以上を指定してください（少数の過剰申請を防ぎ、アプローチ効果を担保するため）。" 
          : isVi 
          ? "Số lượng gửi tối thiểu cho mỗi chiến dịch là từ 100 form trở lên (nhằm tránh tạo quá nhiều chiến dịch nhỏ lẻ và đảm bảo hiệu quả tiếp cận)." 
          : "Minimum target count is 100 forms per campaign."
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const count = customCount;

    // Build payload for automated campaign creation
    const campaignPayload = {
      name: `${companyName}_フォーム営業_${new Date().toLocaleDateString("ja-JP")}`,
      sender_company: companyName,
      sender_name: contactName,
      sender_email: email,
      sender_phone: phone || null,
      sender_website: website || null,
      subject: pitchSubject,
      body: pitchMessage,
      target_filters: currentFilters,
      target_count: count,
      cost_jpy: 0,
      status: "draft"
    };

    try {
      // 1. If logged in, save campaign directly to user's campaigns database
      if (isLoggedIn) {
        await fetch("/api/user/form-campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignPayload)
        });
      }

      // 2. Also record in inquiry tracking for system logging
      await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FORM_DM_CAMPAIGN",
          company_name: companyName,
          person_in_charge: contactName,
          requester_email: email,
          mobile_number: phone,
          website_url: website,
          locale,
          message: `【セルフ型フォーム営業キャンペーン登録】
■ 配信設定件数: ${count.toLocaleString()} 件
■ 検索該当件数: ${totalCount.toLocaleString()} 件
■ 検索フィルター: ${JSON.stringify(currentFilters)}
■ 件名: ${pitchSubject}
■ 本文:
${pitchMessage}`
        })
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Form campaign creation error:", err);
      setErrorMsg(
        isJa 
          ? "保存に失敗しました。時間をおいて再試行してください。" 
          : isVi 
          ? "Lưu chiến dịch thất bại. Vui lòng thử lại sau." 
          : "Failed to save campaign. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-14 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              {isJa 
                ? "キャンペーンを作成・保存しました" 
                : isVi 
                ? "Đã tạo chiến dịch gửi Form thành công" 
                : "Campaign Created Successfully"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 max-w-md mx-auto mb-6 leading-relaxed">
              {isJa
                ? `抽出された【約 ${totalCount.toLocaleString()} 件】のターゲット条件を連携し、キャンペーン下書きとして保存しました。ダッシュボードから内容確認およびStripe決済による自動配信を行えます。`
                : isVi
                ? `Đã liên kết tệp 【khoảng ${totalCount.toLocaleString()} công ty】 vừa lọc vào chiến dịch của bạn. Bạn có thể xem lại bản nháp và tiến hành gửi tự động ngay trong Dashboard.`
                : `Target criteria for 【~${totalCount.toLocaleString()} companies】 has been saved to your campaign. Review drafts and launch outreach in your Dashboard.`}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2.5">
              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg font-semibold text-xs text-white bg-[#1B4F8A] hover:bg-[#163e6d] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>{isJa ? "マイキャンペーン管理画面へ" : isVi ? "Mở Dashboard quản lý chiến dịch" : "Go to Campaign Studio"}</span>
              </Link>
              <Link
                href={`/${locale}/pricing?tab=form`}
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg font-semibold text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isJa ? "配信枠の購入・料金表を見る" : isVi ? "Bảng giá & Mua lượt gửi qua Stripe" : "View Pricing & Purchase Credits"}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#1B4F8A] dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isJa ? "セルフ型・完全自動フォーム営業" : isVi ? "Tự Động Hóa Gửi Form B2B (Self-serve)" : "Self-Serve Automated Form Outreach"}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug mb-1.5">
              {isJa ? "この絞り込み条件でフォーム営業キャンペーンを作成" : isVi ? "Tạo Chiến Dịch Gửi Form Theo Bộ Lọc Này" : "Create Form Campaign from Filtered Targets"}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              {isJa
                ? `現在絞り込まれた【約 ${totalCount.toLocaleString()} 社】のターゲット企業を対象に、フォーム送信キャンペーンを作成・自動配信できます。`
                : isVi
                ? `Tạo chiến dịch tiếp cận tự động đến 【khoảng ${totalCount.toLocaleString()} doanh nghiệp】 theo đúng các tiêu chí bạn vừa lọc với tỷ lệ mở 50% - 90%.`
                : `Launch automated form outreach targeting 【~${totalCount.toLocaleString()} filtered companies】 with 50%-90% executive read rates.`}
            </p>

            {/* Filter Condition Verification Status */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {currentFilters.hasContactForm ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isJa ? "お問い合わせフォーム実在企業のみを抽出中 (Pro準拠)" : isVi ? "Đã lọc chính xác doanh nghiệp có Biểu mẫu liên hệ" : "Targeting verified Contact Form companies"}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{isJa ? "推奨: 検索条件で「お問い合わせフォーム」をONにすると配信成功率が向上します" : isVi ? "Khuyến nghị: Tích chọn 'Biểu mẫu liên hệ' để đạt hiệu quả cao nhất" : "Recommended: Enable 'Contact Form' filter for best outreach"}</span>
                </div>
              )}
            </div>

            {/* Direct Studio Link Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 mb-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {isJa
                    ? "保存済みのキャンペーンや独自テンプレートの管理はこちら:"
                    : isVi
                    ? "Quản lý chiến dịch và các mẫu thư ngỏ của bạn tại Studio:"
                    : "Manage saved campaigns and templates directly:"}
                </span>
              </div>
              <Link
                href={`/${locale}/dashboard?tab=formCampaigns`}
                onClick={onClose}
                className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-[#1B4F8A] dark:text-blue-400 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              >
                <span>{isJa ? "管理画面スタジオへ" : isVi ? "Mở Studio Quản lý" : "Open Studio"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Core Advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "営業お断り自動除外" : isVi ? "Lọc form cấm QC" : "Anti-Spam Filter"}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isJa ? "クレームリスクをAIが未然に防止" : isVi ? "Tự động bỏ qua web cấm chào hàng" : "Auto-skips strict disclaimer forms"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#1B4F8A]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "ビジネス敬語テンプレート" : isVi ? "Kịch bản chuẩn Kính ngữ" : "Keigo Templates"}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isJa ? "業種別の高成約率な文面を用意" : isVi ? "Mẫu câu từ chuẩn B2B Nhật" : "Pre-built high-converting copy"}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B4F8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4F8A]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "リアルタイムCSVレポート" : isVi ? "Báo cáo CSV minh bạch" : "Delivery CSV Log"}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isJa ? "送信日時・URLログを完全納品" : isVi ? "Tải log & bằng chứng gửi trực tiếp" : "URL & timestamp delivery proof"}
                  </p>
                </div>
              </div>
            </div>

            {/* Volume & Credit Wallet Selector */}
            <div className="mb-5 p-3.5 sm:p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  <span>{isJa ? "1. 配信件数を指定 (クレジット消費)" : isVi ? "1. Số lượng Form muốn gửi (Khấu trừ Ví Credits)" : "1. Outreach Target Volume"}</span>
                </label>
                <div className="text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">{isJa ? "保有残高:" : isVi ? "Số dư hiện có:" : "Wallet Balance:"}</span>
                  <strong className={formCredits.balance > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-600 dark:text-slate-350"}>
                    {formCredits.balance.toLocaleString()} 件
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 leading-relaxed">
                {isJa
                  ? "【最低100件〜・自由分割】1回のキャンペーンは最低100件から承っております。100件、250件、500件など小さく分割してテスト配信が可能です。"
                  : isVi
                  ? "【Tối thiểu 100 form trở lên】Mỗi chiến dịch gửi tối thiểu từ 100 form trở lên để đảm bảo hiệu quả tiếp cận. Bạn có thể tự do chia lẻ thành các đợt 100, 250, 500 form..."
                  : "Each campaign requires at least 100 forms to ensure outreach efficacy."}
              </p>

              <div className="relative mb-2">
                <input
                  type="number"
                  min={100}
                  value={customCount || ""}
                  onChange={(e) => setCustomCount(Math.max(100, parseInt(e.target.value) || 0))}
                  className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] shadow-2xs font-mono"
                  placeholder="100"
                />
                <span className="absolute right-3 top-2 text-xs font-medium text-slate-400">
                  {isJa ? "件 (最低100件〜)" : isVi ? "form (Tối thiểu 100)" : "forms (min 100)"}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium mr-0.5">{isJa ? "クイック選択:" : isVi ? "Chọn nhanh:" : "Presets:"}</span>
                {[100, 250, 500, 1000].map((presetNum) => (
                  <button
                    key={presetNum}
                    type="button"
                    onClick={() => setCustomCount(presetNum)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      customCount === presetNum
                        ? "bg-[#1B4F8A] text-white shadow-2xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {presetNum.toLocaleString()}件
                  </button>
                ))}
                {formCredits.balance > 0 && (
                  <button
                    key="balance-btn"
                    type="button"
                    onClick={() => setCustomCount(formCredits.balance)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      customCount === formCredits.balance
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/60"
                    }`}
                  >
                    {isJa ? `全残高 (${formCredits.balance.toLocaleString()}件)` : isVi ? `Toàn bộ số dư (${formCredits.balance.toLocaleString()})` : `All Balance (${formCredits.balance})`}
                  </button>
                )}
                {totalCount > 0 && totalCount !== customCount && (
                  <button
                    key="total-btn"
                    type="button"
                    onClick={() => setCustomCount(totalCount)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                  >
                    {isJa ? `検索抽出全件 (${totalCount.toLocaleString()}件)` : isVi ? `Toàn bộ tệp (${totalCount.toLocaleString()})` : `All Filtered (${totalCount})`}
                  </button>
                )}
              </div>

              {formCredits.balance === 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>💡 {isJa ? "まずは下書きとして保存し、後からクレジットをチャージできます。" : isVi ? "Bạn có thể lưu bản nháp ngay và nạp credits qua Stripe bất cứ lúc nào." : "Save as draft now and top up credits anytime."}</span>
                  <Link
                    href={`/${locale}/pricing?tab=form`}
                    target="_blank"
                    className="font-semibold underline text-[#1B4F8A] dark:text-blue-400 hover:underline shrink-0 ml-2"
                  >
                    {isJa ? "クレジット料金表を見る →" : isVi ? "Bảng giá nạp Credits →" : "View Credit Pricing →"}
                  </Link>
                </div>
              )}
            </div>

            {/* Campaign Creator Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {isJa ? "2. 送信者情報（特定商取引法に基づく表記）" : isVi ? "2. Thông tin người gửi (Theo luật Tokushoho)" : "2. Sender Profile"}
              </label>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "ご担当者様名 *" : isVi ? "Họ tên người gửi *" : "Contact Person *"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder={isJa ? "例: 山田 太郎" : isVi ? "Ví dụ: Nguyễn Văn A" : "e.g. John Doe"}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "返信用メールアドレス *" : isVi ? "Email nhận phản hồi *" : "Reply Email *"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {isJa ? "電話番号" : isVi ? "Số điện thoại" : "Phone Number"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="03-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                    />
                  </div>
                </div>
              </div>

              {/* Pitch Message & Templates */}
              <div className="pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isJa ? "3. 送信メッセージ (件名 & 本文)" : isVi ? "3. Thông điệp gửi (Tiêu đề & Nội dung)" : "3. Pitch Template"}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">{isJa ? "テンプレート引用:" : isVi ? "Chọn mẫu:" : "Load:"}</span>
                    <select
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      {PRESET_TEMPLATES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {isJa ? p.nameJa : isVi ? p.nameVi : p.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                      {isJa ? "件名 (Subject) *" : isVi ? "Tiêu đề thư ngỏ *" : "Subject Line *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={pitchSubject}
                      onChange={(e) => setPitchSubject(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {isJa ? "本文 (Body) *" : isVi ? "Nội dung thư ngỏ *" : "Body Text *"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setPitchMessage((prev) => prev + " {{company_name}}")}
                        className="text-[10px] font-mono text-[#1B4F8A] dark:text-blue-400 font-semibold hover:underline"
                      >
                        + {"{{company_name}}"} (宛先企業名)
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      required
                      value={pitchMessage}
                      onChange={(e) => setPitchMessage(e.target.value)}
                      className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href={`/${locale}/form-marketing`}
                  target="_blank"
                  className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{isJa ? "料金表・仕様詳細を見る" : isVi ? "Xem bảng giá chi tiết" : "View Service Details"}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {isJa ? "キャンセル" : isVi ? "Hủy" : "Cancel"}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-lg font-semibold text-xs text-white bg-[#1B4F8A] hover:bg-[#163e6d] shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isJa ? "キャンペーンを保存・作成" : isVi ? "Lưu & Tạo chiến dịch" : "Save & Create Campaign"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
