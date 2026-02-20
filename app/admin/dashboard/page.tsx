"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, type Order } from "@/lib/orders";

type DashboardSummary = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockCount: number;
};

const currency = (value: number) => `৳${Number(value ?? 0).toLocaleString("en-BD")}`;

const summaryCards = (summary: DashboardSummary) => [
  { label: "Total Products", value: summary.totalProducts },
  { label: "Total Orders", value: summary.totalOrders },
  { label: "Pending Orders", value: summary.pendingOrders },
  { label: "Total Revenue", value: currency(summary.totalRevenue) },
  { label: "Today Orders", value: summary.todayOrders },
  { label: "Today Revenue", value: currency(summary.todayRevenue) },
  { label: "Low Stock Count", value: summary.lowStockCount },
];

const getTodayKey = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
    setLoading(false);
  }, []);

  const summary = useMemo<DashboardSummary>(() => {
    const todayKey = getTodayKey();
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const todayOrdersList = orders.filter(
      (order) => new Date(order.createdAt).toISOString().slice(0, 10) === todayKey
    );

    return {
      totalProducts: 0,
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayOrders: todayOrdersList.length,
      todayRevenue: todayOrdersList.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
      lowStockCount: 0,
    };
  }, [orders]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-muted">Operational summary and low-stock signals.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-white shadow-soft" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards(summary).map((card) => (
            <div key={card.label} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold text-muted">{card.label}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-[#f7efe9]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No orders available in this browser yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Order ID</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-t border-[#f0e4da]">
                    <td className="py-3 font-medium">#{order.id}</td>
                    <td className="py-3">{order.customer.name}</td>
                    <td className="py-3">৳{Number(order.total ?? 0).toLocaleString("en-BD")}</td>
                    <td className="py-3">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
