"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, type Order } from "@/lib/orders";

type DashboardSummary = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
};

const currency = (value: number) => `৳${Number(value ?? 0).toLocaleString("en-BD")}`;

const summaryCards = (summary: DashboardSummary) => [
  { label: "Total Orders", value: summary.totalOrders },
  { label: "Pending Orders", value: summary.pendingOrders },
  { label: "Confirmed Orders", value: summary.confirmedOrders },
  { label: "Delivered Orders", value: summary.deliveredOrders },
  { label: "Total Revenue", value: currency(summary.totalRevenue) },
  { label: "Today Orders", value: summary.todayOrders },
  { label: "Today Revenue", value: currency(summary.todayRevenue) },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
    setLoading(false);
  }, []);

  const summary = useMemo<DashboardSummary>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const todayOrdersList = orders.filter((order) => order.createdAt.slice(0, 10) === today);

    return {
      totalOrders: orders.length,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalRevenue,
      todayOrders: todayOrdersList.length,
      todayRevenue: todayOrdersList.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
    };
  }, [orders]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-muted">Operational summary and order signals.</p>
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
        <h3 className="text-lg font-semibold">Inventory</h3>
        <p className="mt-4 text-sm text-muted">
          Product inventory and low-stock monitoring are managed in /admin/inventory.
        </p>
      </div>
    </section>
  );
}
