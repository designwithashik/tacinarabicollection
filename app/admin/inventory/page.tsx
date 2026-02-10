"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { AdminProduct } from "../../../lib/inventory";
import { uploadToCloudinaryUnsigned, validateImageUrl } from "../../../lib/images";

const defaultDraft: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  image: "",
  category: "Clothing",
  colors: ["Beige"],
  sizes: ["M", "L", "XL"],
  active: true,
  updatedAt: new Date().toISOString(),
};

export default function AdminInventory() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct>(defaultDraft);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isEditing = Boolean(draft.id);

  const hasCloudinaryConfig = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      ),
    []
  );

  const loadProducts = async () => {
    setError(null);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as AdminProduct[];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load inventory from KV.");
      setItems([]);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const uploadImageIfNeeded = async () => {
    if (!selectedFile) return draft.image;

    if (!hasCloudinaryConfig) {
      throw new Error(
        "Cloudinary env is missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
    }

    setUploading(true);
    try {
      return await uploadToCloudinaryUnsigned(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!draft.name || draft.price <= 0) {
      setError("Please fill out all required fields.");
      return;
    }

    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      // Prefer Cloudinary upload when file is selected; fallback to manual URL if upload fails.
      let imageUrl = draft.image;
      if (selectedFile) {
        try {
          imageUrl = await uploadImageIfNeeded();
        } catch {
          if (!validateImageUrl(draft.image)) {
            throw new Error("Image upload failed and fallback URL is invalid.");
          }
          imageUrl = draft.image;
        }
      }

      if (!validateImageUrl(imageUrl)) {
        setError("Please provide a valid image URL.");
        return;
      }

      const payload: Partial<AdminProduct> = {
        name: draft.name,
        price: Number(draft.price),
        image: imageUrl,
        category: draft.category,
        colors: draft.colors,
        sizes: draft.sizes,
        active: draft.active,
      };

      const endpoint = isEditing
        ? `/api/admin/products/${encodeURIComponent(draft.id)}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Failed to save product.");
      }

      setNotice(isEditing ? "Product updated." : "Product created.");
      setDraft(defaultDraft);
      setSelectedFile(null);
      await loadProducts();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save product."
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(id)}/delete`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setNotice("Product deleted.");
      if (draft.id === id) {
        setDraft(defaultDraft);
        setSelectedFile(null);
      }
      await loadProducts();
    } catch {
      setError("Failed to delete product.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-muted">
          Manage products, pricing, and visibility (KV persistence).
        </p>
        <p className="mt-1 text-xs text-muted">
          Cloudinary unsigned upload requires cloud name + upload preset env vars.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Update Product" : "Create Product"}
        </h3>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        {notice ? <p className="mt-2 text-xs text-emerald-700">{notice}</p> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Name
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          <label className="text-xs font-semibold">
            Price (BDT)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.price}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, price: Number(event.target.value) }))
              }
            />
          </label>
          <label className="text-xs font-semibold">
            Category
            <select
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.category}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  category: event.target.value as AdminProduct["category"],
                }))
              }
            >
              <option value="Clothing">Clothing</option>
              <option value="Ceramic">Ceramic</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Active
            <select
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.active ? "true" : "false"}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, active: event.target.value === "true" }))
              }
            >
              <option value="true">Active</option>
              <option value="false">Hidden</option>
            </select>
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold">Image URL (manual fallback)</label>
          <input
            className="w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
            value={draft.image}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, image: event.target.value }))
            }
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            {uploading ? <span className="text-xs text-muted">Uploading...</span> : null}
          </div>
        </div>

        {draft.image ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#f0e4da]">
            <Image
              src={draft.image}
              alt={draft.name || "Preview"}
              width={600}
              height={400}
              className="h-40 w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || uploading}
            className="min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving || uploading ? "Saving..." : isEditing ? "Update Product" : "Save Product"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(defaultDraft);
              setSelectedFile(null);
              setError(null);
            }}
            className="min-h-[44px] rounded-full border border-[#e6d8ce] px-5 py-2 text-sm font-semibold"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Inventory List</h3>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No products yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#f0e4da] p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{item.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">৳{item.price}</span>
                  <span className="text-xs font-semibold text-muted">
                    {item.active ? "Active" : "Hidden"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(item);
                      setSelectedFile(null);
                    }}
                    className="min-h-[36px] rounded-full border border-[#e6d8ce] px-3 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    className="min-h-[36px] rounded-full border border-red-200 px-3 text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
