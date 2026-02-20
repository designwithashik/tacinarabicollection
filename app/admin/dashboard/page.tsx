"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, type Order } from "@/lib/orders";

type InventoryProduct = {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold?: number;
};

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

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/admin/products", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as InventoryProduct[];
        setProducts(data ?? []);
      } catch {
        setProducts([]);
      }
    };

    void loadProducts();
  }, []);

  const summary = useMemo<DashboardSummary>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((order) => order.createdAt.startsWith(today));
    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const lowStockCount = products.filter((product) => product.stock <= Number(product.lowStockThreshold ?? 5)).length;

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      pendingOrders,
      totalRevenue,
      todayOrders: todayOrders.length,
      todayRevenue,
      lowStockCount,
    };
  }, [orders, products]);

  const lowStockItems = useMemo(
    () => products.filter((product) => product.stock <= Number(product.lowStockThreshold ?? 5)).slice(0, 10),
    [products]
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-muted">Operational summary and low-stock signals.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards(summary).map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold text-muted">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Low Stock Items</h3>
        {lowStockItems.length === 0 ? (
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
                    <td className="py-3">{product.lowStockThreshold ?? 5}</td>
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
