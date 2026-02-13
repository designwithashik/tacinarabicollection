"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/orders";
import {
  getStoredAnalyticsEvents,
  getStoredAttribution,
  type AnalyticsEvent,
} from "../../../lib/attribution";

const AnalyticsCharts = dynamic(
  () => import("../../../components/admin/AnalyticsCharts"),
  { ssr: false, loading: () => <p className="text-sm text-muted">Loading charts…</p> }
);

const conversionEvents = [
  "cta_profile_link_click",
  "cta_product_tap",
  "add_to_cart",
  "begin_checkout",
  "purchase",
] as const;

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
    setEvents(getStoredAnalyticsEvents());
  }, []);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseline = getStoredAttribution();
    const baselineSource = baseline.latestTouch?.params.utm_source ?? baseline.firstTouch?.params.utm_source;
    if (baselineSource) {
      counts[baselineSource] = 1;
    }

    for (const event of events) {
      const source =
        event.attribution.latestTouch?.params.utm_source
        ?? event.attribution.firstTouch?.params.utm_source
        ?? "direct";
      counts[source] = (counts[source] ?? 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const conversionCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      conversionEvents.map((item) => [item, 0])
    );
    for (const event of events) {
      if (event.event in counts) {
        counts[event.event] += 1;
      }
    }
    return counts;
  }, [events]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Analytics</h2>
        <p className="mt-1 text-sm text-muted">
          Client-side revenue insights, attribution sources, and conversion steps.
        </p>
      </div>
      <AnalyticsCharts orders={orders} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#e6d8ce] bg-white p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-ink">Traffic source counts (read-only)</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {sourceCounts.length === 0 ? <li>No attribution data yet.</li> : null}
            {sourceCounts.map(([source, count]) => (
              <li key={source} className="flex items-center justify-between">
                <span>{source}</span>
                <span className="font-semibold text-ink">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#e6d8ce] bg-white p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-ink">Conversion steps (read-only)</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {conversionEvents.map((step) => (
              <li key={step} className="flex items-center justify-between">
                <span>{step}</span>
                <span className="font-semibold text-ink">{conversionCounts[step] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
