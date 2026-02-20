"use client";

import type { Order } from "../../lib/models/orders";

const formatMoney = (value: number) => `৳${value.toLocaleString("en-BD")}`;

export default function AnalyticsCharts({ orders }: { orders: Order[] }) {
  const codTotal = orders
    .filter((o) => o.paymentMethod === "COD")
    .reduce((sum, o) => sum + o.total, 0);
  const prepaidTotal = orders
    .filter((o) => o.paymentMethod === "bKash/Nagad")
    .reduce((sum, o) => sum + o.total, 0);
  const maxTotal = Math.max(codTotal, prepaidTotal, 1);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <h3 className="text-lg font-semibold">Payment Split</h3>
      <div className="mt-4 space-y-4">
        {[
          { label: "COD", value: codTotal },
          { label: "Prepaid", value: prepaidTotal },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>{item.label}</span>
              <span>{formatMoney(item.value)}</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-[#efe5dc]">
              <div
                className="h-3 rounded-full bg-accent"
                style={{ width: `${(item.value / maxTotal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
