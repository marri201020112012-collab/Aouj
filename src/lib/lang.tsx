import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Lang } from "./i18n";
import { t as translate } from "./i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  isAr: boolean;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
  isAr: false,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const stored = (typeof localStorage !== "undefined" && localStorage.getItem("aouj_lang")) as Lang | null;
  const [lang, setLangState] = useState<Lang>(stored ?? "en");

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("aouj_lang", l);
  };

  // Apply RTL / LTR to the document root
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LangContextValue = {
    lang,
    setLang,
    t: (key, vars) => translate(key, lang, vars),
    dir: lang === "ar" ? "rtl" : "ltr",
    isAr: lang === "ar",
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
