"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type DashboardSummary = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockCount: number;
};

type LowStockProduct = {
  id: number;
  name: string;
  stock: number;
  low_stock_threshold: number;
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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, lowStockData] = await Promise.all([
          apiFetch<DashboardSummary>("/admin/dashboard/summary"),
          apiFetch<LowStockProduct[]>("/admin/products/low-stock"),
        ]);

        if (!mounted) return;
        setSummary(summaryData);
        setLowStockItems(lowStockData ?? []);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

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
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards(summary).map((card) => (
            <div key={card.label} className="rounded-2xl bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold text-muted">{card.label}</p>
              <p className="mt-2 text-xl font-semibold text-ink">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Low Stock Items</h3>
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-[#f7efe9]" />
            ))}
          </div>
        ) : lowStockItems.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No low stock items right now.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Product Name</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((product) => (
                  <tr key={product.id} className="border-t border-[#f0e4da]">
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3">{product.stock}</td>
                    <td className="py-3">{product.low_stock_threshold}</td>
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
