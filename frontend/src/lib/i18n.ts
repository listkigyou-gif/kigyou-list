import ja from "@/locales/ja";
import en from "@/locales/en";
import vi from "@/locales/vi";

const dictionaries = {
  ja,
  en,
  vi,
};

export const getTranslations = (locale: string) => {
  return dictionaries[locale as keyof typeof dictionaries] || dictionaries.ja;
};
