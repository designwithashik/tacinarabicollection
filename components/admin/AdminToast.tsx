"use client";

import clsx from "clsx";

type ToastTone = "success" | "error" | "info";

type AdminToastProps = {
  message: string;
  tone: ToastTone;
  onClose: () => void;
};

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-gray-200 bg-gray-100 text-gray-700",
};

export default function AdminToast({
  message,
  tone,
  onClose,
}: AdminToastProps) {
  return (
    <div className="admin-toast-enter fixed bottom-6 right-6 z-[70]">
      <div
        className={clsx(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
          toneClasses[tone],
        )}
      >
        <span>{message}</span>
        <button
          type="button"
          className="rounded-full border border-current/20 px-2 py-0.5 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
