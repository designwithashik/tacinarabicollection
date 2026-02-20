"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Order } from "../../../lib/orders";

const AnalyticsCharts = dynamic(
  () => import("../../../components/admin/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted">Loading charts…</p>,
  },
);

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as Order[];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void loadOrders();

    const handler = () => {
      void loadOrders();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        handler();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "orders-updated") {
        handler();
      }
    };

    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("orders-updated", handler);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("orders-updated", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadOrders]);

  const totalOrders = orders.length;
  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders],
  );
  const sentCount = useMemo(
    () => orders.filter((order) => order.status === "sent").length,
    [orders],
  );
  const failedCount = useMemo(
    () => orders.filter((order) => order.status === "failed").length,
    [orders],
  );
  const revenue = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "failed")
        .reduce((sum, order) => sum + order.total, 0),
    [orders],
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <div>
          <h2 className="border-b pb-3 text-xl font-semibold">Analytics</h2>
          <p className="mt-2 text-sm text-muted">
            Client-side revenue insights and payment mix.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Total Orders</p>
            <p className="font-semibold">{totalOrders}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Pending</p>
            <p className="font-semibold">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Sent</p>
            <p className="font-semibold">{sentCount}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Failed</p>
            <p className="font-semibold">{failedCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
          <p className="text-xs text-muted">Revenue (excluding failed)</p>
          <p className="font-semibold">৳{revenue.toLocaleString("en-BD")}</p>
        </div>

        <AnalyticsCharts orders={orders} />
      </div>
    </section>
  );
}
