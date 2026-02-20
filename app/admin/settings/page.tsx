"use client";

import { useEffect, useState } from "react";

export default function AdminSettings() {
  const [imageKitPublicKey, setImageKitPublicKey] = useState("");
  const [whatsapp, setWhatsapp] = useState("+8801522119189");

  useEffect(() => {
    const storedKey = localStorage.getItem("tacin-imagekit-public-key");
    if (storedKey) setImageKitPublicKey(storedKey);
    const storedWhatsapp = localStorage.getItem("tacin-whatsapp");
    if (storedWhatsapp) setWhatsapp(storedWhatsapp);
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-muted">
          Configure admin-only settings and integrations.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <label className="text-xs font-semibold">
          ImageKit Public Key (local note)
          <input
            className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
            value={imageKitPublicKey}
            onChange={(event) => setImageKitPublicKey(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-xs font-semibold">
          WhatsApp Number
          <input
            className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("tacin-imagekit-public-key", imageKitPublicKey);
            localStorage.setItem("tacin-whatsapp", whatsapp);
          }}
          className="mt-4 min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
        >
          Save Settings
        </button>
      </div>
    </section>
  );
}
