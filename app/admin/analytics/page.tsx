"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/models/orders";

const AnalyticsCharts = dynamic(
  () => import("../../../components/admin/AnalyticsCharts"),
  { ssr: false, loading: () => <p className="text-sm text-muted">Loading charts…</p> }
);

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Analytics</h2>
        <p className="mt-1 text-sm text-muted">
          Client-side revenue insights and payment mix.
        </p>
      </div>
      <AnalyticsCharts orders={orders} />
    </section>
  );
}
