"use client";

import React, { createContext, useContext } from "react";
import ja from "@/locales/ja";

type Translations = typeof ja;

interface LanguageContextProps {
  locale: string;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

export const LanguageProvider: React.FC<{
  locale: string;
  translations: Translations;
  children: React.ReactNode;
}> = ({ locale, translations, children }) => {
  return (
    <LanguageContext.Provider value={{ locale, t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
