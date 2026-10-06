"use client";

import React, { useState } from "react";
import { Building2 } from "lucide-react";

interface CompanyLogoProps {
  websiteUrl?: string | null;
  logoUrl?: string | null;
  companyName: string;
  className?: string;
  size?: number;
}

export function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const raw = url.trim();
    if (!raw || raw === "-" || raw.includes("none") || raw.includes("なし")) return null;
    const fullUrl = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(fullUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host.length < 3 || !host.includes(".")) return null;
    return host;
  } catch {
    return null;
  }
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  websiteUrl,
  logoUrl,
  companyName,
  className = "w-12 h-12 sm:w-14 sm:h-14",
  size = 128
}) => {
  const [imgError, setImgError] = useState(false);
  const domain = extractDomain(websiteUrl);

  // Source selection: direct logoUrl if available, otherwise Google Favicon 128px CDN
  let imgSrc: string | null = null;
  if (!imgError) {
    if (logoUrl && logoUrl.trim().startsWith("http")) {
      imgSrc = logoUrl.trim();
    } else if (domain) {
      imgSrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
    }
  }

  // Fallback to building icon if no image or failed
  if (!imgSrc) {
    return (
      <div 
        className={`${className} rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 text-primary dark:text-slate-300 flex items-center justify-center shrink-0 shadow-xs`}
        title={companyName}
      >
        <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
    );
  }

  return (
    <div 
      className={`${className} rounded-xl bg-white dark:bg-[#1E232B] border border-slate-200/90 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-sm`}
      title={`${companyName} Logo`}
    >
      <img
        src={imgSrc}
        alt={`${companyName} Logo`}
        className="w-full h-full object-contain rounded-md"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
};
