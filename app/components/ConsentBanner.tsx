"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_UPDATED_EVENT,
  getConsentState,
  setConsentState,
  type ConsentState,
} from "../../lib/consent";

export default function ConsentBanner() {
  const [consentState, setLocalConsentState] = useState<ConsentState>("unset");

  useEffect(() => {
    setLocalConsentState(getConsentState());

    const syncConsent = () => setLocalConsentState(getConsentState());
    window.addEventListener(CONSENT_UPDATED_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, syncConsent);
  }, []);

  if (consentState !== "unset") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] rounded-2xl border border-[#e9d7c8] bg-white/95 p-4 shadow-soft backdrop-blur sm:left-auto sm:max-w-md">
      <p className="text-sm text-muted">
        We use analytics and heatmap tools to improve shopping flow. You can accept or reject non-essential tracking.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setConsentState("denied")}
          className="rounded-full border border-[#d8c2b1] px-4 py-2 text-xs font-semibold text-muted"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => setConsentState("granted")}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
}
