"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

type Props = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export default function ThemeToggle({ theme, setTheme }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="interactive-feedback flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-secondary)]/35 bg-[var(--brand-surface)] text-[var(--brand-primary)] shadow-sm"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
