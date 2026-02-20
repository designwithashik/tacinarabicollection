"use client";

import { useEffect, useState } from "react";

export default function AdminSettings() {
  const [uploadcareKey, setUploadcareKey] = useState("");
  const [whatsapp, setWhatsapp] = useState("+8801522119189");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem("tacin-uploadcare-key");
    if (storedKey) setUploadcareKey(storedKey);
    const storedWhatsapp = localStorage.getItem("tacin-whatsapp");
    if (storedWhatsapp) setWhatsapp(storedWhatsapp);
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="border-b pb-3 text-xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-muted">
          Configure admin-only settings and integrations.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md">
        <label className="text-xs font-semibold">
          Uploadcare Public Key
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={uploadcareKey}
            onChange={(event) => setUploadcareKey(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs font-semibold">
          WhatsApp Number
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("tacin-uploadcare-key", uploadcareKey);
            localStorage.setItem("tacin-whatsapp", whatsapp);
            setNotice("Settings saved successfully.");
          }}
          className="mt-4 min-h-[44px] rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Save Settings
        </button>
        {notice ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
        ) : null}
      </div>
    </section>
  );
}
