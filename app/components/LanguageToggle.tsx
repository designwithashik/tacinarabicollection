"use client";

import { useEffect, useState } from "react";

type Props = {
  language: "en" | "bn";
  setLanguage: (lang: "en" | "bn") => void;
};

export default function LanguageToggle({ language, setLanguage }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-full transition ${
          language === "en"
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        EN
      </button>

      <button
        onClick={() => setLanguage("bn")}
        className={`px-3 py-1 rounded-full transition ${
          language === "bn"
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        বাংলা
      </button>
    </div>
  );
}
