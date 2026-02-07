"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/orders";

const AnalyticsCharts = dynamic(
  () => import("../../../components/admin/AnalyticsCharts"),
  { ssr: false, loading: () => <p className="text-sm text-muted">Loading charts…</p> }
);

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<
    { action: string; productId?: string; timestamp: number }[]
  >([]);

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  useEffect(() => {
    const load = async () => {
      const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
      if (!secret) return;
      const response = await fetch("/api/admin/logs", {
        headers: { "x-admin-secret": secret },
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        action: string;
        productId?: string;
        timestamp: number;
      }[];
      setLogs(data);
    };
    load();
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

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Admin Activity</h3>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No admin actions yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {logs.slice(0, 8).map((log, index) => (
              <li
                key={`${log.timestamp}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-[#f0e4da] px-3 py-2"
              >
                <span className="font-semibold">{log.action}</span>
                <span className="text-xs text-muted">
                  {log.productId ?? "—"} ·{" "}
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
