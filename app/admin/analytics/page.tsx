"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/orders";

const AnalyticsCharts = dynamic(
  () => import("../../../components/admin/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted">Loading charts…</p>,
  },
);

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      const next = await getStoredOrders();
      setOrders(next);
    };

    void loadOrders();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <div>
          <h2 className="border-b pb-3 text-xl font-semibold">Analytics</h2>
          <p className="mt-2 text-sm text-muted">
            Client-side revenue insights and payment mix.
          </p>
        </div>
        <AnalyticsCharts orders={orders} />
      </div>
    </section>
  );
}
