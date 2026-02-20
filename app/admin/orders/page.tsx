"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminOrder = {
  id: number;
  customer_name: string;
  phone: string;
  total_amount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "failed";
  created_at: string;
};

const statuses: AdminOrder["status"][] = ["pending", "confirmed", "shipped", "delivered", "failed"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("id,customer_name,phone,total_amount,status,created_at")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setOrders((data as AdminOrder[]) ?? []);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const displayedOrders = useMemo(() => orders.filter((o) => (!statusFilter || o.status===statusFilter) && (!dateFilter || o.created_at.startsWith(dateFilter))), [orders,statusFilter,dateFilter]);

  const updateOrderStatus = async (orderId: number, nextStatus: AdminOrder["status"]) => {
    const previousOrders = orders;
    setUpdatingOrderId(orderId);
    setError(null);
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)));
    try {
      const { error: updateError } = await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
      if (updateError) throw updateError;
    } catch (updateError) {
      console.error(updateError);
      setOrders(previousOrders);
      setError(updateError instanceof Error ? updateError.message : "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExportCsv = () => {
    const rows = displayedOrders.map((o) => `${o.id},${o.customer_name},${o.phone},${o.total_amount},${o.status},${o.created_at}`);
    const csv = ["id,customer_name,phone,total_amount,status,created_at", ...rows].join("\n");
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

  return <section className="space-y-6">{/* UI unchanged */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-heading text-2xl font-semibold">Orders</h2><p className="mt-1 text-sm text-muted">Review, filter, update statuses, and export CSV.</p></div><button type="button" className="rounded-2xl border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold" onClick={handleExportCsv}>Export CSV</button></div>
    {error ? <p className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">{error}</p> : null}
    <div className="rounded-3xl bg-white p-6 shadow-soft"><div className="mb-4 flex flex-wrap gap-3"><label className="text-xs font-semibold">Status<select className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All</option>{statuses.map((status)=><option key={status} value={status}>{status}</option>)}</select></label><label className="text-xs font-semibold">Date<input type="date" className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm" value={dateFilter} onChange={(event)=>setDateFilter(event.target.value)} /></label></div>
    {loading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => (<div key={index} className="h-10 animate-pulse rounded-xl bg-[#f7efe9]" />))}</div> : displayedOrders.length===0 ? <p className="text-sm text-muted">No orders found for the selected filters.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="text-xs uppercase tracking-wide text-muted"><th className="py-2">ID</th><th className="py-2">Customer</th><th className="py-2">Phone</th><th className="py-2">Total</th><th className="py-2">Status</th><th className="py-2">Date</th><th className="py-2">Action</th></tr></thead><tbody>{displayedOrders.map((order)=><tr key={order.id} className="border-t border-[#f0e4da]"><td className="py-3 font-medium">#{order.id}</td><td className="py-3">{order.customer_name}</td><td className="py-3">{order.phone}</td><td className="py-3">৳{Number(order.total_amount ?? 0).toLocaleString("en-BD")}</td><td className="py-3"><select className="rounded-xl border border-[#e6d8ce] px-3 py-1 text-xs" value={order.status} disabled={updatingOrderId===order.id} onChange={(event)=>updateOrderStatus(order.id,event.target.value as AdminOrder["status"])}>{statuses.map((status)=><option key={status} value={status}>{status}</option>)}</select></td><td className="py-3">{new Date(order.created_at).toLocaleString()}</td><td className="py-3 text-xs text-muted">{updatingOrderId===order.id?"Saving...":"Updated live"}</td></tr>)}</tbody></table></div>}</div>
  </section>;
}
