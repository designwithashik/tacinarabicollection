"use client";

import { useEffect, useState } from "react";

const ANNOUNCEMENT_TEXT_KEY = "tacin-announcement-text";
const ANNOUNCEMENT_ACTIVE_KEY = "tacin-announcement-active";

export default function AdminSettings() {
  const [uploadcareKey, setUploadcareKey] = useState("");
  const [whatsapp, setWhatsapp] = useState("+8801522119189");
  const [announcementText, setAnnouncementText] = useState(
    "Free nationwide delivery updates • WhatsApp-first support • Elegant modest fashion curated for Bangladesh",
  );
  const [announcementActive, setAnnouncementActive] = useState(true);

  useEffect(() => {
    const storedKey = localStorage.getItem("tacin-uploadcare-key");
    if (storedKey) setUploadcareKey(storedKey);
    const storedWhatsapp = localStorage.getItem("tacin-whatsapp");
    if (storedWhatsapp) setWhatsapp(storedWhatsapp);

    const storedAnnouncement = localStorage.getItem(ANNOUNCEMENT_TEXT_KEY);
    if (storedAnnouncement) setAnnouncementText(storedAnnouncement);
    const storedAnnouncementActive = localStorage.getItem(ANNOUNCEMENT_ACTIVE_KEY);
    if (storedAnnouncementActive) {
      setAnnouncementActive(storedAnnouncementActive === "true");
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("tacin-uploadcare-key", uploadcareKey);
    localStorage.setItem("tacin-whatsapp", whatsapp);
    localStorage.setItem(ANNOUNCEMENT_TEXT_KEY, announcementText);
    localStorage.setItem(ANNOUNCEMENT_ACTIVE_KEY, String(announcementActive));
    window.dispatchEvent(new Event("tacin:announcement-updated"));
  };

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
          Uploadcare Public Key
          <input
            className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
            value={uploadcareKey}
            onChange={(event) => setUploadcareKey(event.target.value)}
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
      </div>

      <div className="rounded-xl bg-white shadow-md p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Announcement Text Bar</h3>
          <p className="text-sm text-muted">Manage the text shown under the hero carousel.</p>
        </div>

        <label className="block text-xs font-semibold">
          Announcement Text
          <textarea
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black mt-2"
            rows={4}
            value={announcementText}
            onChange={(event) => setAnnouncementText(event.target.value)}
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-800">Announcement Active</span>
          <button
            type="button"
            role="switch"
            aria-checked={announcementActive}
            onClick={() => setAnnouncementActive((prev) => !prev)}
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
              announcementActive ? "bg-black" : "bg-neutral-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
                announcementActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 rounded-lg border p-4 overflow-hidden relative bg-gray-50">
          <p className="mb-2 text-xs font-semibold text-neutral-600">Live Preview</p>
          <div className="rounded-md bg-black py-2 text-white">
            <div className="relative overflow-hidden whitespace-nowrap px-3">
              <div className="whitespace-nowrap animate-[announcementScroll_20s_linear_infinite] text-[13px] font-medium tracking-wide">
                {(announcementActive ? announcementText : "Announcement is currently hidden") ||
                  "Announcement preview"}{" "}
                &nbsp;&nbsp;&nbsp;
                {(announcementActive ? announcementText : "Announcement is currently hidden") ||
                  "Announcement preview"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          className="bg-black text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Save Settings
        </button>
      </div>
    </section>
  );
}
