"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage for consent state
    const consent = localStorage.getItem("cookie-consent-accepted");
    if (consent === null) {
      // Delay showing the banner slightly for a premium feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent-accepted", "true");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent-accepted", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-[9999] bg-white/95 dark:bg-[#1C2128]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 flex flex-col gap-4 animate-slide-in transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2.5 items-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary flex items-center justify-center shrink-0">
            <Cookie className="w-4.5 h-4.5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Cookie（クッキー）の使用について
          </h4>
        </div>
        <button
          onClick={handleReject}
          className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 transition-colors p-1 cursor-pointer"
          aria-label="Close cookie consent banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        当社は、お客様の利便性向上やアクセス解析のためにCookieを使用しています。「同意する」をクリックするか、本サイトの閲覧を続行することで、Cookieの使用に同意したことになります。詳細については、
        <Link
          href="/privacy"
          className="text-primary dark:text-secondary hover:underline font-semibold"
        >
          プライバシーポリシー
        </Link>
        をご覧ください。
      </p>

      <div className="flex gap-2 justify-end text-xs font-bold mt-1">
        <button
          onClick={handleReject}
          className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          拒否する
        </button>
        <button
          onClick={handleAccept}
          className="px-5 py-2 bg-primary hover:bg-primary-hover dark:bg-secondary dark:hover:bg-secondary-hover text-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
        >
          同意する
        </button>
      </div>
    </div>
  );
};
