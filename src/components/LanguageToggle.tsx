"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const LanguageToggle = () => {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState("ar"); // Always start with default
  const [isClient, setIsClient] = useState(false);

  // Only run on client side after hydration
  useEffect(() => {
    setIsClient(true);

    // Get current locale from cookie
    const cookies = document.cookie.split(";");
    const localeCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("NEXT_LOCALE=")
    );
    const locale = localeCookie?.split("=")[1] || "ar";
    setCurrentLocale(locale);
  }, []);

  const toggleLanguage = () => {
    const newLocale = currentLocale === "ar" ? "en" : "ar";

    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year

    // Update state
    setCurrentLocale(newLocale);

    // Update HTML attributes
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";

    // Refresh the page to apply new locale
    router.refresh();
  };

  // Show a loading state or default content until client-side hydration is complete
  if (!isClient) {
    return (
      <button
        className="bg-white rounded-full px-3 py-1 flex items-center justify-center cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors"
        title="Toggle Language"
        disabled
      >
        <span className="text-xs font-medium">EN</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="bg-white rounded-full px-3 py-1 flex items-center justify-center cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors"
      title="Toggle Language"
    >
      <span className="text-xs font-medium">
        {currentLocale === "ar" ? "EN" : "ع"}
      </span>
    </button>
  );
};

export default LanguageToggle;
