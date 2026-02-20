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
    const paymentMatch = paymentFilter === "all" || order.paymentMethod === paymentFilter;
    const deliveryMatch = deliveryFilter === "all" || order.deliveryZone === deliveryFilter;
    return paymentMatch && deliveryMatch;
  });

  const deliveryLabel = (value: string) => (value === "inside" ? "Inside Dhaka" : "Outside Dhaka");

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="border-b pb-3 text-xl font-semibold">Orders</h2>
        <p className="mt-3 text-sm text-muted">Review and filter incoming orders.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-xs font-semibold">
            Payment
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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

      <div className="rounded-2xl bg-white p-6 shadow-md space-y-4">
        <h3 className="border-b pb-3 text-xl font-semibold">Orders Table</h3>
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order ID</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Delivery</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={index % 2 === 0 ? "bg-white transition-colors hover:bg-gray-50" : "bg-gray-50/60 transition-colors hover:bg-gray-100/70"}
                    >
                      <td className="px-4 py-3 font-semibold">{order.id}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-xs text-muted">{order.customer.phone}</p>
                      </td>
                      <td className="px-4 py-3">{deliveryLabel(order.deliveryZone)}</td>
                      <td className="px-4 py-3">{order.paymentMethod}</td>
                      <td className="px-4 py-3 font-semibold">৳{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
