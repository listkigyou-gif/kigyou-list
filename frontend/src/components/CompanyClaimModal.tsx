"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Mail,
  Building,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  Code,
  Copy,
  Check,
  Award,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";

interface CompanyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateNumber: string;
  companyName: string;
  initialEmail?: string;
  onClaimSuccess?: () => void;
}

export const CompanyClaimModal: React.FC<CompanyClaimModalProps> = ({
  isOpen,
  onClose,
  corporateNumber,
  companyName,
  initialEmail = "",
  onClaimSuccess,
}) => {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();

  const isJa = locale === "ja";
  const isVi = locale === "vi";

  // URL query params
  const emailFromUrl = searchParams.get("email") || initialEmail;
  const tokenFromUrl = searchParams.get("claim_token") || "";

  // Form states
  const [personInCharge, setPersonInCharge] = useState("");
  const [department, setDepartment] = useState("広報・総務部");
  const [email, setEmail] = useState(emailFromUrl);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prMessage, setPrMessage] = useState("");

  // OTP flow states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Submission & Result states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (emailFromUrl && !email) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl, email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setErrorMsg(isJa ? "有効なメールアドレスを入力してください。" : "Email không hợp lệ.");
      return;
    }

    setSendingOtp(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/inquiry/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCountdown(60);
      } else {
        setErrorMsg(data.error || (isJa ? "認証コードの送信に失敗しました。" : "Gửi OTP thất bại."));
      }
    } catch {
      setErrorMsg(isJa ? "サーバー通信エラーが発生しました。" : "Lỗi kết nối máy chủ.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!personInCharge.trim()) {
      setErrorMsg(isJa ? "担当者名を入力してください。" : "Vui lòng nhập họ tên người phụ trách.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(isJa ? "有効なメールアドレスを入力してください。" : "Vui lòng nhập email hợp lệ.");
      return;
    }

    if (!tokenFromUrl && !otpCode.trim()) {
      setErrorMsg(
        isJa
          ? "メールに届いた6桁の認証コードを入力してください。"
          : "Vui lòng nhập mã OTP 6 chữ số gửi đến email."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/companies/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_number: corporateNumber,
          email: email.trim(),
          person_in_charge: personInCharge.trim(),
          department: department.trim(),
          phone: phone.trim(),
          otp_code: otpCode.trim(),
          claim_token: tokenFromUrl || undefined,
          pr_title: prTitle.trim(),
          pr_message: prMessage.trim(),
          locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        if (onClaimSuccess) onClaimSuccess();
      } else {
        setErrorMsg(data.error || (isJa ? "認証に失敗しました。" : "Xác minh thất bại."));
      }
    } catch {
      setErrorMsg(isJa ? "通信エラーが発生しました。" : "Lỗi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  const embedSnippet = `<a href="https://kigyoulist.com/ja/company/${corporateNumber}" target="_blank" rel="noopener noreferrer">\n  <img src="https://kigyoulist.com/icon.svg" alt="${companyName} - Kigyou-List公式認証" width="120" height="36" />\n</a>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[11px] font-bold tracking-wider uppercase border border-white/20 mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> 完全無料・公式オーナー機能
              </div>
              <h2 className="text-xl font-black tracking-tight">{isJa ? "企業公式オーナー認証" : "Xác minh Chính chủ Doanh nghiệp"}</h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed">
            {companyName} の公式管理権限を取得し、「公式認証企業バッジ」の付与と最新の企業PRを掲載できます。
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200">
          {success ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isJa ? "公式オーナー認証が完了いたしました！" : "Xác minh chính chủ thành công!"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  貴社公式ページに<strong>「公式認証済マーク」</strong>が付与されました。<br />
                  ご登録いただいた連絡先へ完了のご案内をお送りいたしました。
                </p>
              </div>

              {/* Verified Badge Preview */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-4 py-2 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Kigyou-List 公式認証企業
                </span>
              </div>

              {/* Embed Badge Widget for SEO */}
              <div className="text-left bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-blue-500" />
                    貴社HP用 認証バッジ埋め込みコード (任意)
                  </span>
                  <button
                    onClick={copyEmbedCode}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? "コピー完了" : "コードをコピー"}
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-slate-600 dark:text-slate-400">
                  {embedSnippet}
                </pre>
                <p className="text-[10px] text-slate-400">
                  ※自社サイトのフッター等に配置いただくことで、信頼性の証明と企業PRにお役立ていただけます。
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all"
              >
                認証済みページを確認する
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitClaim} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Pre-verified Token Banner */}
              {tokenFromUrl && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    メール専用の認証トークンを確認いたしました。認証コードの入力不要で即時に認証可能です。
                  </span>
                </div>
              )}

              {/* Step 1: Representative info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  1. 申請者情報（広報・総務・代表者様）
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ご担当者様 氏名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={personInCharge}
                      onChange={(e) => setPersonInCharge(e.target.value)}
                      placeholder="例: 山田 太郎"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      部署・お役職
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="例: 広報部 / 代表取締役"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      連絡先電話番号
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="例: 03-1234-5678"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      公式メールアドレス <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@company.co.jp"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* OTP Section (Only if not token pre-verified) */}
                {!tokenFromUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        メール認証（本人確認）
                      </span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || otpCountdown > 0}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                      >
                        {sendingOtp ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : otpCountdown > 0 ? (
                          `再送信まで (${otpCountdown}s)`
                        ) : otpSent ? (
                          "コード再送信"
                        ) : (
                          "認証コードを送信"
                        )}
                      </button>
                    </div>

                    {otpSent && (
                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="メール記載の6桁コードを入力"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          ※入力されたメールアドレス宛に届いた6桁の数字をご入力ください。
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Optional PR message */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  2. 企業PRメッセージ（任意・後からいつでも変更可）
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    PRキャッチコピー
                  </label>
                  <input
                    type="text"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="例: 創業50年の信頼と技術力でモノづくりを支えます"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    企業アピール・事業紹介（公式メッセージ）
                  </label>
                  <textarea
                    rows={3}
                    value={prMessage}
                    onChange={(e) => setPrMessage(e.target.value)}
                    placeholder="貴社の強みや主力商品、採用メッセージ等をご自由にご入力ください。認証完了後、公式ページ上部に掲載されます。"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      認証処理を実行中...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      完全無料で公式オーナー認証を完了する
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2.5">
                  ※初期費用・月額利用料は一切発生いたしません（完全無料）。
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
