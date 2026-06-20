"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Lock, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { signIn } from "next-auth/react";

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, isLoggedIn, loginWithGoogle } = useAuth();
  const { locale, t } = useLanguage();

  const [emailInput, setEmailInput] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [magicLinkError, setMagicLinkError] = useState("");

  // Automatically close modal when logged in
  useEffect(() => {
    if (isLoggedIn && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [isLoggedIn, authModalOpen, setAuthModalOpen]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setMagicLinkStatus("sending");
    setMagicLinkError("");

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, locale }),
      });

      const data = await res.json();
      if (res.ok) {
        setMagicLinkStatus("success");
        setEmailInput("");
      } else {
        setMagicLinkStatus("error");
        setMagicLinkError(data.error || t.auth.magicLinkError);
      }
    } catch (err) {
      console.error("Magic link request failed:", err);
      setMagicLinkStatus("error");
      setMagicLinkError(t.auth.magicLinkError);
    }
  };

  if (!authModalOpen) return null;

  return (
    <div data-nosnippet className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-black/80 transition-all duration-300"
        onClick={() => setAuthModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-[#1C2128] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl transition-all duration-300 z-10 scale-100 flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          {/* Gradient Top Banner */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold mb-2 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.auth.freeRegisterTenSec}</span>
            </div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Lock className="w-4.5 h-4.5" />
              {t.auth.premiumFeaturesTitle}
            </h3>
            <p className="text-xs text-slate-100/80 mt-1">
              {t.auth.premiumFeaturesDesc}
            </p>
          </div>

          {/* Google Sign In Container */}
          <div className="p-6 flex flex-col gap-6">
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.auth.loginOrCreateTitle}
              </h4>
              <p className="text-[11px] text-slate-400">
                {t.auth.loginOrCreateDesc}
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full py-3.5 px-4 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#1C2128] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{t.auth.googleBtn}</span>
            </button>

            {/* Or Divider */}
            <div className="flex items-center my-1">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="px-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {t.auth.magicLinkOr}
              </span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>

            {/* Magic Link Email Form */}
            <form onSubmit={handleSendMagicLink} className="flex flex-col gap-2 -mt-2">
              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  {t.auth.magicLinkTitle}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t.auth.magicLinkPlaceholder}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-3 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 focus:bg-white dark:bg-[#1C2128] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={magicLinkStatus === "sending"}
                className="w-full py-3.5 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {magicLinkStatus === "sending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.auth.magicLinkSending}</span>
                  </>
                ) : (
                  <span>{t.auth.magicLinkBtn}</span>
                )}
              </button>
              
              {magicLinkStatus === "success" && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-left mt-1 font-semibold">
                  {t.auth.magicLinkSuccess}
                </p>
              )}
              {magicLinkStatus === "error" && (
                <p className="text-[11px] text-red-500 dark:text-red-400 text-left mt-1 font-semibold">
                  {magicLinkError}
                </p>
              )}
            </form>


            {/* Legal Consent Notice */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed -mt-2">
              {(() => {
                const parts = t.auth.consentNotice.split(/(\{terms\}|\{privacy\})/);
                return parts.map((part, idx) => {
                  if (part === "{terms}") {
                    return (
                      <Link 
                        key={idx} 
                        href={`/${locale}/terms`} 
                        className="text-primary hover:underline dark:text-secondary font-bold mx-0.5"
                      >
                        {t.auth.terms}
                      </Link>
                    );
                  }
                  if (part === "{privacy}") {
                    return (
                      <Link 
                        key={idx} 
                        href={`/${locale}/privacy`} 
                        className="text-primary hover:underline dark:text-secondary font-bold mx-0.5"
                      >
                        {t.auth.privacy}
                      </Link>
                    );
                  }
                  return part;
                });
              })()}
            </p>

            {/* Value Propositions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-left">
                {t.auth.unlockedFeaturesTitle}
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 text-left">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.auth.featureFaxEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.auth.featureSignalDetails}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.auth.featureMylist}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t.auth.featureKanban}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
