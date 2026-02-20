"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order } from "../../../lib/orders";

type OrderStatus = "pending" | "delivering" | "sent" | "failed";

type OrdersApiResponse = {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
};

const orderStatuses: OrderStatus[] = [
  "pending",
  "delivering",
  "sent",
  "failed",
];

const ORDER_PAGE_SIZE = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const emitOrdersUpdated = () => {
    const stamp = Date.now().toString();
    localStorage.setItem("orders-updated", stamp);
    window.dispatchEvent(new Event("orders-updated"));
  };

  const buildQuery = (opts?: { forExport?: boolean }) => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

    if (startDate) {
      params.set("startDate", new Date(startDate).toISOString());
    }

    if (endDate) {
      params.set("endDate", new Date(endDate).toISOString());
    }

    params.set("page", String(opts?.forExport ? 1 : page));
    params.set("limit", String(opts?.forExport ? 99999 : ORDER_PAGE_SIZE));

    return params;
  };

  const fetchOrders = async (opts?: { forExport?: boolean }) => {
    try {
      const params = buildQuery(opts);
      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) return null;

      const payload = (await response.json()) as OrdersApiResponse | Order[];

      if (Array.isArray(payload)) {
        const next = payload;
        if (!opts?.forExport) {
          setOrders(next);
          setTotalOrders(next.length);
          setTotalPages(1);
        }
        return next;
      }

      const next = Array.isArray(payload.data) ? payload.data : [];

      if (!opts?.forExport) {
        setOrders(next);
        setTotalOrders(
          typeof payload.total === "number" ? payload.total : next.length,
        );
        setTotalPages(
          typeof payload.totalPages === "number"
            ? Math.max(1, payload.totalPages)
            : 1,
        );
      }

      return next;
    } catch {
      if (!opts?.forExport) {
        setOrders([]);
        setTotalOrders(0);
        setTotalPages(1);
      }
      return null;
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    void fetchOrders();
  }, [page, searchTerm, startDate, endDate]);

  useEffect(() => {
    const handler = () => {
      void fetchOrders();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        handler();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "orders-updated") {
        handler();
      }
    };

    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("orders-updated", handler);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("orders-updated", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, [page, searchTerm, startDate, endDate]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order)),
    );

    setSelectedOrder((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev,
    );

    emitOrdersUpdated();
    await fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (selectedOrder?.id === id) {
      setSelectedOrder(null);
    }

    emitOrdersUpdated();
    await fetchOrders();
  };

  const exportCsv = async () => {
    const all = await fetchOrders({ forExport: true });
    if (!all) return;

    const rows = [
      ["ID", "Name", "Phone", "Total", "Status", "CreatedAt"],
      ...all.map((order) => [
        order.id,
        order.customer.name,
        order.customer.phone,
        String(order.total),
        order.status,
        order.createdAt,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tacin-orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const paymentMatch =
          paymentFilter === "all" || order.paymentMethod === paymentFilter;
        const deliveryMatch =
          deliveryFilter === "all" || order.deliveryZone === deliveryFilter;
        return paymentMatch && deliveryMatch;
      }),
    [orders, paymentFilter, deliveryFilter],
  );

  const deliveryLabel = (value: string) =>
    value === "inside" ? "Inside Dhaka" : "Outside Dhaka";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <div>
          <h2 className="border-b pb-3 text-xl font-semibold">Orders</h2>
          <p className="mt-2 text-sm text-muted">
            Review and filter incoming orders.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold lg:col-span-2">
            Search
            <input
              type="text"
              placeholder="Search name or phone"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="mt-1 w-full rounded-full border border-gray-200 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold">
            Payment
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="COD">COD</option>
              <option value="bKash/Nagad">bKash/Nagad</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Delivery Zone
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={deliveryFilter}
              onChange={(event) => setDeliveryFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="inside">Inside Dhaka</option>
              <option value="outside">Outside Dhaka</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void exportCsv()}
            className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Export CSV
          </button>
          <p className="ml-auto text-xs text-muted">Total: {totalOrders}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <h3 className="border-b pb-3 text-xl font-semibold">Order Table</h3>
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders found.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`cursor-pointer transition-colors hover:bg-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="px-4 py-3 font-semibold">{order.id}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {deliveryLabel(order.deliveryZone)}
                      </td>
                      <td className="px-4 py-3">{order.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            void updateStatus(
                              order.id,
                              event.target.value as OrderStatus,
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 px-2 py-1"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ৳{order.total}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="border border-black rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Page {page} of {Math.max(1, totalPages)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="border border-black rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="bg-black text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="admin-modal-enter w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-xl font-semibold">
                Order #{selectedOrder.id}
              </h4>
              <button
                type="button"
                className="border border-black rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
              <p>
                <span className="font-semibold">Customer:</span>{" "}
                {selectedOrder.customer.name}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {selectedOrder.customer.phone}
              </p>
              <p className="md:col-span-2">
                <span className="font-semibold">Address:</span>{" "}
                {selectedOrder.customer.address}
              </p>
              <p>
                <span className="font-semibold">Created:</span>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Delivery:</span>{" "}
                {deliveryLabel(selectedOrder.deliveryZone)}
              </p>
              <p>
                <span className="font-semibold">Payment:</span>{" "}
                {selectedOrder.paymentMethod}
              </p>
              <label className="font-semibold">
                Status
                <select
                  value={selectedOrder.status}
                  onChange={(event) =>
                    void updateStatus(
                      selectedOrder.id,
                      event.target.value as OrderStatus,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-normal"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-sm font-semibold">Items</p>
              <ul className="space-y-2 text-sm">
                {selectedOrder.items.map((item) => (
                  <li
                    key={`${selectedOrder.id}-${item.id}`}
                    className="flex justify-between gap-2"
                  >
                    <span>
                      {item.name} · {item.size} · Qty {item.quantity}
                    </span>
                    <span>৳{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-semibold">
                Total: ৳{selectedOrder.total}
              </p>
              <button
                type="button"
                onClick={() => void deleteOrder(selectedOrder.id)}
                className="bg-red-600 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
