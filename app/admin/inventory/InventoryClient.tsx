"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { AdminProduct } from "../../../lib/inventory";

const INVENTORY_UPDATED_STORAGE_KEY = "tacin:inventory-updated-at";
const INVENTORY_UPDATED_EVENTS = ["tacin:inventory-updated", "product-added", "product-deleted"] as const;

const defaultDraft: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  image: "",
  category: "Clothing",
  colors: ["Beige"],
  sizes: ["M", "L", "XL"],
  active: true,
  heroFeatured: false,
  title: "",
  subtitle: "",
  updatedAt: new Date().toISOString(),
};

export default function AdminInventory() {
  const router = useRouter();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct>(defaultDraft);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isEditing = Boolean(draft.id);


  const loadProducts = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Array<Record<string, unknown>>;
      const shaped = (Array.isArray(data) ? data : []).map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        image: String(item.image_url ?? ""),
        category: "Clothing" as const,
        colors: ["Beige"],
        sizes: ["M", "L", "XL"],
        active: Number(item.is_active ?? 1) === 1,
        updatedAt: String(item.updated_at ?? item.created_at ?? new Date().toISOString()),
      }));
      setItems(shaped as AdminProduct[]);
    } catch {
      setError("Failed to load inventory from D1.");
      setItems([]);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name || draft.price <= 0) {
      setError("Please fill out all required fields.");
      return;
    }

    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      const endpoint = isEditing
        ? `/api/admin/products/${encodeURIComponent(draft.id)}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      let res: Response;
      if (isEditing) {
        const payload: Partial<AdminProduct> = {
          name: draft.name,
          price: Number(draft.price),
          active: draft.active,
        };

        res = await fetch(endpoint, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        if (!selectedFile) {
          setError("Please select an image file.");
          return;
        }

        const formData = new FormData();
        formData.set("name", draft.name);
        formData.set("price", String(draft.price));
        formData.set("image", selectedFile);

        res = await fetch(endpoint, {
          method,
          credentials: "include",
          body: formData,
        });
      }

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Failed to save product.");
      }

      setNotice(isEditing ? "Product updated." : "Product created.");
      setDraft(defaultDraft);
      setSelectedFile(null);
      await loadProducts();
      if (typeof window !== "undefined") {
        const stamp = String(Date.now());
        window.localStorage.setItem(INVENTORY_UPDATED_STORAGE_KEY, stamp);
        INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
          window.dispatchEvent(new Event(eventName));
        });
      }
      router.refresh();
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
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      setNotice("Product deleted.");
      if (draft.id === id) {
        setDraft(defaultDraft);
        setSelectedFile(null);
      }
      await loadProducts();
      if (typeof window !== "undefined") {
        const stamp = String(Date.now());
        window.localStorage.setItem(INVENTORY_UPDATED_STORAGE_KEY, stamp);
        INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
          window.dispatchEvent(new Event(eventName));
        });
      }
      router.refresh();
    } catch {
      setError("Failed to delete product.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-muted">
          Manage products, pricing, and visibility (D1 persistence).
        </p>
        <p className="mt-1 text-xs text-muted">
          Image uploads and deletes are handled by the Worker via ImageKit.
        </p>
      </div>

      <form className="rounded-3xl bg-white p-6 shadow-soft" onSubmit={handleSave}>
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
          <label className="text-xs font-semibold">
            Hero Featured
            <select
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.heroFeatured ? "true" : "false"}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, heroFeatured: event.target.value === "true" }))
              }
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Hero Title
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.title ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Displayed headline for hero slide"
            />
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Hero Subtitle
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.subtitle ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, subtitle: event.target.value }))
              }
              placeholder="Displayed supporting text for hero slide"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold">Image</label>
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
            type="submit"
            disabled={saving || uploading}
            className="min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading
              ? "Uploading..."
              : saving
              ? "Saving..."
              : isEditing
              ? "Update Product"
              : "Save Product"}
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
      </form>

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
                    {item.active ? "Active" : "Hidden"} {item.heroFeatured ? "• Hero" : ""}
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
