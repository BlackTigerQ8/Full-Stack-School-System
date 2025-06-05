"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  messages: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: Language;
}> = ({ children, initialLanguage = "ar" }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [messages, setMessages] = useState<any>({});

  const loadMessages = async (lang: Language) => {
    try {
      const msgs = await import(`../locales/${lang}.json`);
      setMessages(msgs.default);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);

    // Update the HTML dir attribute
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;

    // Load new messages
    loadMessages(lang);
  };

  const toggleLanguage = () => {
    const newLang = language === "ar" ? "en" : "ar";
    setLanguage(newLang);
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && savedLanguage !== language) {
      setLanguageState(savedLanguage);
      loadMessages(savedLanguage);
    } else {
      loadMessages(language);
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, messages }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
