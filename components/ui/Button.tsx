"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-black text-white border-black hover:shadow-md",
  secondary: "border border-neutral-900 text-neutral-900 bg-white hover:shadow-md",
  ghost: "border border-transparent text-neutral-900 bg-transparent hover:bg-neutral-100",
  danger: "bg-rose-600 text-white border-rose-600 hover:shadow-md",
  success: "bg-emerald-600 text-white border-emerald-600 hover:shadow-md",
};

export default function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  disabled,
  fullWidth = false,
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "interactive-feedback min-h-[40px] rounded-lg border px-4 py-2 text-[14px] font-medium leading-[1.4] transition disabled:cursor-not-allowed disabled:opacity-60",
        "active:scale-95 motion-reduce:active:scale-100",
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? "Processing..." : children}
        {!loading ? icon : null}
      </span>
    </button>
  );
}
