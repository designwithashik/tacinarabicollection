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

  if (!mounted) return <div className="h-10 w-24" />;

  return (
    <div className="relative inline-flex h-10 items-center rounded-full bg-neutral-100 p-1">
      <div className={`absolute bottom-1 top-1 w-1/2 rounded-full bg-black transition-all ${language === "en" ? "left-1" : "left-1/2"}`} />
      <button type="button" onClick={() => setLanguage("en")} className="relative z-10 px-3 text-[12px] font-medium">
        <span className={language === "en" ? "text-white" : "text-neutral-900"}>EN</span>
      </button>
      <button type="button" onClick={() => setLanguage("bn")} className="relative z-10 px-3 text-[12px] font-medium">
        <span className={language === "bn" ? "text-white" : "text-neutral-900"}>বাং</span>
      </button>
    </div>
  );
}
