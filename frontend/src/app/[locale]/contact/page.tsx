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
  Search, 
  Mail, 
  Phone, 
  User, 
  Sparkles,
  Send
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { locale, t } = useLanguage();
  const isVi = locale === "vi";
  const isJa = locale === "ja";

  const [activeCategory, setActiveCategory] = useState<"company_manage" | "api_sales" | "partnership" | "general">("company_manage");

  // Category 1: Company Lookup States
  const [lookupCorpNum, setLookupCorpNum] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundCompany, setFoundCompany] = useState<{ corporate_number: string; company_name: string; prefecture_name?: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Forms for API / Partnership / General
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    data_scale: "API連携（常時クエリ）",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Company Lookup for Category 1
  const handleLookupCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = lookupCorpNum.trim().replace(/\D/g, "");
    if (cleanNum.length !== 13) {
      setLookupError(isJa ? "13桁の半角数字で法人番号を入力してください。" : "Vui lòng nhập đúng 13 số mã số pháp nhân.");
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
        setLookupError(isJa ? "該当する企業が見つかりませんでした。法人番号をご確認ください。" : "Không tìm thấy doanh nghiệp phù hợp.");
      }
    } catch {
      setLookupError(isJa ? "通信エラーが発生しました。" : "Lỗi kết nối.");
    } finally {
      setLookupLoading(false);
    }
  };

  // Submit General / API / Partnership Inquiry
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setResultMsg({
        type: "error",
        text: isJa ? "お名前、メールアドレス、お問い合わせ内容をご入力ください。" : "Vui lòng điền đầy đủ các trường bắt buộc.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeCategory === "api_sales" ? "api" : activeCategory === "partnership" ? "partner" : "general",
          company_name: formData.company_name.trim() || undefined,
          person_in_charge: formData.name.trim(),
          requester_email: formData.email.trim(),
          mobile_number: formData.phone.trim(),
          message: activeCategory === "api_sales"
            ? `【ご検討規模】${formData.data_scale}\n\n【詳細】\n${formData.message}`
            : formData.subject ? `【件名】${formData.subject}\n\n${formData.message}` : formData.message,
          locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultMsg({
          type: "success",
          text: data.message || (isJa ? "お問い合わせを受け付けました。2営業日以内にご連絡いたします。" : "Đã gửi yêu cầu thành công."),
        });
        setFormData({
          name: "",
          company_name: "",
          email: "",
          phone: "",
          data_scale: "API連携（常時クエリ）",
          subject: "",
          message: "",
        });
      } else {
        setResultMsg({
          type: "error",
          text: data.error || (isJa ? "送信に失敗しました。" : "Gửi thất bại."),
        });
      }
    } catch {
      setResultMsg({
        type: "error",
        text: isJa ? "通信エラーが発生しました。" : "Lỗi kết nối mạng.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 md:py-16 flex flex-col gap-10">
        {/* Page Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-900">
            <Sparkles className="w-3.5 h-3.5" />
            Kigyou-List 総合お問い合わせ窓口
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            お問い合わせ・公式サポート
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            自社企業情報の管理・公式認証、法人向けデータAPI、業務提携、サービス全般に関するお問い合わせを承っております。
          </p>
        </div>

        {/* 4 Category Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("company_manage");
              setResultMsg(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeCategory === "company_manage"
                ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">自社情報の管理・認証</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                公式認証バッジの取得、最新連絡先の反映、掲載停止
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-3 inline-flex items-center gap-1">
              専用窓口へ <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("api_sales");
              setResultMsg(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeCategory === "api_sales"
                ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">法人API・データ一括購入</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                500万社DBの一括CSV抽出、リアルタイムAPI連携
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-3 inline-flex items-center gap-1">
              相談フォームへ <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("partnership");
              setResultMsg(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeCategory === "partnership"
                ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/20 shadow-md ring-2 ring-purple-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Handshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">業務提携・広告掲載</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                B2Bアライアンス、サービス連携、バナー広告
              </p>
            </div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-3 inline-flex items-center gap-1">
              提携窓口へ <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("general");
              setResultMsg(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeCategory === "general"
                ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">一般・その他</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                ログイン・決済、不具合のご報告、サービス要望
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-3 inline-flex items-center gap-1">
              問い合わせへ <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        </div>

        {/* Global Feedback Message */}
        {resultMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-3 border ${
              resultMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            {resultMsg.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="mt-0.5">{resultMsg.text}</span>
          </div>
        )}

        {/* Dynamic Content by Category */}
        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none">
          
          {/* CATEGORY 1: COMPANY PROFILE MANAGEMENT & CLAIM */}
          {activeCategory === "company_manage" && (
            <div className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" /> 企業関係者・公式オーナー様専用窓口
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  自社情報の管理・公式認証・非公開申請
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Kigyou-Listでは、なりすましによる悪意ある改ざんを防止するため、各企業ページ内において<strong>「公式オーナー認証（本人確認）」</strong>を行った上で安全に情報の更新や非公開申請を受け付けております。
                </p>
              </div>

              {/* Fast Lookup Box */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 rounded-2xl p-6 space-y-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  貴社の法人番号（13桁）を入力して、自社管理ページを検索してください
                </label>

                <form onSubmit={handleLookupCompany} className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={13}
                      value={lookupCorpNum}
                      onChange={(e) => setLookupCorpNum(e.target.value)}
                      placeholder="例: 1010001000001 (国税庁13桁法人番号)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    企業を検索
                  </button>
                </form>

                {lookupError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {lookupError}
                  </p>
                )}

                {foundCompany && (
                  <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">法人番号: {foundCompany.corporate_number}</div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">{foundCompany.company_name}</h4>
                      {foundCompany.prefecture_name && (
                        <span className="text-xs text-slate-500 mt-1 block">所在地: {foundCompany.prefecture_name}</span>
                      )}
                    </div>
                    <Link
                      href={`/${locale}/company/${foundCompany.corporate_number}?claim=1`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      公式管理パネルを開く →
                    </Link>
                  </div>
                )}
              </div>

              {/* Guide steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center mb-2.5">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">自社ページを開く</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    法人番号から自社ページへアクセスし、「公式オーナー認証・情報管理」ボタンをクリック。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center mb-2.5">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">メールで本人確認</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    公式メールアドレス宛に届く6桁の認証コード（OTP）を入力して認証を完了。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center mb-2.5">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">情報更新または非公開</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    公式認証バッジの取得、PR文の掲載、電話番号やサイトURLの変更、非公開をワンストップで管理。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 2, 3, 4: STANDARD INQUIRY FORMS */}
          {activeCategory !== "company_manage" && (
            <form onSubmit={handleSubmitInquiry} className="space-y-6">
              <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {activeCategory === "api_sales"
                    ? "法人API・データ一括購入のお問い合わせ"
                    : activeCategory === "partnership"
                    ? "業務提携・広告掲載のご相談"
                    : "一般・その他のお問い合わせ"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  以下のフォームに必要事項をご記入の上、送信してください。担当者より2営業日以内にご連絡いたします。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    お名前 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: 山田 太郎"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    貴社名 / 組織名
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="例: 株式会社サンプル"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    メールアドレス <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yamada@company.co.jp"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03-1234-5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {activeCategory === "api_sales" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ご検討のデータ規模・連携形態
                  </label>
                  <select
                    value={formData.data_scale}
                    onChange={(e) => setFormData({ ...formData, data_scale: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="API連携（常時クエリ・システム連携）">API連携（常時クエリ・システム連携）</option>
                    <option value="スポット一括ダウンロード（1万件〜5万件）">スポット一括ダウンロード（1万件〜5万件）</option>
                    <option value="特定業界・地域カスタム抽出（5万件〜50万件）">特定業界・地域カスタム抽出（5万件〜50万件）</option>
                    <option value="日本全国全件データ購入（500万社）">日本全国全件データ購入（500万社）</option>
                    <option value="定期データフィード（毎月差分更新）">定期データフィード（毎月差分更新）</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              )}

              {activeCategory === "general" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    件名
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="お問い合わせの概要"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  お問い合わせ内容の詳細 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    activeCategory === "api_sales"
                      ? "データ利用の目的、想定利用頻度、必要な項目（電話番号、URL、売上高など）をご記入ください。"
                      : activeCategory === "partnership"
                      ? "貴社サービス概要および提携・協業のイメージをご記入ください。"
                      : "お問い合わせの詳細をご自由にご記入ください。"
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    お問い合わせを送信する
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
