"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Order } from "../../../lib/orders";

type OrdersApiResponse = {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
};

const AnalyticsCharts = dynamic(
  () => import("../../../components/admin/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted">Loading charts…</p>,
  },
);

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders?page=1&limit=99999", {
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = (await response.json()) as OrdersApiResponse | Order[];
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : [];

      setOrders(data);
    } catch {
      setOrders([]);
    }
  };

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
  }, []);

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

  const revenueBars = useMemo(() => {
    const grouped = orders.reduce<Record<string, number>>((acc, order) => {
      if (order.status === "failed") return acc;
      const dateKey = order.createdAt.slice(0, 10);
      acc[dateKey] = (acc[dateKey] || 0) + order.total;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
  }, [orders]);

  const maxBarValue =
    revenueBars.length > 0
      ? Math.max(...revenueBars.map((item) => item.total), 1)
      : 1;

  const sentPercent = totalOrders > 0 ? (sentCount / totalOrders) * 100 : 0;
  const pendingPercent =
    totalOrders > 0 ? (pendingCount / totalOrders) * 100 : 0;

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

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Total revenue</p>
            <p className="font-semibold">৳{revenue.toLocaleString("en-BD")}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Sent %</p>
            <p className="font-semibold">{sentPercent.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="text-xs text-muted">Pending %</p>
            <p className="font-semibold">{pendingPercent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold">Revenue by date</p>
          {revenueBars.length === 0 ? (
            <p className="text-xs text-muted">No revenue data available.</p>
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {revenueBars.map((bar) => {
                const height = Math.max(8, (bar.total / maxBarValue) * 140);
                return (
                  <div key={bar.date} className="min-w-[56px] text-center">
                    <div className="h-40 flex items-end justify-center">
                      <div
                        className="w-8 rounded-t-lg bg-black transition-all duration-500"
                        style={{ height: `${height}px` }}
                        title={`${bar.date} - ৳${bar.total.toLocaleString("en-BD")}`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      {bar.date.slice(5)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AnalyticsCharts orders={orders} />
      </div>
    </section>
  );
}
