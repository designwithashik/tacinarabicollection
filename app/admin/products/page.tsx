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
};

const defaultDraft: ProductDraft = {
  name: "",
  price: 0,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(defaultDraft);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) throw loadError;
      setProducts((data ?? []) as AdminProduct[]);
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
    setDraft(defaultDraft);
    setSelectedFile(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      if (!selectedFile) {
        throw new Error("Please select an image file.");
      }

      const filePath = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, selectedFile, { upsert: false });

      if (uploadError || !uploadData) throw uploadError ?? new Error("Upload failed");

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      const { error: insertError } = await supabase.from("products").insert([
        {
          name: draft.name,
          price: Number(draft.price),
          image_url: publicUrlData.publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      setNotice("Product created successfully.");
      resetModal();
      await loadProducts();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setNotice("Product deleted successfully.");
      await loadProducts();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-muted">Manage catalog, stock, and product visibility.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-2xl border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold"
        >
          Add Product
        </button>
      </div>

      {error ? <p className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">{error}</p> : null}
      {notice ? <p className="rounded-2xl bg-white p-4 text-sm text-green-700 shadow-soft">{notice}</p> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-white shadow-soft" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-muted shadow-soft">No products found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <h3 className="font-semibold text-ink">{product.name}</h3>
              <p className="mt-2 text-sm">৳{Number(product.price ?? 0).toLocaleString("en-BD")}</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                  onClick={() => handleDelete(product.id)}
                  disabled={submitting}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold">Add Product</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
              <label className="text-xs font-semibold sm:col-span-2">
                Name
                <input
                  required
                  className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Price
                <input
                  required
                  min={0}
                  type="number"
                  className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                  value={draft.price}
                  onChange={(event) => setDraft((prev) => ({ ...prev, price: Number(event.target.value) }))}
                />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                Image
                <input
                  required
                  type="file"
                  accept="image/*"
                  className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-[#e6d8ce] px-3 py-2 text-sm"
                  onClick={resetModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-[#e6d8ce] bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Uploading..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
