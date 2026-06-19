import ja from "@/locales/ja";
import en from "@/locales/en";

const dictionaries = {
  ja,
  en,
};

export const getTranslations = (locale: string) => {
  return dictionaries[locale as keyof typeof dictionaries] || dictionaries.ja;
};
