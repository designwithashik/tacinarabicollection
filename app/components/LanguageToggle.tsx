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
    <div className="relative inline-flex min-h-10 items-center rounded-full bg-[var(--brand-secondary)]/15 p-1">
      <div
        className={`absolute bottom-1 top-1 w-1/2 rounded-full bg-[var(--brand-primary)] transition-all duration-300 ease-in-out ${
          language === "en" ? "left-1" : "left-1/2"
        }`}
      />

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className="relative z-10 inline-flex min-h-10 items-center px-4 py-1 text-sm transition-colors duration-300"
      >
        <span className={language === "en" ? "text-white" : "text-[var(--brand-primary)]"}>
          EN
        </span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("bn")}
        className="relative z-10 inline-flex min-h-10 items-center px-4 py-1 text-sm transition-colors duration-300"
      >
        <span className={language === "bn" ? "text-white" : "text-[var(--brand-primary)]"}>
          বাংলা
        </span>
      </button>
    </div>
  );
}
