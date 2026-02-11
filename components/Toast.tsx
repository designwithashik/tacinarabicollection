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

export default function Toast({
  type,
  message,
  onClose,
  retryLabel = "Retry",
  onRetry,
}: Props) {
  return (
    <div
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      className={clsx(
        "toast-enter fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-soft",
        type === "success" && "bg-emerald-700",
        type === "error" && "bg-rose-700",
        type === "info" && "bg-ink"
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="interactive-feedback rounded-full border border-white/40 px-2 py-1 text-[11px]"
        >
          {retryLabel}
        </button>
      ) : null}
      <button type="button" onClick={onClose} className="interactive-feedback">
        ✕
      </button>
    </div>
  );
}
