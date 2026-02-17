"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const stockBadgeClass = (stock: number) => {
  if (stock === 0) return "bg-red-100 text-red-700";
  if (stock <= 5) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(defaultDraft);
  const [localPreview, setLocalPreview] = useState<string>("");

  const previewImage = useMemo(() => localPreview || draft.image_url, [localPreview, draft.image_url]);

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
    setLocalPreview("");
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    setDraft(defaultDraft);
    setLocalPreview("");
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
      is_active: product.is_active === 1,
    });
    setLocalPreview("");
    setShowModal(true);
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.set("image", file);
    const result = await apiFetch<{ image_url: string }>("/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!result?.image_url) {
      throw new Error("Upload failed");
    }

    return result.image_url;
  };

  const handleImageFile = async (file: File) => {
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLocalPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setDraft((prev) => ({ ...prev, image_url: imageUrl }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
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
      description: draft.description.trim() || null,
      image_url: draft.image_url.trim() || null,
      is_active: draft.is_active ? 1 : 0,
    };

    try {
      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await apiFetch(`/admin/products/${editingProductId}/stock`, {
          method: "PATCH",
          body: JSON.stringify({ stock: payload.stock }),
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
    setError(null);
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

  const updateStock = async (product: AdminProduct, nextStock: number) => {
    if (nextStock < 0) return;
    setError(null);
    try {
      await apiFetch(`/admin/products/${product.id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock: nextStock }),
      });
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, stock: nextStock } : item)));
    } catch (stockError) {
      setError(stockError instanceof Error ? stockError.message : "Failed to update stock.");
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
              <div className="mb-3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} width={320} height={180} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-neutral-500">No image</div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{product.name}</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stockBadgeClass(Number(product.stock))}`}>
                  Stock: {product.stock}
                </span>
              </div>
              <p className="mt-2 text-sm">৳{Number(product.price ?? 0).toLocaleString("en-BD")}</p>
              <p className="mt-1 text-xs text-muted">Slug: {product.slug}</p>
              <p className="mt-1 text-xs text-muted">Status: {product.is_active === 1 ? "Active" : "Inactive"}</p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[#e6d8ce] px-2 py-1 text-xs font-semibold"
                  onClick={() => void updateStock(product, Math.max(0, Number(product.stock) - 1))}
                >
                  -
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[#e6d8ce] px-2 py-1 text-xs font-semibold"
                  onClick={() => void updateStock(product, Number(product.stock) + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[#e6d8ce] px-3 py-1 text-xs font-semibold"
                  onClick={() => openEditModal(product)}
                  disabled={submitting}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                  onClick={() => void handleDelete(product.id)}
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
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold">{editingProductId ? "Edit Product" : "Add Product"}</h3>
            <form className="mt-4 grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-neutral-700">Image Preview</p>
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                  {previewImage ? (
                    <Image src={previewImage} alt="Preview" width={420} height={300} className="h-52 w-full object-cover" />
                  ) : (
                    <div className="flex h-52 items-center justify-center text-xs text-neutral-500">No image selected</div>
                  )}
                </div>
                <label className="block text-xs font-semibold">
                  Image upload
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleImageFile(file);
                      }
                    }}
                  />
                </label>
                {uploading ? <p className="text-xs text-muted">Uploading image...</p> : null}
              </div>

              <div className="grid gap-3">
                <label className="text-xs font-semibold">
                  Name
                  <input
                    required
                    className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                    value={draft.name}
                    onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
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
                <label className="text-xs font-semibold">
                  Description
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                    value={draft.description}
                    onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(event) => setDraft((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                  Active product
                </label>

                <div className="flex justify-end gap-2 pt-2">
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
                    disabled={submitting || uploading}
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
