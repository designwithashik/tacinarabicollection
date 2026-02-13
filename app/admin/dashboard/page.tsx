"use client";

import { useEffect, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/orders";

const formatMoney = (value: number) => `৳${value.toLocaleString("en-BD")}`;

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;

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
        ].map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold text-muted">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-ink">{card.value}</p>
          </div>
        ))}
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
