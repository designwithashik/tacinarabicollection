"use client";

import clsx from "clsx";

type ToastType = "success" | "error" | "info";

type Props = {
  type: ToastType;
  message: string;
  onClose: () => void;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function Toast({ type, message, onClose, retryLabel = "Retry", onRetry }: Props) {
  return (
    <div
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      className={clsx(
        "toast-enter fixed right-4 top-20 z-50 flex max-w-[320px] items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-lg",
        type === "success" && "bg-emerald-700",
        type === "error" && "bg-rose-700",
        type === "info" && "bg-neutral-900"
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="rounded border border-white/40 px-2 py-1 text-[11px]">
          {retryLabel}
        </button>
      ) : null}
      <button type="button" onClick={onClose} className="ml-auto text-xs">✕</button>
    </div>
  );
}
