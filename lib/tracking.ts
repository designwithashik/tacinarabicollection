"use client";

import { hasAnalyticsConsent } from "./consent";

export type EcommerceEventName =
  | "view_item"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "page_view";

export type EcommerceItem = {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant?: string;
  quantity: number;
  price: number;
};

type TrackOptions = {
  requireConsent?: boolean;
};

type TrackPayload = Record<string, unknown>;

type TrackingWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
  hj?: (...args: unknown[]) => void;
};

const getCampaignAttribution = (search: URLSearchParams) => ({
  utm_source: search.get("utm_source") ?? undefined,
  utm_medium: search.get("utm_medium") ?? undefined,
  utm_campaign: search.get("utm_campaign") ?? undefined,
  utm_term: search.get("utm_term") ?? undefined,
  utm_content: search.get("utm_content") ?? undefined,
  gclid: search.get("gclid") ?? undefined,
  fbclid: search.get("fbclid") ?? undefined,
});

export const trackEvent = (
  eventName: EcommerceEventName,
  payload: TrackPayload = {},
  options: TrackOptions = {}
) => {
  if (typeof window === "undefined") return;

  const requiresConsent = options.requireConsent ?? true;
  if (requiresConsent && !hasAnalyticsConsent()) {
    return;
  }

  const trackingWindow = window as TrackingWindow;
  const eventPayload = { event: eventName, ...payload };

  if (Array.isArray(trackingWindow.dataLayer)) {
    trackingWindow.dataLayer.push(eventPayload);
  }

  if (typeof trackingWindow.gtag === "function") {
    trackingWindow.gtag("event", eventName, payload);
  }

  if (typeof trackingWindow.hj === "function") {
    trackingWindow.hj("event", eventName);
  }
};

export const trackPageView = (pathname: string, search: URLSearchParams) => {
  if (typeof window === "undefined") return;

  const language = window.localStorage.getItem("tacin-lang") ?? "en";

  trackEvent("page_view", {
    page_path: pathname,
    language,
    ...getCampaignAttribution(search),
  });
};
