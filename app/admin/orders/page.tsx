"use client";

import { useEffect, useState } from "react";
import type { Order } from "../../../lib/orders";

type OrderStatus = "pending" | "delivering" | "sent" | "failed";

const orderStatuses: OrderStatus[] = [
  "pending",
  "delivering",
  "sent",
  "failed",
];

const formatCurrency = (amount: number) => `৳${Number(amount || 0).toFixed(2)}`;

const normalizeOrder = (raw: unknown): Order | null => {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  const customerSource =
    source.customer && typeof source.customer === "object"
      ? (source.customer as Record<string, unknown>)
      : null;

  const totalValue =
    typeof source.total === "number"
      ? source.total
      : typeof source.total === "string"
        ? Number(source.total)
        : 0;

  return {
    id: typeof source.id === "string" ? source.id : crypto.randomUUID(),
    createdAt:
      typeof source.createdAt === "string"
        ? source.createdAt
        : new Date().toISOString(),
    items: Array.isArray(source.items) ? (source.items as Order["items"]) : [],
    total: Number.isFinite(totalValue) ? totalValue : 0,
    paymentMethod:
      typeof source.paymentMethod === "string"
        ? source.paymentMethod
        : typeof source.payment === "string"
          ? source.payment
          : "COD",
    deliveryZone:
      source.deliveryZone === "outside" ? "outside" : "inside",
    customer: {
      name:
        typeof customerSource?.name === "string"
          ? customerSource.name
          : typeof source.customerName === "string"
            ? source.customerName
            : "",
      phone:
        typeof customerSource?.phone === "string"
          ? customerSource.phone
          : typeof source.phone === "string"
            ? source.phone
            : "",
      address:
        typeof customerSource?.address === "string"
          ? customerSource.address
          : typeof source.address === "string"
            ? source.address
            : "",
    },
    status:
      source.status === "pending" ||
      source.status === "delivering" ||
      source.status === "sent" ||
      source.status === "failed"
        ? source.status
        : "pending",
  };
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as unknown[];
      const normalized = (Array.isArray(data) ? data : [])
        .map((item) => normalizeOrder(item))
        .filter((item): item is Order => Boolean(item));
      setOrders(normalized);
    } catch {
      setOrders([]);
    }
  };

  const emitOrdersUpdated = () => {
    const stamp = Date.now().toString();
    localStorage.setItem("orders-updated", stamp);
    window.dispatchEvent(new Event("orders-updated"));
  };

  useEffect(() => {
    void loadOrders();

    const handler = () => {
      void loadOrders();
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
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    emitOrdersUpdated();
    await loadOrders();
    setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const deleteOrder = async (id: string) => {
    await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (selectedOrder?.id === id) {
      setSelectedOrder(null);
    }
    emitOrdersUpdated();
    await loadOrders();
  };

  const generateInvoice = (order: Order) => {
    setInvoiceError(null);

    try {
      const itemRows = order.items
        .map((item, index) => {
          const itemTotal = item.quantity * item.price;
          return `${index + 1}. ${item.name} (${item.size}) x ${item.quantity} = ${formatCurrency(itemTotal)}`;
        })
        .join("\n");

      const invoiceText = [
        "Tacin Arabi Collection",
        "Official Invoice",
        "",
        `Invoice ID: ${order.id}`,
        `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        `Status: ${order.status}`,
        `Customer: ${order.customer.name}`,
        `Phone: ${order.customer.phone}`,
        `Address: ${order.customer.address}`,
        `Delivery: ${deliveryLabel(order.deliveryZone)}`,
        `Payment: ${order.paymentMethod}`,
        "",
        "Items:",
        itemRows || "No items",
        "",
        `Grand Total: ${formatCurrency(order.total)}`,
      ].join("\n");

      const blob = new Blob([invoiceText], { type: "text/plain;charset=utf-8" });
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `Invoice-${order.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    } catch {
      setInvoiceError(
        "Something went wrong while generating invoice. Please try again.",
      );
    }
  };

  const filteredOrders = orders.filter((order) => {
    const paymentMatch =
      paymentFilter === "all" || order.paymentMethod === paymentFilter;
    const deliveryMatch =
      deliveryFilter === "all" || order.deliveryZone === deliveryFilter;
    return paymentMatch && deliveryMatch;
  });

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

        <div className="flex flex-wrap gap-3">
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
                      className={`transition-colors hover:bg-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
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
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowInvoicePreview(true);
                              setInvoiceError(null);
                            }}
                            className="border border-black rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteOrder(order.id)}
                            className="bg-red-600 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="admin-modal-enter my-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl sm:my-0">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-xl font-semibold">{selectedOrder.id}</h4>
              <button
                type="button"
                className="border border-black rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => {
                  setSelectedOrder(null);
                  setShowInvoicePreview(false);
                  setInvoiceError(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="font-semibold">Customer:</span>{" "}
                {selectedOrder.customer.name} · {selectedOrder.customer.phone}
              </p>
              <p className="text-muted">{selectedOrder.customer.address}</p>
              <p>
                <span className="font-semibold">Delivery:</span>{" "}
                {deliveryLabel(selectedOrder.deliveryZone)}
              </p>
              <p>
                <span className="font-semibold">Payment:</span>{" "}
                {selectedOrder.paymentMethod}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p>
                  <strong>Invoice ID:</strong> {selectedOrder.id}
                </p>
                <p>
                  <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs font-semibold">
                  Status
                  <select
                    value={selectedOrder.status}
                    onChange={(event) =>
                      void updateStatus(
                        selectedOrder.id,
                        event.target.value as OrderStatus,
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2"
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void deleteOrder(selectedOrder.id)}
                  className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-95"
                >
                  Delete Order
                </button>
              </div>

              <ul className="space-y-1 rounded-lg bg-gray-50 p-3">
                {selectedOrder.items.map((item) => (
                  <li key={`${selectedOrder.id}-${item.id}`}>
                    {item.name} · {item.size} · Qty {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-12 rounded-xl border border-black font-semibold transition active:scale-95"
                  onClick={() => setShowInvoicePreview((prev) => !prev)}
                >
                  {showInvoicePreview ? "Hide Invoice" : "View Invoice"}
                </button>
                <button
                  type="button"
                  className="h-12 rounded-xl bg-black text-white font-semibold active:scale-95 transition"
                  onClick={() => generateInvoice(selectedOrder)}
                >
                  Download Invoice (.txt)
                </button>
              </div>

              {showInvoicePreview ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs leading-6">
                  <p className="font-semibold">Tacin Arabi Collection</p>
                  <p>Official Invoice</p>
                  <p>Invoice ID: {selectedOrder.id}</p>
                  <p>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p>Status: {selectedOrder.status}</p>
                  <p>Mobile: {selectedOrder.customer.phone}</p>
                  <p className="pt-2 font-semibold">Items</p>
                  {selectedOrder.items.map((item) => (
                    <p key={`preview-${selectedOrder.id}-${item.id}-${item.size}`}>
                      {item.name} · Qty {item.quantity} · ৳{item.price} · ৳
                      {item.quantity * item.price}
                    </p>
                  ))}
                  <p className="pt-2 font-semibold">
                    Grand Total: {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              ) : null}

              {invoiceError ? (
                <p className="text-xs font-semibold text-red-600">{invoiceError}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
