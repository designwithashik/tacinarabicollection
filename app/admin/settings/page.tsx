"use client";

import { useEffect, useState } from "react";
import AdminToast from "@/components/admin/AdminToast";

type ToastState = {
  tone: "success" | "error" | "info";
  message: string;
};

export default function AdminSettings() {
  const [uploadcareKey, setUploadcareKey] = useState("");
  const [whatsapp, setWhatsapp] = useState("+8801522119189");
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem("tacin-uploadcare-key");
    if (storedKey) setUploadcareKey(storedKey);
    const storedWhatsapp = localStorage.getItem("tacin-whatsapp");
    if (storedWhatsapp) setWhatsapp(storedWhatsapp);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <div>
          <h2 className="border-b pb-3 text-xl font-semibold">Settings</h2>
          <p className="mt-2 text-sm text-muted">
            Configure admin-only settings and integrations.
          </p>
        </div>

        <label className="block text-xs font-semibold">
          Uploadcare Public Key
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={uploadcareKey}
            onChange={(event) => setUploadcareKey(event.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold">
          WhatsApp Number
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("tacin-uploadcare-key", uploadcareKey);
            localStorage.setItem("tacin-whatsapp", whatsapp);
            setToast({ tone: "success", message: "Settings saved." });
          }}
          className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Save Settings
        </button>
      </div>

      {toast ? (
        <AdminToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}
    </section>
  );
}
