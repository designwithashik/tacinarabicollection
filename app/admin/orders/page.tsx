"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, setStoredOrders, type Order } from "@/lib/orders";

type OrderStatus = Order["status"];

const statuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "failed"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  useEffect(() => {
    setOrders(getStoredOrders());
    setLoading(false);
  }, []);

  const displayedOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (dateFilter && !order.createdAt.startsWith(dateFilter)) return false;
      return true;
    });
  }, [orders, statusFilter, dateFilter]);

  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) => {
      const updated = prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order));
      setStoredOrders(updated);
      return updated;
    });
  };

  const handleExportCsv = () => {
    const rows = [
      ["Order ID", "Customer", "Phone", "Total", "Status", "Created At"],
      ...displayedOrders.map((order) => [
        order.id,
        order.customer.name,
        order.customer.phone,
        String(order.total),
        order.status,
        order.createdAt,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "orders.csv";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Orders</h2>
          <p className="mt-1 text-sm text-muted">Review, filter, update statuses, and export CSV.</p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold"
          onClick={handleExportCsv}
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="text-xs font-semibold">
            Status
            <select
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Date
            <input
              type="date"
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-[#f7efe9]" />
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Order ID</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="border-t border-[#f0e4da]">
                    <td className="py-3 font-mono text-xs">{order.id}</td>
                    <td className="py-3">{order.customer.name}</td>
                    <td className="py-3">{order.customer.phone}</td>
                    <td className="py-3">৳{Number(order.total ?? 0).toLocaleString("en-BD")}</td>
                    <td className="py-3">
                      <select
                        className="rounded-xl border border-[#e6d8ce] px-3 py-1 text-xs"
                        value={order.status}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
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
