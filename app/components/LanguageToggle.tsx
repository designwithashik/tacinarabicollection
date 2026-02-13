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
        className={`px-4 py-2 rounded-full transition-all duration-300 ease-in-out text-sm tracking-wide ${
          language === "en"
            ? "bg-[var(--brand-primary)] text-white shadow-sm"
            : "bg-[var(--brand-surface)] border border-[var(--brand-secondary)] text-[var(--brand-primary)]"
        }`}
      >
        EN
      </button>

      <button
        onClick={() => setLanguage("bn")}
        className={`px-4 py-2 rounded-full transition-all duration-300 ease-in-out text-sm tracking-wide ${
          language === "bn"
            ? "bg-[var(--brand-primary)] text-white shadow-sm"
            : "bg-[var(--brand-surface)] border border-[var(--brand-secondary)] text-[var(--brand-primary)]"
        }`}
      >
        বাংলা
      </button>
    </div>
  );
}
