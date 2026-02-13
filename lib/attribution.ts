export const ATTRIBUTION_STORAGE_KEY = "tacin:attribution";
export const ANALYTICS_EVENTS_STORAGE_KEY = "tacin:analytics-events";

const ATTR_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "igshid",
] as const;

export type AttributionParams = Partial<Record<(typeof ATTR_KEYS)[number], string>>;

export type AttributionTouch = {
  sessionId: string;
  timestamp: string;
  params: AttributionParams;
  landingPath: string;
};

export type AttributionState = {
  firstTouch: AttributionTouch | null;
  latestTouch: AttributionTouch | null;
};

export type AnalyticsEvent = {
  event: string;
  timestamp: string;
  attribution: AttributionState;
  payload: Record<string, unknown>;
};

const createSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const parseAttributionFromSearch = (search: string): AttributionParams => {
  const params = new URLSearchParams(search);
  return ATTR_KEYS.reduce<AttributionParams>((acc, key) => {
    const value = params.get(key);
    if (value) acc[key] = value;
    return acc;
  }, {});
};

const hasAttributionData = (params: AttributionParams) => Object.keys(params).length > 0;

const safeReadJson = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const getStoredAttribution = (): AttributionState => {
  if (typeof window === "undefined") {
    return { firstTouch: null, latestTouch: null };
  }

  const parsed = safeReadJson<AttributionState>(localStorage.getItem(ATTRIBUTION_STORAGE_KEY));
  if (!parsed) return { firstTouch: null, latestTouch: null };

  return {
    firstTouch: parsed.firstTouch ?? null,
    latestTouch: parsed.latestTouch ?? null,
  };
};

export const captureAttribution = (): AttributionState => {
  if (typeof window === "undefined") return { firstTouch: null, latestTouch: null };

  const params = parseAttributionFromSearch(window.location.search);
  const existing = getStoredAttribution();

  if (!hasAttributionData(params)) {
    return existing;
  }

  const touch: AttributionTouch = {
    sessionId: createSessionId(),
    timestamp: new Date().toISOString(),
    params,
    landingPath: `${window.location.pathname}${window.location.search}`,
  };

  const nextState: AttributionState = {
    firstTouch: existing.firstTouch ?? touch,
    latestTouch: touch,
  };

  localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
};

export const recordAnalyticsEvent = (event: AnalyticsEvent) => {
  if (typeof window === "undefined") return;
  const existing = safeReadJson<AnalyticsEvent[]>(
    localStorage.getItem(ANALYTICS_EVENTS_STORAGE_KEY)
  ) ?? [];
  const next = [...existing, event].slice(-500);
  localStorage.setItem(ANALYTICS_EVENTS_STORAGE_KEY, JSON.stringify(next));
};

export const getStoredAnalyticsEvents = (): AnalyticsEvent[] => {
  if (typeof window === "undefined") return [];
  return (
    safeReadJson<AnalyticsEvent[]>(localStorage.getItem(ANALYTICS_EVENTS_STORAGE_KEY)) ?? []
  );
};
