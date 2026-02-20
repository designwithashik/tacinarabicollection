"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  created_at?: string;
};

type ProductDraft = {
  name: string;
  price: number;
  image_url: string;
};

const defaultDraft: ProductDraft = {
  name: "",
  price: 0,
  image_url: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(defaultDraft);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price, image_url, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setProducts((data as AdminProduct[]) ?? []);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const resetModal = () => {
    setShowModal(false);
    setEditingProductId(null);
    setDraft(defaultDraft);
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    setDraft(defaultDraft);
    setShowModal(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProductId(product.id);
    setDraft({ name: product.name, price: Number(product.price ?? 0), image_url: product.image_url ?? "" });
    setShowModal(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingProductId) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ name: draft.name.trim(), price: Number(draft.price), image_url: draft.image_url.trim() || null })
          .eq("id", editingProductId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("products").insert([
          { name: draft.name.trim(), price: Number(draft.price), image_url: draft.image_url.trim() || null },
        ]);
        if (insertError) throw insertError;
      }
      resetModal();
      await loadProducts();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    setError(null);
    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from("products").delete().eq("id", productId);
      if (deleteError) throw deleteError;
      await loadProducts();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="space-y-6">{/* existing UI kept */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-heading text-2xl font-semibold">Products</h2><p className="mt-1 text-sm text-muted">Manage catalog, stock, and product visibility.</p></div><button type="button" onClick={openCreateModal} className="rounded-2xl border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold">Add Product</button></div>
    {error ? <p className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">{error}</p> : null}
    {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => (<div key={index} className="h-40 animate-pulse rounded-2xl bg-white shadow-soft" />))}</div> : products.length===0 ? <div className="rounded-2xl bg-white p-6 text-sm text-muted shadow-soft">No products found.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product)=>(<article key={product.id} className="rounded-2xl bg-white p-4 shadow-soft"><h3 className="font-semibold text-ink">{product.name}</h3><p className="mt-2 text-sm">৳{Number(product.price ?? 0).toLocaleString("en-BD")}</p><div className="mt-4 flex gap-2"><button type="button" className="rounded-xl border border-[#e6d8ce] px-3 py-1 text-xs font-semibold" onClick={() => openEditModal(product)} disabled={submitting}>Edit</button><button type="button" className="rounded-xl border border-red-200 px-3 py-1 text-xs font-semibold text-red-700" onClick={() => handleDelete(product.id)} disabled={submitting}>Delete</button></div></article>))}</div>}
    {showModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-soft"><h3 className="text-lg font-semibold">{editingProductId ? "Edit Product" : "Add Product"}</h3><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}><label className="text-xs font-semibold sm:col-span-2">Name<input required className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} /></label><label className="text-xs font-semibold">Price<input required min={0} type="number" className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm" value={draft.price} onChange={(event) => setDraft((prev) => ({ ...prev, price: Number(event.target.value) }))} /></label><label className="text-xs font-semibold">Image URL<input className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm" value={draft.image_url} onChange={(event) => setDraft((prev) => ({ ...prev, image_url: event.target.value }))} /></label><div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" className="rounded-xl border border-[#e6d8ce] px-3 py-2 text-sm" onClick={resetModal} disabled={submitting}>Cancel</button><button type="submit" className="rounded-xl border border-[#e6d8ce] bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={submitting}>{submitting ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}</button></div></form></div></div> : null}
  </section>;
}
