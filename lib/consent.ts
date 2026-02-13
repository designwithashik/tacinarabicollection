export type ConsentState = "granted" | "denied" | "unset";

const CONSENT_STORAGE_KEY = "tacin:analytics-consent";
export const CONSENT_UPDATED_EVENT = "tacin:analytics-consent-updated";

export const getConsentState = (): ConsentState => {
  if (typeof window === "undefined") return "unset";

  const storedValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (storedValue === "granted" || storedValue === "denied") {
    return storedValue;
  }

  return "unset";
};

export const hasAnalyticsConsent = (): boolean => getConsentState() === "granted";

export const setConsentState = (state: Exclude<ConsentState, "unset">) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
};
