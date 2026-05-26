"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldAlert, Loader2, CheckCircle2, Building2, FileText, Mail, Info } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    corporate_number: "",
    company_name: "",
    requester_email: "",
    type: "hide",
    message: "",
    website_url: "" // Honeypot field
  });
  
  // Math CAPTCHA states
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate simple math question on mount
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify CAPTCHA
    if (parseInt(captchaInput) !== num1 + num2) {
      setError("計算問題の答えが正しくありません。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          num1,
          num2,
          captchaInput: parseInt(captchaInput, 10)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "エラーが発生しました。");
      }
    } catch {
      setError("通信エラーが発生しました。しばらく経ってから再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      <Header />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 md:py-20 flex flex-col gap-8 relative z-10">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-black text-primary dark:text-secondary uppercase tracking-widest bg-primary/10 dark:bg-secondary/10 px-3 py-1 rounded-full w-fit mx-auto">
            CONTACT & SUPPORT
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            お問い合わせ
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            企業情報の修正、または掲載の取り下げ（削除）をご希望の場合は、以下のフォームよりご連絡ください。法令に基づき速やかに対応いたします。
          </p>
        </div>

        <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">送信完了</h2>
              <p className="text-sm text-slate-500 max-w-md">
                お問い合わせを受け付けました。ご入力いただいたメールアドレス宛に確認メールをお送りする場合がございます。<br/>
                対応まで今しばらくお待ちください。
              </p>
              <button 
                onClick={() => window.location.href = "/"}
                className="mt-6 px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl text-sm"
              >
                トップページへ戻る
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p className="font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    お問い合わせ種別 <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-1 transition-all ${formData.type === 'hide' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="type" 
                          value="hide" 
                          checked={formData.type === 'hide'} 
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="font-bold text-sm">情報の掲載取り下げ（非公開）</span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-6">御社のデータを検索結果から除外します</span>
                    </label>

                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-1 transition-all ${formData.type === 'update' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="type" 
                          value="update" 
                          checked={formData.type === 'update'} 
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="font-bold text-sm">情報の修正・その他</span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-6">住所変更や間違ったデータの訂正など</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      法人番号 (13桁) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Info className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        maxLength={13}
                        value={formData.corporate_number}
                        onChange={(e) => setFormData({ ...formData, corporate_number: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="例: 1234567890123"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      法人名 (会社名) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="例: 株式会社サンプル"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    ご連絡先メールアドレス <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      required 
                      value={formData.requester_email}
                      onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      placeholder="example@yourcompany.co.jp"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">※ 本人確認のため、なるべく企業ドメインのメールアドレスをご利用ください。</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    お問い合わせ内容・理由 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <textarea 
                      required 
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-y"
                      placeholder="修正内容や取り下げの理由をご記入ください..."
                    />
                  </div>
                </div>

                {/* Honeypot field - Hidden from real users, bots will likely fill it */}
                <div className="hidden" aria-hidden="true">
                  <label>Leave this field blank</label>
                  <input 
                    type="text" 
                    name="website_url" 
                    tabIndex={-1} 
                    autoComplete="off"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>

                {/* Math CAPTCHA */}
                <div className="space-y-1.5 p-4 border border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20 rounded-xl">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    スパム防止のため計算してください <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {num1} + {num2} = 
                    </span>
                    <input 
                      type="number" 
                      required 
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none text-center"
                      placeholder="?"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "送信する"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
