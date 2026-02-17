"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
};

export default function Button({
  variant = "primary",
  loading = false,
  children,
  className,
  disabled,
  icon,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "min-h-[40px] rounded-lg px-4 py-2 text-[13px] font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:hover:shadow-md",
        variant === "primary" && "bg-black text-white",
        variant === "secondary" && "border border-neutral-900 bg-white text-neutral-900",
        variant === "ghost" && "bg-transparent text-neutral-900",
        variant === "danger" && "bg-rose-600 text-white",
        variant === "success" && "bg-emerald-600 text-white",
        className
      )}
    >
      <span className="inline-flex items-center gap-2">
        {loading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
        {loading ? "Processing..." : children}
      </span>
    </button>
  );
}
