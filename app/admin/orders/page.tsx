"use client";

import { useEffect, useState } from "react";
import { getStoredOrders, type Order } from "../../../lib/orders";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

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
      <div>
        <h2 className="font-heading text-2xl font-semibold">Orders</h2>
        <p className="mt-1 text-sm text-muted">
          Review and filter incoming orders.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <label className="text-xs font-semibold">
            Payment
            <select
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
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

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders found.</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <details
                key={order.id}
                className="rounded-2xl border border-[#f0e4da] p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{order.id}</span>
                    <span className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {deliveryLabel(order.deliveryZone)}
                    </span>
                    <span className="font-semibold">৳{order.total}</span>
                  </div>
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Customer:</span>{" "}
                    {order.customer.name} · {order.customer.phone}
                  </p>
                  <p className="text-muted">{order.customer.address}</p>
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.id}`}>
                        {item.name} · {item.size} · Qty {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
