"use client";

import React from "react";
import Link, { LinkProps } from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface LocaleLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  href: string;
  children: React.ReactNode;
}

export const LocaleLink: React.FC<LocaleLinkProps> = ({ href, children, ...props }) => {
  const { locale } = useLanguage();

  const isExternalOrAnchor = 
    href.startsWith("http://") || 
    href.startsWith("https://") || 
    href.startsWith("#") || 
    href.startsWith("mailto:") || 
    href.startsWith("tel:");
  
  let targetHref = href;
  if (!isExternalOrAnchor) {
    const cleanHref = href.startsWith("/") ? href : `/${href}`;
    
    // Check if the path already starts with any supported locale
    const hasLocalePrefix = 
      cleanHref.startsWith("/ja/") || cleanHref === "/ja" || 
      cleanHref.startsWith("/en/") || cleanHref === "/en" ||
      cleanHref.startsWith("/vi/") || cleanHref === "/vi" ||
      cleanHref.startsWith("/zh/") || cleanHref === "/zh";
    
    if (!hasLocalePrefix) {
      targetHref = `/${locale}${cleanHref === "/" ? "" : cleanHref}`;
    }
  }

  return (
    <Link href={targetHref} {...props}>
      {children}
    </Link>
  );
};
