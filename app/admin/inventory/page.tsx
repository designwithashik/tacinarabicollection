"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getStoredInventory,
  setStoredInventory,
  type AdminProduct,
} from "../../../lib/inventory";
import { uploadToUploadcare, validateImageUrl } from "../../../lib/images";

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
  const [error, setError] = useState<string | null>(null);
  const [uploadcareKey, setUploadcareKey] = useState("");

  useEffect(() => {
    setItems(getStoredInventory());
    const storedKey = localStorage.getItem("tacin-uploadcare-key");
    if (storedKey) setUploadcareKey(storedKey);
  }, []);

  useEffect(() => {
    setStoredInventory(items);
  }, [items]);

  const handleSave = () => {
    if (!draft.id || !draft.name || draft.price <= 0) {
      setError("Please fill out all required fields.");
      return;
    }
    if (!validateImageUrl(draft.image)) {
      setError("Please provide a valid image URL.");
      return;
    }
    setError(null);
    const updated = { ...draft, updatedAt: new Date().toISOString() };
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === draft.id);
      if (existingIndex >= 0) {
        return prev.map((item, index) => (index === existingIndex ? updated : item));
      }
      return [updated, ...prev];
    });
    setDraft(defaultDraft);
  };

  const handleUpload = async (file: File) => {
    if (!uploadcareKey) {
      setError("Uploadcare key missing. Add it in settings.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadToUploadcare(file, uploadcareKey);
      setDraft((prev) => ({ ...prev, image: url }));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-muted">
          Manage products, pricing, and visibility.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Add or Update Product</h3>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Product ID
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.id}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, id: event.target.value }))
              }
            />
          </label>
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
        </div>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold">Image URL</label>
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
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file);
              }}
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
            onClick={handleSave}
            className="min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            Save Product
          </button>
          <button
            type="button"
            onClick={() => setDraft(defaultDraft)}
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
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((product) =>
                          product.id === item.id
                            ? { ...product, active: !product.active }
                            : product
                        )
                      )
                    }
                    className="min-h-[36px] rounded-full border border-[#e6d8ce] px-3 text-xs font-semibold"
                  >
                    {item.active ? "Active" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(item)}
                    className="min-h-[36px] rounded-full border border-[#e6d8ce] px-3 text-xs font-semibold"
                  >
                    Edit
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
