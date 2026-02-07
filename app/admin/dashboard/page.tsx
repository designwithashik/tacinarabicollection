"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/orders";

const formatMoney = (value: number) => `৳${value.toLocaleString("en-BD")}`;

type AdminProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  image: string;
  active: boolean;
  updatedAt: number;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  useEffect(() => {
    const load = async () => {
      const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
      if (!secret) return;
      const response = await fetch("/api/admin/products", {
        headers: { "x-admin-secret": secret },
      });
      if (!response.ok) return;
      const data = (await response.json()) as AdminProduct[];
      setProducts(data);
    };
    load();
  }, []);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.total, 0),
    [orders]
  );
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;
  const activeProducts = products.filter((product) => product.active).length;
  const inactiveProducts = products.length - activeProducts;
  const lastUpdate = products.length
    ? new Date(
        Math.max(...products.map((product) => product.updatedAt))
      ).toLocaleString()
    : "No updates";
  const quickActions = [
    {
      title: "Add new product",
      description: "Create a fresh listing in inventory.",
      href: "/admin/inventory",
    },
    {
      title: "Review orders",
      description: "Confirm the latest WhatsApp requests.",
      href: "/admin/orders",
    },
    {
      title: "Track performance",
      description: "See revenue and product trends.",
      href: "/admin/analytics",
    },
    {
      title: "Update settings",
      description: "Refresh WhatsApp and integrations.",
      href: "/admin/settings",
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">
          Dashboard Overview
        </h2>
        <p className="mt-1 text-sm text-muted">
          Snapshot of orders, revenue, and quick actions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: orders.length },
          { label: "Revenue", value: formatMoney(totalRevenue) },
          { label: "Avg Order", value: formatMoney(avgOrder) },
          { label: "Pending", value: orders.filter((o) => o.status === "pending").length },
          { label: "Total Products", value: products.length },
          { label: "Active Products", value: activeProducts },
          { label: "Inactive Products", value: inactiveProducts },
          { label: "Last Update", value: lastUpdate },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold text-muted">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Quick actions</h3>
        <p className="mt-1 text-sm text-muted">
          Jump straight to the tasks you run most often.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="group rounded-2xl border border-[#f0e4da] p-4 transition hover:border-accent/50"
            >
              <p className="text-sm font-semibold text-ink group-hover:text-accent">
                {action.title}
              </p>
              <p className="mt-1 text-xs text-muted">{action.description}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No orders yet.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {orders.slice(0, 5).map((order) => (
              <li
                key={order.id}
                className="flex flex-col gap-1 rounded-2xl border border-[#f0e4da] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{order.id}</span>
                  <span className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {order.items.length} items · {order.paymentMethod}
                  </span>
                  <span className="font-semibold">{formatMoney(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
