"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredOrders, setStoredOrders, type Order } from "@/lib/orders";

type AdminOrderStatus = "pending" | "confirmed" | "delivered";
type AdminOrder = {
  id: string;
  customer_name: string;
  phone: string;
  total_amount: number;
  status: AdminOrderStatus;
  created_at: string;
};

const statuses: AdminOrderStatus[] = ["pending", "confirmed", "delivered"];

const toAdminOrder = (order: Order): AdminOrder => ({
  id: order.id,
  customer_name: order.customer.name,
  phone: order.customer.phone,
  total_amount: Number(order.total ?? 0),
  status: order.status,
  created_at: order.createdAt,
});

const toCsv = (rows: AdminOrder[]) => {
  const header = ["id", "customer_name", "phone", "total_amount", "status", "created_at"];
  const data = rows.map((row) =>
    [row.id, row.customer_name, row.phone, row.total_amount, row.status, row.created_at]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header.join(","), ...data].join("\n");
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      setOrders(getStoredOrders().map(toAdminOrder));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  const displayedOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusMatches = !statusFilter || order.status === statusFilter;
      const dateMatches = !dateFilter || order.created_at.startsWith(dateFilter);
      return statusMatches && dateMatches;
    });
  }, [dateFilter, orders, statusFilter]);

  const updateOrderStatus = (orderId: string, nextStatus: AdminOrderStatus) => {
    setUpdatingOrderId(orderId);
    setError(null);

    try {
      const storedOrders = getStoredOrders();
      const nextOrders = storedOrders.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      );
      setStoredOrders(nextOrders);
      setOrders(nextOrders.map(toAdminOrder));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExportCsv = () => {
    setError(null);

    try {
      const blob = new Blob([toCsv(displayedOrders)], { type: "text/csv;charset=utf-8;" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "orders.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Failed to export CSV.");
    }
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

      {error ? <p className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">{error}</p> : null}

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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">ID</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="border-t border-[#f0e4da]">
                    <td className="py-3 font-medium">#{order.id.slice(0, 8)}</td>
                    <td className="py-3">{order.customer_name}</td>
                    <td className="py-3">{order.phone}</td>
                    <td className="py-3">৳{Number(order.total_amount ?? 0).toLocaleString("en-BD")}</td>
                    <td className="py-3">
                      <select
                        className="rounded-xl border border-[#e6d8ce] px-3 py-1 text-xs"
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value as AdminOrderStatus)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">{new Date(order.created_at).toLocaleString()}</td>
                    <td className="py-3 text-xs text-muted">
                      {updatingOrderId === order.id ? "Saving..." : "Stored locally"}
                    </td>
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
