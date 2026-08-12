"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, TranslationDict, translations } from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  dict: TranslationDict;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "berakit_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("id");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LOCAL_STORAGE_KEY) as Language;
      if (savedLang === "id" || savedLang === "en") {
        setLangState(savedLang);
      }
    } catch {
      // Fallback to Indonesian if localStorage unavailable
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newLang);
    } catch {
      // Ignore storage errors
    }
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: any = translations[lang];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  const dict = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return default fallback if used outside provider
    return {
      lang: "id" as Language,
      setLang: () => {},
      t: (path: string, fallback?: string) => fallback || path,
      dict: translations["id"],
    };
  }
  return context;
}
