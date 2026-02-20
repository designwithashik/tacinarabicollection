"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, type Order } from "@/lib/orders";
import type { AdminProduct } from "@/lib/inventory";

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

const isToday = (isoDate: string) => {
  const now = new Date();
  const date = new Date(isoDate);

  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store", credentials: "include" }),
        ]);

        if (!productsRes.ok) {
          throw new Error("Failed to load product inventory.");
        }

        const productsData = (await productsRes.json()) as AdminProduct[];
        const orderData = getStoredOrders();

        if (!mounted) return;
        setProducts(Array.isArray(productsData) ? productsData : []);
        setOrders(orderData);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo<DashboardSummary>(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const todayOrdersCollection = orders.filter((order) => isToday(order.createdAt));

    return {
      totalProducts: products.length,
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayOrders: todayOrdersCollection.length,
      todayRevenue: todayOrdersCollection.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
      lowStockCount: 0,
    };
  }, [orders, products.length]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-muted">Operational summary and low-stock signals.</p>
      </div>

      {error ? <p className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">{error}</p> : null}

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
        <h3 className="text-lg font-semibold">Low Stock Items</h3>
        <p className="mt-4 text-sm text-muted">
          Stock tracking is not configured in the current inventory model.
        </p>
      </div>
    </section>
  );
}
