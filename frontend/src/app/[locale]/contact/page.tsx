"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldAlert, Loader2, CheckCircle2, Building2, FileText, Mail, Info, User, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { locale, t } = useLanguage();

  const [formData, setFormData] = useState({
    corporate_number: '',
    company_name: '',
    person_in_charge: '',
    requester_email: '',
    mobile_number: '',
    type: '削除依頼',
    message: '',
    website_url: ''
  });
  
  // Turnstile CAPTCHA state
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerId = "contact-turnstile-container";
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inject Turnstile script
    const scriptId = "cloudflare-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let widgetId: any = null;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
    
    const renderTurnstile = () => {
      const container = document.getElementById(turnstileContainerId);
      if (container && (window as any).turnstile) {
        try {
          widgetId = (window as any).turnstile.render(`#${turnstileContainerId}`, {
            sitekey: siteKey,
            theme: 'light',
            language: locale,
            callback: (token: string) => setTurnstileToken(token),
            'expired-callback': () => setTurnstileToken(""),
            'error-callback': () => setTurnstileToken("")
          });
        } catch (e) {
          console.error("Turnstile render error", e);
        }
      }
    };

    // Retry render if script is still loading
    const interval = setInterval(() => {
      if ((window as any).turnstile) {
        clearInterval(interval);
        renderTurnstile();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (widgetId !== null && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetId);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify CAPTCHA
    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== "") {
      setError(locale === "vi" ? "Vui lòng xác minh CAPTCHA" : locale === "en" ? "Please verify CAPTCHA" : "スパム対策の認証を完了してください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Sending data:', {
        ...formData,
      });

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Include client timestamp to detect time-based anomalies
          client_timestamp: new Date().toISOString(),
          turnstileToken
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || t.contact.generalError);
      }
    } catch {
      setError(t.contact.networkError);
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
            {t.contact.tagline}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.contact.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t.contact.desc}
          </p>
        </div>

        <section className="bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-450 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.contact.successTitle}</h2>
              <p className="text-sm text-slate-500 max-w-md">
                {t.contact.successDesc}
              </p>
              <button 
                onClick={() => window.location.href = "/" + locale}
                className="mt-6 px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl text-sm"
              >
                {t.contact.backToHome}
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
                    {t.contact.inquiryType} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-1 transition-all ${formData.type === 'hide' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="inquiry_type" 
                          value="hide" 
                          checked={formData.type === 'hide'} 
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="font-bold text-sm">{t.contact.typeHide}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-6">{t.contact.typeHideDesc}</span>
                    </label>

                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-1 transition-all ${formData.type === 'update' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="inquiry_type" 
                          value="update" 
                          checked={formData.type === 'update'} 
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="font-bold text-sm">{t.contact.typeUpdate}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 ml-6">{t.contact.typeUpdateDesc}</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.contact.corporateNumber} <span className="text-rose-500">*</span>
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
                        placeholder={t.contact.placeholderCorporateNumber}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.contact.companyName} <span className="text-rose-500">*</span>
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
                        placeholder={t.contact.placeholderCompanyName}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.contact.email} <span className="text-rose-500">*</span>
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
                  <p className="text-[10px] text-slate-500 mt-1">{t.contact.emailHint}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {locale === "vi" ? "Người phụ trách" : locale === "en" ? "Person in charge" : "担当者"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={formData.person_in_charge}
                        onChange={(e) => setFormData({ ...formData, person_in_charge: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder={locale === "vi" ? "Ví dụ: Nguyễn Văn A" : locale === "en" ? "e.g., John Doe" : "例：山田 太郎"}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {locale === "vi" ? "Số điện thoại di động" : locale === "en" ? "Mobile Number" : "携帯番号"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="tel" 
                        required 
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder={locale === "vi" ? "Ví dụ: 090-1234-5678" : locale === "en" ? "e.g., 090-1234-5678" : "例：090-1234-5678"}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.contact.message} <span className="text-rose-500">*</span>
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
                      placeholder={t.contact.placeholderMessage}
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

                {/* Turnstile CAPTCHA */}
                <div className="flex justify-center mt-4">
                  <div id={turnstileContainerId}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.contact.sending}</span>
                    </>
                  ) : (
                    t.contact.sendBtn
                  )}
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
