"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_url: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
};

type ProductDraft = {
  name: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
  is_active: boolean;
};

const defaultDraft: ProductDraft = {
  name: "",
  price: 0,
  stock: 0,
  description: "",
  image_url: "",
  is_active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(defaultDraft);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminProduct[]>("/admin/products");
      setProducts(data ?? []);
    } catch (loadError) {
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
    setPreviewUrl("");
    setUploadingImage(false);
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    setDraft(defaultDraft);
    setPreviewUrl("");
    setShowModal(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProductId(product.id);
    setDraft({
      name: product.name,
      price: Number(product.price ?? 0),
      stock: Number(product.stock ?? 0),
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      is_active: product.is_active !== 0,
    });
    setPreviewUrl(product.image_url ?? "");
    setShowModal(true);
  };

  const uploadImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const uploadResponse = await fetch(`${baseUrl}/admin/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const uploadPayload = (await uploadResponse.json()) as { image_url?: string; error?: string };
      if (!uploadResponse.ok || !uploadPayload.image_url) {
        throw new Error(uploadPayload.error || "Upload failed.");
      }

      setDraft((prev) => ({ ...prev, image_url: uploadPayload.image_url ?? "" }));
      setPreviewUrl(uploadPayload.image_url ?? "");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: draft.name.trim(),
      price: Number(draft.price),
      stock: Number(draft.stock),
      description: draft.description.trim(),
      image_url: draft.image_url.trim() || null,
      is_active: draft.is_active ? 1 : 0,
    };

    try {
      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetModal();
      await loadProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    setSubmitting(true);
    try {
      await apiFetch(`/admin/products/${productId}`, { method: "DELETE" });
      await loadProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete product.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStock = async (productId: number, stock: number) => {
    const nextStock = Math.max(0, stock);
    try {
      await apiFetch(`/admin/products/${productId}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock: nextStock }),
      });
      await loadProducts();
    } catch (stockError) {
      setError(stockError instanceof Error ? stockError.message : "Stock update failed.");
    }
  };

  const getStockBadgeClass = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-700";
    if (stock <= 5) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
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
          onClick={openCreateModal}
          className="rounded-2xl border border-[#e6d8ce] bg-white px-4 py-2 text-sm font-semibold"
        >
          Add Product
        </button>
      </div>

      {error ? <p className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">{error}</p> : null}

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
              <div className="flex gap-3">
                <div className="relative h-20 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">No image</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-semibold text-ink">{product.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStockBadgeClass(Number(product.stock))}`}>
                      Stock {product.stock}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">৳{Number(product.price ?? 0).toLocaleString("en-BD")}</p>
                  <p className="mt-1 text-xs text-muted">{product.is_active ? "Active" : "Inactive"}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-[#e6d8ce] px-2 py-1">
                  <button type="button" className="p-1" onClick={() => void updateStock(product.id, Number(product.stock) - 1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[2ch] text-center text-xs font-semibold">{product.stock}</span>
                  <button type="button" className="p-1" onClick={() => void updateStock(product.id, Number(product.stock) + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl border border-[#e6d8ce] px-3 py-1 text-xs font-semibold"
                    onClick={() => openEditModal(product)}
                    disabled={submitting}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                    onClick={() => handleDelete(product.id)}
                    disabled={submitting}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold">{editingProductId ? "Edit Product" : "Add Product"}</h3>
            <form className="mt-4 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <p className="text-xs font-semibold">Image Preview</p>
                <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-[#e6d8ce] bg-neutral-100">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">No image selected</div>
                  )}
                </div>
                <label className="block text-xs font-semibold">
                  Image Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full rounded-xl border border-[#e6d8ce] px-3 py-2 text-sm"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage(file);
                    }}
                    disabled={uploadingImage || submitting}
                  />
                </label>
                {uploadingImage ? <p className="text-xs text-muted">Uploading image...</p> : null}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold">
                  Name
                  <input
                    required
                    className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                    value={draft.name}
                    onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold">
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
                  <label className="text-xs font-semibold">
                    Stock
                    <input
                      required
                      min={0}
                      type="number"
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={draft.stock}
                      onChange={(event) => setDraft((prev) => ({ ...prev, stock: Number(event.target.value) }))}
                    />
                  </label>
                </div>
                <label className="block text-xs font-semibold">
                  Description
                  <textarea
                    rows={5}
                    className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                    value={draft.description}
                    onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(event) => setDraft((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                  Active product
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="rounded-xl border border-[#e6d8ce] px-3 py-2 text-sm" onClick={resetModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl border border-[#e6d8ce] bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={submitting || uploadingImage}
                  >
                    {submitting ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
